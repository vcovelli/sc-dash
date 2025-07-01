from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(unique=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class Warehouse(models.Model):
    name = models.CharField(max_length=255)
    location = models.TextField()

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField()
    client_name = models.CharField(max_length=100, default="")

    def __str__(self):
        return self.name

class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    quantity = models.IntegerField()

class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [('Pending', 'Pending'), ('Shipped', 'Shipped'), ('Delivered', 'Delivered'), ('Cancelled', 'Cancelled')]
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    client_name = models.CharField(max_length=100, default="")

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

class Shipment(models.Model):
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

class UploadedFile(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("success", "Success"),
        ("error", "Error"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    minio_path = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    message = models.TextField(blank=True, null=True)  # for error info or notes
    file_size = models.PositiveIntegerField(null=True)
    client_name = models.CharField(max_length=100, default="")
    row_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        # Automatically assign client_name from user's business_name if not set
        if not self.client_name and self.user and hasattr(self.user, 'business_name'):
            self.client_name = self.user.business_name or ""
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} - {self.status}"

class UserTableSchema(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="table_schemas")
    table_name = models.CharField(max_length=128)
    db_table_name = models.CharField(max_length=128, blank=True, null=True)
    primary_key = models.CharField(max_length=128, default="id")
    columns = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "table_name")

    def __str__(self):
        return f"{self.user.email or self.user.username} - {self.table_name} schema"
    
class OnboardingProgress(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    completed_steps = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s onboarding progress"
    
class UserFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    object_key = models.CharField(max_length=255)  # MinIO key or file path
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)