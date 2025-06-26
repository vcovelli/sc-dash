# /accounts/helpers/onboarding_utils.py

from api.models import UploadedFile, UserTableSchema
from django.contrib.auth import get_user_model

User = get_user_model()

def has_uploaded_file(user):
    # Mark as uploaded if user has a successfully processed file
    return UploadedFile.objects.filter(user=user, status="success").exists()

def has_created_schema(user):
    return UserTableSchema.objects.filter(user=user).exists()

def has_created_dashboard(user):
    # For now, just return False or True as appropriate until you add dashboard tracking
    return False  # or True

def has_set_alerts(user):
    # For now, just return False or True as appropriate until you add alert settings
    return False  # or True

def has_invited_users(user):
    # Only checks users from the same business
    if not hasattr(user, 'business_name') or not user.business_name:
        return False
    return User.objects.filter(business_name=user.business_name).count() > 1
