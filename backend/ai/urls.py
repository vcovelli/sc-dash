from django.urls import path
from .views.assistant import AssistantView, AssistantStreamView
from .views import assistant
#from .views import AIFeedbackView

urlpatterns = [
    #path("feedback/", AIFeedbackView.as_view(), name="ai-feedback"),
    path("stream/", AssistantStreamView.as_view(), name="assistant-stream"),
    path("", AssistantView.as_view(), name="assistant-chat"),
]
