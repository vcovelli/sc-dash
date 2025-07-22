import threading
import logging
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from django.conf import settings
from django.db import connections
from django.core.exceptions import ImproperlyConfigured
from django.core.cache import cache
from django.core.management import call_command
from accounts.models import Organization

logger = logging.getLogger(__name__)

_thread_local = threading.local()
_db_config_cache = {}
_cache_lock = threading.Lock()

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

class OrgDatabaseRouter:
    org_models = {
        'api.supplier', 'api.warehouse', 'api.product',
        'api.inventory', 'api.customer', 'api.order',
        'api.orderitem', 'api.shipment'
    }

    def _get_org_db_alias(self, org_id):
        if not org_id:
            return None
        return org_id if str(org_id).startswith("orgdata_") else f"orgdata_{org_id}"

    def _ensure_org_database_config(self, org_id):
        if not org_id:
            logger.warning("No organization ID provided for database configuration")
            return None

        db_alias = self._get_org_db_alias(org_id)

        with _cache_lock:
            if db_alias in _db_config_cache:
                return db_alias

        from config.db_utils import ensure_org_database
        ensure_org_database(org_id)

        with _cache_lock:
            _db_config_cache[db_alias] = True
        return db_alias

    def _get_model_identifier(self, model):
        return f"{model._meta.app_label}.{model._meta.model_name}" if hasattr(model, '_meta') else None

    def db_for_read(self, model, **hints):
        model_id = self._get_model_identifier(model)

        if model_id == "accounts.organization":
            return "default"

        if model_id in self.org_models:
            org_id = get_org_context()
            if org_id:
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    return db_alias

            instance = hints.get('instance')
            if instance and hasattr(instance, 'org') and instance.org:
                org_id = instance.org.id
                set_org_context(org_id)
                db_alias = self._ensure_org_database_config(org_id)
                if db_alias:
                    return db_alias

        return 'default'

    def db_for_write(self, model, **hints):
        return self.db_for_read(model, **hints)

    def allow_relation(self, obj1, obj2, **hints):
        db1 = getattr(obj1._state, 'db', 'default')
        db2 = getattr(obj2._state, 'db', 'default')
        if db1 == db2:
            return True
        if db1.startswith('orgdata_') and db2.startswith('orgdata_'):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        ORG_APPS = ['api', 'accounts', 'auth', 'contenttypes', 'sessions']
        if db.startswith('orgdata_'):
            return app_label in ORG_APPS
        if db == 'default':
            if app_label in ['auth', 'contenttypes', 'sessions', 'admin', 'accounts']:
                return True
            if app_label == 'api':
                return False
        return None

def ensure_org_database(org_id):
    db_key = f"orgdata_{org_id}"
    db_name = db_key

    if db_key not in settings.DATABASES:
        settings.DATABASES[db_key] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': settings.APP_DB_USER,
            'PASSWORD': settings.APP_DB_PASSWORD,
            'HOST': settings.PG_HOST,
            'PORT': settings.PG_PORT,
            'AUTOCOMMIT': True,
            'ATOMIC_REQUESTS': True,
            'CONN_HEALTH_CHECKS': False,
            'CONN_MAX_AGE': 60,
            'OPTIONS': {},
            'TIME_ZONE': settings.TIME_ZONE,
        }

    conn = psycopg2.connect(
        dbname='postgres',
        user=settings.APP_DB_USER,
        password=settings.APP_DB_PASSWORD,
        host=settings.PG_HOST,
        port=settings.PG_PORT,
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
    if not cur.fetchone():
        logger.info(f"Creating missing database: {db_name}")
        cur.execute(f'CREATE DATABASE "{db_name}";')
    else:
        logger.debug(f"Database {db_name} already exists.")

    cur.close()
    conn.close()

    from django.core.management import call_command
    call_command('migrate', database=db_key, run_syncdb=True, interactive=False)

    org = Organization.objects.using('default').get(id=org_id)
    Organization.objects.using(db_key).update_or_create(
        id=org.id,
        defaults={
            'name': org.name,
            'slug': org.slug,
            'created_at': org.created_at,
            'updated_at': org.updated_at,
        }
    )
    logger.info(f"Replicated org {org_id} to {db_key}")
