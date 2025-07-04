from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datagrid.models import UserTableRow
from datagrid.serializers import UserTableRowSerializer
from django.shortcuts import get_object_or_404

class UserTableRowListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, table_name):
        rows = UserTableRow.objects.filter(user=request.user, table_name=table_name)
        serializer = UserTableRowSerializer(rows, many=True)
        return Response(serializer.data)

    def post(self, request, table_name):
        row = UserTableRow.objects.create(
            user=request.user,
            table_name=table_name,
            data=request.data.get('data', {}),
        )
        return Response(UserTableRowSerializer(row).data, status=201)

class UserTableRowDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, table_name, pk):
        row = get_object_or_404(UserTableRow, user=request.user, table_name=table_name, pk=pk)
        for k, v in request.data.get('data', {}).items():
            row.data[k] = v
        row.save()
        return Response(UserTableRowSerializer(row).data)

    def delete(self, request, table_name, pk):
        row = get_object_or_404(UserTableRow, user=request.user, table_name=table_name, pk=pk)
        row.delete()
        return Response({"success": True})
