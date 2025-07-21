from rest_framework import viewsets
from accounts.mixins import CombinedOrgMixin
from accounts.permissions import IsReadOnlyOrAbove

class TenantScopedViewSet(CombinedOrgMixin, viewsets.ModelViewSet):
    """
    Modern RBAC-enabled ViewSet with organization-based multi-tenancy.
    Integrates with the new permission system for secure access control.
    """
    permission_classes = [IsReadOnlyOrAbove]
    
    def get_queryset(self):
        """Enhanced queryset with org filtering and RBAC support"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Debug logging for authentication issues
        logger.info(f"User: {self.request.user}, Authenticated: {self.request.user.is_authenticated}")
        if self.request.user.is_authenticated:
            logger.info(f"User org: {getattr(self.request.user, 'org', 'None')}")
        
        # CombinedOrgMixin handles org filtering automatically
        base = super().get_queryset()
        
        # Legacy client_id support for migration period
        if hasattr(self.request.user, 'client_id') and not self.request.user.org:
            client_id = getattr(self.request.user, 'client_id', None)
            if client_id and hasattr(base.model, 'client_name'):
                logger.info(f"Using legacy client_id filtering: {client_id}")
                return base.filter(client_name=client_id)
        
        queryset = base
        logger.info(f"Final queryset count for {base.model.__name__}: {queryset.count()}")
        return queryset
    
    def perform_create(self, serializer):
        """Enhanced creation with org assignment"""
        # CombinedOrgMixin handles org assignment
        # Also set legacy client_name for backward compatibility
        if hasattr(serializer.Meta.model, 'client_name') and self.request.user.org:
            serializer.save(client_name=self.request.user.org.slug)
        else:
            super().perform_create(serializer)
