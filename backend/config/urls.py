from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Core business APIs
    path('api/', include('api.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/assistant/', include('ai.urls')),
    path('api/analytics/', include('analytics.urls')),

    # NEW: datagrid and files apps (modular and clean)
    path('api/datagrid/', include('datagrid.urls')),
    path('api/files/', include('files.urls')),

    # Auth
    path('auth/', include('accounts.urls')),
    path('auth/rest/', include('dj_rest_auth.urls')),
    path('auth/rest/registration/', include('dj_rest_auth.registration.urls')),
    path('auth/social/', include('allauth.socialaccount.urls')),
    # Optional allauth: path('auth/allauth/', include('allauth.urls')),
]
