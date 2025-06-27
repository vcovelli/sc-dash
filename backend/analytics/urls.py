from django.urls import path
from .views import (
    AnalyticsDashboardView,
    DashboardChartView,
)

urlpatterns = [
    path('dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),  # GET/patch for "my" dashboard (no id)
    path('dashboard/<int:pk>/', AnalyticsDashboardView.as_view(), name='analytics-dashboard-detail'),  # PATCH by id!
    path('chart/', DashboardChartView.as_view(), name='dashboard-chart-list'),      # POST, GET all
    path('chart/<int:pk>/', DashboardChartView.as_view(), name='dashboard-chart-detail'), # PATCH, DELETE
]