FROM apache/airflow:2.7.3

USER root
COPY airflow_entrypoint.sh /opt/airflow/airflow_entrypoint.sh
RUN chmod +x /opt/airflow/airflow_entrypoint.sh

USER airflow
