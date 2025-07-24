from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseServerError
from django.conf import settings
from .routers import set_org_context, clear_org_context, ensure_org_database
import logging
logger = logging.getLogger(__name__)

class OrgContextMiddleware(MiddlewareMixin):
    def process_request(self, request):
        """Process incoming request and set organization context with detailed logging"""
        request_id = id(request)
        path = request.path
        method = request.method
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')[:100]  # Limit length
        
        logger.debug(f"🌐 MIDDLEWARE: Processing {method} request to {path} (ID: {request_id})")
        logger.debug(f"🌐 MIDDLEWARE: User agent: {user_agent}")
        
        # Clear any existing context first
        logger.debug(f"🧹 MIDDLEWARE: Clearing any existing org context for request {request_id}")
        clear_org_context()
        
        # Check if user is available and authenticated
        if not hasattr(request, 'user'):
            logger.debug(f"🔍 MIDDLEWARE: No user attribute found on request {request_id}")
            return None
            
        if not request.user.is_authenticated:
            logger.debug(f"🔍 MIDDLEWARE: User not authenticated for request {request_id}")
            return None
        
        logger.debug(f"👤 MIDDLEWARE: Authenticated user found: {request.user.email} (ID: {request.user.id}) for request {request_id}")
        
        # Check if user has an organization
        if not hasattr(request.user, 'org'):
            logger.warning(f"⚠️  MIDDLEWARE: User {request.user.email} has no 'org' attribute for request {request_id}")
            return None
            
        if not request.user.org:
            logger.warning(f"⚠️  MIDDLEWARE: User {request.user.email} has None org value for request {request_id}")
            return None
        
        org_id = request.user.org.id
        org_name = getattr(request.user.org, 'name', 'Unknown')
        logger.info(f"🏢 MIDDLEWARE: Found organization: {org_name} (ID: {org_id}) for user {request.user.email} on request {request_id}")
        
        try:
            # Ensure the organization database exists
            logger.debug(f"🛠️  MIDDLEWARE: Ensuring database exists for org {org_id} (request {request_id})")
            ensure_org_database(org_id)
            logger.debug(f"✅ MIDDLEWARE: Database ensured for org {org_id} (request {request_id})")
            
            # Set the organization context for this request
            logger.debug(f"🔧 MIDDLEWARE: Setting org context to {org_id} for request {request_id}")
            set_org_context(org_id)
            logger.info(f"✅ MIDDLEWARE: Organization context set to {org_id} for request {request_id}")
            
            # Store org_id in request for easier access in views
            request.org_id = org_id
            logger.debug(f"💾 MIDDLEWARE: Stored org_id {org_id} in request object {request_id}")
            
        except Exception as e:
            logger.error(f"💥 MIDDLEWARE: Failed to set organization context for org {org_id} on request {request_id}: {e}")
            logger.debug(f"💥 MIDDLEWARE: Exception details for org {org_id}:", exc_info=True)
            
            # Don't block the request, but log the error
            if settings.DEBUG:
                logger.error(f"💥 MIDDLEWARE: Debug mode - re-raising exception for request {request_id}")
                # In debug mode, you might want to see these errors
                raise
            # In production, continue without org context (will use default DB)
            logger.warning(f"🔄 MIDDLEWARE: Production mode - continuing without org context for request {request_id}")
            return None
        
        logger.debug(f"🎯 MIDDLEWARE: Request processing complete for {request_id}")
        return None
    
    def process_response(self, request, response):
        """Clear organization context after processing response with logging"""
        request_id = id(request)
        status_code = response.status_code
        
        logger.debug(f"📤 MIDDLEWARE: Processing response for request {request_id} (status: {status_code})")
        
        try:
            logger.debug(f"🧹 MIDDLEWARE: Clearing org context for request {request_id}")
            clear_org_context()
            logger.debug(f"✅ MIDDLEWARE: Successfully cleared org context for request {request_id}")
        except Exception as e:
            logger.error(f"💥 MIDDLEWARE: Error clearing organization context for request {request_id}: {e}")
            
        logger.debug(f"🏁 MIDDLEWARE: Response processing complete for request {request_id}")
        return response
    
    def process_exception(self, request, exception):
        """Clear organization context if an exception occurs with logging"""
        request_id = id(request)
        exception_type = type(exception).__name__
        
        logger.error(f"💥 MIDDLEWARE: Exception {exception_type} occurred during request {request_id}: {exception}")
        
        try:
            logger.debug(f"🧹 MIDDLEWARE: Clearing org context due to exception for request {request_id}")
            clear_org_context()
            logger.debug(f"✅ MIDDLEWARE: Successfully cleared org context after exception for request {request_id}")
        except Exception as e:
            logger.error(f"💥 MIDDLEWARE: Error clearing organization context during exception handling for request {request_id}: {e}")
            
        logger.debug(f"🔄 MIDDLEWARE: Exception processing complete for request {request_id}")
        return None


class DatabaseHealthCheckMiddleware(MiddlewareMixin):
    """
    Optional middleware to perform basic database health checks with detailed logging.
    Place this after OrgContextMiddleware if you want to use it.
    """
    
    def process_request(self, request):
        """Check database connectivity for organization databases with logging"""
        request_id = id(request)
        
        logger.debug(f"🏥 HEALTH_CHECK: Starting database health check for request {request_id}")
        
        if not hasattr(request, 'user'):
            logger.debug(f"🏥 HEALTH_CHECK: No user on request {request_id}, skipping health check")
            return None
            
        if not request.user.is_authenticated:
            logger.debug(f"🏥 HEALTH_CHECK: User not authenticated for request {request_id}, skipping health check")
            return None
            
        if not (hasattr(request.user, 'org') and request.user.org):
            logger.debug(f"🏥 HEALTH_CHECK: User has no org for request {request_id}, skipping health check")
            return None
        
        org_id = request.user.org.id
        logger.debug(f"🏥 HEALTH_CHECK: Checking health for org {org_id} on request {request_id}")
        
        try:
            from django.db import connections
            from .routers import OrgDatabaseRouter
            
            router = OrgDatabaseRouter()
            db_alias = router._get_org_db_alias(org_id)
            
            logger.debug(f"🏥 HEALTH_CHECK: Generated db_alias '{db_alias}' for org {org_id}")
            
            if db_alias and db_alias in settings.DATABASES:
                logger.debug(f"🏥 HEALTH_CHECK: Database {db_alias} found in configuration")
                
                # Test connection
                connection = connections[db_alias]
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    
                logger.debug(f"✅ HEALTH_CHECK: Database health check passed for {db_alias} (result: {result}) on request {request_id}")
            else:
                logger.warning(f"⚠️  HEALTH_CHECK: Database {db_alias} not found in configuration for org {org_id} on request {request_id}")
                
        except Exception as e:
            logger.warning(f"💥 HEALTH_CHECK: Database health check failed for org {org_id} on request {request_id}: {e}")
            # Don't block the request, just log the warning
            
        logger.debug(f"🏁 HEALTH_CHECK: Health check complete for request {request_id}")
        return None
