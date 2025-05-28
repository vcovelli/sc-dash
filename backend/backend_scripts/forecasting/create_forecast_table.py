import csv
import psycopg2
import os

def create_forecast_table(client_name):
    schema_path = f"user_schemas/{client_name}_schema.csv"

    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    # Read schema CSV
    columns = []
    with open(schema_path, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            col_name = row['column_name']
            col_type = row['data_type'].upper()
            columns.append(f"{col_name} {col_type}")

    # Generate table name and SQL
    table_name = f"{client_name}_forecast_data"
    create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n  " + ",\n  ".join(columns) + "\n);"

    # Connect to Postgres
    conn = psycopg2.connect(
        dbname=os.getenv("PG_DATABASE"),
        user=os.getenv("APP_DB_USER"),
        password=os.getenv("APP_DB_PASSWORD"),
        host=os.getenv("PG_HOST", "localhost"),
        port=os.getenv("PG_PORT", 5432),
    )

    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(create_sql)
                print(f"Table `{table_name}` created or already exists.")
    finally:
        conn.close()
