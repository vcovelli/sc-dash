from django.contrib import admin
from .models import Organization, CustomUser, Invitation, UserActivity, OnboardingProgress

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "role", "plan", "business_name", "total_files", "storage_used_bytes", "last_dashboard_update")
    list_filter = ("role", "plan")
    search_fields = ("username", "email", "business_name")
    ordering = ("-last_dashboard_update",)

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "verb", "target", "timestamp")
    list_filter = ("verb",)
    search_fields = ("user__username", "verb", "target")
    ordering = ("-timestamp",)

@admin.register(OnboardingProgress)
class OnboardingProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "completed_steps", "updated_at")
    search_fields = ("user__username",)
    ordering = ("-updated_at",)

admin.site.register(Organization)
admin.site.register(Invitation)
