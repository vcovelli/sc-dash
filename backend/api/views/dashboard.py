from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import UploadedFile
from rest_framework import status

class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            uploads_qs = UploadedFile.objects.filter(user=user).order_by("-uploaded_at")
            total_uploads = uploads_qs.count()
            recent_uploads = uploads_qs[:5]

            return Response({
                "total_files": total_uploads,
                "recent_uploads": [
                    {
                        "file_name": f.file_name,
                        "row_count": getattr(f, "row_count", 0),  # Safe fallback
                        "uploaded_at": f.uploaded_at,
                    }
                    for f in recent_uploads
                ],
            })
        except Exception as e:
            print(f"[dashboard-overview] ERROR: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)