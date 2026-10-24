"""Pydantic schemas and data models for WindScope.

Represents:
- Raw actual generation records (Elexon FUELHH)
- Raw forecast generation records (Elexon WINDFOR)
- Matched delivery intervals for day-ahead purchasing evaluation
- Aggregated accuracy metrics and summaries
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FuelHHRecord(BaseModel):
    dataset: str = "FUELHH"
    publishTime: str
    startTime: str
    settlementDate: str
    settlementPeriod: int
    fuelType: str
    generation: float


class WindforRecord(BaseModel):
    dataset: str = "WINDFOR"
    publishTime: str
    startTime: str
    generation: float


class MatchedInterval(BaseModel):
    """Represents a single 30-minute delivery interval matched with its

    eligible day-ahead forecast.
    """
    startTime: str = Field(..., description="Target delivery start time in ISO 8601 UTC")
    deliveryDate: str = Field(..., description="Target delivery date (YYYY-MM-DD)")
    settlementPeriod: int = Field(..., description="UK Settlement Period (1-48/50)")
    actualGeneration: Optional[float] = Field(None, description="Actual wind generation in MW from FUELHH")
    forecastGeneration: Optional[float] = Field(None, description="Day-ahead forecast wind generation in MW from WINDFOR")
    forecastPublishTime: Optional[str] = Field(None, description="Timestamp when the selected forecast was published")
    decisionCutoffTime: str = Field(..., description="Effective cutoff timestamp on D-1")
    error: Optional[float] = Field(None, description="Signed error: Forecast - Actual (MW). Positive = overforecast, Negative = underforecast")
    absoluteError: Optional[float] = Field(None, description="Absolute error: |Forecast - Actual| (MW)")
    percentageError: Optional[float] = Field(None, description="Percentage error relative to actual (|error| / actual * 100), None if actual == 0")
    isMatched: bool = Field(..., description="True if both actual and eligible forecast exist for this interval")
    missingReason: Optional[str] = Field(None, description="Reason if unmatched (e.g., missing_forecast, missing_actual)")


class AccuracyMetrics(BaseModel):
    """Statistical summary of forecast performance across matched intervals."""
    mae: float = Field(..., description="Mean Absolute Error in MW: sum(|forecast - actual|) / N")
    rmse: float = Field(..., description="Root Mean Squared Error in MW: sqrt(sum((forecast - actual)^2) / N)")
    meanError: float = Field(..., description="Mean Signed Error / Bias in MW: sum(forecast - actual) / N")
    matchedCount: int = Field(..., description="Number of intervals with both valid actual and eligible forecast")
    totalTargetIntervals: int = Field(..., description="Total intervals in the requested delivery range")
    coverageRate: float = Field(..., description="Percentage of target intervals successfully matched (0-100%)")
    unmatchedCount: int = Field(..., description="Number of intervals lacking forecast or actual")
    overforecastCount: int = Field(..., description="Count of intervals where Forecast > Actual")
    underforecastCount: int = Field(..., description="Count of intervals where Forecast < Actual")
    exactMatchCount: int = Field(..., description="Count of intervals where Forecast == Actual")
    maxOverforecast: Optional[float] = Field(None, description="Largest positive error (Forecast - Actual)")
    maxUnderforecast: Optional[float] = Field(None, description="Largest negative error (Forecast - Actual)")
    units: str = Field("MW", description="Generation power units reported by Elexon BMRS")


class DailyAccuracyMetric(BaseModel):
    """Daily aggregated accuracy metric for trend analysis."""
    date: str
    mae: float
    rmse: float
    meanError: float
    matchedCount: int
    totalIntervals: int
    coverageRate: float
    actualEnergyGWh: float = Field(..., description="Total actual wind energy delivered on this date in GWh (sum(MW * 0.5h)/1000)")
    forecastEnergyGWh: float = Field(..., description="Total forecast wind energy on this date in GWh")


class OverviewResponse(BaseModel):
    """High-level summary response for the dashboard overview."""
    deliveryPeriod: Dict[str, str]
    cutoffTimeOfDay: str
    metrics: AccuracyMetrics
    dataQuality: Dict[str, Any]
    dailySummary: List[DailyAccuracyMetric]
    largestErrors: List[MatchedInterval]
