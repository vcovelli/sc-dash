# Supply Chain Dashboard

A full-stack supply chain analytics platform built to ingest raw CSV data, transform it, and provide actionable insights via APIs. This system uses MongoDB for raw data storage, Apache Airflow for orchestration, and PostgreSQL for structured, analytics-ready querying.

---

## Overview

This project simulates a real-world supply chain data pipeline:
- **Data Ingestion:** CSV datasets are imported into MongoDB.
- **Data Transformation:** Apache Airflow DAGs clean and normalize data.
- **Data Storage:** Normalized data is stored in PostgreSQL.
- **API Exposure:** A Django REST API exposes endpoints for dashboards and external apps.

---

## Architecture

1. **Raw Data Ingestion:**
   - CSV files are placed into a monitored folder.
2. **Apache Airflow DAG:**
   - Detects new CSV files.
   - Loads data into MongoDB.
   - Transforms data and pushes structured records to PostgreSQL.
3. **Data Storage:**
   - **MongoDB:** Holds raw CSV data.
   - **PostgreSQL:** Stores the cleaned, normalized data.
4. **Django API:**
   - Provides authenticated endpoints for accessing supply chain data.

---

## Technologies Used

- **Python** + **Pandas**
- **Apache Airflow**
- **MongoDB**
- **PostgreSQL**
- **Docker & Docker Compose**
- **Django** + **Django REST Framework**

---

## Setup

### Prerequisites

- Python 3.10+
- Docker & Docker Compose

### Clone and Install

```
git clone https://github.com/yourusername/supply-chain-dashboard.git
cd supply-chain-dashboard
```
---

## Data Flow
1. **Drop a CSV:** 
    - Place your CSV file into the datasets/ folder.

2. **Airflow Processing:** 
    - Airflow detects the file, loads raw data into MongoDB, cleans it, and pushes the structured data to PostgreSQL.

3. **API Access:** 
    - Use the Django API to search, filter, and view the supply chain data.

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