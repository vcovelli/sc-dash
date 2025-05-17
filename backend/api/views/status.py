from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from api.models import UploadedFile

class MarkSuccessView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        filename = request.data.get("filename")
        file_id = request.data.get("file_id")

        if not filename and not file_id:
            return Response({"error": "filename or file_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if filename:
                file = UploadedFile.objects.get(filename=filename)
            else:
                file = UploadedFile.objects.get(id=file_id)

            file.status = "success"
            file.save()
            return Response({"message": "File marked as success"}, status=status.HTTP_200_OK)

        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)