from copy import deepcopy
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
from django.db import connections
from accounts.models import Organization
import os

class Command(BaseCommand):
    help = 'Migrate organization models to their specific databases'

    def add_arguments(self, parser):
        parser.add_argument(
            '--org-id',
            type=str,
            help='Specific organization ID to migrate (if not provided, migrates all)',
        )
        parser.add_argument(
            '--create-databases',
            action='store_true',
            help='Create organization databases if they do not exist',
        )

    def handle(self, *args, **options):
        org_id = options.get('org_id')
        create_databases = options.get('create_databases', False)
        
        if org_id:
            # Migrate specific organization
            try:
                org = Organization.objects.get(id=org_id)
                self.migrate_organization(org, create_databases)
            except Organization.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Organization with ID {org_id} not found!')
                )
                return
        else:
            # Fetch org list using raw SQL to avoid field mismatches
            with connections['default'].cursor() as cursor:
                cursor.execute("SELECT id, name FROM accounts_organization")
                org_rows = cursor.fetchall()

            self.stdout.write(f'Found {len(org_rows)} organizations to migrate')
            for org_id, org_name in org_rows:
                # Pass minimal info—your migrate_organization will need to accept (id, name)
                self.migrate_organization(org_id, org_name, create_databases)
        
        self.stdout.write(
            self.style.SUCCESS('Organization database migration completed!')
        )

    def migrate_organization(self, org_id, org_name, create_databases=False):
        """Migrate a specific organization to its database"""
        self.stdout.write(f'\n--- Migrating Organization: {org_name} (ID: {org_id}) ---')

        db_alias = f"orgdata_{org_id}"
        db_name = f"orgdata_{org_id}"

        # Copy the default db config and override what you need
        if db_alias not in settings.DATABASES:
            org_db_config = deepcopy(settings.DATABASES['default'])
            org_db_config['NAME'] = db_name
            org_db_config['USER'] = os.getenv('APP_DB_USER', org_db_config.get('USER'))
            org_db_config['PASSWORD'] = os.getenv('APP_DB_PASSWORD', org_db_config.get('PASSWORD'))
            org_db_config['HOST'] = os.getenv('PG_HOST', org_db_config.get('HOST', 'postgres'))
            org_db_config['PORT'] = os.getenv('PG_PORT', org_db_config.get('PORT', '5432'))
            settings.DATABASES[db_alias] = org_db_config
            self.stdout.write(f'Added database configuration: {db_alias}')

        if create_databases:
            self.create_database_if_not_exists(db_name)

        try:
            # Test database connection
            connection = connections[db_alias]
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(f'✅ Database connection successful: {db_name}')

            # Run ALL needed migrations for this org db
            self.stdout.write(f'Running migrations for {db_alias}...')
            call_command(
                'migrate',
                verbosity=1,
                interactive=False,
                database=db_alias,
            )
            self.stdout.write(
                self.style.SUCCESS(f'✅ Migration completed for organization: {org_name}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error migrating organization {org_name}: {str(e)}')
            )

    def create_database_if_not_exists(self, db_name):
        """Create the organization database if it doesn't exist"""
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
        
        try:
            default_conn = psycopg2.connect(
                dbname=os.getenv('APP_DB_NAME', 'postgres'),
                user=os.getenv('APP_DB_USER'),
                password=os.getenv('APP_DB_PASSWORD'),
                host=os.getenv('PG_HOST', 'postgres'),
                port=os.getenv('PG_PORT', '5432')
            )
            default_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            with default_conn.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM pg_database WHERE datname = %s", 
                    (db_name,)
                )
                exists = cursor.fetchone()
                if not exists:
                    cursor.execute(f'CREATE DATABASE "{db_name}"')
                    self.stdout.write(f'✅ Created database: {db_name}')
                else:
                    self.stdout.write(f'Database already exists: {db_name}')
            default_conn.close()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error creating database {db_name}: {str(e)}')
            )
