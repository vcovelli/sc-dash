from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("client", "Client"),
        ("staff", "Staff"),
        ("admin", "Admin"),
    ]

    PLAN_CHOICES = [
        ("Free", "Free"),
        ("Pro", "Pro"),
        ("Enterprise", "Enterprise"),
    ]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="client")
    allow_feedback_to_train_model = models.BooleanField(default=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="Free")

    # Dashboard stats
    total_files = models.PositiveIntegerField(default=0)
    storage_used_bytes = models.BigIntegerField(default=0)
    last_dashboard_update = models.DateTimeField(auto_now=True)

    def is_admin(self):
        return self.role == "admin"

    def is_staff_user(self):
        return self.role == "staff"

    def is_client(self):
        return self.role == "client"
    
class UserActivity(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # references CustomUser
        on_delete=models.CASCADE,
        related_name='activities'
    )
    verb = models.CharField(max_length=255)        # E.g. "uploaded", "updated settings", "deleted"
    target = models.CharField(max_length=255, blank=True, null=True)  # E.g. "orders.csv"
    timestamp = models.DateTimeField(auto_now_add=True)
    meta = models.JSONField(blank=True, null=True)  # For any extra event details (e.g. row count, IP, etc)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user.username} {self.verb} {self.target or ''} at {self.timestamp:%Y-%m-%d %H:%M:%S}"