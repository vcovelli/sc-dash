from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Organization

User = get_user_model()

class UserTableSchema(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="table_schemas")
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='table_schemas',
        help_text="Organization this table schema belongs to"
    )
    table_name = models.CharField(max_length=128)
    db_table_name = models.CharField(max_length=128, blank=True, null=True)
    primary_key = models.CharField(max_length=128, default="id")
    columns = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "org", "table_name")

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email or self.user.username} - {self.table_name} schema ({self.org.name})"

class UserTableRow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='table_rows',
        help_text="Organization this table row belongs to"
    )
    table_name = models.CharField(max_length=128)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.table_name} row by {self.user.username} ({self.org.name})"

class UserGridConfig(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='grid_configs',
        help_text="Organization this grid config belongs to"
    )
    table_name = models.CharField(max_length=128)
    column_order = models.JSONField(default=list, blank=True)
    column_widths = models.JSONField(default=dict, blank=True)
    column_visibility = models.JSONField(default=dict, blank=True)
    column_names = models.JSONField(default=dict, blank=True)
    extra_options = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "org", "table_name")

    def save(self, *args, **kwargs):
        # Auto-assign org from user if not set
        if not self.org and self.user and self.user.org:
            self.org = self.user.org
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.table_name} config by {self.user.username} ({self.org.name})"

