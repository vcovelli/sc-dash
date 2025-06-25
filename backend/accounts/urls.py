from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SignupView, LoginView, UserProfileView
from accounts.views import ReactConfirmEmailView, GoogleLoginAPIView
from accounts.views import GitHubLoginStartView, GitHubCallbackView
from .views import ActivityFeedView

urlpatterns = [
    path('account-confirm-email/<key>/', ReactConfirmEmailView.as_view(), name='account_confirm_email'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='me'),
    path('google/', GoogleLoginAPIView.as_view(), name='google-login'),

    # GitHub OAuth endpoints (no custom logic needed)
    path("github/login/", GitHubLoginStartView.as_view(), name="github_login"),
    path("github/callback/", GitHubCallbackView.as_view(), name="github_callback"),

    path("activity-feed/", ActivityFeedView.as_view(), name="activity-feed"),
]