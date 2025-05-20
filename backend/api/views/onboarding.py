import os
import json
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import JsonResponse
from api.views.schema_wizard import generate_full_workbook
from api.views.table_creation import create_table_for_client

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_table_for_client_view(request):
    client_name = request.data.get("client_name")
    selected_features = request.data.get("features")

    if not client_name or not selected_features:
        return Response({"error": "Missing client_name or features."}, status=400)

    if not request.user.business_name:
        request.user.business_name = client_name
        request.user.save()

    try:
        create_table_for_client(client_name)
        download_url = generate_full_workbook(client_name, selected_features)

        return JsonResponse({
            "success": True,
            "message": f"Workbook and table created for {client_name}",
            "download_url": download_url
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def map_schema_and_create(request):
    csv_file = request.FILES.get('file')
    mapping_json = request.POST.get('mapping')
    client_name = request.user.username.lower()

    if not csv_file or not mapping_json:
        return Response({"error": "File and mapping required."}, status=400)

    try:
        mapping = json.loads(mapping_json)
        mapped_fields = list(mapping.values())

        feature_fields = {
            "orders": ["order_id", "order_date", "quantity", "total_price"],
            "products": ["product_id", "product_name", "unit_price", "product_category"],
            "customers": ["customer_id", "customer_name"],
            "suppliers": ["supplier_id", "supplier_name"],
            "warehouses": ["warehouse_id", "warehouse_location"],
            "shipments": ["shipment_id", "shipment_method", "shipment_status", "tracking_number"]
        }

        selected_features = [
            feature for feature, fields in feature_fields.items()
            if any(field in mapped_fields for field in fields)
        ]

        if not selected_features:
            return Response({"error": "Could not infer any valid features from mapping."}, status=400)

        if not request.user.business_name:
            request.user.business_name = client_name
            request.user.save()

        create_table_for_client(client_name)
        download_url = generate_full_workbook(client_name, selected_features)

        return JsonResponse({
            "success": True,
            "download_url": download_url,
            "features_inferred": selected_features
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)