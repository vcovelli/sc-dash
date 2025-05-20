from django.db import models
from django.contrib.auth.models import AbstractUser

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
    business_name = models.CharField(max_length=255, blank=True, null=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="Free")

    def is_admin(self):
        return self.role == "admin"

    def is_staff_user(self):
        return self.role == "staff"

    def is_client(self):
        return self.role == "client"
