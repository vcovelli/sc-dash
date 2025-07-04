# helpers/models.py or common/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

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
