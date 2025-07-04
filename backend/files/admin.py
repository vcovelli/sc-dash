from django.contrib import admin
from .models import UploadedFile, UserFile

@admin.register(UploadedFile)
class UploadedFileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "file_name", "status", "uploaded_at", "file_size", "row_count", "client_name")
    list_filter = ("status", "client_name")
    search_fields = ("file_name", "client_name", "user__username")
    ordering = ("-uploaded_at",)

@admin.register(UserFile)
class UserFileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "object_key", "original_filename", "uploaded_at")
    search_fields = ("original_filename", "object_key", "user__username")
    ordering = ("-uploaded_at",)
