"""FastAPI REST API routes for WindScope.

Exposes endpoints for:
- /api/health
- /api/overview
- /api/generation
- /api/accuracy
- /api/intervals
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from app.services.elexon_client import ElexonClient
from app.services.forecast_matcher import match_actuals_and_forecasts
from app.analytics.metrics import compute_accuracy_metrics, compute_daily_breakdown, compute_error_histogram

router = APIRouter(prefix="/api", tags=["WindScope"])
elexon_client = ElexonClient(use_cache=True)


def get_evaluation_data(
    start_date: str = "2026-01-01",
    end_date: str = "2026-01-31",
    cutoff_time: str = "17:00:00",
    match_mode: str = "hourly_persistence",
    force_refresh: bool = False
) -> Dict[str, Any]:
    """Retrieve actuals and forecasts, execute matching, and return data + audit."""
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be less than or equal to end_date"
        )

    actuals, actuals_src = elexon_client.get_january_2026_actuals(force_refresh=force_refresh)
    forecasts, forecasts_src = elexon_client.get_january_2026_forecasts(force_refresh=force_refresh)

    matched_intervals, audit = match_actuals_and_forecasts(
        actuals_records=actuals,
        forecast_records=forecasts,
        cutoff_time_str=cutoff_time,
        start_date=start_date,
        end_date=end_date,
        match_mode=match_mode
    )

    data_source = "live_elexon" if "live" in actuals_src or "cached" in actuals_src else "demo_fixtures"

    return {
        "matched_intervals": matched_intervals,
        "audit": audit,
        "actuals_source": actuals_src,
        "forecasts_source": forecasts_src,
        "data_source": data_source
    }


@router.get("/health")
def health_check():
    """Health and readiness probe."""
    return {
        "status": "healthy",
        "service": "WindScope API",
        "version": "1.0.0",
        "supportedPeriod": "2026-01-01 to 2026-01-31",
        "elexonEndpoints": [
            "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream",
            "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"
        ]
    }


@router.get("/overview")
def get_overview(
    start_date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date YYYY-MM-DD"),
    end_date: str = Query("2026-01-31", pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date YYYY-MM-DD"),
    cutoff_time: str = Query("17:00:00", pattern=r"^\d{2}:\d{2}:\d{2}$", description="D-1 decision cutoff time (e.g. 12:00:00, 17:00:00)"),
    match_mode: str = Query("hourly_persistence", pattern=r"^(hourly_persistence|exact)$", description="Matching mode: hourly_persistence (48 SPs) or exact (24 SPs)"),
    cashout_price: float = Query(85.0, ge=0.0, le=1000.0, description="Benchmark cashout price (£/MWh) for imbalance calculation")
):
    """Returns high-level KPI cards, accuracy metrics, daily summary, and transparency metadata."""
    res = get_evaluation_data(
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        match_mode=match_mode
    )
    matched_intervals = res["matched_intervals"]
    audit = res["audit"]

    metrics = compute_accuracy_metrics(
        matched_intervals,
        total_target_intervals=audit["totalTargetIntervals"],
        cashout_price_gbp=cashout_price
    )
    daily = compute_daily_breakdown(matched_intervals)

    # Identify 5 largest absolute errors for immediate review
    matched_only = [iv for iv in matched_intervals if iv["isMatched"] and iv["absoluteError"] is not None]
    largest_errors = sorted(matched_only, key=lambda x: x["absoluteError"], reverse=True)[:5]

    return {
        "deliveryPeriod": {
            "startDate": start_date,
            "endDate": end_date,
            "timeZone": "UTC (GMT)"
        },
        "cutoffPolicy": {
            "cutoffTimeOfDay": cutoff_time,
            "description": f"Forecasts published on Day D-1 on or before {cutoff_time} UTC. Look-ahead bias strictly excluded."
        },
        "marketAssumptions": {
            "matchMode": match_mode,
            "cashoutPriceGbpPerMWh": cashout_price,
            "notes": "Cashout benchmark configurable; £85/MWh represents winter baseline average."
        },
        "dataSource": res["data_source"],
        "actualsSource": res["actuals_source"],
        "forecastsSource": res["forecasts_source"],
        "metrics": metrics,
        "dailySummary": daily,
        "largestErrors": largest_errors,
        "audit": audit
    }


@router.get("/generation")
def get_generation_timeseries(
    start_date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_time: str = Query("17:00:00", pattern=r"^\d{2}:\d{2}:\d{2}$"),
    match_mode: str = Query("hourly_persistence", pattern=r"^(hourly_persistence|exact)$")
):
    """Returns time-series data of actual generation vs day-ahead forecast for charting."""
    res = get_evaluation_data(start_date=start_date, end_date=end_date, cutoff_time=cutoff_time, match_mode=match_mode)
    intervals = res["matched_intervals"]

    timeseries = []
    for iv in intervals:
        timeseries.append({
            "startTime": iv["startTime"],
            "deliveryDate": iv["deliveryDate"],
            "settlementPeriod": iv["settlementPeriod"],
            "actualGeneration": iv["actualGeneration"],
            "forecastGeneration": iv["forecastGeneration"],
            "error": iv["error"],
            "absoluteError": iv.get("absoluteError"),
            "percentageError": iv.get("percentageError"),
            "forecastPublishTime": iv["forecastPublishTime"],
            "decisionCutoffTime": iv.get("decisionCutoffTime"),
            "isMatched": iv["isMatched"],
            "missingReason": iv.get("missingReason")
        })

    return {
        "startDate": start_date,
        "endDate": end_date,
        "cutoffTime": cutoff_time,
        "matchMode": match_mode,
        "units": "MW",
        "count": len(timeseries),
        "data": timeseries
    }


@router.get("/accuracy")
def get_accuracy_analysis(
    start_date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_time: str = Query("17:00:00", pattern=r"^\d{2}:\d{2}:\d{2}$"),
    match_mode: str = Query("hourly_persistence", pattern=r"^(hourly_persistence|exact)$"),
    cashout_price: float = Query(85.0, ge=0.0, le=1000.0)
):
    """Returns detailed accuracy metrics, error distribution histogram, and daily breakdowns."""
    res = get_evaluation_data(start_date=start_date, end_date=end_date, cutoff_time=cutoff_time, match_mode=match_mode)
    intervals = res["matched_intervals"]
    audit = res["audit"]

    metrics = compute_accuracy_metrics(
        intervals,
        total_target_intervals=audit["totalTargetIntervals"],
        cashout_price_gbp=cashout_price
    )
    daily = compute_daily_breakdown(intervals)
    histogram = compute_error_histogram(intervals, num_bins=12)

    return {
        "metrics": metrics,
        "dailySummary": daily,
        "errorDistribution": histogram,
        "audit": audit
    }


@router.get("/intervals")
def get_intervals(
    start_date: str = Query("2026-01-01", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    end_date: str = Query("2026-01-31", pattern=r"^\d{4}-\d{2}-\d{2}$"),
    cutoff_time: str = Query("17:00:00", pattern=r"^\d{2}:\d{2}:\d{2}$"),
    match_mode: str = Query("hourly_persistence", pattern=r"^(hourly_persistence|exact)$"),
    matched_only: bool = Query(False, description="Filter to matched intervals only"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=500),
    sort_by: str = Query("startTime", description="Field to sort by: startTime, error, absoluteError"),
    sort_order: str = Query("asc", description="Sort order: asc or desc")
):
    """Returns paginated 30-minute interval table with sorting and filtering."""
    res = get_evaluation_data(start_date=start_date, end_date=end_date, cutoff_time=cutoff_time, match_mode=match_mode)
    intervals = res["matched_intervals"]

    if matched_only:
        intervals = [iv for iv in intervals if iv["isMatched"]]

    # Sorting
    reverse = (sort_order.lower() == "desc")
    if sort_by in ["error", "absoluteError", "actualGeneration", "forecastGeneration"]:
        intervals.sort(
            key=lambda x: (x.get(sort_by) is not None, x.get(sort_by) if x.get(sort_by) is not None else 0),
            reverse=reverse
        )
    else:
        intervals.sort(key=lambda x: x["startTime"], reverse=reverse)

    total_count = len(intervals)
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paged_items = intervals[start_idx:end_idx]

    return {
        "totalCount": total_count,
        "page": page,
        "pageSize": page_size,
        "totalPages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        "items": paged_items
    }
