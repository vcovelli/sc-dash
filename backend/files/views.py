# files/views.py

import logging
import traceback
import datetime
import uuid
import requests
import os
import boto3

from rest_framework import status
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseForbidden
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes

from files.models import UploadedFile, UserFile   # Move these models to files.models!
from files.serializers import UploadedFileSerializer, StartIngestionSerializer  # Move these serializers!
from accounts.models import UserActivity

logger = logging.getLogger(__name__)

### 1. Upload CSV File ###
class UploadCSVView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

    def post(self, request, format=None):
        try:
            csv_file = request.FILES.get("file")
            if not csv_file:
                return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            file_name = csv_file.name
            if not file_name.endswith(".csv"):
                return Response({"error": "Only CSV files are allowed."}, status=status.HTTP_400_BAD_REQUEST)
            file_size = csv_file.size
            if file_size > self.MAX_FILE_SIZE:
                return Response({"error": "File size exceeds limit."}, status=status.HTTP_400_BAD_REQUEST)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            uid = uuid.uuid4().hex[:8]
            minio_path = f"{request.user.id}/{timestamp}/{uid}_{file_name}"
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.MINIO_ENDPOINT,
                aws_access_key_id=settings.MINIO_ROOT_USER,
                aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            )
            bucket_name = settings.MINIO_BUCKET_NAME
            try:
                s3.head_bucket(Bucket=bucket_name)
            except s3.exceptions.ClientError as e:
                error_code = int(e.response['Error']['Code'])
                if error_code == 404:
                    s3.create_bucket(Bucket=bucket_name)
                elif error_code != 301 and error_code != 403:
                    raise
            s3.upload_fileobj(
                csv_file,
                bucket_name,
                minio_path,
                ExtraArgs={"ContentType": "text/csv"}
            )
            uploaded_file = UploadedFile.objects.create(
                user=request.user,
                file_name=file_name,
                minio_path=minio_path,
                status="pending",
                file_size=file_size
            )
            UserActivity.objects.create(
                user=request.user,
                verb="uploaded file",
                target=file_name,
                meta={
                    "file_id": uploaded_file.id,
                    "file_size": file_size,
                    "minio_path": minio_path
                }
            )
            dag_id = "ingest_csv_to_mongo_dag"
            airflow_url = f"{os.getenv('AIRFLOW_API_BASE')}/dags/{dag_id}/dagRuns"
            airflow_user = os.getenv("AIRFLOW_USERNAME", "airflow")
            airflow_pass = os.getenv("AIRFLOW_PASSWORD", "airflow")
            airflow_response = requests.post(
                airflow_url,
                auth=(airflow_user, airflow_pass),
                json={"conf": {"file_id": uploaded_file.id}},
                timeout=10
            )
            if airflow_response.status_code not in [200, 201]:
                return Response({
                    "error": f"Airflow DAG trigger failed: {airflow_response.text}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({
                "message": f"Uploaded {file_name} to MinIO!",
                "file_id": uploaded_file.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"File upload failed: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

### 2. List Uploaded Files ###
class UploadedFileListView(ListAPIView):
    serializer_class = UploadedFileSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return UploadedFile.objects.filter(user=self.request.user).order_by("-uploaded_at")

### 3. Mark Upload as Success (used by Airflow or ETL job) ###
class MarkSuccessView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        file_id = request.data.get("file_id")
        row_count = request.data.get("row_count", 0)
        if not file_id:
            return Response({"error": "file_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            file_record = UploadedFile.objects.get(id=file_id)
            file_record.status = "success"
            file_record.row_count = row_count
            file_record.save()
            return Response({"message": "File marked as ingested"}, status=status.HTTP_200_OK)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

### 4. Download File (as S3 signed URL) ###
class FileDownloadView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, file_id):
        try:
            file_record = UploadedFile.objects.get(id=file_id, user=request.user)
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.MINIO_ENDPOINT,
                aws_access_key_id=settings.MINIO_ROOT_USER,
                aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            )
            url = s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": settings.MINIO_BUCKET_NAME,
                    "Key": file_record.minio_path
                },
                ExpiresIn=3600,
            )
            return Response({"url": url})
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

### 5. Start Ingestion Endpoint (from start_ingestion.py) ###
class StartIngestionView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, format=None):
        serializer = StartIngestionSerializer(data=request.data)
        if serializer.is_valid():
            file_id = serializer.validated_data['file_id']
            try:
                uploaded_file = UploadedFile.objects.get(id=file_id, user=request.user)
                uploaded_file.status = "processing"
                uploaded_file.save()
                # trigger_ingestion_pipeline(uploaded_file.minio_path, uploaded_file.id)
                return Response({"message": "Ingestion started."}, status=status.HTTP_200_OK)
            except UploadedFile.DoesNotExist:
                return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

### 6. Direct MinIO Streaming Download Endpoint (from download_files.py) ###
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def download_user_file(request, file_id):
    try:
        user_file = UserFile.objects.get(id=file_id, user=request.user)
        logger.info(f"User {request.user.id} downloading file {file_id} from MinIO key: {user_file.object_key}")
    except UserFile.DoesNotExist:
        logger.warning(f"User {request.user.id} attempted to access unauthorized file {file_id}")
        return HttpResponseForbidden("You do not have access to this file.")

    try:
        logger.info(f"Using Minio endpoint: {os.getenv('MINIO_ENDPOINT')} (secure={os.getenv('MINIO_SECURE')})")
        from minio import Minio
        minio_client = Minio(
            os.getenv("MINIO_ENDPOINT", "minio.supplywise.ai"),
            access_key=os.getenv("MINIO_ROOT_USER"),
            secret_key=os.getenv("MINIO_ROOT_PASSWORD"),
            secure=os.getenv("MINIO_SECURE", "True").lower() == "true"
        )
        bucket_name = "templates"
        logger.info(f"Attempting to fetch object '{user_file.object_key}' from bucket '{bucket_name}'")
        response = minio_client.get_object(bucket_name, user_file.object_key)
        logger.info(f"Successfully streaming file {user_file.original_filename} for user {request.user.id}")
        return FileResponse(response, as_attachment=True, filename=user_file.original_filename)
    except Exception as e:
        logger.error(f"Failed to stream file {file_id} for user {request.user.id}: {e}")
        logger.error(traceback.format_exc())
        raise Http404("File not found or access denied.")
