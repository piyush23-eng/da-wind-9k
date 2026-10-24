/**
 * WindScope API client service.
 * Connects to FastAPI backend endpoints with configurable base URL.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000/api'
    : '/api'
);

export async function fetchOverview(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '17:00:00') {
  const url = `${API_BASE_URL}/overview?start_date=${startDate}&end_date=${endDate}&cutoff_time=${cutoffTime}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch overview: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchGenerationTimeseries(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '17:00:00') {
  const url = `${API_BASE_URL}/generation?start_date=${startDate}&end_date=${endDate}&cutoff_time=${cutoffTime}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch generation data: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAccuracy(startDate = '2026-01-01', endDate = '2026-01-31', cutoffTime = '17:00:00') {
  const url = `${API_BASE_URL}/accuracy?start_date=${startDate}&end_date=${endDate}&cutoff_time=${cutoffTime}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch accuracy data: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchIntervals(params = {}) {
  const {
    startDate = '2026-01-01',
    endDate = '2026-01-31',
    cutoffTime = '17:00:00',
    matchedOnly = false,
    page = 1,
    pageSize = 50,
    sortBy = 'startTime',
    sortOrder = 'asc'
  } = params;

  const query = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
    matched_only: matchedOnly,
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_by: sortBy,
    sort_order: sortOrder
  });

  const response = await fetch(`${API_BASE_URL}/intervals?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch intervals: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
