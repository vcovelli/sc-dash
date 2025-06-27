from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import AnalyticsDashboard, DashboardChart
from .serializers import AnalyticsDashboardSerializer, DashboardChartSerializer

class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get or create the user's dashboard
        dashboard, _ = AnalyticsDashboard.objects.get_or_create(user=request.user)
        serializer = AnalyticsDashboardSerializer(dashboard)
        return Response(serializer.data)

    def patch(self, request):
        dashboard = AnalyticsDashboard.objects.filter(user=request.user).first()
        if not dashboard:
            return Response({"error": "Dashboard not found"}, status=404)
        # Only update layout for now
        layout = request.data.get("layout")
        if layout is not None:
            dashboard.layout = layout
            dashboard.save()
        serializer = AnalyticsDashboardSerializer(dashboard)
        return Response(serializer.data)

class DashboardChartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return all charts for the current user's dashboard
        dashboard = AnalyticsDashboard.objects.filter(user=request.user).first()
        if not dashboard:
            return Response([], status=200)
        charts = DashboardChart.objects.filter(dashboard=dashboard)
        serializer = DashboardChartSerializer(charts, many=True)
        return Response(serializer.data)

    def post(self, request):
        # Add new chart for current user's dashboard
        dashboard, _ = AnalyticsDashboard.objects.get_or_create(user=request.user)
        data = request.data.copy()
        data['dashboard'] = dashboard.id
        serializer = DashboardChartSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def patch(self, request, pk=None):
        try:
            chart = DashboardChart.objects.get(pk=pk, dashboard__user=request.user)
        except DashboardChart.DoesNotExist:
            return Response({'error': 'Chart not found'}, status=404)
        serializer = DashboardChartSerializer(chart, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk=None):
        try:
            chart = DashboardChart.objects.get(pk=pk, dashboard__user=request.user)
        except DashboardChart.DoesNotExist:
            return Response({'error': 'Chart not found'}, status=404)
        chart.delete()
        return Response(status=204)
