from rest_framework.permissions import BasePermission


class IsOrgMember(BasePermission):
    """
    Allows access only to users who belong to an organization.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org is not None
        )


class IsOrgOwnerOrAdmin(BasePermission):
    """
    Allows access only to organization owners or platform admins.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            (request.user.is_owner() or request.user.is_admin())
        )


class CanInviteUsers(BasePermission):
    """
    Users who can invite other users to their organization.
    Owners, CEOs, and managers can invite users.
    """
    INVITE_ROLES = ['admin', 'owner', 'ceo', 'national_manager', 'regional_manager']
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.INVITE_ROLES
        )


class CanManageUsers(BasePermission):
    """
    Users who can modify other users' roles and settings.
    More restrictive than inviting - only owners and admins.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            (request.user.is_owner() or request.user.is_admin())
        )


class CanManageOrganization(BasePermission):
    """
    Users who can modify organization settings.
    Only owners and platform admins.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            (request.user.is_owner() or request.user.is_admin())
        )


class IsManagerOrAbove(BasePermission):
    """
    Allows access to managers and above (excluding basic employees and clients).
    """
    MANAGER_ROLES = [
        'admin', 'owner', 'ceo', 'national_manager', 
        'regional_manager', 'local_manager'
    ]
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.MANAGER_ROLES
        )


class CanUploadFiles(BasePermission):
    """
    Users who can upload files to the system.
    Managers and above can upload files. Employees and clients cannot.
    """
    UPLOAD_ROLES = [
        'admin', 'owner', 'ceo', 'national_manager', 
        'regional_manager', 'local_manager'
    ]
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.UPLOAD_ROLES
        )


class CanViewAnalytics(BasePermission):
    """
    Users who can view analytics and reports.
    All roles except read_only and client (unless explicitly granted).
    """
    ANALYTICS_ROLES = [
        'admin', 'owner', 'ceo', 'national_manager', 
        'regional_manager', 'local_manager', 'employee'
    ]
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.ANALYTICS_ROLES
        )


class IsReadOnlyOrAbove(BasePermission):
    """
    Basic permission for any authenticated org member.
    Excludes only unauthenticated users.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.org:
            return False
            
        # Allow read operations for all org members
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
            
        # Write operations require employee level or above
        WRITE_ROLES = [
            'admin', 'owner', 'ceo', 'national_manager', 
            'regional_manager', 'local_manager', 'employee'
        ]
        return request.user.role in WRITE_ROLES


class IsSameOrgUser(BasePermission):
    """
    Object-level permission to only allow users to access objects 
    within their own organization.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not request.user.org:
            return False
            
        # Check if object has org relationship
        if hasattr(obj, 'org'):
            return obj.org == request.user.org
        elif hasattr(obj, 'org_id'):
            return obj.org_id == request.user.org.id
        elif hasattr(obj, 'user') and hasattr(obj.user, 'org'):
            return obj.user.org == request.user.org
            
        # If no org relationship found, deny access
        return False


class IsSelfOrManager(BasePermission):
    """
    Object-level permission to allow users to edit their own profile
    or managers to edit their subordinates.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        # Users can always access their own objects
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        elif obj == request.user:
            return True
            
        # Managers can access subordinates in same org
        if not request.user.org or not hasattr(obj, 'org'):
            return False
            
        if obj.org != request.user.org:
            return False
            
        # Define hierarchy - higher roles can manage lower roles
        ROLE_HIERARCHY = {
            'admin': 100,
            'owner': 90,
            'ceo': 80,
            'national_manager': 70,
            'regional_manager': 60,
            'local_manager': 50,
            'employee': 40,
            'client': 30,
            'tech_support': 20,
            'read_only': 10,
            'custom': 5,
        }
        
        user_level = ROLE_HIERARCHY.get(request.user.role, 0)
        target_level = ROLE_HIERARCHY.get(obj.role if hasattr(obj, 'role') else 'custom', 0)
        
        return user_level > target_level