"""
Centralized MinIO client configuration.
This module provides a standardized way to connect to MinIO across the application.
"""
import os
import boto3
from minio import Minio
from django.conf import settings


def get_minio_client():
    """
    Get a configured MinIO client using environment variables.
    
    Returns:
        Minio: Configured MinIO client instance
    """
    endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
    
    return Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
    )


def get_boto3_client():
    """
    Get a configured boto3 S3 client for MinIO.
    
    Returns:
        boto3.client: Configured S3 client for MinIO
    """
    endpoint_url = os.getenv("MINIO_HTTP_ENDPOINT", "http://localhost:9000")
    access_key = os.getenv("MINIO_ROOT_USER", "minioadmin")
    secret_key = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
    
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )


def get_bucket_name():
    """
    Get the configured bucket name.
    
    Returns:
        str: The bucket name to use
    """
    return os.getenv("MINIO_BUCKET_NAME", "uploads")


def ensure_bucket_exists(client, bucket_name):
    """
    Ensure that a bucket exists, create it if it doesn't.
    
    Args:
        client: MinIO or boto3 client
        bucket_name (str): Name of the bucket to ensure exists
    """
    if hasattr(client, 'bucket_exists'):
        # MinIO client
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
    else:
        # boto3 client
        try:
            client.head_bucket(Bucket=bucket_name)
        except client.exceptions.ClientError as e:
            error_code = int(e.response['Error']['Code'])
            if error_code == 404:
                client.create_bucket(Bucket=bucket_name)
            elif error_code != 301 and error_code != 403:
                raise


# Configuration info for debugging
def get_minio_config_info():
    """
    Get current MinIO configuration for debugging.
    
    Returns:
        dict: Configuration information
    """
    return {
        "endpoint": os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        "secure": os.getenv("MINIO_SECURE", "false").lower() == "true",
        "bucket_name": get_bucket_name(),
        "http_endpoint": os.getenv("MINIO_HTTP_ENDPOINT", "http://localhost:9000"),
        "access_key": os.getenv("MINIO_ROOT_USER", "minioadmin"),
        # Don't log the secret key for security
        "secret_key_set": bool(os.getenv("MINIO_ROOT_PASSWORD")),
    }