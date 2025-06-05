# Causana

Causana is a modular, end-to-end system designed to analyze multivariate time series data and uncover temporal causal relationships. It enables users to submit datasets, perform causal inference, and visualize directed acyclic graphs (DAGs) that represent causal links across variables and time lags.

## Project Structure

The MVP implementation consists of three main components, each running as an independent service:

### 1. Spring Boot API Gateway
Handles HTTP requests from the frontend or API clients. Receives uploaded files and job configuration, then forwards requests to the Go-based job runner.

Port: 8080
Endpoint: `POST /submit-job`
Fields: `file`, `method`, `lags`, `window`

### 2. Go Job Runner
Receives requests from the Spring Boot gateway, forwards the files and parameters to the Python causal engine, and returns the result to the gateway.

Port: 8081
Endpoint: `POST /run-job`

### 3. Python Causal Inference Engine
Implements basic Granger causality to compute causal relationships. Accepts CSV data and job parameters, processes the dataset, and returns a list of nodes and directed edges with associated weights and lags.

Port: 8000
Endpoint: `POST /granger`

## Features

File upload and job submission via HTTP (Postman or frontend)
Asynchronous processing pipeline from Java to Go to Python
Causal graph output as a list of nodes and weighted edges
Basic Granger causality logic for MVP
Configurable lag and window parameters

## Requirements

Java 17+
Go 1.20+
Python 3.9+
pip packages: `pandas`, `numpy`, `statsmodels`, `fastapi`, `uvicorn`

## Local Development Setup

Start all three services from their respective root directories.

### 1. Start Python Causal Engine
```bash
uvicorn main:app --host 127.0.0.1 --port 8000

### 2. Start Go Runner
```bash
go run main.go

### 3. Start SpringBoot Gateway
./mvnw spring-boot:run

## Testing the Pipeline
Use Postman to send a multipart/form-data request to:
```bash
POST http://localhost:8080/submit-job

Form fields:

file: CSV file (max 1 MB for now)

method: granger

lags: integer value (e.g., 2)

window: integer value (e.g., 50)

Successful responses will return a JSON object:
```json
{
  "nodes": ["X1", "X2", "X3"],
  "edges": [
    {"source": "X1", "target": "X2", "weight": 0.84, "lag": 1}
  ]
}

## Notes
Larger CSV files may trigger size restrictions unless configured.

The current MVP uses mock edge generation for some files. A future update will integrate full statistical computation.

The frontend is under development and will include interactive DAG visualizations.