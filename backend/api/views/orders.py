from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..models import OrderItem, Order
from ..serializers import OrderItemSerializer, OrderSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer']
    search_fields = ['status']
    ordering_fields = ['order_date']

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'product']