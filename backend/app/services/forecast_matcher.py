"""Forecast Matcher Service for Day-Ahead Power Procurement.

Business Context:
UK electricity wholesale market day-ahead auctions require energy traders to commit
to procurement volumes on Day D-1 before a market gate closure / decision cutoff
(e.g., 11:00, 12:00, 14:00, 17:00, or 23:00 UTC).

Resolution & Matching Modes:
- Elexon FUELHH provides half-hourly outturn generation (30-minute intervals).
- Elexon WINDFOR provides hourly target wind forecasts (:00 of each hour).
- Matching Modes:
    1. 'hourly_persistence' (Default): Applies the hourly WINDFOR forecast across both
       30-minute settlement periods of that hour (SPs 2k-1 and 2k), reflecting standard
       utility scheduling. Yields ~100% January coverage.
    2. 'exact': Strictly requires exact timestamp matching (matching the 24 top-of-hour
       settlement periods per day, yielding 50% coverage).
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np


def parse_iso_datetime(dt_str: str) -> datetime:
    """Parse ISO 8601 datetime strings to UTC datetime."""
    if dt_str.endswith("Z"):
        dt_str = dt_str[:-1] + "+00:00"
    return datetime.fromisoformat(dt_str).astimezone(timezone.utc)


def format_iso_utc(dt: datetime) -> str:
    """Format UTC datetime into ISO 8601 string with 'Z' suffix."""
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def match_actuals_and_forecasts(
    actuals_records: List[Dict[str, Any]],
    forecast_records: List[Dict[str, Any]],
    cutoff_time_str: str = "17:00:00",
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    match_mode: str = "hourly_persistence",
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Match actual wind generation with the latest forecast published before cutoff.

    Args:
        actuals_records: Raw FUELHH records (fuelType='WIND')
        forecast_records: Raw WINDFOR records
        cutoff_time_str: Time of day on D-1 for decision cutoff (e.g. '12:00:00', '17:00:00')
        start_date: Delivery period start YYYY-MM-DD
        end_date: Delivery period end YYYY-MM-DD
        match_mode: 'hourly_persistence' (covers both half-hours) or 'exact'

    Returns:
        matched_intervals: List of interval dicts with comparison metrics
        audit_summary: Diagnostic stats on filtering and matching
    """
    cutoff_hour, cutoff_minute, cutoff_second = map(int, cutoff_time_str.split(":"))

    df_actuals = pd.DataFrame(actuals_records)
    df_forecasts = pd.DataFrame(forecast_records)

    raw_actuals_count = len(df_actuals)
    raw_forecasts_count = len(df_forecasts)

    # 1. Clean actuals
    if df_actuals.empty:
        df_actuals = pd.DataFrame(columns=["startTime", "generation", "settlementDate", "settlementPeriod", "fuelType"])
    else:
        if "fuelType" in df_actuals.columns:
            df_actuals = df_actuals[df_actuals["fuelType"] == "WIND"].copy()
        if "publishTime" in df_actuals.columns:
            df_actuals = df_actuals.sort_values(by="publishTime", ascending=False).drop_duplicates(subset=["startTime"])
        else:
            df_actuals = df_actuals.drop_duplicates(subset=["startTime"])

    # 2. Clean forecasts
    if df_forecasts.empty:
        df_forecasts = pd.DataFrame(columns=["startTime", "publishTime", "generation"])
    else:
        df_forecasts = df_forecasts.dropna(subset=["startTime", "publishTime", "generation"]).copy()
        df_forecasts = df_forecasts.drop_duplicates(subset=["startTime", "publishTime"])

    # 3. Create canonical 30-minute interval grid for the delivery range
    start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    end_dt = (datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)).replace(tzinfo=timezone.utc)
    
    interval_grid = pd.date_range(start=start_dt, end=end_dt - timedelta(minutes=30), freq="30min", tz="UTC")
    
    # 4. Index forecasts by target startTime
    forecast_by_target: Dict[str, List[Tuple[datetime, float]]] = {}
    if not df_forecasts.empty:
        for _, row in df_forecasts.iterrows():
            target_st = row["startTime"]
            try:
                pub_dt = parse_iso_datetime(row["publishTime"])
                gen = float(row["generation"])
                if target_st not in forecast_by_target:
                    forecast_by_target[target_st] = []
                forecast_by_target[target_st].append((pub_dt, gen))
            except Exception:
                continue

    # Actuals mapping by startTime
    actuals_by_target: Dict[str, Dict[str, Any]] = {}
    if not df_actuals.empty:
        for _, row in df_actuals.iterrows():
            target_st = row["startTime"]
            actuals_by_target[target_st] = {
                "generation": float(row["generation"]) if pd.notnull(row["generation"]) else None,
                "settlementDate": str(row.get("settlementDate", "")),
                "settlementPeriod": int(row.get("settlementPeriod", 0)) if pd.notnull(row.get("settlementPeriod")) else None,
            }

    matched_intervals = []
    matched_count = 0
    missing_forecast_count = 0
    missing_actual_count = 0

    for iv in interval_grid:
        st_iso = format_iso_utc(iv)
        delivery_date = iv.strftime("%Y-%m-%d")
        
        # Calculate Settlement Period (1 to 48 for standard 24h day)
        minute_of_day = iv.hour * 60 + iv.minute
        settlement_period = (minute_of_day // 30) + 1

        # Decision cutoff is on Day D - 1 at specified cutoff time
        delivery_d = iv.date()
        cutoff_d = delivery_d - timedelta(days=1)
        cutoff_dt = datetime(
            cutoff_d.year, cutoff_d.month, cutoff_d.day,
            cutoff_hour, cutoff_minute, cutoff_second,
            tzinfo=timezone.utc
        )
        cutoff_iso = format_iso_utc(cutoff_dt)

        # Actual lookup
        actual_info = actuals_by_target.get(st_iso)
        actual_gen = actual_info["generation"] if actual_info else None
        if actual_info and actual_info.get("settlementPeriod"):
            settlement_period = actual_info["settlementPeriod"]
        if actual_info and actual_info.get("settlementDate"):
            delivery_date = actual_info["settlementDate"]

        # Forecast lookup
        candidate_forecasts = forecast_by_target.get(st_iso, [])
        # If hourly persistence mode is active and this is a :30 interval lacking exact forecast,
        # inherit from the containing hour's forecast (:00)
        if match_mode == "hourly_persistence" and not candidate_forecasts and iv.minute == 30:
            top_hour_st = format_iso_utc(iv - timedelta(minutes=30))
            candidate_forecasts = forecast_by_target.get(top_hour_st, [])

        eligible_forecasts = [
            (pub_dt, gen) for (pub_dt, gen) in candidate_forecasts
            if pub_dt <= cutoff_dt
        ]

        forecast_gen = None
        forecast_pub_iso = None
        if eligible_forecasts:
            # Sort by publish time descending and pick the latest eligible
            eligible_forecasts.sort(key=lambda x: x[0], reverse=True)
            best_pub_dt, best_gen = eligible_forecasts[0]
            forecast_gen = best_gen
            forecast_pub_iso = format_iso_utc(best_pub_dt)

        # Determine match status and error
        is_matched = False
        error = None
        abs_error = None
        pct_error = None
        missing_reason = None

        if actual_gen is None and forecast_gen is None:
            missing_reason = "missing_both"
        elif actual_gen is None:
            missing_reason = "missing_actual"
            missing_actual_count += 1
        elif forecast_gen is None:
            missing_reason = "missing_forecast_before_cutoff"
            missing_forecast_count += 1
        else:
            is_matched = True
            matched_count += 1
            error = round(forecast_gen - actual_gen, 2)
            abs_error = round(abs(error), 2)
            if actual_gen > 0:
                pct_error = round((abs_error / actual_gen) * 100, 2)
            else:
                pct_error = None

        matched_intervals.append({
            "startTime": st_iso,
            "deliveryDate": delivery_date,
            "settlementPeriod": settlement_period,
            "actualGeneration": round(actual_gen, 2) if actual_gen is not None else None,
            "forecastGeneration": round(forecast_gen, 2) if forecast_gen is not None else None,
            "forecastPublishTime": forecast_pub_iso,
            "decisionCutoffTime": cutoff_iso,
            "error": error,
            "absoluteError": abs_error,
            "percentageError": pct_error,
            "isMatched": is_matched,
            "missingReason": missing_reason
        })

    total_target_intervals = len(interval_grid)
    coverage_rate = round((matched_count / total_target_intervals) * 100, 2) if total_target_intervals > 0 else 0.0

    audit_summary = {
        "rawActualsCount": raw_actuals_count,
        "rawForecastsCount": raw_forecasts_count,
        "totalTargetIntervals": total_target_intervals,
        "matchedCount": matched_count,
        "unmatchedCount": total_target_intervals - matched_count,
        "missingForecastCount": missing_forecast_count,
        "missingActualCount": missing_actual_count,
        "coverageRate": coverage_rate,
        "cutoffTimeOfDay": cutoff_time_str,
        "deliveryPeriodStart": start_date,
        "deliveryPeriodEnd": end_date,
        "matchMode": match_mode,
        "timeZone": "UTC (GMT)",
    }

    return matched_intervals, audit_summary
