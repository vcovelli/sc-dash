from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.suppliers import SupplierViewSet
from .views.warehouses import WarehouseViewSet
from .views.products import ProductViewSet
from .views.inventory import InventoryViewSet
from .views.customers import CustomerViewSet
from .views.orders import OrderViewSet, OrderItemViewSet
from .views.shipments import ShipmentViewSet
from .views.onboarding import create_table_for_client
from .views.upload import UploadCSVView
from .views.upload import UploadedFileListView
from .views.upload import MarkSuccessView

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
    path('ingest-csv/', UploadCSVView.as_view(), name='ingest-csv'),
    path("uploaded-files/", UploadedFileListView.as_view(), name="uploaded-files"),
    path("uploads/mark-success/", MarkSuccessView.as_view(), name="mark-success"),
]
