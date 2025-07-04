from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

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

class UserTableRow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    table_name = models.CharField(max_length=128)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

class UserGridConfig(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    table_name = models.CharField(max_length=128)
    column_order = models.JSONField(default=list, blank=True)
    column_widths = models.JSONField(default=dict, blank=True)
    column_visibility = models.JSONField(default=dict, blank=True)
    column_names = models.JSONField(default=dict, blank=True)
    extra_options = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "table_name")

