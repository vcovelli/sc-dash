from django.db import models
from django.conf import settings
from accounts.models import Organization
from helpers.models import AuditableModel

class UploadedFile(AuditableModel):  # Now inherits system columns
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("success", "Success"),
        ("error", "Error"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='uploaded_files',
        help_text="Organization this file belongs to",
        null=True, blank=True,
    )
    file_name = models.CharField(max_length=255)
    minio_path = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    message = models.TextField(blank=True, null=True)
    file_size = models.PositiveIntegerField(null=True)
    client_name = models.CharField(max_length=100, default="", help_text="Legacy field for migration")
    row_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['user', 'org', 'file_name']]

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        if not self.client_name and self.user and hasattr(self.user, 'business_name'):
            self.client_name = self.user.business_name or ""
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} - {self.status} ({self.org.name})"

class UserFile(AuditableModel):  # Now inherits system columns
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='user_files',
        help_text="Organization this file belongs to",
        null=True, blank=True,
    )
    object_key = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'org', 'object_key']]

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.original_filename} ({self.org.name})"
