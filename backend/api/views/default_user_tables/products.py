from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ...models import Product
from ...serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'client_name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price']