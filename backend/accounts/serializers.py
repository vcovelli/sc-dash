from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserActivity
from allauth.account.models import EmailAddress

User = get_user_model()

class SignupSerializer(serializers.ModelSerializer):
    # Add both fields as regular (write-only) fields, not part of Meta.fields
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]

    def validate(self, data):
        if data["password1"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Create the EmailAddress object (Allauth)
        EmailAddress.objects.create(
            user=user,
            email=user.email,
            primary=True,
            verified=False,  # require email confirmation
        )

        return user
    
class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ["verb", "target", "timestamp", "meta"]