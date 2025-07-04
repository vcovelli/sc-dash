from django.db import models
from django.conf import settings

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
    message = models.TextField(blank=True, null=True)
    file_size = models.PositiveIntegerField(null=True)
    client_name = models.CharField(max_length=100, default="")
    row_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.client_name and self.user and hasattr(self.user, 'business_name'):
            self.client_name = self.user.business_name or ""
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} - {self.status}"

class UserFile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    object_key = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
