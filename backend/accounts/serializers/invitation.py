from rest_framework import serializers
from accounts.models import Invitation, Organization
from django.contrib.auth import get_user_model

User = get_user_model()

PLAN_USER_LIMITS = {
    "Free": 1,
    "Pro": 5,
    "Enterprise": 100,
}

def can_add_user(org):
    plan = getattr(org, "plan", "Free")
    limit = PLAN_USER_LIMITS.get(plan, 1)
    current_users = org.users.count()  # related_name='users'
    pending_invites = org.invitations.filter(accepted=False).count()
    return (limit is None) or ((current_users + pending_invites) < limit)

class InvitationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    role = serializers.CharField()
    org_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Invitation
        fields = [
            "id",
            "email",
            "role",
            "org_id",
            "org",
            "invited_by",
            "created_at",
            "accepted",
            "token"
        ]
        read_only_fields = ["id", "created_at", "accepted", "token", "org", "invited_by"]

    def validate(self, attrs):
        org = None
        request = self.context.get("request")
        if request and hasattr(request.user, "org") and request.user.org:
            org = request.user.org
        elif attrs.get("org_id"):
            org = Organization.objects.filter(id=attrs["org_id"]).first()

        if not org:
            raise serializers.ValidationError("No organization found for this invitation.")

        if not can_add_user(org):
            raise serializers.ValidationError("User limit reached for your plan. Please upgrade to invite more users.")

        email = attrs["email"]
        if User.objects.filter(email=email, org=org).exists():
            raise serializers.ValidationError("User with this email already exists in your organization.")
        if Invitation.objects.filter(email=email, org=org, accepted=False).exists():
            raise serializers.ValidationError("There is already a pending invite for this email in your organization.")

        attrs["org"] = org
        return attrs

    def create(self, validated_data):
        import secrets
        token = secrets.token_urlsafe(32)
        request = self.context.get("request")
        inviter = request.user if request else None
        invite = Invitation.objects.create(
            email=validated_data["email"],
            org=validated_data["org"],
            invited_by=inviter,
            token=token,
            role=validated_data.get("role", "client"),
        )
        return invite

class AcceptInviteSerializer(serializers.Serializer):
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        token = attrs.get("token")
        password = attrs.get("password")
        password2 = attrs.get("password2")

        if not token or not password or not password2:
            raise serializers.ValidationError("All fields are required.")
        if password != password2:
            raise serializers.ValidationError("Passwords do not match.")

        invite = Invitation.objects.filter(token=token, accepted=False).first()
        if not invite:
            raise serializers.ValidationError("Invalid or expired invitation.")

        if not can_add_user(invite.org):
            raise serializers.ValidationError("User limit reached for this organization. Contact your admin.")

        if User.objects.filter(email=invite.email, org=invite.org).exists():
            raise serializers.ValidationError("User already exists in this organization.")

        attrs["invite"] = invite
        return attrs

    def create(self, validated_data):
        invite = validated_data["invite"]
        password = validated_data["password"]

        user = User.objects.create_user(
            username=invite.email,
            email=invite.email,
            password=password,
            org=invite.org,
            role=invite.role,
        )
        invite.accepted = True
        invite.save()
        return {
            "user_id": user.id,
            "email": user.email,
            "org_id": str(invite.org.id),
            "org_name": invite.org.name,
            "role": invite.role,
        }
