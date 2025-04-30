import csv
import os

# Resolve paths relative to the current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MASTER_TEMPLATE = os.path.join(BASE_DIR, "../datasets/master_template.csv")
SCHEMA_CONFIG_DIR = os.path.join(BASE_DIR, "../user_schemas")

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

def main():
    user_id = input("Enter a unique name for this schema (e.g., company name): ").strip()
    headers = read_master_template()
    selected_columns = prompt_user_for_schema(headers)
    if selected_columns:
        save_schema_config(user_id, selected_columns)
    else:
        print("No columns selected. Schema not saved.")

if __name__ == "__main__":
    main()
