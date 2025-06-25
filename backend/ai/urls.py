from django.urls import path
from .views import AIFeedbackView

urlpatterns = [
    path("feedback/", AIFeedbackView.as_view(), name="ai-feedback"),
]
