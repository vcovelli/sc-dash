import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import os

def forecast_inventory():
    # DB connection
    pg_user = os.getenv("PG_USER", "airflow")
    pg_password = os.getenv("PG_PASSWORD", "airflow")
    pg_database = os.getenv("PG_DATABASE", "airflow")
    pg_host = os.getenv("PG_HOST", "postgres")

    conn_str = f"postgresql+psycopg2://{pg_user}:{pg_password}@{pg_host}/{pg_database}"
    engine = create_engine(conn_str)

    # Step 1: Load data
    df = pd.read_sql("SELECT * FROM inventory", engine)

    # Step 2: Dummy forecast: Add 10% buffer to current stock
    df['forecast_quantity'] = df['quantity'] * 1.1

    # Step 3: Write forecast table
    df[['product_id', 'warehouse_id', 'forecast_quantity']].to_sql(
        "forecast_inventory",
        engine,
        if_exists='replace',
        index=False
    )

    print("Forecast table updated.")
