from rest_framework.views import APIView
from rest_framework.response import Response
from api.models import (
    Supplier,
    Warehouse,
    Shipment,
    Product,
    Order,
    Customer,
)

class SheetSchemaAPIView(APIView):
    def get(self, request, sheet_name):
        sheet_name = sheet_name.strip().lower()
        print("📥 Received sheet_name:", sheet_name)

        if sheet_name == "orders":
            rows = list(Order.objects.all().values())
            customer_refs = list(Customer.objects.values("id", "name"))
            columns = [
                {"accessorKey": "id", "header": "Order ID", "type": "text"},
                {"accessorKey": "customer_id", "header": "Customer", "type": "reference", "referenceData": [{"id": c["id"], "name": c["name"]} for c in customer_refs]},
                {"accessorKey": "status", "header": "Status", "type": "choice", "choices": ["Pending", "Shipped", "Delivered", "Cancelled"]},
                {"accessorKey": "order_date", "header": "Date", "type": "date"},
            ]
            return Response({"columns": columns, "rows": rows})

        elif sheet_name == "products":
            rows = list(Product.objects.all().values())
            supplier_refs = list(Supplier.objects.values("id", "name"))
            columns = [
                {"accessorKey": "id", "header": "Product ID", "type": "text"},
                {"accessorKey": "name", "header": "Name", "type": "text"},
                {"accessorKey": "price", "header": "Price", "type": "currency"},
                {"accessorKey": "stock_quantity", "header": "Stock", "type": "number"},
                {"accessorKey": "supplier_id", "header": "Supplier", "type": "reference", "referenceData": [{"id": s["id"], "name": s["name"]} for s in supplier_refs]},
            ]
            return Response({"columns": columns, "rows": rows})

        elif sheet_name == "customers":
            rows = list(Customer.objects.all().values())
            columns = [
                {"accessorKey": "id", "header": "Customer ID", "type": "text"},
                {"accessorKey": "name", "header": "Name", "type": "text"},
                {"accessorKey": "email", "header": "Email", "type": "link"},
            ]
            return Response({"columns": columns, "rows": rows})

        elif sheet_name == "suppliers":
            rows = list(Supplier.objects.all().values())
            columns = [
                {"accessorKey": "id", "header": "Supplier ID", "type": "text"},
                {"accessorKey": "name", "header": "Name", "type": "text"},
                {"accessorKey": "email", "header": "Email", "type": "link"},
            ]
            return Response({"columns": columns, "rows": rows})

        elif sheet_name == "warehouses":
            rows = list(Warehouse.objects.all().values())
            columns = [
                {"accessorKey": "id", "header": "Warehouse ID", "type": "text"},
                {"accessorKey": "name", "header": "Name", "type": "text"},
                {"accessorKey": "location", "header": "Location", "type": "text"},
            ]
            return Response({"columns": columns, "rows": rows})

        elif sheet_name == "shipments":
            rows = list(Shipment.objects.all().values())
            columns = [
                {"accessorKey": "id", "header": "Shipment ID", "type": "text"},
                {"accessorKey": "status", "header": "Status", "type": "choice", "choices": ["on_time", "delayed", "delivered"]},
                {"accessorKey": "shipped_date", "header": "Shipped", "type": "date"},
                {"accessorKey": "estimated_arrival", "header": "ETA", "type": "date"},
            ]
            return Response({"columns": columns, "rows": rows})

        return Response({"error": f"Schema for '{sheet_name}' not found."}, status=404)
