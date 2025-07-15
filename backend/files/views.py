# files/views.py

import logging
import traceback
import datetime
import uuid
import requests
import os
from pathlib import Path

from helpers.minio_client import get_boto3_client, get_minio_client, get_bucket_name, ensure_bucket_exists

from rest_framework import status
from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseForbidden
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes

from files.models import UploadedFile, UserFile   # Move these models to files.models!
from files.serializers import UploadedFileSerializer, StartIngestionSerializer  # Move these serializers!
from accounts.models import UserActivity
from accounts.permissions import IsReadOnlyOrAbove, CanManageOrganization, CanUploadFiles
from accounts.mixins import CombinedOrgMixin

logger = logging.getLogger(__name__)

### 1. Upload CSV File ###
class UploadCSVView(CombinedOrgMixin, APIView):
    permission_classes = [CanUploadFiles]  # Restrict uploads to managers and above
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
            minio_path = f"{request.user.org.id}/{request.user.id}/{timestamp}/{uid}_{file_name}"
            s3 = get_boto3_client()
            bucket_name = get_bucket_name()
            ensure_bucket_exists(s3, bucket_name)
            s3.upload_fileobj(
                csv_file,
                bucket_name,
                minio_path,
                ExtraArgs={"ContentType": "text/csv"}
            )
            uploaded_file = UploadedFile.objects.create(
                user=request.user,
                org=request.user.org,
                file_name=file_name,
                minio_path=minio_path,
                status="pending",
                file_size=file_size
            )
            # Auto-set created_by for system column tracking
            uploaded_file.created_by = request.user
            uploaded_file.save()
            
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
            # Use the new enhanced organization-aware ingest DAG
            dag_id = "enhanced_org_aware_ingest_dag"
            airflow_url = f"{os.getenv('AIRFLOW_API_BASE')}/dags/{dag_id}/dagRuns"
            airflow_user = os.getenv("AIRFLOW_USERNAME", "airflow")
            airflow_pass = os.getenv("AIRFLOW_PASSWORD", "airflow")
            
            # Enhanced DAG configuration with organization awareness and smart table detection
            def detect_table_name(filename: str, request_table: str = None) -> str:
                """Detect table name from request or filename"""
                # Use explicit table name if provided and not "unknown"
                if request_table and request_table.strip() and request_table != "unknown":
                    return request_table.lower().strip()
                
                # Extract from filename
                base_name = Path(filename).stem.lower()
                
                # Map common filename patterns to table names
                table_mappings = {
                    'order': 'orders',
                    'product': 'products', 
                    'customer': 'customers',
                    'inventory': 'inventory',
                    'sale': 'sales',
                    'employee': 'employees',
                    'supplier': 'suppliers',
                    'transaction': 'transactions',
                    'invoice': 'invoices',
                    'shipment': 'shipments'
                }
                
                # Check for patterns in filename
                for pattern, table_name in table_mappings.items():
                    if pattern in base_name:
                        return table_name
                
                # Use cleaned filename as table name
                cleaned_name = base_name.replace(' ', '_').replace('-', '_')
                # Remove common file suffixes
                for suffix in ['_data', '_export', '_import', '_file']:
                    cleaned_name = cleaned_name.replace(suffix, '')
                
                return cleaned_name if cleaned_name else "unknown"
            
            detected_table = detect_table_name(file_name, request.data.get("table"))
            
            dag_config = {
                "org_id": str(request.user.org.id),
                "table": detected_table,  # Use smart table detection
                "file_id": str(uploaded_file.id),
                "user_id": str(request.user.id),
                "triggered_by": "file_upload"
            }
            
            dag_run_data = {
                "conf": dag_config,
                "dag_run_id": f"upload_trigger_{request.user.org.id}_{uploaded_file.id}"
            }
            
            airflow_response = requests.post(
                airflow_url,
                auth=(airflow_user, airflow_pass),
                json=dag_run_data,
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
class UploadedFileListView(CombinedOrgMixin, ListAPIView):
    serializer_class = UploadedFileSerializer
    permission_classes = [IsReadOnlyOrAbove]
    
    def get_queryset(self):
        # CombinedOrgMixin handles org filtering automatically
        return UploadedFile.objects.filter(user=self.request.user).order_by("-uploaded_at")

### 3. Mark Upload as Success (used by Airflow or ETL job) ###
class MarkSuccessView(CombinedOrgMixin, APIView):
    permission_classes = [CanManageOrganization]  # Only org admins can mark files as successful
    
    def post(self, request):
        file_id = request.data.get("file_id")
        row_count = request.data.get("row_count", 0)
        if not file_id:
            return Response({"error": "file_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # CombinedOrgMixin ensures we only get files from user's org
            file_record = UploadedFile.objects.get(id=file_id, org=request.user.org)
            file_record.status = "success"
            file_record.row_count = row_count
            file_record.save()
            return Response({"message": "File marked as ingested"}, status=status.HTTP_200_OK)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

### 4. Download File (as S3 signed URL) ###
class FileDownloadView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]
    
    def get(self, request, file_id):
        try:
            # Ensure user can only download files from their org
            file_record = UploadedFile.objects.get(
                id=file_id, 
                user=request.user, 
                org=request.user.org
            )
            s3 = get_boto3_client()
            url = s3.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": get_bucket_name(),
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
class StartIngestionView(CombinedOrgMixin, APIView):
    permission_classes = [CanUploadFiles]  # Restrict ingestion to managers and above
    
    def post(self, request, format=None):
        serializer = StartIngestionSerializer(data=request.data)
        if serializer.is_valid():
            file_id = serializer.validated_data['file_id']
            try:
                uploaded_file = UploadedFile.objects.get(
                    id=file_id, 
                    user=request.user,
                    org=request.user.org
                )
                uploaded_file.status = "processing"
                uploaded_file.modified_by = request.user  # Track who started ingestion
                uploaded_file.save()
                # trigger_ingestion_pipeline(uploaded_file.minio_path, uploaded_file.id)
                return Response({"message": "Ingestion started."}, status=status.HTTP_200_OK)
            except UploadedFile.DoesNotExist:
                return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

### 6. Direct MinIO Streaming Download Endpoint (from download_files.py) ###
@api_view(["GET"])
@permission_classes([IsReadOnlyOrAbove])  # Keep downloads accessible to all org members
def download_user_file(request, file_id):
    try:
        user_file = UserFile.objects.get(
            id=file_id, 
            user=request.user,
            org=request.user.org
        )
        logger.info(f"User {request.user.id} downloading file {file_id} from MinIO key: {user_file.object_key}")
    except UserFile.DoesNotExist:
        logger.warning(f"User {request.user.id} attempted to access unauthorized file {file_id}")
        return HttpResponseForbidden("You do not have access to this file.")

    try:
        minio_client = get_minio_client()
        logger.info(f"Using MinIO client with configured endpoint")
        bucket_name = "templates"
        logger.info(f"Attempting to fetch object '{user_file.object_key}' from bucket '{bucket_name}'")
        response = minio_client.get_object(bucket_name, user_file.object_key)
        logger.info(f"Successfully streaming file {user_file.original_filename} for user {request.user.id}")
        return FileResponse(response, as_attachment=True, filename=user_file.original_filename)
    except Exception as e:
        logger.error(f"Failed to stream file {file_id} for user {request.user.id}: {e}")
        logger.error(traceback.format_exc())
        raise Http404("File not found or access denied.")
