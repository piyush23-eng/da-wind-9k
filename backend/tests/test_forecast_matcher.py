"""Tests for forecast matching logic, cutoff enforcement, and lookahead bias prevention."""

import pytest
from app.services.forecast_matcher import match_actuals_and_forecasts


def test_forecast_cutoff_selection_and_rejection():
    """Verify that:

    1. Forecast published before cutoff on D-1 is accepted.
    2. The latest forecast before cutoff is chosen when multiple exist.
    3. Forecast published after cutoff on D-1 is rejected.
    """
    # Target delivery: 2026-01-05T12:00:00Z (Day D = 2026-01-05)
    # Cutoff at 17:00 UTC means cutoff is 2026-01-04T17:00:00Z
    target_time = "2026-01-05T12:00:00Z"

    actuals = [
        {
            "startTime": target_time,
            "settlementDate": "2026-01-05",
            "settlementPeriod": 25,
            "fuelType": "WIND",
            "generation": 5000.0,
            "publishTime": "2026-01-05T12:30:00Z"
        }
    ]

    forecasts = [
        # Candidate 1: Published D-2 (too early, but valid)
        {"startTime": target_time, "publishTime": "2026-01-03T18:00:00Z", "generation": 4000.0},
        # Candidate 2: Published D-1 at 12:00 (Eligible, earlier than cutoff)
        {"startTime": target_time, "publishTime": "2026-01-04T12:00:00Z", "generation": 4500.0},
        # Candidate 3: Published D-1 at 16:30 (Eligible, latest before 17:00 cutoff -> MUST BE CHOSEN!)
        {"startTime": target_time, "publishTime": "2026-01-04T16:30:00Z", "generation": 4800.0},
        # Candidate 4: Published D-1 at 18:00 (AFTER 17:00 cutoff -> MUST BE REJECTED to prevent look-ahead bias)
        {"startTime": target_time, "publishTime": "2026-01-04T18:00:00Z", "generation": 5100.0},
        # Candidate 5: Published Day D morning at 06:00 (Intra-day -> MUST BE REJECTED)
        {"startTime": target_time, "publishTime": "2026-01-05T06:00:00Z", "generation": 4950.0},
    ]

    matched, audit = match_actuals_and_forecasts(
        actuals_records=actuals,
        forecast_records=forecasts,
        cutoff_time_str="17:00:00",
        start_date="2026-01-05",
        end_date="2026-01-05"
    )

    # Find the target interval
    target_iv = next(iv for iv in matched if iv["startTime"] == target_time)

    assert target_iv["isMatched"] is True
    # Verify the selected forecast is Candidate 3 (4800 MW), NOT the post-cutoff Candidate 4 (5100) or Candidate 5 (4950)
    assert target_iv["forecastGeneration"] == 4800.0
    assert target_iv["forecastPublishTime"] == "2026-01-04T16:30:00Z"
    assert target_iv["actualGeneration"] == 5000.0
    # Error = Forecast - Actual = 4800 - 5000 = -200 MW (Underforecast)
    assert target_iv["error"] == -200.0
    assert target_iv["absoluteError"] == 200.0


def test_missing_forecast_leaves_interval_unmatched():
    """If all available forecasts are published AFTER cutoff, interval must be unmatched."""
    target_time = "2026-01-05T10:00:00Z"
    actuals = [
        {"startTime": target_time, "fuelType": "WIND", "generation": 3000.0}
    ]
    # Forecast published after 17:00 cutoff
    forecasts = [
        {"startTime": target_time, "publishTime": "2026-01-04T19:00:00Z", "generation": 3200.0}
    ]

    matched, audit = match_actuals_and_forecasts(
        actuals_records=actuals,
        forecast_records=forecasts,
        cutoff_time_str="17:00:00",
        start_date="2026-01-05",
        end_date="2026-01-05"
    )

    target_iv = next(iv for iv in matched if iv["startTime"] == target_time)
    assert target_iv["isMatched"] is False
    assert target_iv["missingReason"] == "missing_forecast_before_cutoff"
    assert target_iv["forecastGeneration"] is None


def test_duplicate_handling_and_fuel_type_filter():
    """Verify deduplication and that non-WIND actual generation is excluded."""
    target_time = "2026-01-02T00:00:00Z"
    actuals = [
        # Coal record for same startTime should be ignored
        {"startTime": target_time, "fuelType": "COAL", "generation": 800.0},
        # WIND record 1
        {"startTime": target_time, "fuelType": "WIND", "generation": 2500.0, "publishTime": "2026-01-02T00:30:00Z"},
        # Duplicate WIND record with newer publishTime should prevail
        {"startTime": target_time, "fuelType": "WIND", "generation": 2600.0, "publishTime": "2026-01-02T01:00:00Z"},
    ]
    forecasts = [
        {"startTime": target_time, "publishTime": "2026-01-01T14:00:00Z", "generation": 2700.0},
        # Duplicate forecast record
        {"startTime": target_time, "publishTime": "2026-01-01T14:00:00Z", "generation": 2700.0},
    ]

    matched, audit = match_actuals_and_forecasts(
        actuals_records=actuals,
        forecast_records=forecasts,
        cutoff_time_str="17:00:00",
        start_date="2026-01-02",
        end_date="2026-01-02"
    )

    target_iv = next(iv for iv in matched if iv["startTime"] == target_time)
    assert target_iv["isMatched"] is True
    assert target_iv["actualGeneration"] == 2600.0
    assert target_iv["forecastGeneration"] == 2700.0
    assert target_iv["error"] == 100.0  # Overforecast by 100 MW
