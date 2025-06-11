from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from api.models import UploadedFile
from django.db import models
import psutil
import time

def format_size(bytes_value):
    if bytes_value < 1024:
        return f"{bytes_value} Bytes"
    elif bytes_value < 1024 ** 2:
        return f"{bytes_value / 1024:.2f} KB"
    elif bytes_value < 1024 ** 3:
        return f"{bytes_value / (1024 ** 2):.2f} MB"
    else:
        return f"{bytes_value / (1024 ** 3):.2f} GB"

class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user

            uploads_qs = UploadedFile.objects.filter(user=user).order_by("-uploaded_at")
            total_uploads = uploads_qs.count()
            recent_uploads = uploads_qs[:5]

            # Storage used (human-readable)
            total_size_bytes = uploads_qs.aggregate(total_size=models.Sum("file_size"))["total_size"] or 0
            storage_used = format_size(total_size_bytes)

            # System uptime (static for now, replace with real % if monitored)
            system_uptime = "99.99%"

            return Response({
                "total_files": total_uploads,
                "recent_uploads": [
                    {
                        "file_name": f.file_name,
                        "row_count": getattr(f, "row_count", 0),
                        "uploaded_at": f.uploaded_at,
                    }
                    for f in recent_uploads
                ],
                "storage_used": storage_used,
                "system_uptime": system_uptime,
            })
        except Exception as e:
            print(f"[dashboard-overview] ERROR: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
