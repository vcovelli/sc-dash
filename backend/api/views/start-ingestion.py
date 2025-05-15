from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import UploadedFile
from .serializers import StartIngestionSerializer
from .tasks import trigger_ingestion_pipeline  #######

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

                trigger_ingestion_pipeline(uploaded_file.minio_path, uploaded_file.id)

                return Response({"message": "Ingestion started."}, status=status.HTTP_200_OK)
            except UploadedFile.DoesNotExist:
                return Response({"error": "File not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
