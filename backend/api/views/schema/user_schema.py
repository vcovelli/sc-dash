from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from api.models import UserTableSchema

class UserSchemaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schema = UserTableSchema.objects.filter(user=request.user).first()
        if not schema:
            return Response({ "columns": [] }, status=200)

        return Response({
            "columns": schema.columns or [],
            "last_updated": schema.updated_at
        })

    def post(self, request):
        columns = request.data.get("columns")
        if not columns or not isinstance(columns, list):
            return Response({ "error": "columns must be a list" }, status=400)

        columns = [h.strip() for h in columns if isinstance(h, str)]
        if len(columns) != len(set(columns)):
            return Response({ "error": "columns contains duplicate columns" }, status=400)

        UserTableSchema.objects.update_or_create(
            user=request.user,
            table_name="main",
            defaults={ "columns": columns }
        )

        return Response({ "message": "Schema saved successfully" })

# views.py


from api.serializers import UserTableSchemaSerializer
from django.shortcuts import get_object_or_404

class UserTableSchemasView(APIView):
    """Handle CRUD for user table schemas (multi-table, per user)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all table schemas for this user."""
        schemas = UserTableSchema.objects.filter(user=request.user)
        serializer = UserTableSchemaSerializer(schemas, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new table schema for this user (unique per table_name)."""
        table_name = request.data.get("table_name")
        columns = request.data.get("columns")

        if not table_name or not columns:
            return Response({"error": "Missing table_name or columns."}, status=400)
        if UserTableSchema.objects.filter(user=request.user, table_name=table_name).exists():
            return Response({"error": "Schema already exists. Use PATCH to update."}, status=409)

        serializer = UserTableSchemaSerializer(data={
            "user": request.user.id,
            "table_name": table_name,
            "columns": columns,
        })
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class UserTableSchemaDetailView(APIView):
    """Handle GET, PATCH, DELETE for a single table schema."""
    permission_classes = [IsAuthenticated]

    def get(self, request, table_name):
        schema = get_object_or_404(UserTableSchema, user=request.user, table_name=table_name)
        serializer = UserTableSchemaSerializer(schema)
        return Response(serializer.data)

    def patch(self, request, table_name):
        schema = get_object_or_404(UserTableSchema, user=request.user, table_name=table_name)
        columns = request.data.get("columns")
        if columns is not None:
            schema.columns = columns
            schema.save()
        serializer = UserTableSchemaSerializer(schema)
        return Response(serializer.data)

    def delete(self, request, table_name):
        schema = get_object_or_404(UserTableSchema, user=request.user, table_name=table_name)
        schema.delete()
        return Response({"success": True})

# Optionally, you can add router endpoints for these views:
# /api/user-table-schemas/            -> UserTableSchemasView (list/create)
# /api/user-table-schemas/<table_name>/  -> UserTableSchemaDetailView (detail/update/delete)
