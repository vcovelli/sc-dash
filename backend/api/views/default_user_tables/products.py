from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .base import TenantScopedViewSet
from ...models import Product
from ...serializers import ProductSerializer

class ProductViewSet(TenantScopedViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'client_id']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price']