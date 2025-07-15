from rest_framework import serializers
from .models import UserTableSchema, UserGridConfig, UserTableRow

class UserTableSchemaSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    columns = serializers.JSONField()
    expected_headers = serializers.SerializerMethodField()
    
    # New sharing fields
    sharing_level = serializers.CharField(read_only=False)
    is_shared = serializers.BooleanField(read_only=True)
    shared_by = serializers.PrimaryKeyRelatedField(read_only=True)
    shared_by_username = serializers.SerializerMethodField()
    shared_at = serializers.DateTimeField(read_only=True)
    
    # Permission indicators for the current user
    can_edit = serializers.SerializerMethodField()
    can_share = serializers.SerializerMethodField()
    can_unshare = serializers.SerializerMethodField()

    class Meta:
        model = UserTableSchema
        fields = [
            'id',
            'user',
            'org',
            'table_name',
            'db_table_name',
            'primary_key',
            'columns',
            'sharing_level',
            'is_shared',
            'shared_by',
            'shared_by_username',
            'shared_at',
            'created_at',
            'updated_at',
            'expected_headers',
            'can_edit',
            'can_share',
            'can_unshare',
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_shared', 'shared_by', 'shared_at']

    def get_expected_headers(self, obj):
        cols = obj.columns or []
        if cols and isinstance(cols[0], dict):
            return [col.get('accessorKey') for col in cols if col.get('accessorKey')]
        return cols

    def get_shared_by_username(self, obj):
        return obj.shared_by.username if obj.shared_by else None

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_edit(request.user)

    def get_can_share(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.can_user_share(request.user)

    def get_can_unshare(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # Can unshare if can share and it's currently shared
        return obj.can_user_share(request.user) and obj.is_shared

    def validate_sharing_level(self, value):
        """Validate that user has permission to set sharing level"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication required")

        # If trying to share organization-wide, check permissions
        if value == 'organization':
            SCHEMA_SHARE_ROLES = [
                'admin', 'owner', 'ceo', 'national_manager', 
                'regional_manager', 'local_manager'
            ]
            if request.user.role not in SCHEMA_SHARE_ROLES:
                raise serializers.ValidationError(
                    "You don't have permission to share schemas organization-wide. "
                    "Contact your manager or organization owner."
                )

        return value

    def update(self, instance, validated_data):
        """Handle schema sharing/unsharing during updates"""
        sharing_level = validated_data.get('sharing_level')
        request = self.context.get('request')
        
        # If sharing level is being changed
        if sharing_level and sharing_level != instance.sharing_level:
            if sharing_level == 'organization':
                instance.share_organization_wide(request.user)
            elif sharing_level == 'personal':
                instance.make_personal()
        
        return super().update(instance, validated_data)

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
