from pathlib import Path
import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
SITE_ID = 2
APPEND_SLASH = False
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.github",
    "allauth.socialaccount.providers.apple",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "django_filters",
    "django_extensions",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "api",
    "accounts",
    "ai",
    "analytics",
    "datagrid",
    "files",
    "helpers",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",
    "config.middleware.OrgContextMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

AUTH_USER_MODEL = 'accounts.CustomUser'
LOGIN_REDIRECT_URL = "/dashboard/"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_EMAIL_VERIFICATION = "mandatory"

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.getenv("GOOGLE_CLIENT_ID"),
            'secret': os.getenv("GOOGLE_CLIENT_SECRET"),
            'key': ''
        },
        'OAUTH_PKCE_ENABLED': True,
    },
    'github': {
        'APP': {
            'client_id': os.getenv("GITHUB_CLIENT_ID"),
            'secret': os.getenv("GITHUB_CLIENT_SECRET"),
            'key': ''
        },
        'SCOPE': ['user:email'],
        'FIELDS': ['email', 'name'],
    }
}

REST_USE_JWT = True
DJANGO_REST_AUTH_SERIALIZERS = {
    'TOKEN_SERIALIZER': 'dj_rest_auth.jwt_auth.JWTCookieSerializer',
}
TOKEN_MODEL = None

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=5),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

APP_DB_USER = os.getenv("APP_DB_USER", "app_user")
APP_DB_PASSWORD = os.getenv("APP_DB_PASSWORD", "app_pass")
PG_HOST = os.getenv("PG_HOST", "postgres")
PG_PORT = os.getenv("PG_PORT", "5432")

if os.getenv("APP_DB_NAME"):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('APP_DB_NAME'),
            'USER': APP_DB_USER,
            'PASSWORD': APP_DB_PASSWORD,
            'HOST': PG_HOST,
            'PORT': PG_PORT,
        }
    }

    if os.getenv("INCLUDE_ORGDATA_1", "false").lower() == "true":
        DATABASES["orgdata_1"] = {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": "orgdata_1",
            "USER": APP_DB_USER,
            "PASSWORD": APP_DB_PASSWORD,
            "HOST": PG_HOST,
            "PORT": PG_PORT,
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

DATABASE_ROUTERS = ['config.routers.OrgDatabaseRouter']

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")

CORS_ALLOWED_ORIGINS = [
    "https://supplywise.ai",
    "http://localhost:3000",
    "http://192.168.1.42:3000",
]
CSRF_TRUSTED_ORIGINS = [
    "https://supplywise.ai",
    "http://supplywise.ai",
    "http://localhost:3000",
    "http://192.168.1.42:3000"
]
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_DOMAIN = ".supplywise.ai"
SESSION_COOKIE_DOMAIN = ".supplywise.ai"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": "logs/uploads.log",
            "formatter": "verbose",
        },
        "db_router_file": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.FileHandler",
            "filename": "logs/database_routing.log",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
        "api.upload": {
            "handlers": ["file"],
            "level": "INFO",
            "propagate": False,
        },
        "config.routers": {
            "handlers": ["console", "db_router_file"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        "config.middleware": {
            "handlers": ["console", "db_router_file"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}

CSV_FILE_PATH = os.getenv('CSV_FILE_PATH', str(BASE_DIR / "datasets" / "sample_orders.csv"))
DATASET_DIR = os.getenv('DATASET_DIR', str(BASE_DIR / "datasets"))
ARCHIVE_DIR = os.getenv('ARCHIVE_DIR', str(BASE_DIR / "datasets" / "archive"))
SCHEMA_DIR = Path(os.getenv('SCHEMA_DIR', BASE_DIR / "user_schemas"))

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER")
MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME")

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

if os.getenv("INCLUDE_ORG_DATABASES", "false").lower() == "true":
    from django.core.exceptions import ImproperlyConfigured
    try:
        import psycopg2
        import psycopg2.extras

        conn = psycopg2.connect(
            dbname=os.getenv("APP_DB_NAME"),
            user=APP_DB_USER,
            password=APP_DB_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id FROM accounts_organization")
        org_ids = [row["id"] for row in cursor.fetchall()]
        cursor.close()
        conn.close()

        for org_id in org_ids:
            alias = f"orgdata_{org_id}"
            DATABASES[alias] = {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": alias,
                "USER": APP_DB_USER,
                "PASSWORD": APP_DB_PASSWORD,
                "HOST": PG_HOST,
                "PORT": PG_PORT,
            }
    except Exception as e:
        raise ImproperlyConfigured(f"Could not dynamically configure org databases: {e}")
