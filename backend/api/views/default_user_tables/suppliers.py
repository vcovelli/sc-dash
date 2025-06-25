from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ...models import Supplier
from ...serializers import SupplierSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'email']
    search_fields = ['name', 'contact_name']
    ordering_fields = ['name']