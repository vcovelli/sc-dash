from rest_framework import serializers
from .models import UserTableSchema, UserGridConfig, UserTableRow, Column, SchemaHistory, SchemaPermission

class ColumnSerializer(serializers.ModelSerializer):
    """Serializer for the Column model"""
    effective_display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Column
        fields = [
            'id', 'name', 'display_name', 'effective_display_name', 'data_type', 'order',
            'is_required', 'is_unique', 'default_value', 'choices',
            'max_length', 'min_length', 'max_value', 'min_value', 'decimal_places',
            'is_primary_key', 'is_foreign_key', 'foreign_key_table', 'foreign_key_column',
            'is_visible', 'is_editable', 'width',
            'description', 'help_text', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'effective_display_name']

class SchemaHistorySerializer(serializers.ModelSerializer):
    """Serializer for schema history/audit trail"""
    user_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SchemaHistory
        fields = [
            'id', 'action', 'user', 'user_display', 'timestamp',
            'field_changed', 'old_value', 'new_value', 'description',
            'ip_address', 'user_agent'
        ]
        read_only_fields = ['id', 'timestamp', 'user_display']
    
    def get_user_display(self, obj):
        if obj.user:
            return obj.user.email or obj.user.username
        return "System"

class SchemaPermissionSerializer(serializers.ModelSerializer):
    """Serializer for schema permissions"""
    user_display = serializers.SerializerMethodField()
    org_display = serializers.SerializerMethodField()
    granted_by_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SchemaPermission
        fields = [
            'id', 'user', 'user_display', 'org', 'org_display', 'permission',
            'granted_by', 'granted_by_display', 'granted_at', 'expires_at'
        ]
        read_only_fields = ['id', 'granted_at', 'user_display', 'org_display', 'granted_by_display']
    
    def get_user_display(self, obj):
        return obj.user.email or obj.user.username if obj.user else None
    
    def get_org_display(self, obj):
        return obj.org.name if obj.org else None
    
    def get_granted_by_display(self, obj):
        return obj.granted_by.email or obj.granted_by.username if obj.granted_by else None

class UserTableSchemaSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    columns = serializers.JSONField()  # Legacy field
    expected_headers = serializers.SerializerMethodField()
    
    # New enhanced fields
    schema_columns = ColumnSerializer(many=True, read_only=True)
    is_shared_display = serializers.SerializerMethodField()
    shared_by_display = serializers.SerializerMethodField()
    validation_status = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_share = serializers.SerializerMethodField()
    history = SchemaHistorySerializer(many=True, read_only=True)
    permissions = SchemaPermissionSerializer(many=True, read_only=True)

    class Meta:
        model = UserTableSchema
        fields = [
            'id', 'user', 'table_name', 'db_table_name', 'primary_key',
            'columns', 'expected_headers', 'schema_columns',  # Column fields
            'version', 'is_active',  # Versioning
            'sharing_level', 'is_shared', 'is_shared_display', 'shared_at', 
            'shared_by', 'shared_by_display',  # Sharing
            'is_valid', 'validation_errors', 'validation_status',  # Validation
            'description', 'tags',  # Metadata
            'can_edit', 'can_share',  # Permissions
            'history', 'permissions',  # Related data
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'user', 'created_at', 'updated_at', 'expected_headers',
            'schema_columns', 'is_shared', 'shared_at', 'is_shared_display',
            'shared_by_display', 'validation_status', 'can_edit', 'can_share',
            'history', 'permissions'
        ]

    def get_expected_headers(self, obj):
        # Priority: use new Column model, fallback to legacy columns
        if obj.schema_columns.exists():
            return [col.name for col in obj.schema_columns.all().order_by('order')]
        
        # Legacy fallback
        cols = obj.columns or []
        if cols and isinstance(cols[0], dict):
            return [col.get('accessorKey') for col in cols if col.get('accessorKey')]
        return cols
    
    def get_is_shared_display(self, obj):
        return obj.get_sharing_level_display() if obj.is_shared else "Private"
    
    def get_shared_by_display(self, obj):
        return obj.shared_by.email or obj.shared_by.username if obj.shared_by else None
    
    def get_validation_status(self, obj):
        if obj.is_valid:
            return {"status": "valid", "errors": []}
        return {"status": "invalid", "errors": obj.validation_errors}
    
    def get_can_edit(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return False
        
        # Owner can always edit
        if obj.user == user:
            return True
        
        # Check permissions
        return obj.permissions.filter(
            user=user, 
            permission__in=['edit', 'admin']
        ).exists()
    
    def get_can_share(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user:
            return False
        
        # Owner can always share
        if obj.user == user:
            return True
        
        # Check admin permissions
        return obj.permissions.filter(
            user=user, 
            permission='admin'
        ).exists()

class UserTableSchemaCreateUpdateSerializer(serializers.ModelSerializer):
    """Separate serializer for create/update operations"""
    schema_columns_data = ColumnSerializer(many=True, write_only=True, required=False)
    
    class Meta:
        model = UserTableSchema
        fields = [
            'table_name', 'db_table_name', 'primary_key',
            'sharing_level', 'description', 'tags',
            'schema_columns_data'
        ]
    
    def create(self, validated_data):
        columns_data = validated_data.pop('schema_columns_data', [])
        schema = UserTableSchema.objects.create(**validated_data)
        
        # Create columns
        for i, column_data in enumerate(columns_data):
            column_data['order'] = i
            Column.objects.create(schema=schema, **column_data)
        
        # Validate schema
        schema.validate_schema()
        
        # Create history entry
        SchemaHistory.objects.create(
            schema=schema,
            action='created',
            user=self.context['request'].user,
            description=f"Created schema '{schema.table_name}'"
        )
        
        return schema
    
    def update(self, instance, validated_data):
        columns_data = validated_data.pop('schema_columns_data', None)
        
        # Track changes for history
        changes = []
        for field, value in validated_data.items():
            old_value = getattr(instance, field)
            if old_value != value:
                changes.append({
                    'field': field,
                    'old_value': old_value,
                    'new_value': value
                })
        
        # Update instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update columns if provided
        if columns_data is not None:
            # Delete existing columns
            instance.schema_columns.all().delete()
            
            # Create new columns
            for i, column_data in enumerate(columns_data):
                column_data['order'] = i
                Column.objects.create(schema=instance, **column_data)
            
            changes.append({
                'field': 'columns',
                'old_value': 'Previous columns',
                'new_value': f'{len(columns_data)} columns updated'
            })
        
        # Validate schema
        instance.validate_schema()
        
        # Create history entries
        for change in changes:
            SchemaHistory.objects.create(
                schema=instance,
                action='updated',
                user=self.context['request'].user,
                field_changed=change['field'],
                old_value=change['old_value'],
                new_value=change['new_value']
            )
        
        return instance

class UserGridConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGridConfig
        fields = [
            "id",
            "user",
            "table_name",
            "column_order",
            "column_widths",
            "column_visibility",
            "column_names",
            "extra_options",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "updated_at"]

class UserTableRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTableRow
        fields = ['id', 'user', 'table_name', 'data', 'created_at', 'modified_at']
        read_only_fields = ['id', 'user', 'created_at', 'modified_at']
