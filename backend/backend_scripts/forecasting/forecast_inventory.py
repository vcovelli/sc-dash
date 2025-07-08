import pandas as pd
import os
from sqlalchemy import create_engine

def forecast_inventory():
    # Get DB credentials and client-specific DB name
    pg_user = os.getenv("PG_USER", "airflow")
    pg_password = os.getenv("PG_PASSWORD", "airflow")
    pg_host = os.getenv("PG_HOST", "postgres")
    client_id = os.getenv("CLIENT_NAME")  # e.g. "canes"

    if not client_id:
        raise ValueError("CLIENT_NAME environment variable is required.")

    pg_database = f"clientdata_{client_id}"

    # Build connection string
    conn_str = f"postgresql+psycopg2://{pg_user}:{pg_password}@{pg_host}/{pg_database}"
    engine = create_engine(conn_str)

    # Step 1: Load data from raw_orders table
    try:
        df = pd.read_sql("SELECT * FROM raw_orders", engine)
    except Exception as e:
        print(f"[!] Failed to query raw_orders: {e}")
        return

    if 'quantity' not in df.columns:
        raise ValueError("'quantity' column is required for forecasting.")

    # Step 2: Dummy forecast: Add 10% buffer to quantity
    df['forecast_quantity'] = df['quantity'] * 1.1

    # Step 3: Save to forecast_inventory table
    try:
        df[['product_id', 'warehouse_id', 'forecast_quantity']].to_sql(
            "forecast_inventory",
            engine,
            if_exists='replace',
            index=False
        )
        print(f"[✓] Forecast table updated in {pg_database}.forecast_inventory")
    except Exception as e:
        print(f"[!] Failed to write forecast_inventory: {e}")
