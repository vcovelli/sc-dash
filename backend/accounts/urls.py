from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# Auth-related views
from .views.auth_views import (
    SignupView,
    LoginView,
    ReactConfirmEmailView,
    GoogleLoginAPIView,
    GitHubLoginStartView,
    GitHubCallbackView,
)

# Account-related views
from .views.account_views import (
    UserProfileView,
    ActivityFeedView,
)

from .views.invite_views import OrgAdminInviteUserView, AcceptInviteView

# Dashboard and onboarding views
from .views.dashboard import DashboardOverviewView
from .views.onboarding import OnboardingStatusView  # Only if you have this!

urlpatterns = [
    # Email confirmation (AllAuth)
    path('account-confirm-email/<key>/', ReactConfirmEmailView.as_view(), name='account_confirm_email'),

    # Auth endpoints
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Social Auth
    path('google/', GoogleLoginAPIView.as_view(), name='google-login'),
    path('github/login/', GitHubLoginStartView.as_view(), name='github_login'),
    path('github/callback/', GitHubCallbackView.as_view(), name='github_callback'),

    # Invite endpoints
    path("invite/send/", OrgAdminInviteUserView.as_view(), name="invite-user"),
    path("invite/accept/", AcceptInviteView.as_view(), name="accept-invite"),

    # Account info
    path('me/', UserProfileView.as_view(), name='me'),

    # Activity feed
    path('activity-feed/', ActivityFeedView.as_view(), name='activity-feed'),

    # Dashboard overview
    path('dashboard-overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),

    # Onboarding progress
    path('onboarding/progress/', OnboardingStatusView.as_view(), name='onboarding-progress'),
]
