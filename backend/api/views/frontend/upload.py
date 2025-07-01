from api.models import UploadedFile
from api.serializers import UploadedFileSerializer
from accounts.models import UserActivity
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import boto3
import datetime
import uuid
import logging
import requests
import os

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

            # Upload to MinIO
            s3.upload_fileobj(
                csv_file,
                bucket_name,
                minio_path,
                ExtraArgs={"ContentType": "text/csv"}
            )

            # Create DB record
            uploaded_file = UploadedFile.objects.create(
                user=request.user,
                file_name=file_name,
                minio_path=minio_path,
                status="pending",
                file_size=file_size
            )

            # Log user activity
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

            # Airflow Trigger
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
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UploadedFileListView(ListAPIView):
    serializer_class = UploadedFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UploadedFile.objects.filter(user=self.request.user).order_by("-uploaded_at")

class MarkSuccessView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        file_id = request.data.get("file_id")
        row_count = request.data.get("row_count", 0)

        if not file_id:
            return Response({"error": "file_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_record = UploadedFile.objects.get(id=file_id)
            file_record.status = "success"
            file_record.row_count = row_count  # store the row count
            file_record.save()
            return Response({"message": "File marked as ingested"}, status=status.HTTP_200_OK)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        
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
                    "Key": f"archive/{file_record.minio_path}"
                },
                ExpiresIn=3600,
            )

            return Response({"url": url})
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)