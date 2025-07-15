import os
import csv
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv()

# Directory containing CSV schemas (env or default)
SCHEMA_DIR = os.environ.get("SCHEMA_DIR", "/opt/airflow/user_schemas")

def create_table_for_org(org_id: str):
    """
    Creates a dedicated database and table for an organization based on a CSV schema.

    - Looks for <SCHEMA_DIR>/<org_id>_schema.csv
    - If needed, creates new database: orgdata_<org_id>
    - Creates a 'raw_orders' table in that database according to the schema
    """
    schema_path = Path(SCHEMA_DIR) / f"{org_id}_schema.csv"
    db_name = f"orgdata_{org_id}"

    print(f"[create_table_for_org] Looking for schema at: {schema_path}")
    print(f"[create_table_for_org] Target DB name: {db_name}")

    if not schema_path.exists():
        print(f"[create_table_for_org] ❌ Schema CSV not found: {schema_path}")
        raise FileNotFoundError(f"Schema not found for org: {org_id}")

    # Connect to the default database to create org-specific DB if it doesn't exist
    default_db = os.getenv("PG_DATABASE", os.getenv("APP_DB_NAME", "postgres"))
    default_conn = psycopg2.connect(
        dbname=default_db,
        user=os.getenv("APP_DB_USER"),
        password=os.getenv("APP_DB_PASSWORD"),
        host=os.getenv("PG_HOST", "localhost"),
        port=os.getenv("PG_PORT", "5432")
    )
    default_conn.autocommit = True
    with default_conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()
        if not exists:
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print(f"[✓] Created database: {db_name}")
        else:
            print(f"[=] Database already exists: {db_name}")
    default_conn.close()

    # Connect to the org-specific DB to create the table
    org_conn = psycopg2.connect(
        dbname=db_name,
        user=os.getenv("APP_DB_USER"),
        password=os.getenv("APP_DB_PASSWORD"),
        host=os.getenv("PG_HOST", "localhost"),
        port=os.getenv("PG_PORT", "5432")
    )
    with org_conn:
        with org_conn.cursor() as cur:
            with open(schema_path, newline="") as csvfile:
                reader = csv.DictReader(csvfile)
                columns = [f'"{row["column_name"]}" {row["data_type"]}' for row in reader]
                column_definitions = ", ".join(columns)
            table_name = "raw_orders"
            create_stmt = f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    {column_definitions}
                );
            """
            cur.execute(create_stmt)
            print(f"[✓] Created table `{table_name}` in `{db_name}`")
    org_conn.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Create org database and table from CSV schema.")
    parser.add_argument("--org-id", required=True, help="Organization ID (e.g. 1, 42, acme_inc)")
    args = parser.parse_args()
    create_table_for_org(args.org_id)
