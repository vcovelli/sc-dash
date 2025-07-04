# /accounts/helpers/onboarding_utils.py

from files.models import UploadedFile
from datagrid.models import UserTableSchema
from django.contrib.auth import get_user_model
from analytics.models import AnalyticsDashboard, DashboardChart

User = get_user_model()

def has_uploaded_file(user):
    # Mark as uploaded if user has a successfully processed file
    return UploadedFile.objects.filter(user=user, status="success").exists()

def has_created_schema(user):
    return UserTableSchema.objects.filter(user=user).exists()

def has_created_dashboard(user):
    # There must be a dashboard and at least one chart attached
    dashboard = AnalyticsDashboard.objects.filter(user=user).first()
    return dashboard is not None and DashboardChart.objects.filter(dashboard=dashboard).exists()

def has_set_alerts(user):
    # For now, just return False or True as appropriate until you add alert settings
    return False  # or True

def has_invited_users(user):
    # Only checks users from the same business
    if not hasattr(user, 'business_name') or not user.business_name:
        return False
    return User.objects.filter(business_name=user.business_name).count() > 1
