"""Elexon BMRS Client for fetching Actual (FUELHH) and Forecast (WINDFOR) wind generation data.

Endpoints:
- Actuals: https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream
- Forecasts: https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream

Key Features:
1. Disk caching in `data_cache/` to ensure sub-50ms API response times.
2. Chunked fetching to handle API rate-limits and timeouts cleanly.
3. Realistic fixture fallback so the system remains fully operational and verifiable.
4. Clear metadata indicating whether data is 'live_elexon' or 'demo_fixtures'.
"""

import os
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
import requests

logger = logging.getLogger("windscope.elexon")

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data_cache")


def ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)


def get_cache_path(filename: str) -> str:
    ensure_cache_dir()
    return os.path.join(CACHE_DIR, filename)


class ElexonClient:
    def __init__(self, use_cache: bool = True):
        self.use_cache = use_cache
        self.headers = {
            "User-Agent": "WindScope-GridBricks/1.0",
            "Accept": "application/json"
        }

    def fetch_stream_dataset(
        self,
        dataset: str,
        publish_from: str,
        publish_to: str,
        timeout: int = 30
    ) -> List[Dict[str, Any]]:
        """Fetch raw stream data from Elexon for a given publishDateTime window."""
        url = f"{BASE_URL}/datasets/{dataset}/stream"
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to
        }
        response = requests.get(url, params=params, headers=self.headers, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else []

    def get_january_2026_actuals(self, force_refresh: bool = False) -> Tuple[List[Dict[str, Any]], str]:
        """Retrieve January 2026 FUELHH actual generation (filtered to WIND)."""
        cache_file = get_cache_path("fuelhh_wind_jan2026.json")
        if self.use_cache and not force_refresh and os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                    if cached:
                        return cached, "cached_elexon"
            except Exception as e:
                logger.warning(f"Failed to read actuals cache: {e}")

        # Fetch live from Elexon in 7-day chunks
        try:
            all_records = []
            # January 1, 2026 to February 1, 2026
            start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(2026, 2, 1, 0, 0, 0, tzinfo=timezone.utc)
            
            chunk_days = 5
            curr = start
            while curr < end:
                next_chunk = min(curr + timedelta(days=chunk_days), end)
                from_str = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
                to_str = (next_chunk - timedelta(seconds=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
                logger.info(f"Fetching FUELHH from {from_str} to {to_str}...")
                
                chunk_data = self.fetch_stream_dataset("FUELHH", from_str, to_str)
                # Filter to WIND only
                wind_chunk = [r for r in chunk_data if r.get("fuelType") == "WIND"]
                all_records.extend(wind_chunk)
                curr = next_chunk

            if all_records:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(all_records, f)
                return all_records, "live_elexon"
        except Exception as e:
            logger.error(f"Live fetch failed for FUELHH: {e}")

        # Fallback to fixture
        return self._generate_fallback_actuals(), "demo_fixtures"

    def get_january_2026_forecasts(self, force_refresh: bool = False) -> Tuple[List[Dict[str, Any]], str]:
        """Retrieve WINDFOR forecasts relevant for January 2026 delivery.

        Includes forecasts published from Dec 30, 2025 through Jan 31, 2026.
        """
        cache_file = get_cache_path("windfor_jan2026.json")
        if self.use_cache and not force_refresh and os.path.exists(cache_file):
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached = json.load(f)
                    if cached:
                        return cached, "cached_elexon"
            except Exception as e:
                logger.warning(f"Failed to read forecasts cache: {e}")

        try:
            all_records = []
            # For delivery starting Jan 1, day-ahead forecasts are published Dec 30-31
            start = datetime(2025, 12, 30, 0, 0, 0, tzinfo=timezone.utc)
            end = datetime(2026, 2, 1, 0, 0, 0, tzinfo=timezone.utc)
            
            chunk_days = 4
            curr = start
            while curr < end:
                next_chunk = min(curr + timedelta(days=chunk_days), end)
                from_str = curr.strftime("%Y-%m-%dT%H:%M:%SZ")
                to_str = (next_chunk - timedelta(seconds=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
                logger.info(f"Fetching WINDFOR from {from_str} to {to_str}...")
                
                chunk_data = self.fetch_stream_dataset("WINDFOR", from_str, to_str)
                all_records.extend(chunk_data)
                curr = next_chunk

            if all_records:
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(all_records, f)
                return all_records, "live_elexon"
        except Exception as e:
            logger.error(f"Live fetch failed for WINDFOR: {e}")

        return self._generate_fallback_forecasts(), "demo_fixtures"

    def _generate_fallback_actuals(self) -> List[Dict[str, Any]]:
        """Generate high-fidelity synthetic actuals for Jan 1-31, 2026 if offline."""
        import math
        records = []
        start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        for i in range(31 * 48):
            dt = start + timedelta(minutes=30 * i)
            # Realistic UK winter wind profile (ranges 4,000 MW to 16,000 MW with synoptic cycles)
            day_cycle = math.sin(i / 15.0) * 3500
            weather_front = math.cos(i / 80.0) * 4500
            base = 9000 + day_cycle + weather_front
            noise = (math.sin(i * 1.7) * 400)
            gen = max(800.0, base + noise)
            
            records.append({
                "dataset": "FUELHH",
                "publishTime": (dt + timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "startTime": dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "settlementDate": dt.strftime("%Y-%m-%d"),
                "settlementPeriod": (dt.hour * 60 + dt.minute) // 30 + 1,
                "fuelType": "WIND",
                "generation": round(gen, 1)
            })
        return records

    def _generate_fallback_forecasts(self) -> List[Dict[str, Any]]:
        """Generate high-fidelity synthetic day-ahead forecasts."""
        import math
        actuals = self._generate_fallback_actuals()
        forecasts = []
        for act in actuals:
            dt = datetime.fromisoformat(act["startTime"].replace("Z", "+00:00"))
            # Day D-1 publication at 11:30 and 16:30
            d_minus_1 = dt.date() - timedelta(days=1)
            pub_1 = datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 11, 30, tzinfo=timezone.utc)
            pub_2 = datetime(d_minus_1.year, d_minus_1.month, d_minus_1.day, 16, 30, tzinfo=timezone.utc)
            
            # Forecast with error (mean slight overforecast in winter + random atmospheric variation)
            err_factor = 1.05 + 0.12 * math.sin(dt.day * 1.3)
            f_gen_1 = act["generation"] * err_factor + 150
            f_gen_2 = act["generation"] * (1.02 + 0.08 * math.cos(dt.day * 0.9)) - 50

            forecasts.append({
                "dataset": "WINDFOR",
                "publishTime": pub_1.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "startTime": act["startTime"],
                "generation": round(f_gen_1, 1)
            })
            forecasts.append({
                "dataset": "WINDFOR",
                "publishTime": pub_2.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "startTime": act["startTime"],
                "generation": round(f_gen_2, 1)
            })
        return forecasts
