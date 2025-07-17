from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views.health import health

# --- Default Resource ViewSets ---
from .views.default_user_tables.suppliers import SupplierViewSet
from .views.default_user_tables.warehouses import WarehouseViewSet
from .views.default_user_tables.products import ProductViewSet
from .views.default_user_tables.inventory import InventoryViewSet
from .views.default_user_tables.customers import CustomerViewSet
from .views.default_user_tables.orders import OrderViewSet, OrderItemViewSet
from .views.default_user_tables.shipments import ShipmentViewSet

# --- Enhanced Airflow Operations ---
from .views.airflow_operations import (
    EnhancedIngestDAGView,
    EnhancedMongoToPostgresDAGView, 
    ForecastInventoryDAGView,
    DAGStatusView,
    PipelineStatusView
)

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

    path('health/', health, name='health'),
    
    # Enhanced Airflow DAG endpoints
    path('airflow/trigger/enhanced-ingest/', EnhancedIngestDAGView.as_view(), name='trigger-enhanced-ingest'),
    path('airflow/trigger/mongo-to-postgres/', EnhancedMongoToPostgresDAGView.as_view(), name='trigger-mongo-to-postgres'),
    path('airflow/trigger/forecast-inventory/', ForecastInventoryDAGView.as_view(), name='trigger-forecast-inventory'),
    
    # DAG status and monitoring
    path('airflow/status/<str:dag_id>/', DAGStatusView.as_view(), name='dag-status'),
    path('airflow/status/<str:dag_id>/<str:dag_run_id>/', DAGStatusView.as_view(), name='dag-run-status'),
    path('airflow/pipeline-status/', PipelineStatusView.as_view(), name='pipeline-status'),
]
