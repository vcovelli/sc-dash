from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.generics import get_object_or_404
from api.models import UserTableSchema, Supplier, Warehouse, Shipment, Product, Order, Customer
from api.serializers import UserTableSchemaSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

MODEL_MAP = {
    "orders": Order,
    "products": Product,
    "customers": Customer,
    "suppliers": Supplier,
    "warehouses": Warehouse,
    "shipments": Shipment,
}

def normalize_columns(columns):
    """Convert list of strings to list of {'accessorKey': col, 'header': col} dicts if needed."""
    if not columns:
        return []
    if isinstance(columns[0], dict):
        return columns
    return [{"accessorKey": col, "header": col.replace("_", " ").title()} for col in columns]

class UserSchemaListAPIView(APIView):
    """GET all schemas, POST new schema (create table)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schemas = UserTableSchema.objects.filter(user=request.user)
        return Response(UserTableSchemaSerializer(schemas, many=True).data)

    def post(self, request):
        user = request.user
        table_name = request.data.get("table_name")
        columns = request.data.get("columns")
        if not table_name or not columns:
            return Response({"error": "Missing table_name or columns."}, status=400)
        if UserTableSchema.objects.filter(user=user, table_name=table_name).exists():
            return Response({"error": "Schema already exists. Use PATCH to update."}, status=409)
        columns = normalize_columns(columns)
        schema = UserTableSchema(user=user, table_name=table_name, columns=columns)
        serializer = UserTableSchemaSerializer(schema, data={"user": user.id, "table_name": table_name, "columns": columns})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class SheetSchemaAPIView(APIView):
    """GET, PATCH, DELETE for a single table schema.
       PATCH can update whole columns list or just one column if accessorKey provided.
    """
    permission_classes = [IsAuthenticated]

    def get_canonical(self, sheet_name):
        aliases = {
            "order": "orders",
            "product": "products",
            "customer": "customers",
            "supplier": "suppliers",
            "warehouse": "warehouses",
            "shipment": "shipments",
        }
        return aliases.get(sheet_name.strip().lower(), sheet_name.strip().lower())

    def get(self, request, sheet_name):
        user = request.user
        canonical_name = self.get_canonical(sheet_name)
        schema = get_object_or_404(UserTableSchema, user=user, table_name=canonical_name)
        columns = normalize_columns(schema.columns)
        Model = MODEL_MAP.get(canonical_name)
        if not Model:
            return Response({"error": f"Table '{canonical_name}' not recognized."}, status=404)
        accessor_keys = [col.get("accessorKey") for col in columns]

        # Only include fields that actually exist on the model
        model_fields = set(f.name for f in Model._meta.get_fields())
        filtered_keys = [k for k in accessor_keys if k in model_fields]

        rows = list(Model.objects.all().values(*filtered_keys))
        return Response({
            "schema": UserTableSchemaSerializer(schema).data,
            "columns": columns,
            "rows": rows,
        })

    def patch(self, request, sheet_name):
        user = request.user
        canonical_name = self.get_canonical(sheet_name)
        schema = get_object_or_404(UserTableSchema, user=user, table_name=canonical_name)
        columns = normalize_columns(schema.columns)

        accessor_key = request.data.get("accessorKey")
        if accessor_key:
            update_data = request.data.get("update")
            found = False
            for col in columns:
                if col.get("accessorKey") == accessor_key:
                    col.update(update_data or {})
                    found = True
                    break
            if not found:
                return Response({"error": f"Column '{accessor_key}' not found."}, status=404)
            schema.columns = columns
            schema.save()
            return Response(UserTableSchemaSerializer(schema).data)

        # PATCH whole columns
        new_columns = request.data.get("columns")
        if new_columns:
            schema.columns = normalize_columns(new_columns)
            schema.save()
            return Response(UserTableSchemaSerializer(schema).data)
        return Response({"error": "Missing columns or accessorKey."}, status=400)

    def delete(self, request, sheet_name):
        user = request.user
        canonical_name = self.get_canonical(sheet_name)
        deleted, _ = UserTableSchema.objects.filter(user=user, table_name=canonical_name).delete()
        if not deleted:
            return Response({"error": f"No schema to delete for '{canonical_name}'."}, status=404)
        return Response({"success": True})

class SheetColumnAPIView(APIView):
    """PATCH a single column by accessorKey (atomic column updates, e.g. rename, reorder, type, etc)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, table_name, accessor_key):
        user = request.user
        canonical_name = SheetSchemaAPIView().get_canonical(table_name)
        schema = get_object_or_404(UserTableSchema, user=user, table_name=canonical_name)
        columns = normalize_columns(schema.columns)
        update_data = request.data.get("update")
        found = False
        for col in columns:
            if col.get("accessorKey") == accessor_key:
                col.update(update_data or {})
                found = True
                break
        if not found:
            return Response({"error": f"Column '{accessor_key}' not found."}, status=404)
        schema.columns = columns
        schema.save()
        return Response(UserTableSchemaSerializer(schema).data)