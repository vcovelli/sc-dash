from rest_framework import serializers
from accounts.models import UserActivity

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ["verb", "target", "timestamp", "meta"]
