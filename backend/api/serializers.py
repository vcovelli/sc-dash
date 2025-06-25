from rest_framework import serializers
from .models import (
    Supplier, Warehouse, Product, Inventory,
    Customer, Order, OrderItem, Shipment,
    UploadedFile, UserTableSchema
)

# ========== Basic Serializers ==========

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_name', 'phone', 'email', 'address']

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'location']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address']

# ========== Product & Inventory ==========

class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price',
            'stock_quantity', 'supplier', 'supplier_name', 'client_name'
        ]

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = ['id', 'product', 'warehouse', 'quantity']

# ========== Orders ==========

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'product_name', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    items = OrderItemSerializer(source="orderitem_set", many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_name', 'order_date', 'status', 'client_name', 'items']

# ========== Shipments ==========

class ShipmentSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    order_id = serializers.IntegerField(source="order.id", read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'order', 'order_id', 'warehouse',
            'warehouse_name', 'shipped_date',
            'estimated_arrival', 'status', 'client_name'
        ]

# ========== File Uploads ==========

class UploadedFileSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UploadedFile
        fields = [
            'id', 'user', 'uploaded_by', 'file_name',
            'minio_path', 'uploaded_at', 'status',
            'message', 'file_size', 'client_name', 'row_count'
        ]

class StartIngestionSerializer(serializers.Serializer):
    file_id = serializers.IntegerField()

# ========== User Schema ==========

from api.models import UserTableSchema

class UserTableSchemaSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    columns = serializers.JSONField()
    expected_headers = serializers.SerializerMethodField()

    class Meta:
        model = UserTableSchema
        fields = [
            'id',
            'user',
            'table_name',
            'db_table_name',
            'primary_key',
            'columns',
            'created_at',
            'updated_at',
            'expected_headers',  # <-- add this line
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_expected_headers(self, obj):
        cols = obj.columns or []
        # If dicts (modern style): extract accessorKey, else just string
        if cols and isinstance(cols[0], dict):
            return [col.get('accessorKey') for col in cols if col.get('accessorKey')]
        return cols
