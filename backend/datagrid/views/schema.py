import json
import re
import csv
import os
import random
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Protection
from openpyxl.utils import get_column_letter
from helpers.table_utils import create_table_for_client
from minio import Minio

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from dotenv import load_dotenv

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from datagrid.models import UserTableSchema  # Use your app/model import here!
from datagrid.serializers import UserTableSchemaSerializer  # Ditto, update path if needed

from accounts.models import UserActivity  # If you track user actions
from accounts.permissions import IsReadOnlyOrAbove, CanViewAnalytics
from accounts.mixins import CombinedOrgMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

# ====== SCHEMA CONSTANTS AND HELPERS =======

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SCHEMA_DIR = Path(os.environ.get("SCHEMA_DIR", BASE_DIR / "user_schemas"))

def ensure_schema_dir():
    SCHEMA_DIR.mkdir(parents=True, exist_ok=True)

SCHEMA_FEATURES = {
    "orders": {
        "sheet": "MASTER_Orders",
        "columns": [
            "order_id", "order_date", "product_id", "product_name", "customer_id",
            "warehouse_id", "shipment_id", "quantity", "order_status", "expected_delivery_date"
        ]
    },
    "products": {
        "sheet": "Products",
        "columns": ["product_id", "product_name", "product_category", "supplier_id", "unit_price"]
    },
    "suppliers": {
        "sheet": "Suppliers",
        "columns": ["supplier_id", "supplier_name"]
    },
    "warehouses": {
        "sheet": "Warehouses",
        "columns": ["warehouse_id", "warehouse_location", "supplier_id"]
    },
    "customers": {
        "sheet": "Customers",
        "columns": ["customer_id", "customer_name"]
    },
    "shipments": {
        "sheet": "Shipments",
        "columns": ["shipment_id", "shipment_method", "shipment_status", "tracking_number"]
    }
}

REQUIRED_KEYS = ["order_id", "product_id", "order_date"]
INTERNAL_COLUMNS = ["version", "uuid", "ingested_at", "client_name"]

def style_header(cell):
    cell.font = Font(bold=True)
    cell.alignment = Alignment(horizontal="center")
    cell.fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    cell.protection = Protection(locked=True)

def generate_sample_row(columns, client_name):
    row = []
    for col in columns:
        if col == "order_id":
            row.append(f"ORD-{random.randint(1000,9999)}")
        elif col == "product_id":
            row.append(f"PROD-{random.randint(100,999)}")
        elif col == "product_name":
            row.append(random.choice(["Widget A", "Widget B", "Widget C"]))
        elif col == "customer_id":
            row.append(f"CUST-{random.randint(100,999)}")
        elif col == "customer_name":
            row.append(random.choice(["Alice", "Bob", "Charlie", "Dana"]))
        elif col == "warehouse_id":
            row.append(f"WH-{random.randint(1,3)}")
        elif col == "warehouse_location":
            row.append(random.choice(["North DC", "South DC"]))
        elif col == "supplier_id":
            row.append(f"SUP-{random.randint(10,99)}")
        elif col == "supplier_name":
            row.append(random.choice(["SupplyCo", "MegaSupply", "FastParts"]))
        elif col == "shipment_id":
            row.append(f"SHIP-{random.randint(1000,9999)}")
        elif col == "shipment_method":
            row.append(random.choice(["Ground", "Air", "Freight"]))
        elif col == "shipment_status":
            row.append(random.choice(["Pending", "In Transit", "Delivered"]))
        elif col == "tracking_number":
            row.append(f"TRK{random.randint(100000,999999)}")
        elif col == "product_category":
            row.append(random.choice(["Electronics", "Apparel", "Furniture"]))
        elif col == "unit_price":
            row.append(round(random.uniform(10, 500), 2))
        elif col == "quantity":
            row.append(random.randint(1, 100))
        elif col == "order_date":
            row.append((datetime.today() - timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%d"))
        elif col == "expected_delivery_date":
            row.append((datetime.today() + timedelta(days=random.randint(1, 14))).strftime("%Y-%m-%d"))
        elif col == "order_status":
            row.append(random.choice(["Pending", "Processing", "Delivered"]))
        elif col == "uuid":
            row.append(str(uuid.uuid4()))
        elif col == "version":
            row.append(1)
        elif col == "ingested_at":
            row.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        elif col == "client_name":
            row.append(client_name)
        else:
            row.append("Sample")
    return row

def write_sheet(wb, sheet_name, columns, client_name, num_rows=10):
    ws = wb.create_sheet(title=sheet_name)
    for col_idx, col_name in enumerate(columns, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        style_header(cell)
    for row_num in range(2, 2 + num_rows):
        row_data = generate_sample_row(columns, client_name)
        for col_idx, value in enumerate(row_data, start=1):
            cell = ws.cell(row=row_num, column=col_idx, value=value)
            if "date" in columns[col_idx-1]:
                cell.number_format = "yyyy-mm-dd"
            elif "price" in columns[col_idx-1]:
                cell.number_format = '"$"#,##0.00'

def generate_full_workbook(client_name, selected_features, include_sample_data=True):
    ensure_schema_dir()
    file_path = SCHEMA_DIR / f"{client_name}_full_template.xlsx"
    wb = Workbook()
    wb.remove(wb.active)

    included_sheets = {}
    for feature in selected_features:
        config = SCHEMA_FEATURES.get(feature)
        if config:
            included_sheets[config["sheet"]] = config["columns"]

    logical_order = [
        "order_id", "order_date", "product_id", "product_name",
        "customer_id", "customer_name",
        "warehouse_id", "warehouse_location",
        "shipment_id", "shipment_method", "shipment_status", "tracking_number",
        "quantity", "unit_price", "product_category", "supplier_id", "supplier_name"
    ]
    master_fields = [col for col in logical_order if col in {col for cols in included_sheets.values() for col in cols} or col in REQUIRED_KEYS]

    # MASTER_Orders Sheet with sample values
    ws_master = wb.create_sheet("MASTER_Orders")
    for col_idx, col_name in enumerate(master_fields, start=1):
        cell = ws_master.cell(row=1, column=col_idx, value=col_name)
        style_header(cell)
    if include_sample_data:
        for row_num in range(2, 12):
            row_data = generate_sample_row(master_fields, client_name)
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws_master.cell(row=row_num, column=col_idx, value=value)
                if "date" in master_fields[col_idx - 1]:
                    cell.number_format = "yyyy-mm-dd"
                elif "price" in master_fields[col_idx - 1]:
                    cell.number_format = '"$"#,##0.00'

    # Relational sheets using formulas
    for sheet_name, columns in included_sheets.items():
        if sheet_name == "MASTER_Orders":
            continue
        ws = wb.create_sheet(sheet_name)
        for col_idx, col_name in enumerate(columns, start=1):
            cell = ws.cell(row=1, column=col_idx, value=col_name)
            style_header(cell)
        if include_sample_data:
            for row_num in range(2, 7):
                for col_idx, col_name in enumerate(columns, start=1):
                    if col_name in master_fields:
                        ref_col_idx = master_fields.index(col_name) + 1
                        formula = f"'MASTER_Orders'!{get_column_letter(ref_col_idx)}{row_num}"
                        ws.cell(row=row_num, column=col_idx, value=f"={formula}")
                    else:
                        ws.cell(row=row_num, column=col_idx, value="Sample")

    wb.save(file_path)

    # --- MinIO connection using public host ---
    minio_client = Minio(
        "minio.supplywise.ai",  # PUBLIC HOST for both upload and presign
        access_key=os.getenv("MINIO_ROOT_USER", "admin"),
        secret_key=os.getenv("MINIO_ROOT_PASSWORD", "admin123"),
        secure=True,  # HTTPS for public-facing ops
    )
    bucket_name = "templates"
    object_name = file_path.name

    # --- Ensure bucket exists ---
    if not minio_client.bucket_exists(bucket_name):
        minio_client.make_bucket(bucket_name)

    # --- Upload file ---
    minio_client.fput_object(bucket_name, object_name, str(file_path))

    # --- Presigned URL using public host, no netloc swap needed ---
    presigned_url = minio_client.presigned_get_object(
        bucket_name, object_name, expires=timedelta(minutes=30)
    )

    return {
        "download_url": presigned_url,
        "file_path": str(file_path)
    }

@csrf_exempt
def generate_schema(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        # --- 1. Parse Request Data ---
        data = json.loads(request.body)
        raw_client_name = data.get("client_name") or data.get("business_name")
        selected_features = data.get("features")
        include_sample_data = data.get("include_sample_data", True)

        if not raw_client_name or not selected_features:
            return JsonResponse({"error": "Missing client_name or features"}, status=400)

        client_name = re.sub(r'[^a-z0-9]', '', raw_client_name.lower())
        allowed_keys = set(SCHEMA_FEATURES.keys())
        selected_features = [f for f in selected_features if f in allowed_keys]

        if not selected_features:
            return JsonResponse({"error": "No valid features selected"}, status=400)

        # --- 2. Compute All Columns (Union) ---
        all_columns = set()
        for feature in selected_features:
            config = SCHEMA_FEATURES.get(feature)
            if config:
                all_columns.update(config["columns"])
        all_columns.update(REQUIRED_KEYS)
        all_columns.update(INTERNAL_COLUMNS)
        sorted_columns = sorted(all_columns)

        # --- 3. Write schema CSV (optional, just for export/debug) ---
        ensure_schema_dir()
        schema_path = SCHEMA_DIR / f"{client_name}_schema.csv"
        with open(schema_path, mode="w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["column_name", "data_type"])
            for col in sorted_columns:
                if "date" in col:
                    dtype = "DATE"
                elif "id" in col or col == "uuid":
                    dtype = "VARCHAR(64)"
                elif col == "quantity":
                    dtype = "INTEGER"
                elif col == "unit_price":
                    dtype = "NUMERIC(10, 2)"
                else:
                    dtype = "TEXT"
                writer.writerow([col, dtype])

        # --- 4. Authenticate User ---
        user = None
        try:
            authenticator = JWTAuthentication()
            user_auth_tuple = authenticator.authenticate(request)
            if user_auth_tuple:
                user, _ = user_auth_tuple
        except Exception as auth_err:
            print(f"[schema_wizard] ⚠️ User authentication failed: {auth_err}")

        # --- 5. Save User Schema (if authenticated) ---
        if user and user.org:
            # Log onboarding complete
            UserActivity.objects.create(
                user=user,
                verb="completed onboarding",
                target=client_name,
                meta={
                    "features": selected_features,
                    "include_sample_data": include_sample_data,
                }
            )
            for feature in selected_features:
                config = SCHEMA_FEATURES.get(feature)
                if config:
                    table_name = feature
                    columns = list(config["columns"])
                    # Add any global or table-specific columns as needed
                    columns += [c for c in (REQUIRED_KEYS + INTERNAL_COLUMNS) if c not in columns]
                    columns = sorted(set(columns))
                    UserTableSchema.objects.update_or_create(
                        user=user,
                        org=user.org,
                        table_name=table_name,
                        defaults={"columns": columns}
                    )

        # --- 6. Generate the Excel Workbook, Upload to Minio ---
        # If you have your own client table creation, call it here:
        create_table_for_client(client_name)
        workbook = generate_full_workbook(client_name, selected_features, include_sample_data)
        download_url = workbook["download_url"]

        # Log template download if user is authenticated
        if user and download_url:
            UserActivity.objects.create(
                user=user,
                verb="downloaded template",
                target=os.path.basename(download_url),
                meta={"download_url": download_url, "client_name": client_name}
            )

        # --- 7. Respond with Success/Download URL ---
        return JsonResponse({
            "success": True,
            "message": f"Workbook generated for {client_name}",
            "download_url": download_url
        })

    except Exception as e:
        print(f"[schema_wizard] ❌ Error: {e}")
        return JsonResponse({"error": str(e)}, status=500)

# ==== REST API: UserTableSchema CRUD (multi-table support) ====

def infer_type(col_name):
    if col_name.endswith("_id"):
        return "reference"
    if col_name.endswith("_ids"):
        return "reference-multi"
    if "date" in col_name:
        return "date"
    if "status" in col_name:
        return "choice"
    if "quantity" in col_name or "amount" in col_name or "number" in col_name:
        return "number"
    return "text"

def normalize_columns(columns):
    if not columns:
        return []
    if isinstance(columns[0], dict):
        for col in columns:
            if "type" not in col:
                col["type"] = infer_type(col.get("accessorKey") or col.get("header", ""))
        return columns
    out = []
    for col in columns:
        out.append({
            "accessorKey": col,
            "header": col.replace("_", " ").title(),
            "type": infer_type(col)
        })
    return out

class UserTableSchemasView(CombinedOrgMixin, APIView):
    """Handle CRUD for user table schemas (multi-table, per user)."""
    permission_classes = [IsReadOnlyOrAbove]

    def get(self, request):
        """Get all table schemas for this user."""
        # CombinedOrgMixin automatically filters by org
        schemas = UserTableSchema.objects.filter(user=request.user, org=request.user.org)
        # Normalize every schema's columns
        for schema in schemas:
            schema.columns = normalize_columns(schema.columns)
        serializer = UserTableSchemaSerializer(schemas, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new table schema for this user (unique per table_name)."""
        table_name = request.data.get("table_name")
        columns = request.data.get("columns")

        if not table_name or not columns:
            return Response({"error": "Missing table_name or columns."}, status=400)
        if UserTableSchema.objects.filter(
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        ).exists():
            return Response({"error": "Schema already exists. Use PATCH to update."}, status=409)

        columns = normalize_columns(columns)
        serializer = UserTableSchemaSerializer(data={
            "user": request.user.id,
            "org": request.user.org.id,
            "table_name": table_name,
            "columns": columns,
        })
        if serializer.is_valid():
            serializer.save(user=request.user, org=request.user.org)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class UserTableSchemaDetailView(CombinedOrgMixin, APIView):
    """Handle GET, PATCH, DELETE for a single table schema."""
    permission_classes = [IsReadOnlyOrAbove]

    def get(self, request, table_name):
        schema = get_object_or_404(
            UserTableSchema, 
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        )
        schema.columns = normalize_columns(schema.columns)
        serializer = UserTableSchemaSerializer(schema)
        return Response(serializer.data)

    def patch(self, request, table_name):
        schema = get_object_or_404(
            UserTableSchema, 
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        )
        columns = request.data.get("columns")
        if columns is not None:
            columns = normalize_columns(columns)
            schema.columns = columns
            schema.save()
        serializer = UserTableSchemaSerializer(schema)
        return Response(serializer.data)

    def delete(self, request, table_name):
        schema = get_object_or_404(
            UserTableSchema, 
            user=request.user, 
            org=request.user.org, 
            table_name=table_name
        )
        schema.delete()
        return Response({"success": True})

