from django.utils.deprecation import MiddlewareMixin
from .routers import set_org_context, clear_org_context, ensure_org_database
import logging
logger = logging.getLogger(__name__)

class OrgContextMiddleware(MiddlewareMixin):
    def process_request(self, request):
        clear_org_context()
        if hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'org') and request.user.org:
                logger.debug(f"Setting org context: {request.user.org.id} for user {request.user.email}")
                ensure_org_database(request.user.org.id)
                set_org_context(request.user.org.id)
            else:
                logger.warning(f"User {request.user} is authenticated but has no org assigned")
        else:
            logger.debug("Anonymous request or user not authenticated")
    def process_response(self, request, response):
        clear_org_context()
        return response
    def process_exception(self, request, exception):
        clear_org_context()
        return None
