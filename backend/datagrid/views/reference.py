from rest_framework.views import APIView
from rest_framework.response import Response
from api.models import Customer, Product, Supplier, Warehouse, Shipment, Order  # Add as needed
from accounts.permissions import IsReadOnlyOrAbove
from accounts.mixins import CombinedOrgMixin

REF_MODELS = {
    "customers": Customer,
    "products": Product,
    "suppliers": Supplier,
    "warehouses": Warehouse,
    "shipments": Shipment,
    "orders": Order,
    # Add any other models you want to expose as reference options
}

class ReferenceOptionsView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]
    
    def get(self, request, table_name):
        Model = REF_MODELS.get(table_name)
        if not Model:
            return Response({"error": "Invalid table"}, status=400)
        
        # CombinedOrgMixin ensures org filtering
        # Filter data by user's organization
        if hasattr(Model, 'org'):
            data = list(Model.objects.filter(org=request.user.org).values("id", "name"))
        else:
            # Fallback for models without org field (legacy)
            data = list(Model.objects.all().values("id", "name"))
        return Response(data)
