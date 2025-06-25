from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Resource ViewSets
from .views.default_user_tables.suppliers import SupplierViewSet
from .views.default_user_tables.warehouses import WarehouseViewSet
from .views.default_user_tables.products import ProductViewSet
from .views.default_user_tables.inventory import InventoryViewSet
from .views.default_user_tables.customers import CustomerViewSet
from .views.default_user_tables.orders import OrderViewSet, OrderItemViewSet
from .views.default_user_tables.shipments import ShipmentViewSet

# Upload / Onboarding / Schema
from .views.frontend.onboarding import OnboardingStatusView, create_table_for_client_view, map_schema_and_create
from .views.frontend.upload import UploadCSVView, UploadedFileListView, MarkSuccessView, FileDownloadView
from .views.user.start_ingestion import StartIngestionView
from .views.frontend.dashboard import DashboardOverviewView
from .views.schema.schema_wizard import generate_schema

# SCHEMA MANAGEMENT (NEW)
from .views.schema.schema import (
    UserSchemaListAPIView,   # GET/POST for all table schemas ("/api/schema/")
    SheetSchemaAPIView,      # GET/PATCH/DELETE for one table schema ("/api/schema/<sheet_name>/")
    SheetColumnAPIView,      # PATCH for a single column ("/api/schema/<table_name>/columns/<accessor_key>/")
)
from .views.schema.user_schema import UserTableSchemasView, UserTableSchemaDetailView

# Auth / Profile
from .views.frontend.profile import UserProfileView

# AI Assistant
from .views.frontend.assistant import AssistantView, InsightView, AssistantStreamView

# DRF router for model ViewSets
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
    # Model resources
    path('', include(router.urls)),

    # Onboarding & schema
    path('create-table/', create_table_for_client_view, name='create-table-for-client'),
    path('map-schema/', map_schema_and_create, name='map-schema-and-create'),


    path('schema-wizard/generate/', generate_schema, name='generate-schema'),

    path('user-table-schemas/', UserTableSchemasView.as_view(), name='user-table-schemas-list-create'),
    path('user-table-schemas/<str:table_name>/', UserTableSchemaDetailView.as_view(), name='user-table-schema-detail'),

    # ---- SCHEMA MANAGEMENT ENDPOINTS ----
    path('schema/', UserSchemaListAPIView.as_view(), name='schema-list-create'),  # GET all, POST create table
    path('schema/<str:sheet_name>/', SheetSchemaAPIView.as_view(), name='sheet-schema'),  # GET, PATCH, DELETE table schema
    path('schema/<str:table_name>/columns/<str:accessor_key>/', SheetColumnAPIView.as_view(), name='sheet-column-patch'),  # PATCH single column

    # Uploads
    path('start-ingestion/', StartIngestionView.as_view(), name='start-ingestion'),
    path('ingest-csv/', UploadCSVView.as_view(), name='ingest-csv'),
    path('uploaded-files/', UploadedFileListView.as_view(), name='uploaded-files'),
    path('uploads/mark-success/', MarkSuccessView.as_view(), name='mark-success'),
    path('file-download/<int:file_id>/', FileDownloadView.as_view(), name='file-download'),

    # Dashboard & profile
    path('dashboard-overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path("onboarding/progress/", OnboardingStatusView.as_view(), name="onboarding-progress"),

    # AI Assistant
    path('assistant/', AssistantView.as_view(), name='ai-assistant'),
    path("assistant/stream/", AssistantStreamView.as_view(), name="assistant_stream"),
    path('ai/insight/', InsightView.as_view(), name='ai-insight'),
]
