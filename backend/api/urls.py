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
from .views.onboarding import map_schema_and_create
from .views.dashboard import DashboardOverviewView
from .views.schema_wizard import generate_schema
from .views.user_schema import UserSchemaView
from .views.upload import FileDownloadView
from .views.profile import UserProfileView

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
    path('map-schema/', map_schema_and_create, name='map-schema-and-create'),
    path('dashboard-overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('schema-wizard/generate/', generate_schema, name='generate-schema'),
    path('user-schema/', UserSchemaView.as_view(), name='user-schema'),
    path('file-download/<int:file_id>/', FileDownloadView.as_view(), name='file-download'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]
