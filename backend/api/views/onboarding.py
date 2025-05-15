from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import logging
from backend_scripts.forecasting.create_forecast_table import create_forecast_table

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_table_for_client(request):
    try:
        client_name = request.data.get('client_name')
        if not client_name:
            return Response({'error': 'Missing client_name'}, status=status.HTTP_400_BAD_REQUEST)

        create_forecast_table(client_name)
        return Response({'message': f'Table for {client_name} created.'}, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.exception("Error creating forecast table")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
