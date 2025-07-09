from django.core.exceptions import PermissionDenied
from rest_framework.exceptions import NotFound


class OrgFilterMixin:
    """
    Mixin to filter querysets by organization.
    Ensures users can only access data from their own organization.
    """
    
    def get_queryset(self):
        """Override to filter by organization"""
        queryset = super().get_queryset()
        
        if not self.request.user.is_authenticated:
            return queryset.none()
        
        # Platform admins can see all data
        if self.request.user.is_admin():
            return queryset
            
        # Regular users only see their org's data
        if not self.request.user.org:
            return queryset.none()
            
        # Filter by org_id or org foreign key
        if hasattr(queryset.model, 'org'):
            return queryset.filter(org=self.request.user.org)
        elif hasattr(queryset.model, 'org_id'):
            return queryset.filter(org_id=self.request.user.org.id)
        elif hasattr(queryset.model, 'user') and hasattr(queryset.model.user.field.related_model, 'org'):
            return queryset.filter(user__org=self.request.user.org)
        
        # If no org relationship found, return empty queryset for safety
        return queryset.none()


class OrgCreateMixin:
    """
    Mixin to automatically set organization on object creation.
    """
    
    def perform_create(self, serializer):
        """Automatically set the organization when creating objects"""
        if not self.request.user.is_authenticated or not self.request.user.org:
            raise PermissionDenied("User must belong to an organization")
            
        # Set org on the object if the model has org field
        if hasattr(serializer.Meta.model, 'org'):
            serializer.save(org=self.request.user.org)
        elif hasattr(serializer.Meta.model, 'org_id'):
            serializer.save(org_id=self.request.user.org.id)
        elif hasattr(serializer.Meta.model, 'user'):
            serializer.save(user=self.request.user)
        else:
            serializer.save()


class OrgOwnershipMixin:
    """
    Mixin to check ownership of objects within organization.
    """
    
    def get_object(self):
        """Override to ensure object belongs to user's organization"""
        obj = super().get_object()
        
        if not self.request.user.is_authenticated:
            raise PermissionDenied("Authentication required")
            
        # Platform admins can access anything
        if self.request.user.is_admin():
            return obj
            
        if not self.request.user.org:
            raise PermissionDenied("User must belong to an organization")
        
        # Check if object belongs to user's organization
        if hasattr(obj, 'org') and obj.org != self.request.user.org:
            raise NotFound("Object not found in your organization")
        elif hasattr(obj, 'org_id') and obj.org_id != self.request.user.org.id:
            raise NotFound("Object not found in your organization")
        elif hasattr(obj, 'user') and hasattr(obj.user, 'org') and obj.user.org != self.request.user.org:
            raise NotFound("Object not found in your organization")
            
        return obj


class CombinedOrgMixin(OrgFilterMixin, OrgCreateMixin, OrgOwnershipMixin):
    """
    Combined mixin that provides complete organization-based multi-tenancy.
    Use this for most views that need org isolation.
    """
    pass