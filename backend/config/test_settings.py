"""
Minimal Django settings for testing database routing functionality.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "test-secret-key-for-development")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = ["*"]

# Minimal installed apps for testing
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "api",
    "accounts",
]

# Minimal middleware
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "config.middleware.OrgContextMiddleware",  # Our custom middleware
]

ROOT_URLCONF = "config.test_urls"

# Database configuration
if os.getenv('APP_DB_NAME'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('APP_DB_NAME'),
            'USER': os.getenv('APP_DB_USER'),
            'PASSWORD': os.getenv('APP_DB_PASSWORD'),
            'HOST': os.getenv('PG_HOST', 'postgres'),
            'PORT': os.getenv('PG_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'test_db.sqlite3',
        }
    }

# Database routing
DATABASE_ROUTERS = ['config.routers.OrgDatabaseRouter']

# User model
AUTH_USER_MODEL = 'accounts.CustomUser'

# Default auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Minimal logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}