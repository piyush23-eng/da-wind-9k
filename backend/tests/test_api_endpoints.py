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


def test_inverted_dates_returns_400():
    """Verify that start_date > end_date returns HTTP 400 Bad Request."""
    response = client.get("/api/overview?start_date=2026-01-15&end_date=2026-01-10")
    assert response.status_code == 400
    assert "start_date must be less than or equal to end_date" in response.json()["detail"]


def test_generation_timeseries_metadata():
    """Verify that timeseries payload includes enriched decision cutoff and error fields."""
    response = client.get("/api/generation?start_date=2026-01-01&end_date=2026-01-01")
    assert response.status_code == 200
    data = response.json()
    first_item = data["data"][0]
    assert "decisionCutoffTime" in first_item
    assert "absoluteError" in first_item
    assert "percentageError" in first_item


def test_configurable_cashout_price():
    """Verify that custom cashout price scales imbalance exposure dynamically."""
    res_default = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-02&cashout_price=85.0")
    res_custom = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-02&cashout_price=150.0")
    assert res_default.status_code == 200
    assert res_custom.status_code == 200
    m_default = res_default.json()["metrics"]
    m_custom = res_custom.json()["metrics"]
    assert m_default["cashoutBenchmarkGbpPerMWh"] == 85.0
    assert m_custom["cashoutBenchmarkGbpPerMWh"] == 150.0
    assert m_custom["estimatedImbalanceExposureGbp"] > m_default["estimatedImbalanceExposureGbp"]


def test_match_mode_exact_vs_persistence():
    """Verify that exact mode matches 24 SPs/day while persistence matches 48 SPs/day."""
    res_persist = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-01&match_mode=hourly_persistence")
    res_exact = client.get("/api/overview?start_date=2026-01-01&end_date=2026-01-01&match_mode=exact")
    assert res_persist.status_code == 200
    assert res_exact.status_code == 200
    assert res_persist.json()["metrics"]["matchedCount"] == 48
    assert res_exact.json()["metrics"]["matchedCount"] == 24


