from django.contrib import admin
from .models import UserTableSchema, UserGridConfig, UserTableRow, Column, SchemaHistory, SchemaPermission

@admin.register(Column)
class ColumnAdmin(admin.ModelAdmin):
    list_display = ['name', 'schema', 'data_type', 'order', 'is_required', 'is_primary_key', 'is_visible']
    list_filter = ['data_type', 'is_required', 'is_primary_key', 'is_visible', 'is_editable']
    search_fields = ['name', 'display_name', 'schema__table_name']
    ordering = ['schema', 'order', 'name']
    list_editable = ['order', 'is_visible', 'is_required']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('schema', 'name', 'display_name', 'data_type', 'order')
        }),
        ('Field Properties', {
            'fields': ('is_required', 'is_unique', 'default_value', 'choices')
        }),
        ('Type-specific Properties', {
            'fields': ('max_length', 'min_length', 'max_value', 'min_value', 'decimal_places'),
            'classes': ('collapse',)
        }),
        ('Relationships', {
            'fields': ('is_primary_key', 'is_foreign_key', 'foreign_key_table', 'foreign_key_column'),
            'classes': ('collapse',)
        }),
        ('UI Properties', {
            'fields': ('is_visible', 'is_editable', 'width'),
            'classes': ('collapse',)
        }),
        ('Documentation', {
            'fields': ('description', 'help_text'),
            'classes': ('collapse',)
        }),
    )

class ColumnInline(admin.TabularInline):
    model = Column
    extra = 0
    fields = ['name', 'data_type', 'order', 'is_required', 'is_primary_key', 'is_visible']
    ordering = ['order', 'name']

@admin.register(SchemaHistory)
class SchemaHistoryAdmin(admin.ModelAdmin):
    list_display = ['schema', 'action', 'user', 'timestamp', 'field_changed']
    list_filter = ['action', 'timestamp', 'schema__org']
    search_fields = ['schema__table_name', 'user__username', 'user__email', 'description']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('schema', 'action', 'user', 'timestamp')
        }),
        ('Change Details', {
            'fields': ('field_changed', 'old_value', 'new_value', 'description')
        }),
        ('Request Context', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )

@admin.register(SchemaPermission)
class SchemaPermissionAdmin(admin.ModelAdmin):
    list_display = ['schema', 'user', 'org', 'permission', 'granted_by', 'granted_at', 'expires_at']
    list_filter = ['permission', 'granted_at', 'expires_at']
    search_fields = ['schema__table_name', 'user__username', 'user__email', 'org__name']
    readonly_fields = ['granted_at']
    
    fieldsets = (
        ('Permission Details', {
            'fields': ('schema', 'user', 'org', 'permission')
        }),
        ('Grant Information', {
            'fields': ('granted_by', 'granted_at', 'expires_at')
        }),
    )

class UserTableSchemaAdmin(admin.ModelAdmin):
    list_display = ['table_name', 'user', 'org', 'version', 'is_active', 'sharing_level', 'is_shared', 'is_valid', 'created_at']
    list_filter = ['sharing_level', 'is_shared', 'is_active', 'is_valid', 'org', 'created_at']
    search_fields = ['table_name', 'user__username', 'user__email', 'org__name', 'description']
    readonly_fields = ['is_shared', 'shared_at', 'created_at', 'updated_at']
    list_editable = ['is_active', 'sharing_level']
    inlines = [ColumnInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'org', 'table_name', 'db_table_name', 'primary_key')
        }),
        ('Versioning', {
            'fields': ('version', 'is_active')
        }),
        ('Legacy Columns', {
            'fields': ('columns',),
            'classes': ('collapse',),
            'description': 'Legacy column storage - use Column model instead'
        }),
        ('Sharing', {
            'fields': ('sharing_level', 'is_shared', 'shared_at', 'shared_by')
        }),
        ('Validation', {
            'fields': ('is_valid', 'validation_errors')
        }),
        ('Metadata', {
            'fields': ('description', 'tags'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['make_private', 'make_org_shared', 'make_public', 'validate_schemas']
    
    def make_private(self, request, queryset):
        updated = queryset.update(sharing_level='private')
        self.message_user(request, f'{updated} schemas set to private.')
    make_private.short_description = "Set selected schemas to private"
    
    def make_org_shared(self, request, queryset):
        updated = queryset.update(sharing_level='org')
        self.message_user(request, f'{updated} schemas set to organization shared.')
    make_org_shared.short_description = "Set selected schemas to organization shared"
    
    def make_public(self, request, queryset):
        updated = queryset.update(sharing_level='public')
        self.message_user(request, f'{updated} schemas set to public.')
    make_public.short_description = "Set selected schemas to public"
    
    def validate_schemas(self, request, queryset):
        validated = 0
        for schema in queryset:
            schema.validate_schema()
            validated += 1
        self.message_user(request, f'{validated} schemas validated.')
    validate_schemas.short_description = "Validate selected schemas"

admin.site.register(UserTableSchema, UserTableSchemaAdmin)

@admin.register(UserGridConfig)
class UserGridConfigAdmin(admin.ModelAdmin):
    list_display = ['table_name', 'user', 'org', 'updated_at']
    list_filter = ['org', 'updated_at']
    search_fields = ['table_name', 'user__username', 'user__email', 'org__name']
    readonly_fields = ['updated_at']

@admin.register(UserTableRow)
class UserTableRowAdmin(admin.ModelAdmin):
    list_display = ['table_name', 'user', 'org', 'created_at', 'modified_at']
    list_filter = ['table_name', 'org', 'created_at']
    search_fields = ['table_name', 'user__username', 'user__email', 'org__name']
    readonly_fields = ['created_at', 'modified_at']
