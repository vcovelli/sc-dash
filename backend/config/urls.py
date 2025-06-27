from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/accounts/', include('accounts.urls')),
    path("api/ai/", include("ai.urls")),
    path('api/analytics/', include('analytics.urls')),

    # Your custom account logic (signup, login, profile)
    path('auth/', include('accounts.urls')),

    # REST auth core (login/logout/password/reset/user etc)
    path('auth/rest/', include('dj_rest_auth.urls')),

    # Registration-specific endpoints (verify email, resend, signup)
    path('auth/rest/registration/', include('dj_rest_auth.registration.urls')),

    # AllAuth social login (e.g., /auth/social/github/login/)
    path('auth/social/', include('allauth.socialaccount.urls')),

    # Optional: if you’re using any other allauth views (rarely needed)
    # path('auth/allauth/', include('allauth.urls')),
]
