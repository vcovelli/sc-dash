from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import UploadedFile, Order, Product, Shipment
from django.utils.timezone import now
from datetime import timedelta
from rest_framework import status

class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            client_name = user.client_name

            total_uploads = UploadedFile.objects.filter(client_name=client_name).count()
            latest_upload = UploadedFile.objects.filter(client_name=client_name).order_by("-uploaded_at").first()

            total_orders = Order.objects.filter(client_name=client_name).count()
            total_products = Product.objects.filter(client_name=client_name).count()
            late_shipments = Shipment.objects.filter(client_name=client_name, status="delayed").count()

            return Response({
                "uploads": total_uploads,
                "latest_upload": latest_upload.uploaded_at if latest_upload else None,
                "total_orders": total_orders,
                "total_products": total_products,
                "late_shipments": late_shipments,
            })
        except Exception as e:
            print(f"[dashboard-overview] ERROR: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
