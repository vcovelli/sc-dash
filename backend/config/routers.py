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
    if org_id is not None:
        _thread_local.org_id = org_id
        logger.debug(f"Set organization context to: {org_id}")
    else:
        logger.warning("Attempted to set None as organization context")

def get_org_context():
    return getattr(_thread_local, 'org_id', None)

def clear_org_context():
    if hasattr(_thread_local, 'org_id'):
        delattr(_thread_local, 'org_id')

class EnterpriseOrgDatabaseRouter:
    """Enhanced database router with enterprise features"""
    
    org_models = {
        'api.supplier', 'api.warehouse', 'api.product',
        'api.inventory', 'api.customer', 'api.order',
        'api.orderitem', 'api.shipment'
    }

    def __init__(self):
        self.max_connections_per_org = getattr(settings, 'MAX_DB_CONNECTIONS_PER_ORG', 10)
        self.connection_timeout = getattr(settings, 'DB_CONNECTION_TIMEOUT', 30)
        self.enable_performance_monitoring = getattr(settings, 'ENABLE_DB_PERFORMANCE_MONITORING', True)

    def _get_org_db_alias(self, org_id):
        if not org_id:
            return None
        return org_id if str(org_id).startswith("orgdata_") else f"orgdata_{org_id}"

    def _track_performance(self, org_id: int, operation: str, duration: float):
        """Track database performance metrics per organization"""
        if not self.enable_performance_monitoring:
            return
            
        metric_key = f"db_performance:{org_id}:{operation}"
        metrics = cache.get(metric_key, {'count': 0, 'total_time': 0, 'avg_time': 0})
        
        metrics['count'] += 1
        metrics['total_time'] += duration
        metrics['avg_time'] = metrics['total_time'] / metrics['count']
        
        cache.set(metric_key, metrics, timeout=3600)  # Store for 1 hour
        
        # Log slow queries
        if duration > 1.0:  # Queries taking more than 1 second
            logger.warning(f"Slow query detected for org {org_id}: {operation} took {duration:.2f}s")

    def _ensure_org_database_config(self, org_id):
        if not org_id:
            logger.warning("No organization ID provided for database configuration")
            return None

        db_alias = self._get_org_db_alias(org_id)
        start_time = time.time()

        with _cache_lock:
            if db_alias in _db_config_cache:
                self._track_performance(org_id, 'config_cache_hit', time.time() - start_time)
                return db_alias

        # Enhanced database configuration with connection pooling
        try:
            from config.db_utils import ensure_org_database_enterprise
            ensure_org_database_enterprise(org_id)
            
            with _cache_lock:
                _db_config_cache[db_alias] = True
            
            self._track_performance(org_id, 'config_creation', time.time() - start_time)
            return db_alias
            
        except Exception as e:
            logger.error(f"Failed to configure database for org {org_id}: {str(e)}")
            self._track_performance(org_id, 'config_error', time.time() - start_time)
            return None

    def _get_model_identifier(self, model):
        return f"{model._meta.app_label}.{model._meta.model_name}" if hasattr(model, '_meta') else None

    def _validate_cross_org_access(self, model, org_id: int) -> bool:
        """Validate that the model access is legitimate for the organization"""
        from config.enterprise_security import EnterpriseSecurityManager
        
        security_manager = EnterpriseSecurityManager()
        # Additional validation logic here
        return True

    def db_for_read(self, model, **hints):
        start_time = time.time()
        model_id = self._get_model_identifier(model)

        # Organization model always goes to default
        if model_id == "accounts.organization":
            self._track_performance(0, 'read_default', time.time() - start_time)
            return "default"

        # Route organization-specific models
        if model_id in self.org_models:
            org_id = get_org_context()
            if org_id:
                # Validate access
                if not self._validate_cross_org_access(model, org_id):
                    logger.error(f"Cross-org access attempt blocked for org {org_id}")
                    return None
                
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    self._track_performance(org_id, 'read_org_db', time.time() - start_time)
                    return db_alias

            # Try to get org from instance
            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                set_org_context(org_id)
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    self._track_performance(org_id, 'read_org_db_fallback', time.time() - start_time)
                    return db_alias

        self._track_performance(0, 'read_default_fallback', time.time() - start_time)
        return 'default'

    def db_for_write(self, model, **hints):
        # Use same logic as read for consistency
        return self.db_for_read(model, **hints)

    def allow_relation(self, obj1, obj2, **hints):
        """Enhanced relation checking with security validation"""
        db1 = getattr(obj1._state, 'db', 'default')
        db2 = getattr(obj2._state, 'db', 'default')
        
        # Same database relations are always allowed
        if db1 == db2:
            return True
        
        # Cross-org database relations need validation
        if db1.startswith('orgdata_') and db2.startswith('orgdata_'):
            org1_id = db1.replace('orgdata_', '')
            org2_id = db2.replace('orgdata_', '')
            
            # Only allow if same organization
            if org1_id == org2_id:
                return True
            else:
                logger.warning(f"Blocked cross-org relation attempt: {org1_id} -> {org2_id}")
                return False
        
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Enhanced migration control with better app separation"""
        ORG_APPS = ['api', 'accounts', 'auth', 'contenttypes', 'sessions', 'ai', 'analytics']
        PLATFORM_ONLY_APPS = ['admin', 'allauth', 'rest_framework']
        
        if db.startswith('orgdata_'):
            # Organization databases only get org-specific apps
            if app_label in ORG_APPS:
                return True
            if app_label in PLATFORM_ONLY_APPS:
                return False
            return None
            
        if db == 'default':
            # Default database gets everything except API models
            if app_label in ['auth', 'contenttypes', 'sessions', 'admin', 'accounts', 'allauth']:
                return True
            if app_label == 'api':
                return False  # API models only go to org databases
            return None
            
        return None

# Legacy alias for backwards compatibility
OrgDatabaseRouter = EnterpriseOrgDatabaseRouter

def ensure_org_database(org_id):
    """Legacy function - redirects to enhanced version"""
    from config.db_utils import ensure_org_database_enterprise
    return ensure_org_database_enterprise(org_id)
