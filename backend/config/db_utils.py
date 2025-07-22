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
    """Enhanced database management for enterprise multi-tenant deployments"""
    
    def __init__(self):
        self.min_connections = getattr(settings, 'MIN_DB_CONNECTIONS_PER_ORG', 2)
        self.max_connections = getattr(settings, 'MAX_DB_CONNECTIONS_PER_ORG', 20)
        self.connection_retry_attempts = 3
        self.connection_retry_delay = 1

    def get_connection_pool(self, org_id: int) -> Optional[psycopg2.pool.ThreadedConnectionPool]:
        """Get or create connection pool for organization database"""
        db_name = f"orgdata_{org_id}"
        
        with _pool_lock:
            if db_name not in _connection_pools:
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
                    logger.info(f"Created connection pool for {db_name}")
                except Exception as e:
                    logger.error(f"Failed to create connection pool for {db_name}: {e}")
                    return None
            
            return _connection_pools[db_name]

    def close_connection_pool(self, org_id: int):
        """Close connection pool for organization database"""
        db_name = f"orgdata_{org_id}"
        
        with _pool_lock:
            if db_name in _connection_pools:
                try:
                    _connection_pools[db_name].closeall()
                    del _connection_pools[db_name]
                    logger.info(f"Closed connection pool for {db_name}")
                except Exception as e:
                    logger.error(f"Error closing connection pool for {db_name}: {e}")

    def validate_database_schema(self, org_id: int) -> Dict[str, bool]:
        """Validate that organization database has correct schema"""
        db_name = f"orgdata_{org_id}"
        
        try:
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
                
                missing_tables = []
                for table in required_tables:
                    cur.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = %s
                        );
                    """, [table])
                    
                    if not cur.fetchone()[0]:
                        missing_tables.append(table)
                
                conn.close()
                
                if missing_tables:
                    return {
                        "valid": False,
                        "missing_tables": missing_tables,
                        "message": f"Missing tables: {', '.join(missing_tables)}"
                    }
                else:
                    return {"valid": True, "message": "Schema validation passed"}
                    
        except Exception as e:
            return {"valid": False, "message": f"Schema validation error: {str(e)}"}

    def backup_organization_database(self, org_id: int, backup_path: str = None) -> Dict[str, str]:
        """Create backup of organization database"""
        db_name = f"orgdata_{org_id}"
        
        if not backup_path:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"/backups/{db_name}_{timestamp}.sql"
        
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
            
            env = os.environ.copy()
            env['PGPASSWORD'] = settings.APP_DB_PASSWORD
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "backup_path": backup_path,
                    "message": f"Backup created successfully for {db_name}"
                }
            else:
                return {
                    "success": False,
                    "message": f"Backup failed: {result.stderr}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Backup error: {str(e)}"
            }

    def monitor_database_health(self, org_id: int) -> Dict[str, any]:
        """Monitor database health metrics for organization"""
        db_name = f"orgdata_{org_id}"
        
        try:
            conn = psycopg2.connect(
                dbname=db_name,
                user=settings.APP_DB_USER,
                password=settings.APP_DB_PASSWORD,
                host=settings.PG_HOST,
                port=settings.PG_PORT,
            )
            
            with conn.cursor() as cur:
                # Get database size
                cur.execute("SELECT pg_size_pretty(pg_database_size(current_database()));")
                db_size = cur.fetchone()[0]
                
                # Get connection count
                cur.execute("""
                    SELECT count(*) 
                    FROM pg_stat_activity 
                    WHERE datname = current_database();
                """)
                active_connections = cur.fetchone()[0]
                
                # Get table statistics
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
                
                conn.close()
                
                return {
                    "healthy": True,
                    "database_size": db_size,
                    "active_connections": active_connections,
                    "table_statistics": table_stats,
                    "timestamp": time.time()
                }
                
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "timestamp": time.time()
            }

def ensure_org_database_enterprise(org_id: int):
    """Enhanced organization database creation with enterprise features"""
    manager = EnterpriseOrgDatabaseManager()
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
                logger.info(f"🛠️  Creating missing database: {db_name}")
                cur.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(db_name)))
                
                # Set database-specific configurations for enterprise
                #cur.execute(f"ALTER DATABASE {db_name} SET shared_preload_libraries = 'pg_stat_statements'")
                cur.execute(f"ALTER DATABASE {db_name} SET log_statement = 'all'")
                
            else:
                logger.info(f"✔️ Database {db_name} already exists.")
    finally:
        default_conn.close()

    # Step 2: Enhanced Django database configuration
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
            'CONN_MAX_AGE': 300,  # 5 minutes for enterprise
            'OPTIONS': {
                'isolation_level': psycopg2.extensions.ISOLATION_LEVEL_READ_COMMITTED,
                'connect_timeout': 10,
                'options': '-c statement_timeout=30000',  # 30 seconds
            },
            'TIME_ZONE': getattr(settings, 'TIME_ZONE', 'UTC'),
        }

    # Step 3: Apply migrations with retry logic
    for attempt in range(3):
        try:
            logger.info(f"🚀 Running migrations for {db_key} (attempt {attempt + 1})")
            call_command('migrate', database=db_key, run_syncdb=True, interactive=False)
            break
        except Exception as e:
            if attempt == 2:  # Last attempt
                logger.error(f"Failed to migrate {db_key} after 3 attempts: {e}")
                raise
            else:
                logger.warning(f"Migration attempt {attempt + 1} failed, retrying: {e}")
                time.sleep(2)

    # Step 4: Sync organization data
    replicate_org_to_org_db(org_id, db_key)
    
    # Step 5: Validate schema
    validation_result = manager.validate_database_schema(org_id)
    if not validation_result["valid"]:
        logger.error(f"Schema validation failed for {db_name}: {validation_result['message']}")
    
    # Step 6: Initialize connection pool
    manager.get_connection_pool(org_id)
    
    logger.info(f"✅ Enterprise database setup complete for {db_name}")

def replicate_org_to_org_db(org_id: int, db_key: str):
    """Enhanced organization replication with conflict resolution"""
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
        logger.info(f"📦 {action.capitalize()} Organization {org.id} in {db_key}")
        
    except Exception as e:
        logger.error(f"Failed to replicate organization {org_id} to {db_key}: {e}")
        raise

# Legacy function for backwards compatibility
def ensure_org_database(org_id: int):
    """Legacy wrapper for the enhanced function"""
    return ensure_org_database_enterprise(org_id)
