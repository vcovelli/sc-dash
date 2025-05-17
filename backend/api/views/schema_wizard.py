import os
import csv
import re
import json
from pathlib import Path
from datetime import timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from api.views.table_creation import create_table_for_client
from openpyxl import Workbook
from openpyxl.styles import Font, Protection, Alignment, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from minio import Minio
from dotenv import load_dotenv

load_dotenv()

SCHEMA_DIR = os.environ.get("SCHEMA_DIR", "/opt/airflow/user_schemas")
Path(SCHEMA_DIR).mkdir(parents=True, exist_ok=True)

def sanitize_client_name(name):
    return re.sub(r'[^a-z0-9]', '', name.lower())

def infer_type_from_field(field):
    field = field.lower()
    if "date" in field:
        return "DATE"
    elif "id" in field:
        return "TEXT"
    elif any(keyword in field for keyword in ["price", "quantity", "unit", "total", "amount"]):
        return "NUMERIC"
    else:
        return "TEXT"

def save_schema_config(client_name, selected_columns):
    print(f"[schema_wizard] Saving schema for {client_name}")
    file_path = Path(SCHEMA_DIR) / f"{client_name.lower()}_schema.csv"
    with open(file_path, "w", newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["column_name", "data_type"])
        writer.writeheader()
        for col in selected_columns:
            writer.writerow({
                "column_name": col,
                "data_type": infer_type_from_field(col)
            })

def generate_template_xlsx(client_name):
    file_name = f"{client_name.lower()}_template.xlsx"
    file_path = Path(SCHEMA_DIR) / file_name
    schema_csv_path = Path(SCHEMA_DIR) / f"{client_name.lower()}_schema.csv"

    wb = Workbook()
    ws = wb.active
    ws.title = "Template"

    with open(schema_csv_path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        headers = [row["column_name"] for row in reader]

    # Freeze top row
    ws.freeze_panes = "A2"

    # Write headers and style them
    for col_idx, col_name in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
        cell.fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
        cell.protection = Protection(locked=True)

        # Auto column width
        ws.column_dimensions[get_column_letter(col_idx)].width = max(14, len(col_name) + 2)

    # Fill 20 empty rows of unlocked data cells
    for row in range(2, 22):
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row, column=col_idx, value="")
            cell.protection = Protection(locked=False)
            if row % 2 == 0:
                cell.fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")

    # Enable sheet protection
    ws.protection.sheet = True
    ws.protection.enable()

    wb.save(file_path)
    print(f"[✓] Template saved at {file_path}")

    # Upload to MinIO
    minio_client = Minio(
        os.getenv("MINIO_ENDPOINT"),
        access_key=os.getenv("MINIO_ROOT_USER"),
        secret_key=os.getenv("MINIO_ROOT_PASSWORD"),
        secure=False,
    )

    bucket_name = "templates"

    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)

    minio_client.fput_object(
        bucket_name=bucket_name,
        object_name=file_name,
        file_path=str(file_path),
    )

    # Return presigned URL
    return minio_client.presigned_get_object(
        bucket_name=bucket_name,
        object_name=file_name,
        expires=timedelta(minutes=30)
    )

def trigger_table_creation(client_name):
    print(f"[schema_wizard] Triggering table creation for {client_name}")
    create_table_for_client(client_name)

@csrf_exempt
def generate_schema(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        raw_client_name = data.get("client_name")
        selected_columns = data.get("columns")

        if not raw_client_name or not selected_columns:
            return JsonResponse({"error": "Missing client_name or columns"}, status=400)

        client_name = sanitize_client_name(raw_client_name)
        print(f"[schema_wizard] Sanitized client_name: {client_name}")

        save_schema_config(client_name, selected_columns)
        trigger_table_creation(client_name)
        download_url = generate_template_xlsx(client_name)

        return JsonResponse({
            "success": True,
            "message": f"Schema saved and template generated for {client_name}",
            "download_url": download_url
        })

    except Exception as e:
        print(f"[schema_wizard] Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)
