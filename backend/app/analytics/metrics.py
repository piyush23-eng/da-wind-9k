"""Quantitative forecast accuracy evaluation metrics for WindScope.

Formulas:
- Error: e_i = Forecast_i - Actual_i
    > Positive: Overforecast (bought too much or relied on phantom wind)
    > Negative: Underforecast (bought too little, exposing utility to expensive imbalance fees)
- Mean Absolute Error (MAE): (1 / N) * sum(|e_i|)
- Root Mean Squared Error (RMSE): sqrt( (1 / N) * sum(e_i^2) )
    > Penalizes large catastrophic spikes quadratically.
- Mean Signed Error / Bias: (1 / N) * sum(e_i)
    > Indicates systematic over- or under-estimation.
- Forecast Coverage Rate: (Matched Intervals / Total Target Intervals) * 100%
- Daily Energy in GWh: sum(MW * 0.5 hours) / 1000
    > 1 MW sustained for 30 minutes (0.5 hour) = 0.5 MWh.
"""

from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd


def compute_accuracy_metrics(
    matched_intervals: List[Dict[str, Any]],
    total_target_intervals: Optional[int] = None,
    cashout_price_gbp: float = 85.0
) -> Dict[str, Any]:
    """Calculate MAE, RMSE, Mean Bias, Over/Under-forecast distributions."""
    matched = [iv for iv in matched_intervals if iv.get("isMatched") and iv.get("error") is not None]
    matched_count = len(matched)
    
    if total_target_intervals is None:
        total_target_intervals = len(matched_intervals)

    unmatched_count = total_target_intervals - matched_count
    coverage_rate = round((matched_count / total_target_intervals * 100), 2) if total_target_intervals > 0 else 0.0

    if matched_count == 0:
        return {
            "mae": 0.0,
            "rmse": 0.0,
            "meanError": 0.0,
            "matchedCount": 0,
            "totalTargetIntervals": total_target_intervals,
            "coverageRate": 0.0,
            "unmatchedCount": unmatched_count,
            "overforecastCount": 0,
            "underforecastCount": 0,
            "exactMatchCount": 0,
            "maxOverforecast": None,
            "maxUnderforecast": None,
            "rmseRatio": 1.0,
            "imbalanceMWh": 0.0,
            "estimatedImbalanceExposureGbp": 0.0,
            "debiasedMae": 0.0,
            "potentialSavingsGbp": 0.0,
            "cashoutBenchmarkGbpPerMWh": cashout_price_gbp,
            "units": "MW",
        }

    errors = np.array([iv["error"] for iv in matched], dtype=float)
    abs_errors = np.abs(errors)

    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    mean_error = float(np.mean(errors))

    overforecast_count = int(np.sum(errors > 0))
    underforecast_count = int(np.sum(errors < 0))
    exact_count = int(np.sum(errors == 0))

    max_overforecast = float(np.max(errors)) if overforecast_count > 0 else 0.0
    max_underforecast = float(np.min(errors)) if underforecast_count > 0 else 0.0

    # Dispersion volatility penalty: RMSE/MAE ratio (>1.2 indicates heavy-tailed spikes)
    rmse_ratio = round(rmse / mae, 2) if mae > 0 else 1.0

    # Physical imbalance volume: sum(|error| * 0.5 hours)
    imbalance_mwh = round(float(np.sum(abs_errors) * 0.5), 1)

    # GB wholesale market baseline cashout settlement estimate (configurable benchmark penalty)
    estimated_imbalance_gbp = round(imbalance_mwh * cashout_price_gbp, 2)

    # De-biased simulation: potential performance if systematic bias is removed at auction time
    debiased_errors = errors - mean_error
    debiased_mae = round(float(np.mean(np.abs(debiased_errors))), 2)
    potential_savings_gbp = round(max(0.0, float((mae - debiased_mae) * matched_count * 0.5 * cashout_price_gbp)), 2)

    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "meanError": round(mean_error, 2),
        "matchedCount": matched_count,
        "totalTargetIntervals": total_target_intervals,
        "coverageRate": coverage_rate,
        "unmatchedCount": unmatched_count,
        "overforecastCount": overforecast_count,
        "underforecastCount": underforecast_count,
        "exactMatchCount": exact_count,
        "maxOverforecast": round(max_overforecast, 2),
        "maxUnderforecast": round(max_underforecast, 2),
        "rmseRatio": rmse_ratio,
        "imbalanceMWh": imbalance_mwh,
        "cashoutBenchmarkGbpPerMWh": cashout_price_gbp,
        "estimatedImbalanceExposureGbp": estimated_imbalance_gbp,
        "debiasedMae": debiased_mae,
        "potentialSavingsGbp": potential_savings_gbp,
        "units": "MW",
    }


def compute_daily_breakdown(matched_intervals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Aggregate accuracy and delivered energy by delivery date."""
    if not matched_intervals:
        return []

    df = pd.DataFrame(matched_intervals)
    daily_results = []

    for date, group in df.groupby("deliveryDate"):
        total_intervals = len(group)
        matched_group = group[group["isMatched"] == True]
        matched_count = len(matched_group)

        if matched_count > 0:
            errors = matched_group["error"].to_numpy(dtype=float)
            mae = round(float(np.mean(np.abs(errors))), 2)
            rmse = round(float(np.sqrt(np.mean(errors ** 2))), 2)
            mean_error = round(float(np.mean(errors)), 2)
            # Energy in GWh: sum(MW * 0.5 hours) / 1000
            actual_gwh = round(float(matched_group["actualGeneration"].sum() * 0.5 / 1000.0), 3)
            forecast_gwh = round(float(matched_group["forecastGeneration"].sum() * 0.5 / 1000.0), 3)
        else:
            mae = 0.0
            rmse = 0.0
            mean_error = 0.0
            actual_gwh = 0.0
            forecast_gwh = 0.0

        daily_results.append({
            "date": str(date),
            "mae": mae,
            "rmse": rmse,
            "meanError": mean_error,
            "matchedCount": matched_count,
            "totalIntervals": total_intervals,
            "coverageRate": round(matched_count / total_intervals * 100, 1) if total_intervals > 0 else 0.0,
            "actualEnergyGWh": actual_gwh,
            "forecastEnergyGWh": forecast_gwh
        })

    daily_results.sort(key=lambda x: x["date"])
    return daily_results


def compute_error_histogram(matched_intervals: List[Dict[str, Any]], num_bins: int = 12) -> List[Dict[str, Any]]:
    """Compute distribution histogram of signed errors for visual inspection."""
    matched = [iv for iv in matched_intervals if iv.get("isMatched") and iv.get("error") is not None]
    if not matched:
        return []

    errors = np.array([iv["error"] for iv in matched], dtype=float)
    counts, bin_edges = np.histogram(errors, bins=num_bins)

    histogram = []
    for i in range(len(counts)):
        bin_start = round(float(bin_edges[i]), 1)
        bin_end = round(float(bin_edges[i + 1]), 1)
        histogram.append({
            "bin": f"{bin_start} to {bin_end} MW",
            "binCenter": round((bin_start + bin_end) / 2, 1),
            "count": int(counts[i]),
            "rangeStart": bin_start,
            "rangeEnd": bin_end
        })
    return histogram
