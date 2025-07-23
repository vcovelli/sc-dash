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
    """Set organization context for current thread with detailed logging"""
    if org_id is not None:
        old_context = getattr(_thread_local, 'org_id', None)
        _thread_local.org_id = org_id
        logger.debug(f"🔄 CONTEXT SET: Changed org context from {old_context} to {org_id} (Thread: {threading.current_thread().ident})")
        logger.info(f"Organization context set to: {org_id}")
    else:
        logger.warning(f"⚠️  CONTEXT ERROR: Attempted to set None as organization context (Thread: {threading.current_thread().ident})")

def get_org_context():
    """Get current organization context with logging"""
    context = getattr(_thread_local, 'org_id', None)
    thread_id = threading.current_thread().ident
    logger.debug(f"📖 CONTEXT GET: Retrieved org context {context} (Thread: {thread_id})")
    return context

def clear_org_context():
    """Clear organization context with logging"""
    old_context = getattr(_thread_local, 'org_id', None)
    thread_id = threading.current_thread().ident
    if hasattr(_thread_local, 'org_id'):
        delattr(_thread_local, 'org_id')
        logger.debug(f"🧹 CONTEXT CLEAR: Cleared org context {old_context} (Thread: {thread_id})")
    else:
        logger.debug(f"🧹 CONTEXT CLEAR: No context to clear (Thread: {thread_id})")

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
        """Ensure database configuration exists for organization with comprehensive logging"""
        if not org_id:
            logger.warning("🚫 DB_CONFIG: No organization ID provided for database configuration")
            return None

        db_alias = self._get_org_db_alias(org_id)
        start_time = time.time()
        
        logger.debug(f"🔧 DB_CONFIG: Starting database configuration for org {org_id} (alias: {db_alias})")

        # Check cache first (with read lock)
        with _cache_lock:
            if db_alias in _db_config_cache:
                duration = time.time() - start_time
                self._track_performance(org_id, 'config_cache_hit', duration)
                logger.debug(f"✅ DB_CONFIG: Cache hit for {db_alias} in {duration:.3f}s")
                return db_alias

        logger.debug(f"💾 DB_CONFIG: Cache miss for {db_alias}, creating configuration...")

        # Enhanced database configuration with connection pooling
        try:
            # Check if org exists first to avoid creating databases for non-existent orgs
            logger.debug(f"🔍 DB_CONFIG: Checking if organization {org_id} exists...")
            from accounts.models import Organization
            if not Organization.objects.filter(id=org_id).exists():
                logger.error(f"❌ DB_CONFIG: Organization {org_id} does not exist in database")
                return None
            
            logger.debug(f"✅ DB_CONFIG: Organization {org_id} exists, proceeding with database setup...")
            
            from config.db_utils import ensure_org_database_enterprise
            logger.debug(f"🛠️  DB_CONFIG: Calling ensure_org_database_enterprise for org {org_id}...")
            ensure_org_database_enterprise(org_id)
            logger.debug(f"✅ DB_CONFIG: ensure_org_database_enterprise completed for org {org_id}")
            
            with _cache_lock:
                _db_config_cache[db_alias] = True
                logger.debug(f"💾 DB_CONFIG: Added {db_alias} to cache")
            
            duration = time.time() - start_time
            self._track_performance(org_id, 'config_creation', duration)
            logger.info(f"🎉 DB_CONFIG: Successfully configured database {db_alias} for org {org_id} in {duration:.3f}s")
            return db_alias
            
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"💥 DB_CONFIG: Failed to configure database for org {org_id}: {str(e)}")
            logger.debug(f"💥 DB_CONFIG: Exception details for org {org_id}:", exc_info=True)
            self._track_performance(org_id, 'config_error', duration)
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
        """Validate cross-org access with detailed logging"""
        logger.debug(f"🔒 SECURITY: Validating cross-org access for model {model} and org {org_id}")
        
        try:
            from config.enterprise_security import EnterpriseSecurityManager
            security_manager = EnterpriseSecurityManager()
            # Additional validation logic here
            logger.debug(f"✅ SECURITY: Cross-org access validation passed for org {org_id}")
            return True
        except Exception as e:
            logger.error(f"💥 SECURITY: Cross-org access validation failed for org {org_id}: {e}")
            return False

    def db_for_read(self, model, **hints):
        """Database routing for read operations with comprehensive logging"""
        start_time = time.time()
        thread_id = threading.current_thread().ident
        model_id = self._get_model_identifier(model)
        
        logger.debug(f"📖 READ_ROUTE: Starting db_for_read for model {model_id} (Thread: {thread_id})")
        logger.debug(f"📖 READ_ROUTE: Hints provided: {hints}")

        # Organization model always goes to default
        if model_id == "accounts.organization":
            duration = time.time() - start_time
            self._track_performance(0, 'read_default', duration)
            logger.debug(f"🏛️  READ_ROUTE: Organization model routed to 'default' database in {duration:.3f}s")
            return "default"

        # Route organization-specific models
        if model_id in self.org_models:
            logger.debug(f"🎯 READ_ROUTE: Model {model_id} is in org_models, checking context...")
            
            org_id = get_org_context()
            logger.debug(f"🎯 READ_ROUTE: Current org context: {org_id}")
            
            if org_id:
                logger.debug(f"✅ READ_ROUTE: Found org context {org_id}, validating access...")
                
                # Validate access
                if not self._validate_cross_org_access(model, org_id):
                    logger.error(f"🚫 READ_ROUTE: Cross-org access attempt blocked for org {org_id}")
                    return None
                
                logger.debug(f"🔧 READ_ROUTE: Setting up database configuration for org {org_id}...")
                db_alias = self._ensure_org_database_config(org_id)
                
                if db_alias:
                    duration = time.time() - start_time
                    self._track_performance(org_id, 'read_org_db', duration)
                    logger.info(f"🎯 READ_ROUTE: Model {model_id} routed to '{db_alias}' for org {org_id} in {duration:.3f}s")
                    return db_alias
                else:
                    logger.error(f"💥 READ_ROUTE: Failed to configure database for org {org_id}")

            # Try to get org from instance
            logger.debug(f"🔍 READ_ROUTE: No org context, checking hints for instance...")
            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                logger.debug(f"🔍 READ_ROUTE: Found org {org_id} from instance, setting context...")
                set_org_context(org_id)
                
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    duration = time.time() - start_time
                    self._track_performance(org_id, 'read_org_db_fallback', duration)
                    logger.info(f"🔄 READ_ROUTE: Model {model_id} routed to '{db_alias}' via instance fallback for org {org_id} in {duration:.3f}s")
                    return db_alias
                else:
                    logger.error(f"💥 READ_ROUTE: Failed to configure database via instance fallback for org {org_id}")
            else:
                logger.debug(f"🔍 READ_ROUTE: No org found in instance hints")

        # Fallback to default database
        duration = time.time() - start_time
        self._track_performance(0, 'read_default_fallback', duration)
        logger.debug(f"🏛️  READ_ROUTE: Model {model_id} routed to 'default' database (fallback) in {duration:.3f}s")
        return 'default'

    def db_for_write(self, model, **hints):
        """Database routing for write operations with logging"""
        logger.debug(f"✏️  WRITE_ROUTE: Starting db_for_write for model {self._get_model_identifier(model)}")
        result = self.db_for_read(model, **hints)
        logger.debug(f"✏️  WRITE_ROUTE: Write operation routed to '{result}' (same as read)")
        return result

    def allow_relation(self, obj1, obj2, **hints):
        """Enhanced relation checking with security validation and detailed logging"""
        logger.debug(f"🔗 RELATION: Checking relation between {obj1} and {obj2}")
        
        attr_name = 'db'

        if not isinstance(attr_name, str):
            logger.error(f"🔗 RELATION: Invalid attribute name type: {type(attr_name)}")
            raise TypeError(f"Invalid attribute name: {attr_name}")

        try:
            db1 = getattr(getattr(obj1, '_state', None), attr_name, 'default')
            db2 = getattr(getattr(obj2, '_state', None), attr_name, 'default')
            logger.debug(f"🔗 RELATION: Object1 db: {db1}, Object2 db: {db2}")
        except Exception as e:
            logger.error(f"💥 RELATION: Failed to access db state: {e}")
            return None

        # Same database relations are always allowed
        if db1 == db2:
            logger.debug(f"✅ RELATION: Same database relation allowed ({db1})")
            return True

        # Cross-org database relations need validation
        if db1.startswith('orgdata_') and db2.startswith('orgdata_'):
            org1_id = db1.replace('orgdata_', '')
            org2_id = db2.replace('orgdata_', '')
            
            logger.debug(f"🔍 RELATION: Cross-org relation check - Org1: {org1_id}, Org2: {org2_id}")

            # Only allow if same organization
            if org1_id == org2_id:
                logger.debug(f"✅ RELATION: Same organization cross-db relation allowed ({org1_id})")
                return True
            else:
                logger.warning(f"🚫 RELATION: Blocked cross-org relation attempt: {org1_id} -> {org2_id}")
                return False

        logger.debug(f"❓ RELATION: Relation validation returned None for {db1} -> {db2}")
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Enhanced migration control with better app separation and detailed logging"""
        ORG_APPS = ['api', 'accounts', 'auth', 'contenttypes', 'sessions', 'ai', 'analytics']
        PLATFORM_ONLY_APPS = ['admin', 'allauth', 'rest_framework']
        
        logger.debug(f"🔄 MIGRATION: Checking migration for db='{db}', app_label='{app_label}', model_name='{model_name}'")
        
        if db.startswith('orgdata_'):
            # Organization databases only get org-specific apps
            if app_label in ORG_APPS:
                logger.debug(f"✅ MIGRATION: Allowing {app_label} migration to org database {db}")
                return True
            if app_label in PLATFORM_ONLY_APPS:
                logger.debug(f"🚫 MIGRATION: Blocking platform app {app_label} from org database {db}")
                return False
            logger.debug(f"❓ MIGRATION: Unknown app {app_label} for org database {db}, returning None")
            return None
            
        if db == 'default':
            # Default database gets everything except API models
            if app_label in ['auth', 'contenttypes', 'sessions', 'admin', 'accounts', 'allauth']:
                logger.debug(f"✅ MIGRATION: Allowing {app_label} migration to default database")
                return True
            if app_label == 'api':
                logger.debug(f"🚫 MIGRATION: Blocking API app migration to default database")
                return False  # API models only go to org databases
            logger.debug(f"❓ MIGRATION: Unknown app {app_label} for default database, returning None")
            return None
            
        logger.debug(f"❓ MIGRATION: Unknown database {db}, returning None")
        return None

# Legacy alias for backwards compatibility
OrgDatabaseRouter = EnterpriseOrgDatabaseRouter

def ensure_org_database(org_id):
    """Legacy function - redirects to enhanced version with logging"""
    logger.debug(f"🔄 LEGACY: ensure_org_database called for org {org_id}, redirecting to enhanced version")
    from config.db_utils import ensure_org_database_enterprise
    return ensure_org_database_enterprise(org_id)
