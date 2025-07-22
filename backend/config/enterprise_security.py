"""
Enterprise Security Configuration for Multi-Tenant Platform
Provides advanced security features for enterprise deployments.
"""
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseForbidden
from django.db import connections
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class EnterpriseSecurityManager:
    """Advanced security manager for enterprise multi-tenant operations"""
    
    def __init__(self):
        self.rate_limits = {
            'db_operations': 1000,  # per hour per org
            'api_calls': 10000,     # per hour per org
            'file_uploads': 100,    # per hour per org
        }
        self.security_cache_timeout = 3600  # 1 hour
    
    def validate_org_access(self, user, org_id: int) -> bool:
        """Validate that user has legitimate access to organization"""
        if not user.is_authenticated:
            return False
            
        # Platform admin can access any org
        if user.role == 'admin':
            return True
            
        # Check if user belongs to the organization
        try:
            user_org_id = user.org_id() if callable(user.org_id) else user.org_id
            if user_org_id != org_id:
                logger.warning(f"User {user.email} attempted access to org {org_id} but belongs to {user_org_id}")
                return False
        except (AttributeError, TypeError):
            # Fallback to check org field
            user_org_id = getattr(user, 'org_id', None)
            if user_org_id != org_id:
                return False
            
        return True
    
    def check_rate_limit(self, org_id: int, operation_type: str) -> bool:
        """Check if organization has exceeded rate limits"""
        cache_key = f"rate_limit:{org_id}:{operation_type}:{datetime.now().hour}"
        current_count = cache.get(cache_key, 0)
        
        limit = self.rate_limits.get(operation_type, 1000)
        if current_count >= limit:
            logger.warning(f"Rate limit exceeded for org {org_id}: {operation_type} ({current_count}/{limit})")
            return False
        
        cache.set(cache_key, current_count + 1, timeout=3600)
        return True
    
    def audit_database_access(self, user, org_id: int, operation: str, table_name: str = None):
        """Audit database access for compliance"""
        audit_data = {
            'user_id': user.id,
            'user_email': user.email,
            'org_id': org_id,
            'operation': operation,
            'table_name': table_name,
            'timestamp': datetime.now().isoformat(),
            'ip_address': getattr(user, '_cached_ip', 'unknown'),
        }
        
        # Store in audit log (implement based on your audit system)
        cache_key = f"audit:org:{org_id}:{datetime.now().date()}"
        audit_log = cache.get(cache_key, [])
        audit_log.append(audit_data)
        cache.set(cache_key, audit_log, timeout=86400)  # 24 hours
        
        logger.info(f"Database audit: {user.email} performed {operation} on org {org_id}")
    
    def generate_org_database_encryption_key(self, org_id: int) -> str:
        """Generate unique encryption key for organization data"""
        base_string = f"{settings.SECRET_KEY}:org:{org_id}:{secrets.token_hex(16)}"
        return hashlib.sha256(base_string.encode()).hexdigest()
    
    def validate_database_isolation(self, org_id: int) -> Dict[str, bool]:
        """Validate that organization database is properly isolated"""
        db_alias = f"orgdata_{org_id}"
        
        if db_alias not in connections.databases:
            return {"isolated": False, "reason": "Database not configured"}
        
        try:
            # Test isolation by checking for cross-org data
            connection = connections[db_alias]
            with connection.cursor() as cursor:
                # Check if org data exists in wrong database
                cursor.execute("""
                    SELECT COUNT(*) FROM api_supplier 
                    WHERE org_id != %s
                """, [org_id])
                
                cross_org_count = cursor.fetchone()[0]
                if cross_org_count > 0:
                    return {
                        "isolated": False, 
                        "reason": f"Found {cross_org_count} records from other orgs"
                    }
                
                return {"isolated": True, "reason": "Database properly isolated"}
                
        except Exception as e:
            return {"isolated": False, "reason": f"Validation error: {str(e)}"}


class SecurityMiddleware:
    """Enhanced security middleware for enterprise features"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.security_manager = EnterpriseSecurityManager()
    
    def __call__(self, request):
        # Store IP for audit trail
        ip_address = self.get_client_ip(request)
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.user._cached_ip = ip_address
        
        # Check for suspicious activity
        if self.detect_suspicious_activity(request):
            logger.warning(f"Suspicious activity detected from {ip_address}")
            return HttpResponseForbidden("Access denied due to security policy")
        
        response = self.get_response(request)
        return response
    
    def get_client_ip(self, request):
        """Get real client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def detect_suspicious_activity(self, request) -> bool:
        """Detect suspicious access patterns"""
        ip_address = self.get_client_ip(request)
        
        # Check for rapid requests from same IP
        cache_key = f"requests:{ip_address}:{datetime.now().minute}"
        request_count = cache.get(cache_key, 0)
        
        if request_count > 100:  # More than 100 requests per minute
            return True
        
        cache.set(cache_key, request_count + 1, timeout=60)
        return False