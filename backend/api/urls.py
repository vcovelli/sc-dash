from django.urls import path, include
from rest_framework.routers import DefaultRouter

# --- Default Resource ViewSets ---
from .views.default_user_tables.suppliers import SupplierViewSet
from .views.default_user_tables.warehouses import WarehouseViewSet
from .views.default_user_tables.products import ProductViewSet
from .views.default_user_tables.inventory import InventoryViewSet
from .views.default_user_tables.customers import CustomerViewSet
from .views.default_user_tables.orders import OrderViewSet, OrderItemViewSet
from .views.default_user_tables.shipments import ShipmentViewSet

# --- DRF router for default ViewSets ---
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
]
