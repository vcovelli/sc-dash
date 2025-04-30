from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, WarehouseViewSet, ProductViewSet, InventoryViewSet,
    CustomerViewSet, OrderViewSet, OrderItemViewSet, ShipmentViewSet, create_table_for_client
)

# Using a router for automatic URL routing
router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet)
router.register(r'warehouses', WarehouseViewSet)
router.register(r'products', ProductViewSet)
router.register(r'inventory', InventoryViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'shipments', ShipmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('create-table/', create_table_for_client, name='create-table-for-client'),
]
