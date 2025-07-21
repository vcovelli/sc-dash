import threading
import logging
from django.conf import settings
from django.db import connections
from django.core.exceptions import ImproperlyConfigured
import os

# Set up logging
logger = logging.getLogger(__name__)

# Thread-local storage for the current organization context
_thread_local = threading.local()


def set_org_context(org_id):
    """Set the current organization context for this thread"""
    _thread_local.org_id = org_id
    logger.debug(f"Set organization context to: {org_id}")


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
        """Get the database alias for an organization"""
        if not org_id:
            return None
        return f"orgdata_{org_id}"
    
    def _ensure_org_database_config(self, org_id):
        """Ensure the organization database is configured in Django"""
        if not org_id:
            logger.warning("No organization ID provided for database configuration")
            return None
            
        db_alias = self._get_org_db_alias(org_id)
        logger.info(f"Ensuring database configuration for org {org_id} (alias: {db_alias})")
        
        # Check if database configuration already exists
        if db_alias in settings.DATABASES:
            logger.debug(f"Database configuration for {db_alias} already exists")
            return db_alias
        
        # Get environment variables
        db_user = os.getenv('APP_DB_USER')
        db_password = os.getenv('APP_DB_PASSWORD')
        db_host = os.getenv('PG_HOST', 'postgres')
        db_port = os.getenv('PG_PORT', '5432')
        
        # Validate required environment variables
        if not db_user:
            logger.error("APP_DB_USER environment variable is not set")
            raise ImproperlyConfigured("APP_DB_USER environment variable is required")
        
        if not db_password:
            logger.error("APP_DB_PASSWORD environment variable is not set")
            raise ImproperlyConfigured("APP_DB_PASSWORD environment variable is required")
        
        logger.info(f"Creating database configuration for {db_alias} - Host: {db_host}, Port: {db_port}, User: {db_user}")
            
        # Create database configuration dynamically
        org_db_config = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': f'orgdata_{org_id}',
            'USER': db_user,
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': db_port,
            'OPTIONS': {
                'connect_timeout': 30,
            }
        }
        
        try:
            # Add to Django's database configuration
            settings.DATABASES[db_alias] = org_db_config
            logger.info(f"Successfully added database configuration for {db_alias}")
            
            # Clear connection cache to ensure new config is used
            if db_alias in connections.databases:
                del connections.databases[db_alias]
                logger.debug(f"Cleared connection cache for {db_alias}")
                
        except Exception as e:
            logger.error(f"Failed to configure database {db_alias}: {e}")
            raise ImproperlyConfigured(f"Failed to configure database {db_alias}: {e}")
            
        return db_alias
    
    def _get_model_identifier(self, model):
        """Get model identifier in the format app.model"""
        if hasattr(model, '_meta'):
            return f"{model._meta.app_label}.{model._meta.model_name}"
        return None
    
    def db_for_read(self, model, **hints):
        """Determine which database to read from"""
        model_id = self._get_model_identifier(model)
        logger.debug(f"Routing read for model: {model_id}")

        # SPECIAL CASE: Always read Organization from 'default'
        if model_id == "accounts.organization":
            logger.debug("Routing Organization model read to 'default'")
            return "default"

        if model_id in self.org_models:
            # ...rest of your logic unchanged...
            org_id = get_org_context()
            if org_id:
                logger.debug(f"Found organization context {org_id} for model {model_id}")
                try:
                    db_alias = self._ensure_org_database_config(org_id)
                    if db_alias:
                        logger.info(f"Routing {model_id} read to database: {db_alias}")
                        return db_alias
                except Exception as e:
                    logger.error(f"Failed to configure database for org {org_id}: {e}")
                    logger.warning(f"Falling back to default database for {model_id}")
                    return 'default'
            else:
                logger.debug(f"No organization context found for model {model_id}")
            
            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                logger.debug(f"Found org ID {org_id} from instance for model {model_id}")
                set_org_context(org_id)
                try:
                    db_alias = self._ensure_org_database_config(org_id)
                    if db_alias:
                        logger.info(f"Routing {model_id} read to database: {db_alias}")
                        return db_alias
                except Exception as e:
                    logger.error(f"Failed to configure database for org {org_id}: {e}")
                    logger.warning(f"Falling back to default database for {model_id}")
                    return 'default'
        
        logger.debug(f"Routing {model_id} read to default database")
        return 'default'
    
    def db_for_write(self, model, **hints):
        """Determine which database to write to"""
        return self.db_for_read(model, **hints)
    
    def allow_relation(self, obj1, obj2, **hints):
        """Allow relations if objects are in the same database"""
        db_set = {'default'}
        
        # Add organization databases
        for db_alias in settings.DATABASES.keys():
            if db_alias.startswith('orgdata_'):
                db_set.add(db_alias)
        
        if obj1._state.db in db_set and obj2._state.db in db_set:
            return True
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Allow migrations for org models and all needed core Django apps in org DBs.
        Prevent org models in default DB.
        """
        # All apps that must be per-org
        ORG_APPS = [
            'api',
            'accounts',
            'auth',
            'contenttypes',
            # add others as needed ('analytics', etc)
        ]

        if db.startswith('orgdata_'):
            # Allow all per-org apps in org DBs
            if app_label in ORG_APPS:
                return True
            # Block other apps in org DBs (optional: or let them fall through)
            return False

        # Don't allow per-org apps in default DB
        if db == 'default' and app_label in ORG_APPS:
            return False

        # Default: let Django decide
        return None
    
def ensure_org_database(org_id):
    """
    Ensures the organization DB is configured in Django settings for this org_id.
    This is a thin wrapper for the OrgDatabaseRouter logic, so middleware can easily call it.
    """
    router = OrgDatabaseRouter()
    return router._ensure_org_database_config(org_id)