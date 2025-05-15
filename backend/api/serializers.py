from rest_framework import serializers
from .models import Supplier, Warehouse, Product, Inventory, Customer, Order, OrderItem, Shipment, UploadedFile

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'

class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = '__all__'

class StartIngestionSerializer(serializers.Serializer):
    file_id = serializers.IntegerField()

class UploadedFileSerializer(serializers.ModelSerializer):
    uploaded_by = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UploadedFile
        fields = '__all__'