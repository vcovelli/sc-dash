FROM apache/airflow:2.7.3

COPY airflow-requirements.txt /requirements.txt

USER airflow
RUN pip install --no-cache-dir -r /requirements.txt

USER root
COPY airflow_entrypoint.sh /opt/airflow/airflow_entrypoint.sh
RUN chmod +x /opt/airflow/airflow_entrypoint.sh

USER airflow
