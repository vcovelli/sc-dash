import csv
import os

# Resolve paths relative to the current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MASTER_TEMPLATE = os.path.join(BASE_DIR, "../datasets/master_template.csv")
SCHEMA_CONFIG_DIR = os.path.join(BASE_DIR, "../user_schemas")

def read_master_template():
    with open(MASTER_TEMPLATE, mode='r') as file:
        reader = csv.reader(file)
        return next(reader)

def prompt_user_for_schema(headers):
    print("Welcome to the Supply Chain Analytics Setup Wizard.")
    print("For each column, type 'y' to include it or 'n' to skip it.\n")
    selected_columns = {}

    for column in headers:
        answer = input(f"Include column '{column}'? (y/n): ").strip().lower()
        if answer == 'y':
            selected_columns[column] = input(f"Optional: Provide custom label or press Enter to keep '{column}': ").strip() or column

    return selected_columns

def save_schema_config(user_id, selected_columns):
    os.makedirs(SCHEMA_CONFIG_DIR, exist_ok=True)
    filepath = os.path.join(SCHEMA_CONFIG_DIR, f"{user_id}_schema.csv")
    with open(filepath, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['source_column', 'label'])
        for source_col, label in selected_columns.items():
            writer.writerow([source_col, label])
    print(f"\nSaved schema to: {filepath}")

def main():
    user_id = input("Enter a unique name for this schema (e.g., company name): ").strip()
    headers = read_master_template()
    selected_columns = prompt_user_for_schema(headers)
    save_schema_config(user_id, selected_columns)

if __name__ == "__main__":
    main()
