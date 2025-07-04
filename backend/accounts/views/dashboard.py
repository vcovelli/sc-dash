from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from files.models import UploadedFile
from django.db.models import Sum
from django.utils.timezone import now

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

            # All uploads for this user
            uploads_qs = UploadedFile.objects.filter(user=user).order_by("-uploaded_at")
            total_uploads = uploads_qs.count()
            recent_uploads = uploads_qs[:5]

            # Total storage used
            total_size_bytes = uploads_qs.aggregate(
                total_size=Sum("file_size")
            )["total_size"] or 0
            storage_used = format_size(total_size_bytes)

            # Total rows used (only successful ingestions)
            total_rows_used = uploads_qs.filter(status="success").aggregate(
                total=Sum("row_count")
            )["total"] or 0

            # Optionally update user profile with stats
            user.total_files = total_uploads
            user.storage_used_bytes = total_size_bytes
            user.last_dashboard_update = now()
            user.save(update_fields=["total_files", "storage_used_bytes", "last_dashboard_update"])

            # Static for now, but you can make this dynamic later
            system_uptime = "99.99%"
            usage_quota = 10000  # Change if you want a different plan limit

            return Response({
                "total_files": total_uploads,
                "storage_used": storage_used,
                "system_uptime": system_uptime,
                "usage": total_rows_used,
                "usage_quota": usage_quota,
                "recent_uploads": [
                    {
                        "file_name": f.file_name,
                        "row_count": getattr(f, "row_count", 0),
                        "uploaded_at": f.uploaded_at,
                    }
                    for f in recent_uploads
                ],
            })
        except Exception as e:
            print(f"[dashboard-overview] ERROR: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
