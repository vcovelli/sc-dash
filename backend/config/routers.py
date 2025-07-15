import threading
from django.conf import settings
from django.db import connections
from django.core.exceptions import ImproperlyConfigured
import os

# Thread-local storage for the current organization context
_thread_local = threading.local()


def set_org_context(org_id):
    """Set the current organization context for this thread"""
    _thread_local.org_id = org_id


def get_org_context():
    """Get the current organization context for this thread"""
    return getattr(_thread_local, 'org_id', None)


def clear_org_context():
    """Clear the organization context for this thread"""
    if hasattr(_thread_local, 'org_id'):
        delattr(_thread_local, 'org_id')


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
            return None
            
        db_alias = self._get_org_db_alias(org_id)
        
        # Check if database configuration already exists
        if db_alias in settings.DATABASES:
            return db_alias
            
        # Create database configuration dynamically
        org_db_config = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': f'orgdata_{org_id}',
            'USER': os.getenv('APP_DB_USER'),
            'PASSWORD': os.getenv('APP_DB_PASSWORD'),
            'HOST': os.getenv('PG_HOST', 'postgres'),
            'PORT': os.getenv('PG_PORT', '5432'),
        }
        
        # Add to Django's database configuration
        settings.DATABASES[db_alias] = org_db_config
        
        # Clear connection cache to ensure new config is used
        if db_alias in connections.databases:
            del connections.databases[db_alias]
            
        return db_alias
    
    def _get_model_identifier(self, model):
        """Get model identifier in the format app.model"""
        if hasattr(model, '_meta'):
            return f"{model._meta.app_label}.{model._meta.model_name}"
        return None
    
    def db_for_read(self, model, **hints):
        """Determine which database to read from"""
        model_id = self._get_model_identifier(model)
        
        if model_id in self.org_models:
            # Check for organization context
            org_id = get_org_context()
            if org_id:
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    return db_alias
            
            # If no org context, check the instance for org information
            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                set_org_context(org_id)  # Set context for subsequent queries
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    return db_alias
        
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
        """Control which migrations run on which databases"""
        model_id = f"{app_label}.{model_name}" if model_name else None
        
        # Organization models should only migrate to organization databases
        if model_id in self.org_models:
            return db.startswith('orgdata_')
        
        # Core models (accounts, auth, etc.) should only migrate to default
        if app_label in ['accounts', 'auth', 'contenttypes', 'sessions', 'admin', 'sites']:
            return db == 'default'
        
        # Other models go to default database
        return db == 'default'