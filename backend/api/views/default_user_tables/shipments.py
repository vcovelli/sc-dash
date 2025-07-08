from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .base import TenantScopedViewSet
from ...models import Shipment
from ...serializers import ShipmentSerializer

class ShipmentViewSet(TenantScopedViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'order', 'warehouse']
    ordering_fields = ['shipped_date', 'estimated_arrival']