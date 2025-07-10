from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import JSONField
from accounts.models import Organization

User = get_user_model()

class AnalyticsDashboard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboards')
    org = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='dashboards',
        help_text="Organization this dashboard belongs to",
        null=True, blank=True,
    )
    name = models.CharField(max_length=100, default="My Dashboard")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Optionally: layout config for overall dashboard (grid, custom layouts, etc)
    layout = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = [['user', 'org', 'name']]

    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.org.name})"

class DashboardChart(models.Model):
    dashboard = models.ForeignKey(AnalyticsDashboard, on_delete=models.CASCADE, related_name='charts')
    chart_type = models.CharField(max_length=32, choices=[
        ('bar', 'Bar'),
        ('line', 'Line'),
        ('pie', 'Pie'),
        ('table', 'Table'),
        # add more if needed
    ])
    title = models.CharField(max_length=100, blank=True)
    position = models.IntegerField(default=0)  # for ordering
    size = models.CharField(max_length=20, default="medium")  # small, medium, large, etc
    settings = JSONField(default=dict, blank=True)  # e.g. orientation, colors, whatever UI lets users pick
    data_source = JSONField(default=dict, blank=True)  # Save data, query, or config here
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Optionally: unique_together = [dashboard, position] for no overlaps

    def __str__(self):
        return f"{self.chart_type} ({self.title}) - {self.dashboard.org.name}"
