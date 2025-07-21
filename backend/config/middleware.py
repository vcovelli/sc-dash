from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseServerError
from django.conf import settings
from .routers import set_org_context, clear_org_context, ensure_org_database
import logging
logger = logging.getLogger(__name__)

class OrgContextMiddleware(MiddlewareMixin):
    def process_request(self, request):
        clear_org_context()
        # Only process for authenticated users
        if not (hasattr(request, 'user') and request.user.is_authenticated):
            logger.debug("Request from unauthenticated user or user not available")
            return None
        
        # Check if user has an organization
        if not (hasattr(request.user, 'org') and request.user.org):
            logger.warning(f"Authenticated user {request.user.email} has no organization assigned")
            return None
        
        org_id = request.user.org.id
        logger.debug(f"Setting org context: {org_id} for user {request.user.email}")
        
        try:
            # Ensure the organization database exists
            ensure_org_database(org_id)
            
            # Set the organization context for this request
            set_org_context(org_id)
            
            # Store org_id in request for easier access in views
            request.org_id = org_id
            
        except Exception as e:
            logger.error(f"Failed to set organization context for org {org_id}: {e}")
            # Don't block the request, but log the error
            if settings.DEBUG:
                # In debug mode, you might want to see these errors
                raise
            # In production, continue without org context (will use default DB)
            return None
        
        return None
    
    def process_response(self, request, response):
        """Clear organization context after processing response"""
        try:
            clear_org_context()
        except Exception as e:
            logger.error(f"Error clearing organization context: {e}")
        return response
    
    def process_exception(self, request, exception):
        """Clear organization context if an exception occurs"""
        try:
            clear_org_context()
        except Exception as e:
            logger.error(f"Error clearing organization context during exception handling: {e}")
        return None


class DatabaseHealthCheckMiddleware(MiddlewareMixin):
    """
    Optional middleware to perform basic database health checks.
    Place this after OrgContextMiddleware if you want to use it.
    """
    
    def process_request(self, request):
        """Check database connectivity for organization databases"""
        if not (hasattr(request, 'user') and request.user.is_authenticated):
            return None
            
        if not (hasattr(request.user, 'org') and request.user.org):
            return None
        
        org_id = request.user.org.id
        
        try:
            from django.db import connections
            from .routers import OrgDatabaseRouter
            
            router = OrgDatabaseRouter()
            db_alias = router._get_org_db_alias(org_id)
            
            if db_alias and db_alias in settings.DATABASES:
                # Test connection
                connection = connections[db_alias]
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    
                logger.debug(f"Database health check passed for {db_alias}")
                
        except Exception as e:
            logger.warning(f"Database health check failed for org {org_id}: {e}")
            # Don't block the request, just log the warning
            
        return None
