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


# New schema-specific permissions
class CanCreateSchemas(BasePermission):
    """
    Users who can create new schemas.
    Managers and above can create schemas. Employees can create personal schemas only.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org
        )


class CanShareSchemas(BasePermission):
    """
    Users who can share schemas organization-wide.
    Only managers and above can share schemas across the organization.
    """
    SCHEMA_SHARE_ROLES = [
        'admin', 'owner', 'ceo', 'national_manager', 
        'regional_manager', 'local_manager'
    ]
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.SCHEMA_SHARE_ROLES
        )


class CanManageSharedSchemas(BasePermission):
    """
    Users who can edit organization-wide shared schemas.
    Managers and above can edit shared schemas.
    """
    SCHEMA_EDIT_ROLES = [
        'admin', 'owner', 'ceo', 'national_manager', 
        'regional_manager', 'local_manager'
    ]
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.SCHEMA_EDIT_ROLES
        )


class CanAccessSharedSchemas(BasePermission):
    """
    Users who can access organization-wide shared schemas for viewing/using.
    All organization members except read_only can access shared schemas.
    """
    SCHEMA_ACCESS_ROLES = [
        'admin', 'owner', 'ceo', 'national_manager', 
        'regional_manager', 'local_manager', 'employee', 'client'
    ]
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.org and 
            request.user.role in self.SCHEMA_ACCESS_ROLES
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


class CanAccessSchema(BasePermission):
    """
    Object-level permission for schema access.
    Users can access their own schemas or organization-wide shared schemas.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not request.user.org:
            return False
        
        # Must be same organization
        if obj.org != request.user.org:
            return False
        
        # Can access own schemas
        if obj.user == request.user:
            return True
        
        # Can access shared schemas if user has access permission
        if obj.is_shared:
            SCHEMA_ACCESS_ROLES = [
                'admin', 'owner', 'ceo', 'national_manager', 
                'regional_manager', 'local_manager', 'employee', 'client'
            ]
            return request.user.role in SCHEMA_ACCESS_ROLES
        
        return False


class CanEditSchema(BasePermission):
    """
    Object-level permission for schema editing.
    Users can edit their own schemas or shared schemas if they have management rights.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not request.user.org:
            return False
        
        # Must be same organization
        if obj.org != request.user.org:
            return False
        
        # Can edit own schemas
        if obj.user == request.user:
            return True
        
        # Can edit shared schemas if user has management permission
        if obj.is_shared:
            SCHEMA_EDIT_ROLES = [
                'admin', 'owner', 'ceo', 'national_manager', 
                'regional_manager', 'local_manager'
            ]
            return request.user.role in SCHEMA_EDIT_ROLES
        
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