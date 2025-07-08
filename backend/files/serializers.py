from rest_framework import serializers
from .models import UploadedFile, UserFile

class UploadedFileSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UploadedFile
        fields = [
            'id', 'user', 'uploaded_by', 'file_name',
            'minio_path', 'uploaded_at', 'status',
            'message', 'file_size', 'client_id', 'row_count'
        ]

class StartIngestionSerializer(serializers.Serializer):
    file_id = serializers.IntegerField()

class UserFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFile
        fields = ['id', 'user', 'object_key', 'original_filename', 'uploaded_at']
