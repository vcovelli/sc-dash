import logging
import traceback
from minio import Minio
from django.http import FileResponse, Http404, HttpResponseForbidden
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from api.models import UserFile
import os

logger = logging.getLogger(__name__)

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
