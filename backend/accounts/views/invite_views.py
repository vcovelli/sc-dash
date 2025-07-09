from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.conf import settings
from accounts.models import Invitation, CustomUser, Organization
from accounts.serializers import InvitationSerializer
from accounts.permissions import CanInviteUsers, CanManageUsers, IsOrgMember, IsSelfOrManager

class OrgAdminInviteUserView(APIView):
    permission_classes = [CanInviteUsers]
    
    def post(self, request):
        # Permission class already validates user can invite
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
        invite_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/invite/accept/{token}/"
        try:
            send_mail(
                subject=f"You're invited to {request.user.org.name}!",
                message=f"Click here to join: {invite_url}",
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@supplywise.ai'),
                recipient_list=[email],
            )
        except Exception as e:
            # Log the error but don't fail the invitation creation
            print(f"Failed to send email: {e}")
        
        return Response({
            "message": "Invitation sent!",
            "invite_id": invite.id,
            "invite_url": invite_url
        }, status=200)

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
        return Response({
            "message": "Account created! You can now log in.",
            "user_id": user.id,
            "org_name": user.org_name()
        })


class OrgUsersListView(APIView):
    """List all users in the organization"""
    permission_classes = [IsOrgMember]
    
    def get(self, request):
        users = CustomUser.objects.filter(org=request.user.org).select_related('org')
        
        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'last_login': user.last_login,
                'date_joined': user.date_joined,
                'is_active': user.is_active,
                'total_files': user.total_files,
                'business_name': user.business_name,
                'plan': user.plan,
            })
        
        return Response({
            'users': users_data,
            'total_count': len(users_data),
            'org_name': request.user.org_name()
        })


class OrgUserUpdateView(APIView):
    """Update user role and settings (managers only)"""
    permission_classes = [CanManageUsers, IsSelfOrManager]
    
    def put(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id, org=request.user.org)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found in your organization"}, status=404)
        
        # Check object-level permission
        self.check_object_permissions(request, user)
        
        # Update allowed fields
        role = request.data.get('role')
        is_active = request.data.get('is_active')
        business_name = request.data.get('business_name')
        
        if role and role in dict(CustomUser._meta.get_field('role').choices):
            # Prevent users from promoting themselves to higher roles
            if user == request.user and role != user.role:
                return Response({"error": "Cannot change your own role"}, status=400)
            user.role = role
        
        if is_active is not None:
            user.is_active = is_active
            
        if business_name is not None:
            user.business_name = business_name
        
        user.save()
        
        return Response({
            "message": "User updated successfully",
            "user": {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'is_active': user.is_active,
                'business_name': user.business_name,
            }
        })


class OrgUserRemoveView(APIView):
    """Remove user from organization (owners/admins only)"""
    permission_classes = [CanManageUsers]
    
    def delete(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id, org=request.user.org)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found in your organization"}, status=404)
        
        # Prevent users from removing themselves
        if user == request.user:
            return Response({"error": "Cannot remove yourself"}, status=400)
        
        # Prevent removing other owners (only admins can do this)
        if user.is_owner() and not request.user.is_admin():
            return Response({"error": "Only platform admins can remove organization owners"}, status=403)
        
        # Instead of deleting, deactivate and remove from org
        user.is_active = False
        user.org = None
        user.save()
        
        return Response({"message": "User removed from organization"})


class PendingInvitationsView(APIView):
    """List pending invitations for the organization"""
    permission_classes = [CanInviteUsers]
    
    def get(self, request):
        invitations = Invitation.objects.filter(
            org=request.user.org,
            accepted=False
        ).select_related('invited_by')
        
        invitations_data = []
        for invite in invitations:
            invitations_data.append({
                'id': invite.id,
                'email': invite.email,
                'role': invite.role,
                'invited_by': invite.invited_by.email,
                'created_at': invite.created_at,
                'token': invite.token,
            })
        
        return Response({
            'invitations': invitations_data,
            'total_count': len(invitations_data)
        })
    
    def delete(self, request, invitation_id):
        """Cancel a pending invitation"""
        try:
            invitation = Invitation.objects.get(
                id=invitation_id, 
                org=request.user.org, 
                accepted=False
            )
        except Invitation.DoesNotExist:
            return Response({"error": "Invitation not found"}, status=404)
        
        invitation.delete()
        return Response({"message": "Invitation cancelled"})
