# backend/api/views/default_user_tables/suppliers.py

from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from .base import TenantScopedViewSet
from ...models import Supplier
from ...serializers import SupplierSerializer
from helpers.schema_helpers import get_table_schema


class SupplierViewSet(TenantScopedViewSet):
    """
    Org-scoped API for /api/suppliers/
    Supports filtering, search, ordering — returns column schema + rows
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'email']
    search_fields = ['name', 'contact_name']
    ordering_fields = ['name']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "next": None,
            "previous": None,
            "results": serializer.data,
        })
