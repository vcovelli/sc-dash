"""
Enterprise Settings for Multi-Tenant Platform
Separate configuration for enterprise-grade features.
"""
import os
from django.conf import settings

# Database Configuration
MAX_DB_CONNECTIONS_PER_ORG = int(os.getenv('MAX_DB_CONNECTIONS_PER_ORG', '20'))
MIN_DB_CONNECTIONS_PER_ORG = int(os.getenv('MIN_DB_CONNECTIONS_PER_ORG', '2'))
DB_CONNECTION_TIMEOUT = int(os.getenv('DB_CONNECTION_TIMEOUT', '30'))
ENABLE_DB_PERFORMANCE_MONITORING = os.getenv('ENABLE_DB_PERFORMANCE_MONITORING', 'true').lower() == 'true'

# Security Configuration
ENABLE_ENTERPRISE_SECURITY = os.getenv('ENABLE_ENTERPRISE_SECURITY', 'true').lower() == 'true'
ENABLE_AUDIT_LOGGING = os.getenv('ENABLE_AUDIT_LOGGING', 'true').lower() == 'true'
ENABLE_RATE_LIMITING = os.getenv('ENABLE_RATE_LIMITING', 'true').lower() == 'true'

# Rate Limiting (per hour per organization)
RATE_LIMIT_DB_OPERATIONS = int(os.getenv('RATE_LIMIT_DB_OPERATIONS', '1000'))
RATE_LIMIT_API_CALLS = int(os.getenv('RATE_LIMIT_API_CALLS', '10000'))
RATE_LIMIT_FILE_UPLOADS = int(os.getenv('RATE_LIMIT_FILE_UPLOADS', '100'))

# Backup and Maintenance
ENABLE_AUTO_BACKUP = os.getenv('ENABLE_AUTO_BACKUP', 'false').lower() == 'true'
BACKUP_RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', '30'))
BACKUP_SCHEDULE = os.getenv('BACKUP_SCHEDULE', '0 2 * * *')  # Daily at 2 AM

# Monitoring and Alerting
ENABLE_HEALTH_MONITORING = os.getenv('ENABLE_HEALTH_MONITORING', 'true').lower() == 'true'
HEALTH_CHECK_INTERVAL = int(os.getenv('HEALTH_CHECK_INTERVAL', '300'))  # 5 minutes
ALERT_EMAIL_RECIPIENTS = os.getenv('ALERT_EMAIL_RECIPIENTS', '').split(',') if os.getenv('ALERT_EMAIL_RECIPIENTS') else []

# Redis Configuration for Enterprise Caching
REDIS_HOST = os.getenv('REDIS_HOST', 'redis')
REDIS_PORT = int(os.getenv('REDIS_PORT', '6379'))
REDIS_DB = int(os.getenv('REDIS_DB', '0'))
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')

# Enterprise Cache Configuration
if REDIS_HOST:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': REDIS_PASSWORD if REDIS_PASSWORD else None,
                'CONNECTION_POOL_KWARGS': {
                    'max_connections': 50,
                    'retry_on_timeout': True,
                },
            },
            'KEY_PREFIX': 'supplywise',
            'TIMEOUT': 3600,  # 1 hour default
        },
        'sessions': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB + 1}',
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': REDIS_PASSWORD if REDIS_PASSWORD else None,
            },
            'KEY_PREFIX': 'sessions',
            'TIMEOUT': 86400,  # 24 hours
        }
    }
    
    # Use Redis for sessions in enterprise mode
    SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
    SESSION_CACHE_ALIAS = 'sessions'

# Enterprise Database Configuration
ENTERPRISE_DATABASE_CONFIG = {
    'CONN_HEALTH_CHECKS': True,
    'CONN_MAX_AGE': 300,  # 5 minutes
    'ATOMIC_REQUESTS': True,
    'AUTOCOMMIT': True,
    'OPTIONS': {
        'isolation_level': 'read_committed',
        'connect_timeout': 10,
        'statement_timeout': 30000,  # 30 seconds
        'lock_timeout': 10000,       # 10 seconds
        'idle_in_transaction_session_timeout': 60000,  # 1 minute
    }
}

# Enterprise Logging Configuration
ENTERPRISE_LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'enterprise': {
            'format': '[{asctime}] {levelname} {name} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'audit': {
            'format': '[{asctime}] AUDIT {name} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'enterprise_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/enterprise.log',
            'maxBytes': 50 * 1024 * 1024,  # 50MB
            'backupCount': 10,
            'formatter': 'enterprise',
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/audit.log',
            'maxBytes': 100 * 1024 * 1024,  # 100MB
            'backupCount': 20,
            'formatter': 'audit',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/security.log',
            'maxBytes': 50 * 1024 * 1024,  # 50MB
            'backupCount': 10,
            'formatter': 'enterprise',
        },
    },
    'loggers': {
        'config.enterprise_security': {
            'handlers': ['security_file', 'enterprise_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'config.routers': {
            'handlers': ['enterprise_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'config.db_utils': {
            'handlers': ['enterprise_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'enterprise.audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Enterprise Middleware Stack
ENTERPRISE_MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'config.enterprise_security.SecurityMiddleware',  # Enterprise security
    'config.middleware.OrgContextMiddleware',          # Organization context
    'config.middleware.DatabaseHealthCheckMiddleware', # Database health
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Enterprise Security Headers
ENTERPRISE_SECURITY_HEADERS = {
    'SECURE_BROWSER_XSS_FILTER': True,
    'SECURE_CONTENT_TYPE_NOSNIFF': True,
    'SECURE_HSTS_INCLUDE_SUBDOMAINS': True,
    'SECURE_HSTS_PRELOAD': True,
    'SECURE_HSTS_SECONDS': 31536000,  # 1 year
    'SECURE_REFERRER_POLICY': 'strict-origin-when-cross-origin',
    'SECURE_SSL_REDIRECT': not settings.DEBUG,
    'SESSION_COOKIE_SECURE': not settings.DEBUG,
    'CSRF_COOKIE_SECURE': not settings.DEBUG,
    'SESSION_COOKIE_HTTPONLY': True,
    'CSRF_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Lax',
    'CSRF_COOKIE_SAMESITE': 'Lax',
}

# Data Retention Policies
DATA_RETENTION_POLICIES = {
    'audit_logs': 365,      # 1 year
    'user_activity': 180,   # 6 months
    'performance_metrics': 90,  # 3 months
    'backup_files': 30,     # 1 month
    'temp_files': 7,        # 1 week
}

# API Rate Limiting
API_RATE_LIMITING = {
    'enable': ENABLE_RATE_LIMITING,
    'per_user_per_minute': 60,
    'per_org_per_minute': 1000,
    'per_ip_per_minute': 100,
    'burst_allowance': 10,
}

# Enterprise Feature Flags
ENTERPRISE_FEATURES = {
    'advanced_analytics': True,
    'custom_roles': True,
    'audit_logging': ENABLE_AUDIT_LOGGING,
    'data_encryption': True,
    'backup_automation': ENABLE_AUTO_BACKUP,
    'performance_monitoring': ENABLE_DB_PERFORMANCE_MONITORING,
    'health_checks': ENABLE_HEALTH_MONITORING,
    'rate_limiting': ENABLE_RATE_LIMITING,
    'sso_integration': True,
    'api_versioning': True,
}

# Organization Limits
ORGANIZATION_LIMITS = {
    'free': {
        'max_users': 5,
        'max_storage_gb': 1,
        'max_api_calls_per_day': 1000,
        'features': ['basic_analytics', 'standard_support']
    },
    'pro': {
        'max_users': 50,
        'max_storage_gb': 100,
        'max_api_calls_per_day': 50000,
        'features': ['advanced_analytics', 'priority_support', 'custom_dashboards']
    },
    'enterprise': {
        'max_users': -1,  # Unlimited
        'max_storage_gb': -1,  # Unlimited
        'max_api_calls_per_day': -1,  # Unlimited
        'features': ['all_features', 'dedicated_support', 'sla_guarantee']
    }
}