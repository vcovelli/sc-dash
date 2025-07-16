from django.utils.deprecation import MiddlewareMixin
from .routers import set_org_context, clear_org_context


class OrgContextMiddleware(MiddlewareMixin):
    """
    Middleware that sets the organization context for each request.
    
    This ensures that the database router knows which organization
    database to use for the authenticated user.
    """
    
    def process_request(self, request):
        """Set organization context at the start of each request"""
        clear_org_context()  # Clear any previous context
        
        if hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'org') and request.user.org:
                set_org_context(request.user.org.id)
    
    def process_response(self, request, response):
        """Clear organization context at the end of each request"""
        clear_org_context()
        return response
    
    def process_exception(self, request, exception):
        """Clear organization context on exception"""
        clear_org_context()
        return None