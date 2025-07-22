import os, csv, json, zipfile, random
from datetime import datetime
from pathlib import Path

GRIST_API_KEY = os.getenv("GRIST_API_KEY")
GRIST_BASE_URL = os.getenv("GRIST_BASE_URL", "http://192.168.1.42:8484/api")

# Grist-compatible directory and files
def create_grist_file(output_path: str, schema: dict, sample_data: dict):
    print(f"[debug] Grist file path → {output_path}")

    temp_dir = Path("/tmp/generated_grist")
    tables_dir = temp_dir / "tables"
    tables_dir.mkdir(parents=True, exist_ok=True)

    tables_json = []
    columns_json = []
    column_refs = {}
    table_ids = {}
    current_col_id = 1

    for idx, (table_name, fields) in enumerate(schema.items()):
        table_id = idx + 1
        table_ids[table_name] = table_id

        tables_json.append({
            "id": table_id,
            "fields": {
                "id": table_id,
                "tableId": table_name,
                "columns": [col["colId"] for col in fields]
            }
        })

        column_refs[table_name] = []

        csv_path = tables_dir / f"{table_name}.csv"
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=[col["colId"] for col in fields])
            writer.writeheader()
            for row in sample_data.get(table_name, []):
                writer.writerow(row)

        for field in fields:
            column = {
                "id": current_col_id,
                "fields": {
                    "parentId": table_id,
                    "colId": field["colId"],
                    "type": field["type"]
                }
            }
            if "widgetOptions" in field:
                column["fields"]["widgetOptions"] = json.dumps(field["widgetOptions"])
            columns_json.append(column)
            column_refs[table_name].append((field["colId"], current_col_id))
            current_col_id += 1

    with open(temp_dir / "_grist_Tables.json", "w") as f:
        json.dump(tables_json, f, indent=2)

    with open(temp_dir / "_grist_Tables_column.json", "w") as f:
        json.dump(columns_json, f, indent=2)

    with open(temp_dir / "doc.json", "w") as f:
        json.dump({"timezone": "UTC"}, f)

    from .grist_api import generate_grist_view_files
    view_files = generate_grist_view_files(schema, column_refs, table_ids)

    for filename, content in view_files.items():
        with open(temp_dir / filename, "w") as f:
            f.write(content)

    with open(temp_dir / "_grist_DocInfo.json", "w") as f:
        json.dump({"activeViewId": 1}, f, indent=2)

    print("[create_grist_file] Assembling .grist zip with contents:")
    for path in temp_dir.rglob("*"):
        print(" -", path.relative_to(temp_dir))

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in temp_dir.rglob("*"):
            if file_path.is_file():
                arcname = file_path.relative_to(temp_dir)
                zf.write(file_path, arcname)

    return output_path

def generate_grist_schema_and_data(selected_features: list[str], client_name: str):
    """
    Based on selected schema features, generate:
    - A schema compatible with create_grist_file()
    - Sample records for each table

    Returns:
    - (schema_dict, sample_data_dict)
    """
    schema = {}
    data = {}

    # Hardcoded choices and colors for realism
    choice_fields = {
        "shipment_status": {
            "choices": ["Delivered", "Pending", "In Transit"],
            "colors": ["green", "red", "orange"]
        },
        "shipment_method": {
            "choices": ["Air", "Ground", "Freight"],
            "colors": ["blue", "orange", "gray"]
        },
        "product_category": {
            "choices": ["Electronics", "Apparel", "Furniture"],
            "colors": ["purple", "cyan", "teal"]
        },
        "supplier_name": {
            "choices": ["SupplyCo", "MegaSupply", "FastParts"],
            "colors": ["#f06292", "#ba68c8", "#4db6ac"]
        },
        "customer_name": {
            "choices": ["Alice", "Bob", "Charlie", "Dana"],
            "colors": ["#ab47bc", "#26a69a", "#ff7043", "#42a5f5"]
        }
    }

    # Define table structure and sample rows
    if "suppliers" in selected_features:
        schema["Suppliers"] = [
            {"colId": "supplier_id", "type": "Text"},
            {"colId": "supplier_name", "type": "Choice", "widgetOptions": choice_fields["supplier_name"]}
        ]
        data["Suppliers"] = [
            {"supplier_id": "SUP-51", "supplier_name": "MegaSupply"},
            {"supplier_id": "SUP-48", "supplier_name": "SupplyCo"},
            {"supplier_id": "SUP-71", "supplier_name": "FastParts"}
        ]

    if "products" in selected_features:
        schema["Products"] = [
            {"colId": "product_id", "type": "Text"},
            {"colId": "product_name", "type": "Text"},
            {"colId": "product_category", "type": "Choice", "widgetOptions": choice_fields["product_category"]},
            {"colId": "unit_price", "type": "Numeric"},
            {"colId": "supplier", "type": "Ref:Suppliers"}
        ]
        data["Products"] = [
            {"product_id": "PROD-207", "product_name": "Widget B", "product_category": "Electronics", "unit_price": 37.5, "supplier": 3},
            {"product_id": "PROD-701", "product_name": "Widget A", "product_category": "Furniture", "unit_price": 23.37, "supplier": 2}
        ]

    if "customers" in selected_features:
        schema["Customers"] = [
            {"colId": "customer_id", "type": "Text"},
            {"colId": "customer_name", "type": "Choice", "widgetOptions": choice_fields["customer_name"]}
        ]
        data["Customers"] = [
            {"customer_id": "CUST-859", "customer_name": "Bob"},
            {"customer_id": "CUST-921", "customer_name": "Alice"},
            {"customer_id": "CUST-641", "customer_name": "Charlie"}
        ]

    if "warehouses" in selected_features:
        schema["Warehouses"] = [
            {"colId": "warehouse_id", "type": "Text"},
            {"colId": "warehouse_location", "type": "Text"}
        ]
        data["Warehouses"] = [
            {"warehouse_id": "WH-1", "warehouse_location": "North DC"},
            {"warehouse_id": "WH-2", "warehouse_location": "South DC"},
            {"warehouse_id": "WH-3", "warehouse_location": "North DC"}
        ]

    if "shipments" in selected_features:
        schema["Shipments"] = [
            {"colId": "shipment_id", "type": "Text"},
            {"colId": "shipment_method", "type": "Choice", "widgetOptions": choice_fields["shipment_method"]},
            {"colId": "shipment_status", "type": "Choice", "widgetOptions": choice_fields["shipment_status"]},
            {"colId": "tracking_number", "type": "Text"}
        ]
        data["Shipments"] = [
            {"shipment_id": "SHIP-2506", "shipment_method": "Freight", "shipment_status": "Delivered", "tracking_number": "TRK625842"},
            {"shipment_id": "SHIP-6145", "shipment_method": "Air", "shipment_status": "In Transit", "tracking_number": "TRK342277"}
        ]

    if "orders" in selected_features:
        schema["Orders"] = [
            {"colId": "order_id", "type": "Text"},
            {"colId": "order_date", "type": "Date"},
            {"colId": "product", "type": "Ref:Products"},
            {"colId": "customer", "type": "Ref:Customers"},
            {"colId": "shipment", "type": "Ref:Shipments"},
            {"colId": "warehouse", "type": "Ref:Warehouses"},
            {"colId": "supplier", "type": "Ref:Suppliers"},
            {"colId": "quantity", "type": "Numeric"},
            {"colId": "unit_price", "type": "Numeric"}
        ]
        data["Orders"] = [
            {
                "order_id": "ORD-8279",
                "order_date": datetime.today().strftime("%Y-%m-%d"),
                "product": 1,
                "customer": 1,
                "shipment": 1,
                "warehouse": 1,
                "supplier": 1,
                "quantity": 83,
                "unit_price": 167.81
            },
            {
                "order_id": "ORD-3152",
                "order_date": datetime.today().strftime("%Y-%m-%d"),
                "product": 2,
                "customer": 3,
                "shipment": 2,
                "warehouse": 2,
                "supplier": 3,
                "quantity": 72,
                "unit_price": 414.61
            }
        ]

    return schema, data

def generate_grist_view_files(schema: dict, column_refs: dict, table_ids: dict) -> dict:
    views = []
    view_sections = []
    view_fields = []

    section_id = 1
    field_id = 1
    layout = []

    for table_name, columns in column_refs.items():
        layout.append([section_id])

        section = {
            "id": section_id,
            "fields": {
                "parentId": 1,
                "title": table_name,
                "tableRef": table_ids[table_name],
                "viewAs": "grid",
                "defaultSort": [{"colRef": columns[0][1], "ascending": True}] if columns else []
            }
        }
        view_sections.append(section)

        for _, col_id in columns:
            view_fields.append({
                "id": field_id,
                "fields": {
                    "parentId": section_id,
                    "colRef": col_id,
                    "width": 160
                }
            })
            field_id += 1

        section_id += 1

    views.append({
        "id": 1,
        "fields": {
            "name": "MainView",
            "layout": layout
        }
    })

    return {
        "_grist_Views.json": json.dumps(views, indent=2),
        "_grist_ViewSections.json": json.dumps(view_sections, indent=2),
        "_grist_ViewFields.json": json.dumps(view_fields, indent=2)
    }

def upload_grist_file(file_path: str) -> dict:
    if not GRIST_API_KEY:
        raise ValueError("Missing GRIST_API_KEY environment variable.")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f".grist file not found at: {file_path}")

    headers = {
        "Authorization": f"Bearer {GRIST_API_KEY}"
    }

    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f)}
        response = requests.post(f"{GRIST_BASE_URL}/docs", headers=headers, files=files)

    response.raise_for_status()

    doc_id = response.text.strip().strip('"')
    base_url = GRIST_BASE_URL.replace("/api", "")

    return {
        "doc_id": doc_id,
        "doc_url": f"{base_url}/o/docs/{doc_id}/",
        "view_url": f"{base_url}/o/docs/{doc_id}/view/"
    }
