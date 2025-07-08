from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils.text import slugify

# -- Role and Plan Choices --
ROLE_CHOICES = [
    ("admin", "Admin (Platform Superuser)"),
    ("owner", "Org Owner"),
    ("ceo", "Full Access (CEO/Global)"),
    ("national_manager", "National Manager"),
    ("regional_manager", "Regional Manager"),
    ("local_manager", "Site/Local Manager"),
    ("employee", "Employee/Basic"),
    ("client", "Client/Partner/3rd Party"),
    ("tech_support", "Tech Support"),
    ("read_only", "Read Only"),
    ("custom", "Custom"),
]

PLAN_CHOICES = [
    ("Free", "Free"),
    ("Pro", "Pro"),
    ("Enterprise", "Enterprise"),
]

# -- Organization Model --
class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# -- Invitation Model for Org User Invites --
class Invitation(models.Model):
    email = models.EmailField()
    org = models.ForeignKey(
        Organization,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="invitations"
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted = models.BooleanField(default=False)
    token = models.CharField(max_length=64, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="client")

    def __str__(self):
        org_name = self.org.name if self.org else "No Org"
        return f"Invite {self.email} to {org_name}"

# -- Custom User Model (Org-aware, Role-based) --
class CustomUser(AbstractUser):
    org = models.ForeignKey(
        Organization,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="users"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="client")
    allow_feedback_to_train_model = models.BooleanField(default=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="Free")

    # Dashboard stats
    total_files = models.PositiveIntegerField(default=0)
    storage_used_bytes = models.BigIntegerField(default=0)
    last_dashboard_update = models.DateTimeField(auto_now=True)

    # --- Role helpers ---
    def is_admin(self):
        return self.role == "admin"

    def is_owner(self):
        return self.role == "owner"

    def is_ceo(self):
        return self.role == "ceo"

    def is_national_manager(self):
        return self.role == "national_manager"

    def is_regional_manager(self):
        return self.role == "regional_manager"

    def is_local_manager(self):
        return self.role == "local_manager"

    def is_employee(self):
        return self.role == "employee"

    def is_client(self):
        return self.role == "client"

    def is_tech_support(self):
        return self.role == "tech_support"

    def is_read_only(self):
        return self.role == "read_only"

    # --- Org helpers ---
    def org_id(self):
        return self.org.id if self.org else None

    def org_name(self):
        return self.org.name if self.org else ""

    def org_slug(self):
        return self.org.slug if self.org else ""

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.org_name()}"

# -- Audit/User Activity --
class UserActivity(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    verb = models.CharField(max_length=255)
    target = models.CharField(max_length=1024, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    meta = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.user.username} {self.verb} {self.target or ''} at {self.timestamp:%Y-%m-%d %H:%M:%S}"

# -- Onboarding --
class OnboardingProgress(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    completed_steps = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s onboarding progress"
