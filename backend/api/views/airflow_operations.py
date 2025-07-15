from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
import requests
import os
import json
from typing import Dict, Any

class AirflowOperationsView(APIView):
    """
    Enhanced Airflow operations for triggering the new DAGs
    """
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.airflow_base_url = os.getenv('AIRFLOW_API_BASE', 'http://airflow:8080/api/v1')
        self.airflow_user = os.getenv('AIRFLOW_USERNAME', 'airflow')
        self.airflow_password = os.getenv('AIRFLOW_PASSWORD', 'airflow')
        
    def _make_airflow_request(self, method: str, endpoint: str, data: Dict = None) -> requests.Response:
        """Helper method to make authenticated requests to Airflow API"""
        url = f"{self.airflow_base_url}/{endpoint}"
        auth = (self.airflow_user, self.airflow_password)
        headers = {'Content-Type': 'application/json'}
        
        if method.upper() == 'POST':
            return requests.post(url, auth=auth, headers=headers, json=data)
        elif method.upper() == 'GET':
            return requests.get(url, auth=auth, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")

class EnhancedIngestDAGView(AirflowOperationsView):
    """
    Trigger the enhanced organization-aware ingest DAG
    """
    
    def post(self, request):
        """
        Trigger enhanced ingest DAG with organization awareness
        
        Expected payload:
        {
            "org_id": "123",
            "table": "products", 
            "file_id": "file_456",
            "user_id": "user_789"
        }
        """
        try:
            # Validate required fields
            required_fields = ['org_id', 'table', 'file_id']
            for field in required_fields:
                if not request.data.get(field):
                    return Response(
                        {'error': f'Missing required field: {field}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Prepare DAG configuration
            dag_config = {
                'org_id': request.data['org_id'],
                'table': request.data['table'],
                'file_id': request.data['file_id'],
                'user_id': request.data.get('user_id', request.user.id),
                'triggered_by': 'api',
                'triggered_at': request.data.get('triggered_at')
            }
            
            # Trigger the enhanced org-aware ingest DAG
            dag_run_data = {
                'conf': dag_config,
                'dag_run_id': f"api_trigger_{request.data['org_id']}_{request.data['table']}_{request.data['file_id']}"
            }
            
            response = self._make_airflow_request(
                'POST', 
                'dags/enhanced_org_aware_ingest_dag/dagRuns',
                dag_run_data
            )
            
            if response.status_code in [200, 201]:
                return Response({
                    'success': True,
                    'message': 'Enhanced ingest DAG triggered successfully',
                    'dag_run_id': dag_run_data['dag_run_id'],
                    'airflow_response': response.json()
                })
            else:
                return Response({
                    'error': f'Failed to trigger DAG: {response.text}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EnhancedMongoToPostgresDAGView(AirflowOperationsView):
    """
    Trigger the enhanced MongoDB to PostgreSQL DAG
    """
    
    def post(self, request):
        """
        Trigger enhanced MongoDB to PostgreSQL transfer
        
        Expected payload:
        {
            "org_id": "123",
            "table": "products",
            "triggered_by": "ingest_completion"
        }
        """
        try:
            # Prepare DAG configuration  
            dag_config = {
                'org_id': request.data.get('org_id'),
                'table': request.data.get('table'),
                'triggered_by': request.data.get('triggered_by', 'api'),
                'source_task': request.data.get('source_task', 'manual')
            }
            
            # Trigger the enhanced mongo to postgres DAG
            dag_run_data = {
                'conf': dag_config,
                'dag_run_id': f"postgres_load_{dag_config.get('org_id', 'unknown')}_{dag_config.get('table', 'all')}"
            }
            
            response = self._make_airflow_request(
                'POST',
                'dags/enhanced_mongo_to_postgres_dag/dagRuns', 
                dag_run_data
            )
            
            if response.status_code in [200, 201]:
                return Response({
                    'success': True,
                    'message': 'Enhanced MongoDB to PostgreSQL DAG triggered successfully',
                    'dag_run_id': dag_run_data['dag_run_id'],
                    'airflow_response': response.json()
                })
            else:
                return Response({
                    'error': f'Failed to trigger DAG: {response.text}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForecastInventoryDAGView(AirflowOperationsView):
    """
    Trigger the inventory forecasting DAG
    """
    
    def post(self, request):
        """
        Trigger inventory forecasting
        
        Expected payload:
        {
            "client_id": "org_123"
        }
        """
        try:
            client_id = request.data.get('client_id')
            if not client_id:
                return Response(
                    {'error': 'Missing required field: client_id'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Trigger the forecast inventory DAG
            dag_run_data = {
                'conf': {'client_id': client_id},
                'dag_run_id': f"forecast_{client_id}"
            }
            
            response = self._make_airflow_request(
                'POST',
                'dags/forecast_inventory_dag/dagRuns',
                dag_run_data
            )
            
            if response.status_code in [200, 201]:
                return Response({
                    'success': True,
                    'message': 'Inventory forecasting DAG triggered successfully',
                    'dag_run_id': dag_run_data['dag_run_id'],
                    'airflow_response': response.json()
                })
            else:
                return Response({
                    'error': f'Failed to trigger DAG: {response.text}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DAGStatusView(AirflowOperationsView):
    """
    Get status of DAG runs
    """
    
    def get(self, request, dag_id=None, dag_run_id=None):
        """
        Get status of specific DAG run or all runs for a DAG
        """
        try:
            if dag_run_id:
                # Get specific DAG run status
                endpoint = f"dags/{dag_id}/dagRuns/{dag_run_id}"
            else:
                # Get all DAG runs for the DAG
                endpoint = f"dags/{dag_id}/dagRuns"
                
            response = self._make_airflow_request('GET', endpoint)
            
            if response.status_code == 200:
                return Response({
                    'success': True,
                    'data': response.json()
                })
            else:
                return Response({
                    'error': f'Failed to get DAG status: {response.text}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PipelineStatusView(APIView):
    """
    Get comprehensive pipeline status for an organization
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get pipeline status for user's organization
        """
        try:
            org_id = request.user.org.id if request.user.org else None
            if not org_id:
                return Response({
                    'error': 'User not associated with an organization'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # This would integrate with the data_pipeline_manager.py script
            # For now, return a basic status structure
            
            return Response({
                'success': True,
                'org_id': org_id,
                'pipelines': {
                    'ingest': {
                        'dag_id': 'enhanced_org_aware_ingest_dag',
                        'status': 'available',
                        'last_run': None
                    },
                    'mongo_to_postgres': {
                        'dag_id': 'enhanced_mongo_to_postgres_dag', 
                        'status': 'available',
                        'last_run': None
                    },
                    'forecasting': {
                        'dag_id': 'forecast_inventory_dag',
                        'status': 'available', 
                        'last_run': None
                    }
                }
            })
            
        except Exception as e:
            return Response({
                'error': f'Internal error: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)