from rest_framework import serializers
from .models import (
    Supplier, Warehouse, Product, Inventory,
    Customer, Order, OrderItem, Shipment,
)

# --- Basic Serializers ---

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

# --- Product & Inventory ---

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

# --- Orders ---

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

# --- Shipments ---

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
