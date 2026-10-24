"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "WindScope API" in data["service"]


def test_overview_endpoint():
    response = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-05&cutoff_time=17:00:00")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "deliveryPeriod" in data
    assert data["metrics"]["matchedCount"] > 0
    assert data["metrics"]["mae"] >= 0
    assert data["metrics"]["rmse"] >= data["metrics"]["mae"]  # Mathematically RMSE >= MAE


def test_generation_timeseries():
    response = client.get("/api/generation?start_date=2026-01-01&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert data["units"] == "MW"
    assert len(data["data"]) == 96  # 2 days * 48 intervals = 96


def test_intervals_pagination():
    response = client.get("/api/intervals?start_date=2026-01-01&end_date=2026-01-02&page=1&page_size=20")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["pageSize"] == 20
    assert len(data["items"]) == 20
