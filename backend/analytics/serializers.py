from rest_framework import serializers
from .models import AnalyticsDashboard, DashboardChart

class DashboardChartSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardChart
        fields = '__all__'

class AnalyticsDashboardSerializer(serializers.ModelSerializer):
    charts = DashboardChartSerializer(many=True, read_only=True)
    class Meta:
        model = AnalyticsDashboard
        fields = ['id', 'name', 'created_at', 'updated_at', 'layout', 'charts']
