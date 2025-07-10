from rest_framework import serializers
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from accounts.models import CustomUser

User = get_user_model()

class SignupSerializer(serializers.ModelSerializer):
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    invitation_token = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2", "invitation_token"]

    def validate(self, data):
        if data["password1"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        password = validated_data.pop("password1")
        validated_data.pop("password2")
        invitation_token = validated_data.pop("invitation_token", None)
        
        # Check if this is an invited user
        invitation = None
        if invitation_token:
            from accounts.models import Invitation
            try:
                invitation = Invitation.objects.get(
                    token=invitation_token, 
                    email=validated_data['email'],
                    accepted=False
                )
            except Invitation.DoesNotExist:
                raise serializers.ValidationError("Invalid or expired invitation.")
        
        user = User(**validated_data)
        user.set_password(password)
        
        if invitation:
            # User is joining via invitation - use invitation role and org
            user.org = invitation.org
            user.role = invitation.role
            user.save()
            
            # Mark invitation as accepted
            invitation.accepted = True
            invitation.save()
        else:
            # Solo user/owner-operator mode - auto-generate full permissions
            user.role = "owner"  # Default to owner for solo signups
            user.save()
            
            # Create organization for new solo user
            from accounts.models import Organization
            org_name = f"{user.first_name or user.username}'s Organization"
            org, _ = Organization.objects.get_or_create(
                name=org_name,
                defaults={"slug": f"{user.username}-org"}
            )
            user.org = org
            user.save()

        # Allauth email address creation
        EmailAddress.objects.create(
            user=user,
            email=user.email,
            primary=True,
            verified=False,
        )
        return user

class OrgUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id", "username", "email", "role", "plan", "business_name",
            "date_joined", "is_active"
        ]
        read_only_fields = ["id", "username", "date_joined", "email"]