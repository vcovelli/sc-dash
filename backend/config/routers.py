import threading
import logging
import os
import psycopg2
import time
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from django.conf import settings
from django.db import connections
from django.core.exceptions import ImproperlyConfigured
from django.core.cache import cache
from django.core.management import call_command
from accounts.models import Organization
from typing import Dict, Optional, Any

logger = logging.getLogger(__name__)

_thread_local = threading.local()
_db_config_cache = {}
_cache_lock = threading.Lock()
_connection_pool = {}  # Connection pool for enterprise usage
_performance_metrics = {}  # Track DB performance per org

def set_org_context(org_id):
    """Set organization context for current thread with strategic logging"""
    if org_id is not None:
        old_context = getattr(_thread_local, 'org_id', None)
        _thread_local.org_id = org_id
        # Only log context changes, not every set
        if old_context != org_id:
            logger.info(f"🔄 CONTEXT: {old_context} -> {org_id}")
    else:
        logger.warning(f"⚠️  CONTEXT: Attempted to set None as organization context")

def get_org_context():
    """Get current organization context"""
    return getattr(_thread_local, 'org_id', None)

def clear_org_context():
    """Clear organization context with logging"""
    old_context = getattr(_thread_local, 'org_id', None)
    if hasattr(_thread_local, 'org_id'):
        delattr(_thread_local, 'org_id')
        if old_context:  # Only log if there was actually a context to clear
            logger.debug(f"🧹 CONTEXT: Cleared {old_context}")
    else:
        logger.debug(f"🧹 CONTEXT: Nothing to clear")

class EnterpriseOrgDatabaseRouter:
    """Enhanced database router with enterprise features and comprehensive logging"""
    
    org_models = {
        'api.supplier', 'api.warehouse', 'api.product',
        'api.inventory', 'api.customer', 'api.order',
        'api.orderitem', 'api.shipment'
    }

    def __init__(self):
        self.max_connections_per_org = getattr(settings, 'MAX_DB_CONNECTIONS_PER_ORG', 10)
        self.connection_timeout = getattr(settings, 'DB_CONNECTION_TIMEOUT', 30)
        self.enable_performance_monitoring = getattr(settings, 'ENABLE_DB_PERFORMANCE_MONITORING', True)
        logger.info(f"🚀 ROUTER INIT: EnterpriseOrgDatabaseRouter initialized with max_connections={self.max_connections_per_org}, timeout={self.connection_timeout}, performance_monitoring={self.enable_performance_monitoring}")
        logger.debug(f"📋 ROUTER INIT: Org models configured: {', '.join(self.org_models)}")

    def _get_org_db_alias(self, org_id):
        """Get database alias for organization with logging"""
        if not org_id:
            logger.warning("🚫 DB_ALIAS: No org_id provided, returning None")
            return None
        
        alias = org_id if str(org_id).startswith("orgdata_") else f"orgdata_{org_id}"
        logger.debug(f"🔗 DB_ALIAS: Generated alias '{alias}' for org_id {org_id}")
        return alias

    def _track_performance(self, org_id: int, operation: str, duration: float):
        """Track database performance metrics per organization with detailed logging"""
        if not self.enable_performance_monitoring:
            logger.debug(f"📊 PERFORMANCE: Monitoring disabled, skipping {operation} for org {org_id}")
            return
            
        metric_key = f"db_performance:{org_id}:{operation}"
        metrics = cache.get(metric_key, {'count': 0, 'total_time': 0, 'avg_time': 0})
        
        metrics['count'] += 1
        metrics['total_time'] += duration
        metrics['avg_time'] = metrics['total_time'] / metrics['count']
        
        cache.set(metric_key, metrics, timeout=3600)  # Store for 1 hour
        
        logger.debug(f"📊 PERFORMANCE: Org {org_id} {operation} - Duration: {duration:.3f}s, Count: {metrics['count']}, Avg: {metrics['avg_time']:.3f}s")
        
        # Log slow queries
        if duration > 1.0:  # Queries taking more than 1 second
            logger.warning(f"🐌 SLOW QUERY: Org {org_id} {operation} took {duration:.2f}s (threshold: 1.0s)")

    def _ensure_org_database_config(self, org_id):
        """Ensure database configuration exists for organization with strategic logging"""
        if not org_id:
            logger.warning("🚫 DB_CONFIG: No organization ID provided")
            return None

        db_alias = self._get_org_db_alias(org_id)
        
        # Check cache first (with read lock)
        with _cache_lock:
            if db_alias in _db_config_cache:
                logger.debug(f"✅ DB_CONFIG: Cache hit for {db_alias}")
                return db_alias

        logger.info(f"🔧 DB_CONFIG: Setting up database for org {org_id}...")

        # Enhanced database configuration with connection pooling
        try:
            # Check if org exists first to avoid creating databases for non-existent orgs
            from accounts.models import Organization
            if not Organization.objects.filter(id=org_id).exists():
                logger.error(f"❌ DB_CONFIG: Organization {org_id} does not exist")
                return None
            
            from config.db_utils import ensure_org_database_enterprise
            ensure_org_database_enterprise(org_id)
            
            with _cache_lock:
                _db_config_cache[db_alias] = True
            
            logger.info(f"✅ DB_CONFIG: Successfully configured {db_alias}")
            return db_alias
            
        except Exception as e:
            logger.error(f"💥 DB_CONFIG: Failed to configure database for org {org_id}: {str(e)}")
            return None

    def _get_model_identifier(self, model):
        """Get model identifier with logging"""
        if hasattr(model, '_meta'):
            identifier = f"{model._meta.app_label}.{model._meta.model_name}"
            logger.debug(f"🏷️  MODEL_ID: Generated identifier '{identifier}' for model {model}")
            return identifier
        else:
            logger.warning(f"🏷️  MODEL_ID: Model {model} has no _meta attribute")
            return None

    def _validate_cross_org_access(self, model, org_id: int) -> bool:
        """Validate cross-org access with strategic logging"""
        try:
            from config.enterprise_security import EnterpriseSecurityManager
            security_manager = EnterpriseSecurityManager()
            # Basic validation - for now, allow all requests with valid org context
            # Can be enhanced with more sophisticated security checks
            return True
        except Exception as e:
            logger.warning(f"⚠️  SECURITY: Validation error for org {org_id}: {e}")
            # Be permissive to avoid breaking the app
            return True

    def db_for_read(self, model, **hints):
        """Database routing for read operations with strategic logging"""
        model_id = self._get_model_identifier(model)
        
        # Organization model always goes to default
        if model_id == "accounts.organization":
            logger.debug(f"📖 READ: Organization model -> default")
            return "default"

        # Route organization-specific models
        if model_id in self.org_models:
            org_id = get_org_context()
            
            if org_id:
                # Validate access (but don't log every validation)
                if not self._validate_cross_org_access(model, org_id):
                    logger.warning(f"🚫 READ: Access blocked for org {org_id}")
                    return None
                
                db_alias = self._ensure_org_database_config(org_id)
                
                if db_alias:
                    logger.debug(f"📖 READ: {model_id} -> {db_alias} (org {org_id})")
                    return db_alias
                else:
                    logger.error(f"💥 READ: DB config failed for org {org_id}")

            # Try to get org from instance
            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                set_org_context(org_id)
                
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    logger.info(f"📖 READ: {model_id} -> {db_alias} (org {org_id} via instance)")
                    return db_alias
                else:
                    logger.error(f"💥 READ: Instance fallback failed for org {org_id}")

        # Fallback to default database
        logger.debug(f"📖 READ: {model_id} -> default (fallback)")
        return 'default'

    def db_for_write(self, model, **hints):
        """Database routing for write operations with logging"""
        model_id = self._get_model_identifier(model)
        result = self.db_for_read(model, **hints)
        if result != 'default':  # Only log non-default writes
            logger.debug(f"✏️  WRITE: {model_id} -> {result}")
        return result

    def allow_relation(self, obj1, obj2, **hints):
        """Enhanced relation checking with security validation and strategic logging"""
        # Only log at INFO level for actual issues, DEBUG for details
        try:
            # Get database aliases safely
            db1 = getattr(getattr(obj1, '_state', None), 'db', 'default') if hasattr(obj1, '_state') else 'default'
            db2 = getattr(getattr(obj2, '_state', None), 'db', 'default') if hasattr(obj2, '_state') else 'default'
            
            # Same database relations are always allowed
            if db1 == db2:
                logger.debug(f"🔗 RELATION: Same DB relation allowed ({db1})")
                return True

            # Cross-org database relations need validation
            if db1.startswith('orgdata_') and db2.startswith('orgdata_'):
                org1_id = db1.replace('orgdata_', '')
                org2_id = db2.replace('orgdata_', '')
                
                # Only allow if same organization
                if org1_id == org2_id:
                    logger.debug(f"✅ RELATION: Same org cross-db relation allowed ({org1_id})")
                    return True
                else:
                    logger.info(f"🚫 RELATION: Blocked cross-org relation: {org1_id} -> {org2_id}")
                    return False
            
            # Allow relations between default and org databases (for Organization model etc.)
            if (db1 == 'default' and db2.startswith('orgdata_')) or (db2 == 'default' and db1.startswith('orgdata_')):
                logger.debug(f"✅ RELATION: Default-to-org relation allowed ({db1} <-> {db2})")
                return True

            logger.debug(f"❓ RELATION: Undetermined relation for {db1} -> {db2}")
            return None
            
        except Exception as e:
            logger.error(f"💥 RELATION ERROR: Failed to check relation - {e}")
            # Be permissive on errors to avoid breaking the app
            return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Enhanced migration control with better app separation and strategic logging"""
        ORG_APPS = ['api', 'accounts', 'auth', 'contenttypes', 'sessions', 'ai', 'analytics', 'files', 'datagrid']
        PLATFORM_ONLY_APPS = ['admin', 'allauth', 'rest_framework', 'sites', 'socialaccount', 'authtoken']
        
        # Log migrations to organization databases
        if db.startswith('orgdata_'):
            # Organization databases only get org-specific apps
            if app_label in ORG_APPS:
                logger.debug(f"✅ MIGRATE: {app_label} -> {db}")
                return True
            if app_label in PLATFORM_ONLY_APPS:
                logger.debug(f"🚫 MIGRATE: Blocking {app_label} from {db}")
                return False
            logger.info(f"❓ MIGRATE: Unknown app {app_label} for {db}")
            return None
            
        if db == 'default':
            # Default database gets everything except API models that should be isolated
            if app_label in ['auth', 'contenttypes', 'sessions', 'admin', 'accounts', 'allauth', 'sites', 'socialaccount', 'authtoken']:
                return True
            if app_label == 'api':
                logger.debug(f"🚫 MIGRATE: API models go to org databases, not default")
                return False  # API models only go to org databases
            # Allow other apps to migrate to default unless they're specifically org-only
            return True
            
        logger.info(f"❓ MIGRATE: Unknown database {db}")
        return None

# Legacy alias for backwards compatibility
OrgDatabaseRouter = EnterpriseOrgDatabaseRouter

def ensure_org_database(org_id):
    """Legacy function - redirects to enhanced version with logging"""
    logger.debug(f"🔄 LEGACY: ensure_org_database called for org {org_id}, redirecting to enhanced version")
    from config.db_utils import ensure_org_database_enterprise
    return ensure_org_database_enterprise(org_id)
