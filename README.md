# Supply Chain Dashboard

A full-stack supply chain analytics platform designed to simulate real-world data workflows. This system ingests raw CSV data, stores it in MongoDB, transforms it into structured formats using Apache Airflow, and loads the processed data into PostgreSQL. The data is then exposed via a Django REST API for analytics and integration with external systems.

---

## Overview

This project simulates an end-to-end supply chain data pipeline:
- **Data Ingestion:** CSV datasets are imported into MongoDB.
- **Data Transformation:** Apache Airflow DAGs clean and normalize data.
- **Data Storage:** Normalized data is stored in PostgreSQL.
- **API Exposure:** A Django REST API exposes endpoints for dashboards and external apps.

---

## Airflow DAGs Overview

- `ingest_csv_to_mongo_dag`: Manually imports a specific CSV file into MongoDB.
- `transform_mongo_to_postgres_dag`: Transforms raw MongoDB data and loads it into PostgreSQL.
- `watch_and_ingest_to_mongodb.py`: (Standalone script) Watches `datasets/` for new CSV files and auto-loads them into MongoDB.

---

## Architecture

1. **Raw Data Ingestion:**
   - `watch_and_ingest_to_mongodb.py` watches the datasets/ folder and loads raw data into MongoDB.

   - `ingest_csv_to_mongo_dag` is for manual/scheduled ingestion from a known CSV path.
2. **Apache Airflow DAG:**
   - `ingest_csv_to_mongo_dag` loads raw data into MongoDB.
   - `transform_mongo_to_postgres_dag` transforms and loads structured data into PostgreSQL.
   - Additional DAGs can be added for automation and monitoring.
3. **Data Storage:**
   - **MongoDB:** stores raw CSV records.
   - **PostgreSQL:** stores cleaned and normalized records.
4. **Django API:**
   - Django + Django REST Framework serve the processed data securely.

---

## Technologies Used

- **Python 3.10+** 
- **Pandas** (for cleaning and transforming CSV data)
- **Watchdog** (for real-time file ingestion)
- **Apache Airflow** (for DAG-based automating of ingestion and transformation)
- **SQLAlchemy** (used for PostgreSQL ingestion via Pandas)
- **MongoDB** (NoSQL DB for raw data)
- **PostgreSQL** (Relational DB for structured data)
- **Docker & Docker Compose** (Containerization & Orchestration)
- **Django** + **Django REST Framework** (for RESTful APIs)

---

## Project Setup

### Prerequisites

- Python 3.10+
- Docker & Docker Compose

### Local Setup

**Clone & Install**
```
git clone https://github.com/vcovelli/supply-chain-dashboard.git
```
**Navigate to Project Directory**
```
cd ~/supply-chain-dashboard
```
**Activate Virtual Environment***
```
source backend_env/bin/activate
```
**Run Setup Script***
```
./scripts/linux/setup.sh
```
**Start All Services***
```
./scripts/linux/start.sh
```
**Stop All Services***
```
./scripts/linux/stop.sh
```
---

## Data Flow
1. **Drop a CSV:** 
    - Place your CSV file into the datasets/ folder.

2. **Ingestion to MongoDB:**
    - CSVs are either watched and loaded automatically via a watchdog script, or manually ingested using an Airflow DAG (`ingest_csv_to_mongo_dag`).

3. **Transformation:**
   - Another DAG transforms the raw data and inserts it into PostgreSQL.

4. **API Access:** 
    - Data is accessible via authenticated Django REST endpoints.

---

## API Features
- **Authenticated Login:** Secure access for users.

- **Search & Filter:** Endpoints for querying orders, products, inventory, warehouses, shipments, and suppliers.

---

## Future Enhancements
- Add a React + Chart.js frontend for interactive dashboards.

- Implement role-based access control (admin, analyst, viewer).

- Integrate a machine learning model for demand forecasting.

- Enable real-time updates using WebSockets or polling.

---