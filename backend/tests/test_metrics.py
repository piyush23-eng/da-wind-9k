"""Tests for quantitative accuracy metrics (MAE, RMSE, Bias, Coverage, Distributions).

Includes hand-calculated benchmark tests to prove numerical correctness.
"""

import pytest
import math
from app.analytics.metrics import compute_accuracy_metrics, compute_daily_breakdown, compute_error_histogram


def test_hand_calculated_accuracy_metrics():
    """Verify metrics against exact hand-calculated figures:

    Interval 1: Actual = 1000 MW, Forecast = 1200 MW -> Error = +200 MW
    Interval 2: Actual = 1500 MW, Forecast = 1400 MW -> Error = -100 MW
    Interval 3: Actual = 2000 MW, Forecast = 2150 MW -> Error = +150 MW

    MAE = (200 + 100 + 150) / 3 = 450 / 3 = 150.00 MW
    RMSE = sqrt((40000 + 10000 + 22500) / 3) = sqrt(72500 / 3) = sqrt(24166.6667) ~ 155.46 MW
    Mean Error (Bias) = (200 - 100 + 150) / 3 = 250 / 3 ~ +83.33 MW
    Overforecast Count = 2
    Underforecast Count = 1
    """
    sample_intervals = [
        {"startTime": "2026-01-01T00:00:00Z", "isMatched": True, "actualGeneration": 1000.0, "forecastGeneration": 1200.0, "error": 200.0},
        {"startTime": "2026-01-01T00:30:00Z", "isMatched": True, "actualGeneration": 1500.0, "forecastGeneration": 1400.0, "error": -100.0},
        {"startTime": "2026-01-01T01:00:00Z", "isMatched": True, "actualGeneration": 2000.0, "forecastGeneration": 2150.0, "error": 150.0},
        # One unmatched interval (e.g. missing forecast)
        {"startTime": "2026-01-01T01:30:00Z", "isMatched": False, "actualGeneration": 1800.0, "forecastGeneration": None, "error": None},
    ]

    metrics = compute_accuracy_metrics(sample_intervals, total_target_intervals=4)

    assert metrics["matchedCount"] == 3
    assert metrics["totalTargetIntervals"] == 4
    assert metrics["unmatchedCount"] == 1
    assert metrics["coverageRate"] == 75.0  # 3 / 4 * 100%

    # Hand-verified numerical assertions
    assert metrics["mae"] == 150.0
    assert metrics["rmse"] == 155.46
    assert metrics["meanError"] == 83.33

    # Directional counts
    assert metrics["overforecastCount"] == 2
    assert metrics["underforecastCount"] == 1
    assert metrics["exactMatchCount"] == 0
    assert metrics["maxOverforecast"] == 200.0
    assert metrics["maxUnderforecast"] == -100.0


def test_empty_or_all_unmatched_metrics():
    """Verify graceful handling when no matched records exist."""
    unmatched_intervals = [
        {"startTime": "2026-01-01T00:00:00Z", "isMatched": False, "error": None},
        {"startTime": "2026-01-01T00:30:00Z", "isMatched": False, "error": None},
    ]
    metrics = compute_accuracy_metrics(unmatched_intervals, total_target_intervals=2)
    assert metrics["matchedCount"] == 0
    assert metrics["totalTargetIntervals"] == 2
    assert metrics["mae"] == 0.0
    assert metrics["rmse"] == 0.0
    assert metrics["meanError"] == 0.0
    assert metrics["coverageRate"] == 0.0


def test_daily_breakdown_and_energy_units():
    """Verify daily aggregation and GWh conversion (MW * 0.5 hours / 1000)."""
    intervals = [
        # Day 1: two 30-min intervals of 2000 MW actual = 2000 * 0.5 + 2000 * 0.5 = 2000 MWh = 2.0 GWh
        {
            "deliveryDate": "2026-01-01",
            "isMatched": True,
            "actualGeneration": 2000.0,
            "forecastGeneration": 2200.0,
            "error": 200.0
        },
        {
            "deliveryDate": "2026-01-01",
            "isMatched": True,
            "actualGeneration": 2000.0,
            "forecastGeneration": 2100.0,
            "error": 100.0
        },
    ]
    daily = compute_daily_breakdown(intervals)
    assert len(daily) == 1
    d1 = daily[0]
    assert d1["date"] == "2026-01-01"
    assert d1["matchedCount"] == 2
    assert d1["mae"] == 150.0  # (200 + 100) / 2
    assert d1["actualEnergyGWh"] == 2.0  # 4000 MW * 0.5h / 1000 = 2.0 GWh
    assert d1["forecastEnergyGWh"] == 2.15  # 4300 MW * 0.5h / 1000 = 2.15 GWh
