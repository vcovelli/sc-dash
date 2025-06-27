from django.contrib import admin
from .models import AnalyticsDashboard, DashboardChart

@admin.register(AnalyticsDashboard)
class AnalyticsDashboardAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'created_at')

@admin.register(DashboardChart)
class DashboardChartAdmin(admin.ModelAdmin):
    list_display = ('id', 'dashboard', 'chart_type', 'title', 'position', 'created_at')
