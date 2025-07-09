from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import AnalyticsDashboard, DashboardChart
from .serializers import AnalyticsDashboardSerializer, DashboardChartSerializer
from accounts.permissions import CanViewAnalytics
from accounts.mixins import CombinedOrgMixin

class AnalyticsDashboardView(CombinedOrgMixin, APIView):
    permission_classes = [CanViewAnalytics]

    def get(self, request):
        dashboard, _ = AnalyticsDashboard.objects.get_or_create(
            user=request.user, 
            org=request.user.org,
            defaults={'name': 'My Dashboard'}
        )
        serializer = AnalyticsDashboardSerializer(dashboard)
        return Response(serializer.data)

    def patch(self, request, pk=None):
        # PATCH /api/analytics/dashboard/<pk>/
        try:
            dashboard = AnalyticsDashboard.objects.get(
                pk=pk, 
                user=request.user, 
                org=request.user.org
            )
        except AnalyticsDashboard.DoesNotExist:
            return Response({"error": "Dashboard not found"}, status=404)
        layout = request.data.get("layout")
        if layout is not None:
            dashboard.layout = layout
            dashboard.save()
        serializer = AnalyticsDashboardSerializer(dashboard)
        return Response(serializer.data)


class DashboardChartView(CombinedOrgMixin, APIView):
    """
    GET: List all charts for the authenticated user's dashboard.
    POST: Create a new chart for the user's dashboard.
    PATCH: Update a chart by its ID (pk).
    DELETE: Delete a chart by its ID (pk).
    """
    permission_classes = [CanViewAnalytics]

    def get(self, request):
        dashboard = AnalyticsDashboard.objects.filter(
            user=request.user, 
            org=request.user.org
        ).first()
        if not dashboard:
            return Response([], status=200)
        charts = DashboardChart.objects.filter(dashboard=dashboard)
        serializer = DashboardChartSerializer(charts, many=True)
        return Response(serializer.data)

    def post(self, request):
        dashboard, _ = AnalyticsDashboard.objects.get_or_create(
            user=request.user, 
            org=request.user.org,
            defaults={'name': 'My Dashboard'}
        )
        data = request.data.copy()
        data['dashboard'] = dashboard.id
        serializer = DashboardChartSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def patch(self, request, pk=None):
        if pk is None:
            return Response({'error': 'Chart ID required for PATCH'}, status=400)
        try:
            chart = DashboardChart.objects.get(
                pk=pk, 
                dashboard__user=request.user,
                dashboard__org=request.user.org
            )
        except DashboardChart.DoesNotExist:
            return Response({'error': 'Chart not found'}, status=404)
        serializer = DashboardChartSerializer(chart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk=None):
        if pk is None:
            return Response({'error': 'Chart ID required for DELETE'}, status=400)
        try:
            chart = DashboardChart.objects.get(
                pk=pk, 
                dashboard__user=request.user,
                dashboard__org=request.user.org
            )
        except DashboardChart.DoesNotExist:
            return Response({'error': 'Chart not found'}, status=404)
        chart.delete()
        return Response(status=204)
