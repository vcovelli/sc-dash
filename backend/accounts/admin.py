from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("username", "email", "role", "plan", "business_name", "is_staff", "is_superuser")
    list_filter = ("role", "plan", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "business_name")
    ordering = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal Info", {"fields": ("email", "business_name", "plan")}),
        ("Permissions", {
            "fields": (
                "role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions"
            )
        }),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username", "email", "password1", "password2", "business_name", "role", "plan", "is_staff", "is_superuser"
            ),
        }),
    )
