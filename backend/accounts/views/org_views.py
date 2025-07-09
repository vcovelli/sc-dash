from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from accounts.models import CustomUser, Invitation
from accounts.serializers.user import OrgUserSerializer
from accounts.serializers.invitation import InvitationSerializer
from django.core.mail import send_mail

def is_org_admin(user):
    return user.org and user.role in ["owner", "admin"]

class OrgUsersListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        if not request.user.org:
            return Response({"error": "You do not belong to any organization."}, status=403)
        users = CustomUser.objects.filter(org=request.user.org)
        return Response(OrgUserSerializer(users, many=True).data)

class OrgUserRoleUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, user_id):
        if not is_org_admin(request.user):
            return Response({"error": "Only org admins can change user roles."}, status=403)
        try:
            user = CustomUser.objects.get(id=user_id, org=request.user.org)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        role = request.data.get("role")
        if not role:
            return Response({"error": "Missing role."}, status=400)
        user.role = role
        user.save()
        return Response({"message": "User role updated.", "user": OrgUserSerializer(user).data})

class OrgUserDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, user_id):
        if not is_org_admin(request.user):
            return Response({"error": "Only org admins can remove users."}, status=403)
        try:
            user = CustomUser.objects.get(id=user_id, org=request.user.org)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        if user == request.user:
            return Response({"error": "You can't remove yourself."}, status=400)
        user.delete()
        return Response({"message": "User deleted."})

class OrgInviteResendView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        token = request.data.get("token")
        if not is_org_admin(request.user):
            return Response({"error": "Only org admins can resend invites."}, status=403)
        try:
            invite = Invitation.objects.get(token=token, org=request.user.org, accepted=False)
        except Invitation.DoesNotExist:
            return Response({"error": "Invitation not found."}, status=404)
        invite_url = f"{settings.FRONTEND_URL}/invite/accept/{token}/"
        # Re-send invite email logic here
        send_mail(
            subject=f"You're invited to {request.user.org.name}!",
            message=f"Click here to join: {invite_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invite.email],
        )
        return Response({"message": "Invite resent."})
    
class OrgPlanView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        org = getattr(request.user, "org", None)
        if not org:
            return Response({"error": "No organization found."}, status=404)
        # You could add usage, limits, and stripe_customer_id here too
        return Response({
            "plan": org.plan,
            "org_name": org.name,
            "org_id": org.id,
            "upgrade_available": org.plan != "Enterprise"
        })

class OrgUpgradePlanView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        org = getattr(request.user, "org", None)
        if not org or request.user.role not in ["owner", "admin"]:
            return Response({"error": "Only org owner/admin can upgrade plan."}, status=403)
        plan = request.data.get("plan")
        if plan not in ["Pro", "Enterprise"]:
            return Response({"error": "Invalid plan."}, status=400)
        # Place to integrate with Stripe or another payment system!
        # (In real-world, create checkout session, return session URL to frontend)
        org.plan = plan
        org.save(update_fields=["plan"])
        # Optionally: log activity, trigger webhook, etc.
        return Response({"message": f"Organization upgraded to {plan}."})    