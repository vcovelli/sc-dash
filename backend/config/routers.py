import threading
import logging
from django.conf import settings
from django.db import connections
from django.core.exceptions import ImproperlyConfigured
from django.core.cache import cache
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import psycopg2
import time

# Set up logging
logger = logging.getLogger(__name__)

# Thread-local storage for the current organization context
_thread_local = threading.local()

# Cache for database configurations to avoid repeated setup
_db_config_cache = {}
_cache_lock = threading.Lock()


def set_org_context(org_id):
    """Set the current organization context for this thread"""
    if org_id is not None:
        _thread_local.org_id = org_id
        logger.debug(f"Set organization context to: {org_id}")
    else:
        logger.warning("Attempted to set None as organization context")


def get_org_context():
    """Get the current organization context for this thread"""
    org_id = getattr(_thread_local, 'org_id', None)
    logger.debug(f"Retrieved organization context: {org_id}")
    return org_id


def clear_org_context():
    """Clear the organization context for this thread"""
    if hasattr(_thread_local, 'org_id'):
        org_id = _thread_local.org_id
        delattr(_thread_local, 'org_id')
        logger.debug(f"Cleared organization context: {org_id}")


class OrgDatabaseRouter:
    """
    A database router that routes queries to organization-specific databases.
    
    Organization databases follow the naming convention: orgdata_<org_id>
    """
    
    # Models that should use organization-specific databases
    org_models = {
        'api.supplier',
        'api.warehouse', 
        'api.product',
        'api.inventory',
        'api.customer',
        'api.order',
        'api.orderitem',
        'api.shipment',
    }
    
    def _get_org_db_alias(self, org_id):
        if not org_id:
            return None
        return org_id if org_id.startswith("orgdata_") else f"orgdata_{org_id}"
    
    def _validate_environment_variables(self):
        """Validate required environment variables are set"""
        required_vars = ['APP_DB_USER', 'APP_DB_PASSWORD']
        missing_vars = []
        
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            raise ImproperlyConfigured(
                f"Missing required environment variables: {', '.join(missing_vars)}"
            )
    
    def _ensure_org_database_config(self, org_id):
        """Ensure the organization database is configured in Django with caching"""
        if not org_id:
            logger.warning("No organization ID provided for database configuration")
            return None
            
        db_alias = self._get_org_db_alias(org_id)

        # Check cache first to avoid repeated configuration
        with _cache_lock:
            if db_alias in _db_config_cache:
                logger.debug(f"Database configuration for {db_alias} found in cache")
                return db_alias

        logger.info(f"Ensuring database configuration for org {org_id} (alias: {db_alias})")
        
        # Check if database configuration already exists in Django settings
        if db_alias in settings.DATABASES:
            logger.debug(f"Database configuration for {db_alias} already exists in settings")
            with _cache_lock:
                _db_config_cache[db_alias] = True
            return db_alias
        
        try:
            # Validate environment variables
            self._validate_environment_variables()
            
            # Get environment variables with defaults
            db_user = os.getenv('APP_DB_USER')
            db_password = os.getenv('APP_DB_PASSWORD')
            db_host = os.getenv('PG_HOST', 'postgres')
            db_port = os.getenv('PG_PORT', '5432')
            
            logger.info(f"Creating database configuration for {db_alias} - Host: {db_host}, Port: {db_port}, User: {db_user}")
                
            # Create database configuration dynamically with optimized settings
            org_db_config = {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': f'orgdata_{org_id}',
                'USER': db_user,
                'PASSWORD': db_password,
                'HOST': db_host,
                'PORT': db_port,
                'OPTIONS': {
                    'connect_timeout': 30,
                    'options': '-c default_transaction_isolation=read_committed'
                },
                'CONN_MAX_AGE': 600,  # Connection pooling - reuse connections for 10 minutes
                'CONN_HEALTH_CHECKS': True,  # Enable connection health checks
            }

            # Add to Django's database configuration
            settings.DATABASES[db_alias] = org_db_config
            logger.info(f"Successfully added database configuration for {db_alias}")
            
            # Clear connection cache to ensure new config is used
            if db_alias in connections.databases:
                del connections.databases[db_alias]
                logger.debug(f"Cleared connection cache for {db_alias}")

            # Cache the successful configuration
            with _cache_lock:
                _db_config_cache[db_alias] = True
                
        except Exception as e:
            logger.error(f"Failed to configure database {db_alias}: {e}")
            return None
            
        return db_alias
    
    def _get_model_identifier(self, model):
        """Get model identifier in the format app.model"""
        if hasattr(model, '_meta'):
            return f"{model._meta.app_label}.{model._meta.model_name}"
        return None
    
    def _test_database_connection(self, db_alias):
        """Test if database connection is working"""
        try:
            from django.db import connections
            connection = connections[db_alias]
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database connection test failed for {db_alias}: {e}")
            return False
    
    def db_for_read(self, model, **hints):
        """Determine which database to read from with improved error handling"""
        model_id = self._get_model_identifier(model)
        logger.debug(f"Routing read for model: {model_id}")

        # SPECIAL CASE: Always read Organization from 'default'
        if model_id == "accounts.organization":
            logger.debug("Routing Organization model read to 'default'")
            return "default"

        if model_id in self.org_models:
            # Try to get organization context from thread-local storage
            org_id = get_org_context()
            if org_id:
                logger.debug(f"Found organization context {org_id} for model {model_id}")
                try:
                    db_alias = self._ensure_org_database_config(org_id)
                    if db_alias and self._test_database_connection(db_alias):
                        logger.info(f"Routing {model_id} read to database: {db_alias}")
                        return db_alias
                    else:
                        logger.warning(f"Database connection failed for {db_alias}, falling back to default")
                except Exception as e:
                    logger.error(f"Failed to configure database for org {org_id}: {e}")
                    logger.warning(f"Falling back to default database for {model_id}")
            else:
                logger.debug(f"No organization context found for model {model_id}")
            
            # Try to get organization from model instance
            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                logger.debug(f"Found org ID {org_id} from instance for model {model_id}")
                set_org_context(org_id)
                try:
                    db_alias = self._ensure_org_database_config(org_id)
                    if db_alias and self._test_database_connection(db_alias):
                        logger.info(f"Routing {model_id} read to database: {db_alias}")
                        return db_alias
                except Exception as e:
                    logger.error(f"Failed to configure database for org {org_id}: {e}")
                    logger.warning(f"Falling back to default database for {model_id}")
        
        logger.debug(f"Routing {model_id} read to default database")
        return 'default'
    
    def db_for_write(self, model, **hints):
        """Determine which database to write to"""
        return self.db_for_read(model, **hints)
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if objects are in the same database"""
        # Get database aliases for both objects
        db1 = obj1._state.db if hasattr(obj1, '_state') else 'default'
        db2 = obj2._state.db if hasattr(obj2, '_state') else 'default'
        
        # Allow relations within the same database
        if db1 == db2:
            return True
        
        # Allow cross-database relations for specific cases
        # e.g., between organization data and default database
        db_set = {'default'}
        for db_alias in settings.DATABASES.keys():
            if db_alias.startswith('orgdata_'):
                db_set.add(db_alias)
        
        if db1 in db_set and db2 in db_set:
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Control which migrations run on which databases.
        Improved to handle edge cases and prevent conflicts.
        """
        # Apps that must be per-organization
        ORG_APPS = [
            'api',
            'accounts',
            'auth',
            'contenttypes',
            'sessions',
        ]

        # Organization databases
        if db.startswith('orgdata_'):
            # Allow all per-org apps in org DBs
            if app_label in ORG_APPS:
                logger.debug(f"Allowing migration for {app_label}.{model_name} on {db}")
                return True
            # Block other apps in org DBs
            logger.debug(f"Blocking migration for {app_label}.{model_name} on {db}")
            return False

        # Default database
        if db == 'default':
            # Allow core Django apps that should stay in default
            core_apps = ['auth', 'contenttypes', 'sessions', 'admin', 'accounts']
            if app_label in core_apps:
                logger.debug(f"Allowing migration for {app_label}.{model_name} on {db}")
                return True
            # Block organization-specific data apps
            if app_label == 'api':
                logger.debug(f"Blocking migration for {app_label}.{model_name} on {db}")
                return False

        # Default: let Django decide for other cases
        return None
    
def ensure_org_database(org_id):
    dbname = f"orgdata_{org_id}"

    # Connect to the main DB to check for or create the org DB
    conn = psycopg2.connect(
        dbname="postgres",  # Use main/default DB
        user=os.getenv("APP_DB_USER", "app_user"),
        password=os.getenv("APP_DB_PASSWORD", "app_pass"),
        host=os.getenv("PG_HOST", "postgres"),
        port=os.getenv("PG_PORT", 5432)
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # Check if database exists
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (dbname,))
    exists = cur.fetchone()

    if not exists:
        print(f"Creating database: {dbname}")
        cur.execute(f'CREATE DATABASE "{dbname}";')
    else:
        print(f"Database {dbname} already exists.")

    cur.close()
    conn.close()