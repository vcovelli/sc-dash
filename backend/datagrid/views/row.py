from rest_framework.views import APIView
from rest_framework.response import Response
from datagrid.models import UserTableRow
from datagrid.serializers import UserTableRowSerializer
from django.shortcuts import get_object_or_404
from accounts.permissions import IsReadOnlyOrAbove
from accounts.mixins import CombinedOrgMixin

class UserTableRowListCreateView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def get(self, request, table_name):
        # CombinedOrgMixin ensures org filtering
        rows = UserTableRow.objects.filter(
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        )
        serializer = UserTableRowSerializer(rows, many=True)
        return Response(serializer.data)

    def post(self, request, table_name):
        row = UserTableRow.objects.create(
            user=request.user,
            org=request.user.org,
            table_name=table_name,
            data=request.data.get('data', {}),
        )
        return Response(UserTableRowSerializer(row).data, status=201)

class UserTableRowDetailView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def patch(self, request, table_name, pk):
        row = get_object_or_404(
            UserTableRow, 
            user=request.user, 
            org=request.user.org, 
            table_name=table_name, 
            pk=pk
        )
        for k, v in request.data.get('data', {}).items():
            row.data[k] = v
        row.save()
        return Response(UserTableRowSerializer(row).data)

    def delete(self, request, table_name, pk):
        row = get_object_or_404(
            UserTableRow, 
            user=request.user, 
            org=request.user.org, 
            table_name=table_name, 
            pk=pk
        )
        row.delete()
        return Response({"success": True})
