from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ...models import Warehouse
from ...serializers import WarehouseSerializer

class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'location']
    filterset_fields = ['location']