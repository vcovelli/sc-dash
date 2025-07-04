import os
import csv
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv()

SCHEMA_DIR = os.environ.get("SCHEMA_DIR", "/opt/airflow/user_schemas")

def create_table_for_client(client_name: str):
    """
    Creates a dedicated database and table for a client based on a CSV schema.

    - Looks for <SCHEMA_DIR>/<client_name>_schema.csv
    - If needed, creates new database: clientdata_<client_name>
    - Creates a 'raw_orders' table in that database according to the schema
    """
    schema_path = Path(SCHEMA_DIR) / f"{client_name}_schema.csv"
    db_name = f"clientdata_{client_name}"

    print(f"[create_table_for_client] Looking for schema at: {schema_path}")
    print(f"[create_table_for_client] Target DB name: {db_name}")

    if not schema_path.exists():
        print(f"[create_table_for_client] ❌ Schema CSV not found: {schema_path}")
        raise FileNotFoundError(f"Schema not found for client: {client_name}")

    # Connect to default DB to create client-specific DB if it doesn't exist
    default_conn = psycopg2.connect(
        dbname=os.getenv("PG_DATABASE"),
        user=os.getenv("APP_DB_USER"),
        password=os.getenv("APP_DB_PASSWORD"),
        host=os.getenv("PG_HOST"),
        port=os.getenv("PG_PORT")
    )
    default_conn.autocommit = True
    with default_conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()
        if not exists:
            cur.execute(f'CREATE DATABASE "{db_name}"')
            print(f"[✓] Created database: {db_name}")
    default_conn.close()

    # Now connect to the client-specific DB to create the table
    conn = psycopg2.connect(
        dbname=db_name,
        user=os.getenv("APP_DB_USER"),
        password=os.getenv("APP_DB_PASSWORD"),
        host=os.getenv("PG_HOST"),
        port=os.getenv("PG_PORT")
    )
    with conn:
        with conn.cursor() as cur:
            with open(schema_path, newline="") as csvfile:
                reader = csv.DictReader(csvfile)
                columns = [f'"{row["column_name"]}" {row["data_type"]}' for row in reader]
                column_definitions = ", ".join(columns)

            table_name = "raw_orders"
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    {column_definitions}
                );
            """)
            print(f"[✓] Created table `{table_name}` in `{db_name}`")

    conn.close()
