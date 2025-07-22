import psycopg2
from psycopg2 import sql
from django.conf import settings
from django.db import connections
from django.core.management import call_command
from accounts.models import Organization

def ensure_org_database(org_id: int):
    db_key = f'orgdata_{org_id}'
    db_name = db_key

    # Step 1: Ensure the PostgreSQL database exists
    default_conn = psycopg2.connect(
        dbname='postgres',
        user=settings.APP_DB_USER,
        password=settings.APP_DB_PASSWORD,
        host=settings.PG_HOST,
        port=settings.PG_PORT,
    )

    try:
        default_conn.set_session(autocommit=True)
        with default_conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", [db_name])
            if not cur.fetchone():
                print(f"🛠️  Creating missing database: {db_name}")
                cur.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(db_name)))
            else:
                print(f"✔️ Database {db_name} already exists.")
    finally:
        default_conn.close()

    # Step 2: Inject database config into Django
    if db_key not in connections.databases:
        connections.databases[db_key] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': settings.APP_DB_USER,
            'PASSWORD': settings.APP_DB_PASSWORD,
            'HOST': settings.PG_HOST,
            'PORT': settings.PG_PORT,
            'AUTOCOMMIT': True,
            'ATOMIC_REQUESTS': True,
            'CONN_HEALTH_CHECKS': True,
            'CONN_MAX_AGE': 60,
            'OPTIONS': {},
            'TIME_ZONE': getattr(settings, 'TIME_ZONE', 'UTC'),
        }

    # Step 3: Apply migrations
    print(f"🚀 Running migrations for {db_key}...")
    call_command('migrate', database=db_key, run_syncdb=True, interactive=False)

    # Step 4: Sync org row into the new DB
    replicate_org_to_org_db(org_id, db_key)

def replicate_org_to_org_db(org_id: int, db_key: str):
    org = Organization.objects.using('default').get(id=org_id)
    Organization.objects.using(db_key).update_or_create(
        id=org.id,
        defaults={
            "name": org.name,
            "slug": org.slug,
            "created_at": org.created_at,
            "updated_at": org.updated_at,
        }
    )
    print(f"📦 Replicated Organization {org.id} into {db_key}")
