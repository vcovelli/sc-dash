import csv
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Resolve paths relative to the current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MASTER_TEMPLATE = os.path.join(BASE_DIR, "../datasets/master_template.csv")
SCHEMA_CONFIG_DIR = os.path.join(BASE_DIR, "../user_schemas")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TEMPLATE_OUTPUT_DIR = os.path.join(BASE_DIR, "../datasets/templates")

# Basic mapping of keywords to data types
def infer_postgres_type(column_name):
    name = column_name.lower()
    if any(kw in name for kw in ['date', 'time']):
        return "TIMESTAMP"
    elif any(kw in name for kw in ['id', 'quantity', 'amount', 'count']):
        return "INTEGER"
    elif any(kw in name for kw in ['price', 'cost', 'rate', 'value']):
        return "FLOAT"
    else:
        return "TEXT"

def read_master_template():
    with open(MASTER_TEMPLATE, mode='r') as file:
        reader = csv.reader(file)
        return next(reader)

def prompt_user_for_schema(headers):
    print("📊 Welcome to the Supply Chain Analytics Setup Wizard.\n")
    selected_columns = []

    for column in headers:
        include = input(f"Include column '{column}'? (y/n): ").strip().lower()
        if include == 'y':
            label = input(f"Custom label for '{column}' (or press Enter to keep as-is): ").strip() or column
            data_type = infer_postgres_type(column)
            selected_columns.append({
                "column_name": label,
                "data_type": data_type
            })

    return selected_columns

def save_schema_config(user_id, selected_columns):
    os.makedirs(SCHEMA_CONFIG_DIR, exist_ok=True)
    filepath = os.path.join(SCHEMA_CONFIG_DIR, f"{user_id}_schema.csv")
    with open(filepath, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=['column_name', 'data_type'])
        writer.writeheader()
        for col in selected_columns:
            writer.writerow(col)
    print(f"\nSchema saved to: {filepath}")

# Generate blank data template
def generate_template_csv(client_name, output_dir=TEMPLATE_OUTPUT_DIR):
    schema_path = os.path.join(SCHEMA_CONFIG_DIR, f"{client_name}_schema.csv")
    output_path = os.path.join(output_dir, f"{client_name}_data_template.csv")

    if not os.path.exists(schema_path):
        raise FileNotFoundError(f"Schema not found: {schema_path}")

    os.makedirs(output_dir, exist_ok=True)

    with open(schema_path, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        headers = [row['column_name'] for row in reader]

    with open(output_path, mode='w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()

    print(f"Template CSV generated at: {output_path}")

def trigger_table_creation(user_id):
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/create-table/",
            json={"client_name": user_id}
        )
        if response.status_code == (200, 201):
            print(f"✅ Table created successfully for `{user_id}`.")
        else:
            print(f"❌ Table creation failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ Error contacting backend: {e}")

def main():
    user_id = input("Enter a unique name for this schema (e.g., company name): ").strip()
    headers = read_master_template()
    selected_columns = prompt_user_for_schema(headers)
    if selected_columns:
        save_schema_config(user_id, selected_columns)
        trigger_table_creation(user_id)
        generate_template_csv(user_id)
    else:
        print("No columns selected. Schema not saved.")

if __name__ == "__main__":
    main()
