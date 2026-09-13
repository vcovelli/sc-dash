# Local configuration

Copy `.env.example` to `.env` and set the database, OAuth and service values for your deployment. Runtime `.env` files are ignored by Git.

Generate separate Airflow internal API, webserver and administrator values with `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`. Set `AIRFLOW__CORE__INTERNAL_API_SECRET_KEY`, `AIRFLOW__WEBSERVER__SECRET_KEY` and `AIRFLOW_ADMIN_PASSWORD` in `.env`. The webserver and scheduler must use the same internal API and webserver keys. Restart both components together after changing those keys.

Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to the comma-separated browser origins allowed for your deployment. Configure OAuth credentials in the provider's console and keep the values in `.env`.
