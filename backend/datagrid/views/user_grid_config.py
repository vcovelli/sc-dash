# api/views/schema/user_grid_config.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datagrid.models import UserGridConfig
from datagrid.serializers import UserGridConfigSerializer
from django.shortcuts import get_object_or_404
from accounts.permissions import IsReadOnlyOrAbove
from accounts.mixins import CombinedOrgMixin

class UserGridConfigView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def get(self, request, table_name):
        """Get the current user's grid config for a table."""
        config = UserGridConfig.objects.filter(
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        ).first()
        if not config:
            # Return sensible defaults if config doesn't exist yet
            return Response({"detail": "No config yet."}, status=404)
        serializer = UserGridConfigSerializer(config)
        return Response(serializer.data)

    def patch(self, request, table_name):
        """Update grid config for this table."""
        config, _ = UserGridConfig.objects.get_or_create(
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        )
        serializer = UserGridConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
