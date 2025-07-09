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

from .views.invite_views import (
    OrgAdminInviteUserView, 
    AcceptInviteView,
    OrgUsersListView,
    OrgUserUpdateView,
    OrgUserRemoveView,
    PendingInvitationsView
)

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
    path("invitations/pending/", PendingInvitationsView.as_view(), name="pending-invitations"),
    path("invitations/<int:invitation_id>/cancel/", PendingInvitationsView.as_view(), name="cancel-invitation"),
    
    # User Management endpoints
    path("org/users/", OrgUsersListView.as_view(), name="org-users-list"),
    path("org/users/<int:user_id>/", OrgUserUpdateView.as_view(), name="org-user-update"),
    path("org/users/<int:user_id>/remove/", OrgUserRemoveView.as_view(), name="org-user-remove"),

    # Account info
    path('me/', UserProfileView.as_view(), name='me'),

    # Activity feed
    path('activity-feed/', ActivityFeedView.as_view(), name='activity-feed'),

    # Dashboard overview
    path('dashboard-overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),

    # Onboarding progress
    path('onboarding/progress/', OnboardingStatusView.as_view(), name='onboarding-progress'),
]
