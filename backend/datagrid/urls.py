from django.urls import path

from .views.schema import (
    UserTableSchemasView,
    UserTableSchemaDetailView,
    generate_schema,
)
from .views.row import (
    UserTableRowListCreateView,
    UserTableRowDetailView,
)
from .views.reference import ReferenceOptionsView
from .views.user_grid_config import UserGridConfigView

urlpatterns = [
    # Schema management
    path('schemas/', UserTableSchemasView.as_view(), name='user-table-schemas-list-create'),
    path('schemas/<str:table_name>/', UserTableSchemaDetailView.as_view(), name='user-table-schema-detail'),

    # API-driven schema management (dynamic)
    # path('schema/', UserSchemaListAPIView.as_view(), name='schema-list-create'),
    # path('schema/<str:sheet_name>/', SheetSchemaAPIView.as_view(), name='sheet-schema'),
    # path('schema/<str:table_name>/columns/<str:accessor_key>/', SheetColumnAPIView.as_view(), name='sheet-column-patch'),
    path('grid-config/<str:table_name>/', UserGridConfigView.as_view(), name='user-grid-config'),

    # Row management for user tables
    path('rows/<str:table_name>/', UserTableRowListCreateView.as_view(), name='user-table-row-list-create'),
    path('rows/<str:table_name>/<int:pk>/', UserTableRowDetailView.as_view(), name='user-table-row-detail'),

    # Reference dropdowns
    path('refs/<str:table_name>/', ReferenceOptionsView.as_view(), name='reference-options'),

    # ----- Schema Wizard -----
    path('schema-wizard/generate/', generate_schema, name='schema-wizard-generate'),
]
