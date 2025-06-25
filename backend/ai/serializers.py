from rest_framework import serializers
from .models import AIFeedback

class AIFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIFeedback
        fields = '__all__'
