from django.contrib import admin
from .models import UserTableSchema

@admin.register(UserTableSchema)
class UserTableSchemaAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "table_name")
    list_filter = ("user", "table_name")
    search_fields = ("table_name", "user__username")
    ordering = ("user", "table_name")
    readonly_fields = ("id",)
