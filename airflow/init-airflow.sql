-- Create airflow user if it doesn't exist
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'airflow'
   ) THEN
      CREATE ROLE airflow LOGIN PASSWORD 'airflow';
   END IF;
END
$$;

-- Create airflow DB owned by airflow user
CREATE DATABASE airflow OWNER airflow;