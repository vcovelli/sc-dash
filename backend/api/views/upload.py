from api.models import UploadedFile
from api.serializers import UploadedFileSerializer
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
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
        )

        try:
            s3.upload_fileobj(
                csv_file,
                settings.MINIO_BUCKET_NAME,
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

            logger = logging.getLogger(__name__)
            logger.info(f"User {request.user.username} uploaded file to {minio_path}")

            # Trigger the first DAG in the pipeline (CSV -> Mongo)
            dag_id = "ingest_csv_to_mongo_dag"
            airflow_url = f"{os.getenv('AIRFLOW_API_BASE')}/dags/{dag_id}/dagRuns"
            airflow_user = os.getenv("AIRFLOW_USERNAME", "airflow")
            airflow_pass = os.getenv("AIRFLOW_PASSWORD", "airflow")

            try:
                airflow_response = requests.post(
                    airflow_url,
                    auth=(airflow_user, airflow_pass),
                    json={"conf": {"file_id": uploaded_file.id}},
                    timeout=5
                )

                if airflow_response.status_code in [200, 201]:
                    logger.info("Airflow DAG triggered successfully.")
                else:
                    logger.warning(f"Airflow DAG trigger failed: {airflow_response.text}")

            except Exception as dag_err:
                logger.error(f"Error triggering DAG: {dag_err}")

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
        if not file_id:
            return Response({"error": "file_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_record = UploadedFile.objects.get(id=file_id)
            file_record.status = "success"
            file_record.save()
            return Response({"message": "File marked as ingested"}, status=status.HTTP_200_OK)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)