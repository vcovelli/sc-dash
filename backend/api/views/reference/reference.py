from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import Customer, Product, Supplier, Warehouse, Shipment, Order  # Add as needed

REF_MODELS = {
    "customers": Customer,
    "products": Product,
    "suppliers": Supplier,
    "warehouses": Warehouse,
    "shipments": Shipment,
    "orders": Order,
    # Add any other models you want to expose as reference options
}

class ReferenceOptionsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, table_name):
        Model = REF_MODELS.get(table_name)
        if not Model:
            return Response({"error": "Invalid table"}, status=400)
        data = list(Model.objects.all().values("id", "name"))
        return Response(data)
