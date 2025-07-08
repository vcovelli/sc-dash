from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .base import TenantScopedViewSet
from ...models import Inventory
from ...serializers import InventorySerializer

class InventoryViewSet(TenantScopedViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'warehouse']
    ordering_fields = ['quantity']