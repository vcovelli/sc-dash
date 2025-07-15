from django.urls import path
from datagrid.views.schema import (
    UserTableSchemasView, UserTableSchemaDetailView, SchemaFeatureView, 
    UploadJSONSchemaToGsheetView, ShareableTemplateGeneratorView, 
    ShareableTemplateReaderView,
    # Enhanced views
    EnhancedSchemasView, EnhancedSchemaDetailView, SchemaVersionView,
    SchemaColumnsView, SchemaColumnDetailView, SchemaSharingView,
    SchemaValidationView
)
from datagrid.views.data import (
    DataGridAPIView, DataImportView, GridConfigView, 
    DynamicTableDataView, DynamicTableDetailView, DataSyncView
)

app_name = 'datagrid'

urlpatterns = [
    # ====== LEGACY SCHEMA ENDPOINTS (KEEP FOR BACKWARD COMPATIBILITY) ======
    path('schemas/', UserTableSchemasView.as_view(), name='user-table-schemas'),
    path('schemas/<int:pk>/', UserTableSchemaDetailView.as_view(), name='user-table-schema-detail'),
    path('schemas/features/<str:feature_name>/', SchemaFeatureView.as_view(), name='schema-feature'),
    path('upload-schema-to-gsheet/', UploadJSONSchemaToGsheetView.as_view(), name='upload-schema-to-gsheet'),
    path('shareable-template-generator/<str:schema_name>/', ShareableTemplateGeneratorView.as_view(), name='shareable-template-generator'),
    path('shareable-template-reader/<str:schema_name>/', ShareableTemplateReaderView.as_view(), name='shareable-template-reader'),
    
    # ====== ENHANCED SCHEMA ENDPOINTS ======
    # Main schema management
    path('v2/schemas/', EnhancedSchemasView.as_view(), name='enhanced-schemas'),
    path('v2/schemas/<int:schema_id>/', EnhancedSchemaDetailView.as_view(), name='enhanced-schema-detail'),
    
    # Versioning
    path('v2/schemas/<int:schema_id>/versions/', SchemaVersionView.as_view(), name='schema-versions'),
    path('v2/schemas/<int:schema_id>/create-version/', SchemaVersionView.as_view(), name='schema-create-version'),
    
    # Column management
    path('v2/schemas/<int:schema_id>/columns/', SchemaColumnsView.as_view(), name='schema-columns'),
    path('v2/schemas/<int:schema_id>/columns/<int:column_id>/', SchemaColumnDetailView.as_view(), name='schema-column-detail'),
    path('v2/schemas/<int:schema_id>/columns/reorder/', SchemaColumnsView.as_view(), name='schema-columns-reorder'),
    
    # Sharing and permissions
    path('v2/schemas/<int:schema_id>/sharing/', SchemaSharingView.as_view(), name='schema-sharing'),
    path('v2/schemas/<int:schema_id>/share/', SchemaSharingView.as_view(), name='schema-share'),
    
    # Validation
    path('v2/schemas/<int:schema_id>/validate/', SchemaValidationView.as_view(), name='schema-validate'),
    
    # ====== DATA ENDPOINTS (UNCHANGED) ======
    path('data/', DataGridAPIView.as_view(), name='data-grid'),
    path('import/', DataImportView.as_view(), name='data-import'),
    path('config/', GridConfigView.as_view(), name='grid-config'),
    path('dynamic-tables/', DynamicTableDataView.as_view(), name='dynamic-table-data'),
    path('dynamic-tables/<str:table_name>/', DynamicTableDetailView.as_view(), name='dynamic-table-detail'),
    path('sync/', DataSyncView.as_view(), name='data-sync'),
    
    # Commented out unused endpoints
    # path('schema/<str:table_name>/columns/<str:accessor_key>/', SheetColumnAPIView.as_view(), name='sheet-column-patch'),
]
