from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Supplier, Warehouse, Product, Inventory, Customer, Order, OrderItem, Shipment, UploadedFile, UserSchema
from accounts.models import CustomUser

admin.site.register(Supplier)
admin.site.register(Warehouse)
admin.site.register(Product)
admin.site.register(Inventory)
admin.site.register(Customer)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Shipment)
admin.site.register(UploadedFile)

admin.site.register(UserSchema)
