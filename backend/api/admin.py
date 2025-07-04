from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Supplier, Warehouse, Product, Inventory, Customer, Order, OrderItem, Shipment

admin.site.register(Supplier)
admin.site.register(Warehouse)
admin.site.register(Product)
admin.site.register(Inventory)
admin.site.register(Customer)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Shipment)
