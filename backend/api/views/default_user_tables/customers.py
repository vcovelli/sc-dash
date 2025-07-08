from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .base import TenantScopedViewSet  # adjust the import as needed
from ...models import Customer
from ...serializers import CustomerSerializer

class CustomerViewSet(TenantScopedViewSet):  # Use the mixin!
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['name', 'email']
    search_fields = ['name', 'email']
    ordering_fields = ['name']
