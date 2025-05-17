import os
import json
import tempfile
import csv
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.http import JsonResponse
from api.views.schema_wizard import save_schema_config, generate_template_xlsx, trigger_table_creation

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def map_schema_and_create(request):
    csv_file = request.FILES.get('file')
    mapping_json = request.POST.get('mapping')
    user_id = request.user.username  # or use a client_name input

    if not csv_file or not mapping_json:
        return Response({"error": "File and mapping required."}, status=400)

    try:
        mapping = json.loads(mapping_json)
        selected_columns = [{"column_name": v, "data_type": infer_postgres_type(v)} for k, v in mapping.items() if v]

        save_schema_config(user_id, selected_columns)
        trigger_table_creation(user_id)
        generate_template_xlsx(user_id)

        download_url = f"/static/templates/{user_id}_data_template.xlsx"
        return JsonResponse({"success": True, "download_url": download_url})

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
def create_table_for_client(request):
    client_name = request.data.get("client_name")
    if not client_name:
        return Response({"error": "Missing client_name"}, status=status.HTTP_400_BAD_REQUEST)

    # TODO: Actually invoke schema_wizard logic
    print(f"[onboarding] Creating table for client: {client_name}")
    return Response({"message": f"Table created for {client_name}"}, status=status.HTTP_201_CREATED)