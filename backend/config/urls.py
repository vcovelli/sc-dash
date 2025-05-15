from django.contrib import admin
from django.urls import path, include
from api.views.upload import MarkSuccessView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('auth/', include('accounts.urls')),
]
