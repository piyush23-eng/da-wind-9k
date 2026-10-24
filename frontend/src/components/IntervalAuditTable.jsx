import React, { useState, useEffect } from 'react';
import { fetchIntervals } from '../services/api';

export default function IntervalAuditTable({
  startDate,
  endDate,
  cutoffTime,
  metrics,
  selectedInterval,
  onSelectInterval
}) {
  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [largeErrorsOnly, setLargeErrorsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIntervals();
  }, [startDate, endDate, cutoffTime, page, pageSize, matchedOnly, sortBy, sortOrder]);

  const loadIntervals = async () => {
    setLoading(true);
    try {
      const res = await fetchIntervals({
        startDate,
        endDate,
        cutoffTime,
        matchedOnly,
        page,
        pageSize,
        sortBy,
        sortOrder
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load audit table:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Client-side filtering for search & large errors
  const filteredItems = (data.items || []).filter((iv) => {
    if (largeErrorsOnly && (iv.absoluteError === null || iv.absoluteError < 2000)) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const st = (iv.startTime || '').toLowerCase();
      const sp = String(iv.settlementPeriod);
      return st.includes(q) || sp.includes(q);
    }
    return true;
  });

  const exportCSV = () => {
    if (!data.items || !data.items.length) return;
    const headers = [
      'Delivery Time (UTC)',
      'Date',
      'Settlement Period',
      'Actual Wind (MW)',
      'Day-Ahead Forecast (MW)',
      'Forecast Published Time (UTC)',
      'Signed Error (MW)',
      'Absolute Error (MW)',
      'Status'
    ];
    const rows = data.items.map((iv) => [
      iv.startTime,
      iv.deliveryDate,
      iv.settlementPeriod,
      iv.actualGeneration ?? '',
      iv.forecastGeneration ?? '',
      iv.forecastPublishTime ?? '',
      iv.error ?? '',
      iv.absoluteError ?? '',
      iv.isMatched ? 'Matched' : (iv.missingReason || 'Unmatched')
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `windscope_audit_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-8 border-b border-rule font-sans">
      
      {/* 1. Contextual Statistical Header */}
      {metrics && (
        <div className="mb-6 pb-6 border-b border-rule/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-muted text-[11px] font-sans">RMSE Volatility Penalty:</span>
            <div className="font-bold text-ink text-base mt-0.5">
              {Math.round(metrics.rmse || 0).toLocaleString()} MW
            </div>
            <div className="text-[10px] text-muted font-sans mt-0.5">
              +{(metrics.rmse - metrics.mae).toFixed(1)} MW above MAE
            </div>
          </div>

          <div>
            <span className="text-muted text-[11px] font-sans">Peak Overforecast Shortfall:</span>
            <div className="font-bold text-copper text-base mt-0.5">
              +{Math.round(metrics.maxOverforecast || 0).toLocaleString()} MW
            </div>
            <div className="text-[10px] text-muted font-sans mt-0.5">
              Acute market exposure
            </div>
          </div>

          <div>
            <span className="text-muted text-[11px] font-sans">Peak Underforecast Ramp:</span>
            <div className="font-bold text-forest text-base mt-0.5">
              {Math.round(metrics.maxUnderforecast || 0).toLocaleString()} MW
            </div>
            <div className="text-[10px] text-muted font-sans mt-0.5">
              Rapid weather front arrival
            </div>
          </div>

          <div>
            <span className="text-muted text-[11px] font-sans">Over / Under Ratio:</span>
            <div className="font-bold text-ink text-base mt-0.5">
              <span className="text-copper font-bold">{metrics.overforecastCount}</span> /{' '}
              <span className="text-forest font-bold">{metrics.underforecastCount}</span>
            </div>
            <div className="text-[10px] text-muted font-sans mt-0.5">
              Matched interval counts
            </div>
          </div>
        </div>
      )}

      {/* 2. Audit Table Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 gap-3">
        <div>
          <h3 className="font-sans font-medium text-ink text-sm">
            Settlement Period Audit Ledger
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Click any row to inspect its exact forecast vintage and cutoff details on the chart above.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted">
          
          {/* Quick Filter: Matched Only */}
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-ink">
            <input
              type="checkbox"
              checked={matchedOnly}
              onChange={(e) => {
                setMatchedOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded-none border-rule text-forest focus:ring-0 cursor-pointer"
            />
            <span>Matched only</span>
          </label>

          {/* Quick Filter: Large Errors (>2000 MW) */}
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-ink">
            <input
              type="checkbox"
              checked={largeErrorsOnly}
              onChange={(e) => setLargeErrorsOnly(e.target.checked)}
              className="rounded-none border-rule text-copper focus:ring-0 cursor-pointer"
            />
            <span>Large errors (&gt;2k MW)</span>
          </label>

          <span className="text-rule">|</span>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search date or SP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-b border-rule bg-transparent px-1 py-0.5 text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink w-32 sm:w-36"
          />

          <span className="text-rule">|</span>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="text-ink hover:text-forest transition underline underline-offset-4 decoration-rule hover:decoration-forest cursor-pointer"
          >
            Export Raw CSV
          </button>
        </div>
      </div>

      {/* 3. The Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-t border-b border-rule">
          <thead className="text-muted uppercase text-[10px] tracking-wider border-b border-rule">
            <tr>
              <th
                onClick={() => handleSort('startTime')}
                className="py-2.5 pr-4 font-medium cursor-pointer hover:text-ink transition"
              >
                Delivery Timestamp (UTC) {sortBy === 'startTime' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3 text-center font-medium">SP</th>
              <th
                onClick={() => handleSort('actualGeneration')}
                className="py-2.5 px-3 text-right font-medium cursor-pointer hover:text-ink transition"
              >
                Actual (MW) {sortBy === 'actualGeneration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('forecastGeneration')}
                className="py-2.5 px-3 text-right font-medium cursor-pointer hover:text-ink transition"
              >
                DA Forecast (MW) {sortBy === 'forecastGeneration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3 font-medium">Published (D-1)</th>
              <th
                onClick={() => handleSort('error')}
                className="py-2.5 px-3 text-right font-medium cursor-pointer hover:text-ink transition"
              >
                Signed Error {sortBy === 'error' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 pl-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60 text-ink">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-muted font-sans text-xs">
                  Loading ledger rows...
                </td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((iv) => {
                const isOver = iv.error > 0;
                const isUnder = iv.error < 0;
                const isSelected = selectedInterval?.startTime === iv.startTime;

                return (
                  <tr
                    key={iv.startTime}
                    onClick={() => onSelectInterval && onSelectInterval(iv)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-paper-tint font-semibold border-l-2 border-l-forest'
                        : 'hover:bg-paper-tint/40'
                    }`}
                  >
                    <td className="py-2 pr-4 font-mono text-muted">
                      {iv.startTime.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="py-2 px-3 text-center text-muted font-mono">
                      {iv.settlementPeriod}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-forest">
                      {iv.actualGeneration !== null ? iv.actualGeneration.toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-copper">
                      {iv.forecastGeneration !== null ? iv.forecastGeneration.toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-muted text-[11px]">
                      {iv.forecastPublishTime ? iv.forecastPublishTime.replace('T', ' ').replace('Z', '') : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2.5">
                        {/* Centered Diverging Micro-Bar: Center is 0 MW baseline */}
                        <div
                          className="w-14 h-2 bg-rule/50 rounded-2xs relative flex items-center overflow-hidden"
                          title={`Error: ${iv.error > 0 ? '+' : ''}${iv.error?.toLocaleString()} MW`}
                        >
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rule-dark z-10" />
                          {iv.error !== null && iv.error > 0 && (
                            <div
                              className="absolute left-1/2 top-0.5 bottom-0.5 bg-copper rounded-2xs transition-all duration-150"
                              style={{ width: `${Math.min(50, (iv.error / 7100) * 50)}%` }}
                            />
                          )}
                          {iv.error !== null && iv.error < 0 && (
                            <div
                              className="absolute right-1/2 top-0.5 bottom-0.5 bg-forest rounded-2xs transition-all duration-150"
                              style={{ width: `${Math.min(50, (Math.abs(iv.error) / 7100) * 50)}%` }}
                            />
                          )}
                        </div>

                        {/* Numeric Error Text */}
                        <span
                          className={`font-medium tabular-nums ${
                            isOver ? 'text-copper' : isUnder ? 'text-forest' : 'text-muted'
                          }`}
                        >
                          {iv.error !== null
                            ? `${iv.error > 0 ? '+' : ''}${iv.error.toLocaleString()} MW`
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pl-3 text-center">
                      {iv.isMatched ? (
                        <span className="text-forest text-[11px] font-sans">Matched</span>
                      ) : (
                        <span className="text-copper text-[11px] font-sans">Unmatched</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-6 text-center text-muted font-sans text-xs">
                  No records match current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination */}
      <div className="flex items-baseline justify-between text-xs text-muted font-mono pt-3">
        <span>
          Page {page} of {data.totalPages} ({data.totalCount} total settlement periods)
        </span>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="hover:text-ink disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            ← Previous
          </button>
          <span className="text-rule">/</span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages || loading}
            className="hover:text-ink disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            Next →
          </button>
        </div>
      </div>

    </div>
  );
}
