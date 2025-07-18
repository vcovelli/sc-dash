import os
import json
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse
from datagrid.views.schema import generate_full_workbook
from datagrid.views.schema import create_table_for_org
from accounts.models import OnboardingProgress, CustomUser
User = CustomUser
from helpers.onboarding_utils import (
    has_uploaded_file,
    has_created_schema,
    has_created_dashboard,
    has_set_alerts,
    has_invited_users,
)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_table_for_org_view(request):
    client_id = request.data.get("client_id")
    selected_features = request.data.get("features")

    if not client_id or not selected_features:
        return Response({"error": "Missing client_id or features."}, status=400)

    if not request.user.business_name:
        request.user.business_name = client_id
        request.user.save()

    try:
        create_table_for_org(client_id)
        download_url = generate_full_workbook(client_id, selected_features)

        return JsonResponse({
            "success": True,
            "message": f"Workbook and table created for {client_id}",
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
    client_id = request.user.username.lower()

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
            request.user.business_name = client_id
            request.user.save()

        create_table_for_org(client_id)
        download_url = generate_full_workbook(client_id, selected_features)

        return JsonResponse({
            "success": True,
            "download_url": download_url,
            "features_inferred": selected_features
        })

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
ONBOARDING_STEP_KEYS = [
    "upload_data",
    "verify_schema",
    "dashboard",
    "alerts",
    "add_users",  # Optional—show conditionally
]

class OnboardingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        completed_keys = []

        if has_uploaded_file(user):
            completed_keys.append("upload_data")

        if has_created_schema(user):
            completed_keys.append("verify_schema")

        if has_created_dashboard(user):
            completed_keys.append("dashboard")

        if has_set_alerts(user):
            completed_keys.append("alerts")

        # Optional: add "add_users" logic if you want to keep it
        if User.objects.filter(business_name=user.business_name).count() > 1:
            completed_keys.append("add_users")

        return Response({"completed_keys": completed_keys})