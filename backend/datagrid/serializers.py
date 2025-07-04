from rest_framework import serializers
from .models import UserTableSchema, UserGridConfig, UserTableRow

class UserTableSchemaSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    columns = serializers.JSONField()
    expected_headers = serializers.SerializerMethodField()

    class Meta:
        model = UserTableSchema
        fields = [
            'id',
            'user',
            'table_name',
            'db_table_name',
            'primary_key',
            'columns',
            'created_at',
            'updated_at',
            'expected_headers',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_expected_headers(self, obj):
        cols = obj.columns or []
        if cols and isinstance(cols[0], dict):
            return [col.get('accessorKey') for col in cols if col.get('accessorKey')]
        return cols

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
