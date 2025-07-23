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
    """Advanced security manager for enterprise multi-tenant operations with comprehensive logging"""
    
    def __init__(self):
        self.rate_limits = {
            'db_operations': 1000,  # per hour per org
            'api_calls': 10000,     # per hour per org
            'file_uploads': 100,    # per hour per org
        }
        self.security_cache_timeout = 3600  # 1 hour
        logger.debug(f"🔐 SECURITY: EnterpriseSecurityManager initialized with rate limits: {self.rate_limits}")
    
    def validate_org_access(self, user, org_id: int) -> bool:
        """Validate that user has legitimate access to organization with detailed logging"""
        user_id = getattr(user, 'id', 'anonymous')
        user_email = getattr(user, 'email', 'unknown')
        
        logger.debug(f"🔒 ACCESS: Validating org access for user {user_email} (ID: {user_id}) to org {org_id}")
        
        if not user.is_authenticated:
            logger.warning(f"🚫 ACCESS: Unauthenticated user attempted access to org {org_id}")
            return False
            
        # Platform admin can access any org
        user_role = getattr(user, 'role', None)
        if user_role == 'admin':
            logger.info(f"✅ ACCESS: Admin user {user_email} granted access to org {org_id}")
            return True
            
        # Check if user belongs to the organization
        try:
            logger.debug(f"🔍 ACCESS: Checking user org membership for {user_email}")
            user_org_id = user.org_id() if callable(user.org_id) else user.org_id
            
            if user_org_id != org_id:
                logger.warning(f"🚫 ACCESS: User {user_email} attempted access to org {org_id} but belongs to {user_org_id}")
                return False
            else:
                logger.debug(f"✅ ACCESS: User {user_email} belongs to org {org_id}")
                
        except (AttributeError, TypeError) as e:
            logger.debug(f"🔍 ACCESS: Failed to get org_id via method for {user_email}, trying attribute: {e}")
            # Fallback to check org field
            user_org_id = getattr(user, 'org_id', None)
            if user_org_id != org_id:
                logger.warning(f"🚫 ACCESS: User {user_email} org mismatch via attribute - user org: {user_org_id}, requested: {org_id}")
                return False
            else:
                logger.debug(f"✅ ACCESS: User {user_email} belongs to org {org_id} (via attribute)")
            
        logger.info(f"✅ ACCESS: Access granted for user {user_email} to org {org_id}")
        return True
    
    def check_rate_limit(self, org_id: int, operation_type: str) -> bool:
        """Check if organization has exceeded rate limits with detailed logging"""
        current_hour = datetime.now().hour
        cache_key = f"rate_limit:{org_id}:{operation_type}:{current_hour}"
        
        logger.debug(f"⏱️  RATE_LIMIT: Checking rate limit for org {org_id}, operation {operation_type}")
        
        current_count = cache.get(cache_key, 0)
        limit = self.rate_limits.get(operation_type, 1000)
        
        logger.debug(f"⏱️  RATE_LIMIT: Current count: {current_count}/{limit} for org {org_id}")
        
        if current_count >= limit:
            logger.warning(f"🚫 RATE_LIMIT: Rate limit exceeded for org {org_id}: {operation_type} ({current_count}/{limit})")
            return False
        
        new_count = current_count + 1
        cache.set(cache_key, new_count, timeout=3600)
        logger.debug(f"✅ RATE_LIMIT: Rate limit check passed for org {org_id}: {operation_type} ({new_count}/{limit})")
        return True
    
    def audit_database_access(self, user, org_id: int, operation: str, table_name: str = None):
        """Audit database access for compliance with detailed logging"""
        user_id = getattr(user, 'id', 'unknown')
        user_email = getattr(user, 'email', 'unknown')
        ip_address = getattr(user, '_cached_ip', 'unknown')
        timestamp = datetime.now().isoformat()
        
        logger.debug(f"📋 AUDIT: Recording database access for user {user_email} on org {org_id}")
        
        audit_data = {
            'user_id': user_id,
            'user_email': user_email,
            'org_id': org_id,
            'operation': operation,
            'table_name': table_name,
            'timestamp': timestamp,
            'ip_address': ip_address,
        }
        
        # Store in audit log (implement based on your audit system)
        date_key = datetime.now().date()
        cache_key = f"audit:org:{org_id}:{date_key}"
        
        logger.debug(f"📋 AUDIT: Storing audit data with key {cache_key}")
        
        audit_log = cache.get(cache_key, [])
        audit_log.append(audit_data)
        cache.set(cache_key, audit_log, timeout=86400)  # 24 hours
        
        logger.info(f"📋 AUDIT: Database audit recorded - {user_email} performed {operation} on org {org_id} table {table_name}")
    
    def generate_org_database_encryption_key(self, org_id: int) -> str:
        """Generate unique encryption key for organization data with logging"""
        logger.debug(f"🔑 ENCRYPT: Generating encryption key for org {org_id}")
        
        base_string = f"{settings.SECRET_KEY}:org:{org_id}:{secrets.token_hex(16)}"
        encryption_key = hashlib.sha256(base_string.encode()).hexdigest()
        
        logger.debug(f"✅ ENCRYPT: Encryption key generated for org {org_id} (length: {len(encryption_key)})")
        return encryption_key
    
    def validate_database_isolation(self, org_id: int) -> Dict[str, bool]:
        """Validate that organization database is properly isolated with detailed logging"""
        db_alias = f"orgdata_{org_id}"
        
        logger.debug(f"🔍 ISOLATION: Starting database isolation validation for {db_alias}")
        
        if db_alias not in connections.databases:
            logger.error(f"💥 ISOLATION: Database {db_alias} not configured")
            return {"isolated": False, "reason": "Database not configured"}
        
        try:
            logger.debug(f"🔌 ISOLATION: Connecting to {db_alias} for isolation check")
            # Test isolation by checking for cross-org data
            connection = connections[db_alias]
            with connection.cursor() as cursor:
                logger.debug(f"🔍 ISOLATION: Checking for cross-org data in {db_alias}")
                # Check if org data exists in wrong database
                cursor.execute("""
                    SELECT COUNT(*) FROM api_supplier 
                    WHERE org_id != %s
                """, [org_id])
                
                cross_org_count = cursor.fetchone()[0]
                logger.debug(f"🔍 ISOLATION: Found {cross_org_count} cross-org records in {db_alias}")
                
                if cross_org_count > 0:
                    logger.error(f"💥 ISOLATION: Database isolation violated - {cross_org_count} records from other orgs found in {db_alias}")
                    return {
                        "isolated": False, 
                        "reason": f"Found {cross_org_count} records from other orgs"
                    }
                
                logger.info(f"✅ ISOLATION: Database {db_alias} properly isolated (no cross-org data)")
                return {"isolated": True, "reason": "Database properly isolated"}
                
        except Exception as e:
            logger.error(f"💥 ISOLATION: Validation error for {db_alias}: {str(e)}")
            return {"isolated": False, "reason": f"Validation error: {str(e)}"}


class SecurityMiddleware:
    """Enhanced security middleware for enterprise features with comprehensive logging"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.security_manager = EnterpriseSecurityManager()
        logger.debug(f"🔐 SECURITY_MW: SecurityMiddleware initialized")
    
    def __call__(self, request):
        request_id = id(request)
        path = request.path
        
        logger.debug(f"🔐 SECURITY_MW: Processing security check for request {request_id} to {path}")
        
        # Store IP for audit trail
        ip_address = self.get_client_ip(request)
        logger.debug(f"🌐 SECURITY_MW: Client IP for request {request_id}: {ip_address}")
        
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.user._cached_ip = ip_address
            logger.debug(f"💾 SECURITY_MW: Cached IP {ip_address} for user {request.user.email}")
        
        # Check for suspicious activity
        logger.debug(f"🔍 SECURITY_MW: Checking for suspicious activity from {ip_address}")
        if self.detect_suspicious_activity(request):
            logger.warning(f"🚨 SECURITY_MW: Suspicious activity detected from {ip_address} for request {request_id}")
            return HttpResponseForbidden("Access denied due to security policy")
        
        logger.debug(f"✅ SECURITY_MW: Security check passed for request {request_id}")
        response = self.get_response(request)
        logger.debug(f"🏁 SECURITY_MW: Security middleware complete for request {request_id}")
        return response
    
    def get_client_ip(self, request):
        """Get real client IP address with logging"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
            logger.debug(f"🌐 IP: Got client IP from X-Forwarded-For: {ip}")
        else:
            ip = request.META.get('REMOTE_ADDR')
            logger.debug(f"🌐 IP: Got client IP from REMOTE_ADDR: {ip}")
        return ip
    
    def detect_suspicious_activity(self, request) -> bool:
        """Detect suspicious access patterns with detailed logging"""
        ip_address = self.get_client_ip(request)
        current_minute = datetime.now().minute
        
        # Check for rapid requests from same IP
        cache_key = f"requests:{ip_address}:{current_minute}"
        request_count = cache.get(cache_key, 0)
        
        logger.debug(f"🔍 SUSPICIOUS: IP {ip_address} has made {request_count} requests this minute")
        
        if request_count > 100:  # More than 100 requests per minute
            logger.warning(f"🚨 SUSPICIOUS: IP {ip_address} exceeded request threshold ({request_count} > 100)")
            return True
        
        new_count = request_count + 1
        cache.set(cache_key, new_count, timeout=60)
        logger.debug(f"✅ SUSPICIOUS: IP {ip_address} activity normal ({new_count}/100 per minute)")
        return False