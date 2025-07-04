from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

# --- System fields for audit/version control ---
class AuditableModel(models.Model):
    created_by = models.ForeignKey(
        User, null=True, blank=True, related_name="%(class)s_created", on_delete=models.SET_NULL
    )
    modified_by = models.ForeignKey(
        User, null=True, blank=True, related_name="%(class)s_modified", on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        abstract = True

class Supplier(AuditableModel):
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(unique=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class Warehouse(AuditableModel):
    name = models.CharField(max_length=255)
    location = models.TextField()

    def __str__(self):
        return self.name

class Product(AuditableModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField()
    client_name = models.CharField(max_length=100, default="")

    def __str__(self):
        return self.name

class Inventory(AuditableModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity = models.IntegerField()

class Customer(AuditableModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class Order(AuditableModel):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Shipped', 'Shipped'), ('Delivered', 'Delivered'), ('Cancelled', 'Cancelled')]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    client_name = models.CharField(max_length=100, default="")

class OrderItem(AuditableModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

class Shipment(AuditableModel):
    STATUS_CHOICES = [
        ('on_time', 'On Time'),
        ('delayed', 'Delayed'),
        ('delivered', 'Delivered'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True)
    shipped_date = models.DateTimeField(null=True, blank=True)
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    client_name = models.CharField(max_length=100, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='on_time')
