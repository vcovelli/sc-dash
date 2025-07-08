from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from accounts.models import Invitation, CustomUser
from accounts.serializers import InvitationSerializer

class OrgAdminInviteUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        if not request.user.is_admin() or not request.user.org:
            return Response({"error": "Only org admins can invite users."}, status=403)
        email = request.data.get("email")
        role = request.data.get("role", "client")  # Optional: allow admins to choose
        if not email:
            return Response({"error": "Email is required."}, status=400)
        if CustomUser.objects.filter(email=email, org=request.user.org).exists():
            return Response({"error": "User already exists in your organization."}, status=400)
        token = get_random_string(48)
        invite = Invitation.objects.create(
            email=email,
            org=request.user.org,
            invited_by=request.user,
            token=token,
            role=role,
        )
        invite_url = f"{settings.FRONTEND_URL}/invite/accept/{token}/"
        send_mail(
            subject=f"You're invited to {request.user.org.name}!",
            message=f"Click here to join: {invite_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )
        return Response({"message": "Invitation sent!"}, status=200)

class AcceptInviteView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        token = request.data.get("token")
        password = request.data.get("password")
        if not token or not password:
            return Response({"error": "Token and password required."}, status=400)
        invite = Invitation.objects.filter(token=token, accepted=False).first()
        if not invite:
            return Response({"error": "Invalid or expired invitation."}, status=400)
        if CustomUser.objects.filter(email=invite.email, org=invite.org).exists():
            return Response({"error": "User already exists."}, status=400)
        user = CustomUser.objects.create_user(
            username=invite.email,
            email=invite.email,
            password=password,
            org=invite.org,
            role=invite.role,
        )
        invite.accepted = True
        invite.save()
        return Response({"message": "Account created! You can now log in."})
