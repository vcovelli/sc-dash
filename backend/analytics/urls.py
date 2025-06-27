from django.urls import path
from .views import (
    AnalyticsDashboardView,
    DashboardChartView,
)

urlpatterns = [
    path('dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('chart/', DashboardChartView.as_view(), name='dashboard-chart-list'),      # POST, GET all
    path('chart/<int:pk>/', DashboardChartView.as_view(), name='dashboard-chart-detail'), # PATCH, DELETE
]
