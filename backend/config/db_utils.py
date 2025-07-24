import psycopg2
import time
import threading
from psycopg2 import sql, pool
from django.conf import settings
from django.db import connections
from django.core.management import call_command
from django.core.cache import cache
from accounts.models import Organization
from typing import Dict, Optional, List
import logging
import os

logger = logging.getLogger(__name__)

# Enterprise connection pool management
_connection_pools: Dict[str, psycopg2.pool.ThreadedConnectionPool] = {}
_pool_lock = threading.Lock()

class EnterpriseOrgDatabaseManager:
    """Enhanced database management for enterprise multi-tenant deployments with comprehensive logging"""
    
    def __init__(self):
        self.min_connections = getattr(settings, 'MIN_DB_CONNECTIONS_PER_ORG', 2)
        self.max_connections = getattr(settings, 'MAX_DB_CONNECTIONS_PER_ORG', 20)
        self.connection_retry_attempts = 3
        self.connection_retry_delay = 1
        logger.info(f"🚀 DB_MANAGER: EnterpriseOrgDatabaseManager initialized with min_conn={self.min_connections}, max_conn={self.max_connections}")

    def get_connection_pool(self, org_id: int) -> Optional[psycopg2.pool.ThreadedConnectionPool]:
        """Get or create connection pool for organization database with logging"""
        db_name = f"orgdata_{org_id}"
        
        logger.debug(f"🏊 POOL: Getting connection pool for {db_name}")
        
        with _pool_lock:
            if db_name not in _connection_pools:
                logger.debug(f"🏊 POOL: Creating new connection pool for {db_name}")
                try:
                    _connection_pools[db_name] = psycopg2.pool.ThreadedConnectionPool(
                        self.min_connections,
                        self.max_connections,
                        dbname=db_name,
                        user=settings.APP_DB_USER,
                        password=settings.APP_DB_PASSWORD,
                        host=settings.PG_HOST,
                        port=settings.PG_PORT,
                    )
                    logger.info(f"✅ POOL: Created connection pool for {db_name} ({self.min_connections}-{self.max_connections} connections)")
                except Exception as e:
                    logger.error(f"💥 POOL: Failed to create connection pool for {db_name}: {e}")
                    return None
            else:
                logger.debug(f"♻️  POOL: Reusing existing connection pool for {db_name}")
            
            return _connection_pools[db_name]

    def close_connection_pool(self, org_id: int):
        """Close connection pool for organization database with logging"""
        db_name = f"orgdata_{org_id}"
        
        logger.debug(f"🔚 POOL: Closing connection pool for {db_name}")
        
        with _pool_lock:
            if db_name in _connection_pools:
                try:
                    _connection_pools[db_name].closeall()
                    del _connection_pools[db_name]
                    logger.info(f"✅ POOL: Closed connection pool for {db_name}")
                except Exception as e:
                    logger.error(f"💥 POOL: Error closing connection pool for {db_name}: {e}")
            else:
                logger.debug(f"❓ POOL: No connection pool found for {db_name} to close")

    def validate_database_schema(self, org_id: int) -> Dict[str, bool]:
        """Validate that organization database has correct schema with detailed logging"""
        db_name = f"orgdata_{org_id}"
        
        logger.debug(f"🔍 SCHEMA: Starting schema validation for {db_name}")
        
        try:
            logger.debug(f"🔌 SCHEMA: Connecting to {db_name} for validation")
            conn = psycopg2.connect(
                dbname=db_name,
                user=settings.APP_DB_USER,
                password=settings.APP_DB_PASSWORD,
                host=settings.PG_HOST,
                port=settings.PG_PORT,
            )
            
            with conn.cursor() as cur:
                # Check for required tables
                required_tables = [
                    'api_supplier', 'api_warehouse', 'api_product',
                    'api_customer', 'api_order', 'api_orderitem',
                    'api_inventory', 'api_shipment'
                ]
                
                logger.debug(f"🔍 SCHEMA: Checking {len(required_tables)} required tables for {db_name}")
                
                missing_tables = []
                for table in required_tables:
                    logger.debug(f"🔍 SCHEMA: Checking table {table} in {db_name}")
                    cur.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = %s
                        );
                    """, [table])
                    
                    exists = cur.fetchone()[0]
                    if not exists:
                        missing_tables.append(table)
                        logger.warning(f"❌ SCHEMA: Missing table {table} in {db_name}")
                    else:
                        logger.debug(f"✅ SCHEMA: Found table {table} in {db_name}")
                
                conn.close()
                logger.debug(f"🔌 SCHEMA: Closed connection to {db_name}")
                
                if missing_tables:
                    logger.error(f"💥 SCHEMA: Schema validation failed for {db_name} - missing {len(missing_tables)} tables")
                    return {
                        "valid": False,
                        "missing_tables": missing_tables,
                        "message": f"Missing tables: {', '.join(missing_tables)}"
                    }
                else:
                    logger.info(f"✅ SCHEMA: Schema validation passed for {db_name}")
                    return {"valid": True, "message": "Schema validation passed"}
                    
        except Exception as e:
            logger.error(f"💥 SCHEMA: Schema validation error for {db_name}: {str(e)}")
            return {"valid": False, "message": f"Schema validation error: {str(e)}"}

    def backup_organization_database(self, org_id: int, backup_path: str = None) -> Dict[str, str]:
        """Create backup of organization database with detailed logging"""
        db_name = f"orgdata_{org_id}"
        
        if not backup_path:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"/backups/{db_name}_{timestamp}.sql"
        
        logger.info(f"💾 BACKUP: Starting backup for {db_name} to {backup_path}")
        
        try:
            import subprocess
            
            # Use pg_dump to create backup
            cmd = [
                "pg_dump",
                f"--host={settings.PG_HOST}",
                f"--port={settings.PG_PORT}",
                f"--username={settings.APP_DB_USER}",
                f"--dbname={db_name}",
                f"--file={backup_path}",
                "--no-password",
                "--verbose"
            ]
            
            logger.debug(f"💾 BACKUP: Running command: {' '.join(cmd[:-1])} [password hidden]")
            
            env = os.environ.copy()
            env['PGPASSWORD'] = settings.APP_DB_PASSWORD
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"✅ BACKUP: Backup created successfully for {db_name} at {backup_path}")
                return {
                    "success": True,
                    "backup_path": backup_path,
                    "message": f"Backup created successfully for {db_name}"
                }
            else:
                logger.error(f"💥 BACKUP: Backup failed for {db_name}: {result.stderr}")
                return {
                    "success": False,
                    "message": f"Backup failed: {result.stderr}"
                }
                
        except Exception as e:
            logger.error(f"💥 BACKUP: Backup error for {db_name}: {str(e)}")
            return {
                "success": False,
                "message": f"Backup error: {str(e)}"
            }

    def monitor_database_health(self, org_id: int) -> Dict[str, any]:
        """Monitor database health metrics for organization with detailed logging"""
        db_name = f"orgdata_{org_id}"
        
        logger.debug(f"🏥 HEALTH: Starting health monitoring for {db_name}")
        
        try:
            logger.debug(f"🔌 HEALTH: Connecting to {db_name} for health check")
            conn = psycopg2.connect(
                dbname=db_name,
                user=settings.APP_DB_USER,
                password=settings.APP_DB_PASSWORD,
                host=settings.PG_HOST,
                port=settings.PG_PORT,
            )
            
            with conn.cursor() as cur:
                # Get database size
                logger.debug(f"📏 HEALTH: Getting database size for {db_name}")
                cur.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
                db_size = cur.fetchone()[0]
                logger.debug(f"📏 HEALTH: Database size for {db_name}: {db_size}")
                
                # Get connection count
                logger.debug(f"🔗 HEALTH: Getting connection count for {db_name}")
                cur.execute("""
                    SELECT count(*) 
                    FROM pg_stat_activity 
                    WHERE datname = current_database();
                """)
                active_connections = cur.fetchone()[0]
                logger.debug(f"🔗 HEALTH: Active connections for {db_name}: {active_connections}")
                
                # Get table statistics
                logger.debug(f"📊 HEALTH: Getting table statistics for {db_name}")
                cur.execute("""
                    SELECT 
                        schemaname,
                        tablename,
                        n_tup_ins,
                        n_tup_upd,
                        n_tup_del
                    FROM pg_stat_user_tables;
                """)
                table_stats = cur.fetchall()
                logger.debug(f"📊 HEALTH: Found {len(table_stats)} tables with statistics in {db_name}")
                
                conn.close()
                logger.debug(f"🔌 HEALTH: Closed connection to {db_name}")
                
                health_data = {
                    "healthy": True,
                    "database_size": db_size,
                    "active_connections": active_connections,
                    "table_statistics": table_stats,
                    "timestamp": time.time()
                }
                
                logger.info(f"✅ HEALTH: Health monitoring complete for {db_name} - Size: {db_size}, Connections: {active_connections}")
                return health_data
                
        except Exception as e:
            logger.error(f"💥 HEALTH: Health monitoring error for {db_name}: {str(e)}")
            return {
                "healthy": False,
                "error": str(e),
                "timestamp": time.time()
            }

def ensure_org_database_enterprise(org_id: int):
    """Enhanced organization database creation with enterprise features and strategic logging"""
    manager = EnterpriseOrgDatabaseManager()
    db_key = f'orgdata_{org_id}'
    db_name = db_key

    logger.info(f"🚀 DB_SETUP: Starting setup for org {org_id}")

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
            exists = cur.fetchone()
            
            if not exists:
                logger.info(f"🛠️  DB_SETUP: Creating database {db_name}")
                cur.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(db_name)))
                
                # Set database-specific configurations for enterprise
                cur.execute(f"ALTER DATABASE {db_name} SET log_statement = 'all'")
                logger.info(f"✅ DB_SETUP: Created {db_name}")
            else:
                logger.debug(f"✔️ DB_SETUP: Database {db_name} exists")
    except Exception as e:
        logger.error(f"💥 DB_SETUP: Error creating {db_name}: {e}")
        raise
    finally:
        default_conn.close()

    # Step 2: Enhanced Django database configuration
    if db_key not in connections.databases:
        logger.debug(f"🔧 DB_SETUP: Configuring Django connection for {db_key}")
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
            'CONN_MAX_AGE': 300,  # 5 minutes for enterprise
            'OPTIONS': {
                'isolation_level': psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED,
                'connect_timeout': 10,
                'options': '-c statement_timeout=30000',  # 30 seconds
            },
            'TIME_ZONE': getattr(settings, 'TIME_ZONE', 'UTC'),
        }
        logger.debug(f"✅ DB_SETUP: Django configuration added for {db_key}")
    else:
        logger.debug(f"✔️ DB_SETUP: Django configuration exists for {db_key}")

    # Step 3: Apply migrations with retry logic
    logger.info(f"🔄 DB_SETUP: Running migrations for {db_key}")
    for attempt in range(3):
        try:
            call_command('migrate', database=db_key, run_syncdb=True, interactive=False)
            logger.info(f"✅ DB_SETUP: Migrations completed for {db_key}")
            break
        except Exception as e:
            if attempt == 2:  # Last attempt
                logger.error(f"💥 DB_SETUP: Failed migrations for {db_key} after 3 attempts: {e}")
                raise
            else:
                logger.warning(f"⚠️  DB_SETUP: Migration attempt {attempt + 1} failed, retrying: {e}")
                time.sleep(2)

    # Step 4: Sync organization data
    replicate_org_to_org_db(org_id, db_key)
    
    # Step 5: Validate schema
    validation_result = manager.validate_database_schema(org_id)
    if not validation_result["valid"]:
        logger.warning(f"⚠️  DB_SETUP: Schema validation failed for {db_name}: {validation_result['message']}")
    
    # Step 6: Initialize connection pool
    pool = manager.get_connection_pool(org_id)
    if not pool:
        logger.warning(f"⚠️  DB_SETUP: Failed to initialize connection pool for {db_key}")
    
    logger.info(f"✅ DB_SETUP: Setup complete for {db_name}")

def replicate_org_to_org_db(org_id: int, db_key: str):
    """Enhanced organization replication with conflict resolution and strategic logging"""
    try:
        org = Organization.objects.using('default').get(id=org_id)
        
        # Use update_or_create with proper conflict handling
        org_replica, created = Organization.objects.using(db_key).update_or_create(
            id=org.id,
            defaults={
                "name": org.name,
                "slug": org.slug,
                "created_at": org.created_at,
                "updated_at": org.updated_at,
            }
        )
        
        action = "created" if created else "updated"
        logger.debug(f"📦 REPLICATE: {action.capitalize()} org {org.id} in {db_key}")
        
    except Organization.DoesNotExist:
        logger.error(f"💥 REPLICATE: Organization {org_id} not found")
        raise
    except Exception as e:
        logger.error(f"💥 REPLICATE: Failed to replicate org {org_id}: {e}")
        raise

# Legacy function for backwards compatibility
def ensure_org_database(org_id: int):
    """Legacy wrapper for the enhanced function with logging"""
    logger.debug(f"🔄 LEGACY: ensure_org_database called for org {org_id}, redirecting to enhanced version")
    return ensure_org_database_enterprise(org_id)
