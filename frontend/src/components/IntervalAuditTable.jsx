import React, { useState, useEffect } from 'react';
import { fetchIntervals } from '../services/api';

export default function IntervalAuditTable({ startDate, endDate, cutoffTime }) {
  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadIntervals();
  }, [startDate, endDate, cutoffTime, page, pageSize, matchedOnly]);

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
        sortBy: 'startTime',
        sortOrder: 'asc'
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load audit table:', err);
    } finally {
      setLoading(false);
    }
  };

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
    const rows = data.items.map(iv => [
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

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `windscope_audit_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-8 border-b border-rule">
      
      {/* Editorial Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-4 gap-3">
        <div>
          <h3 className="font-sans font-medium text-ink text-sm">
            Settlement Period Audit Ledger
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Half-hourly verification records matching physical outturns to day-ahead bids.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-muted">
          <label className="flex items-center space-x-1.5 cursor-pointer hover:text-ink">
            <input
              type="checkbox"
              checked={matchedOnly}
              onChange={(e) => {
                setMatchedOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded-none border-rule text-forest focus:ring-0"
            />
            <span>Matched only</span>
          </label>

          <span className="text-rule">|</span>

          <button
            onClick={exportCSV}
            className="text-ink hover:text-forest transition underline underline-offset-4 decoration-rule hover:decoration-forest cursor-pointer"
          >
            Export Raw CSV
          </button>
        </div>
      </div>

      {/* Clean Editorial Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-t border-b border-rule">
          <thead className="text-muted uppercase text-[10px] tracking-wider border-b border-rule">
            <tr>
              <th className="py-2.5 pr-4 font-medium">Delivery Timestamp (UTC)</th>
              <th className="py-2.5 px-3 text-center font-medium">SP</th>
              <th className="py-2.5 px-3 text-right font-medium">Actual (MW)</th>
              <th className="py-2.5 px-3 text-right font-medium">Forecast (MW)</th>
              <th className="py-2.5 px-3 font-medium">Published (D-1)</th>
              <th className="py-2.5 px-3 text-right font-medium">Signed Error</th>
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
            ) : data.items && data.items.length > 0 ? (
              data.items.map((iv) => {
                const isOver = iv.error > 0;
                const isUnder = iv.error < 0;
                return (
                  <tr key={iv.startTime} className="hover:bg-paper-tint/40 transition-colors">
                    <td className="py-2 pr-4 font-mono text-muted">
                      {iv.startTime.replace('T', ' ').replace('Z', '')}
                    </td>
                    <td className="py-2 px-3 text-center text-muted font-mono">
                      {iv.settlementPeriod}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-forest">
                      {iv.actualGeneration !== null ? iv.actualGeneration.toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-rust">
                      {iv.forecastGeneration !== null ? iv.forecastGeneration.toLocaleString() : '—'}
                    </td>
                    <td className="py-2 px-3 text-muted text-[11px]">
                      {iv.forecastPublishTime ? iv.forecastPublishTime.replace('T', ' ').replace('Z', '') : '—'}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-medium ${
                        isOver ? 'text-rust' : isUnder ? 'text-forest' : 'text-muted'
                      }`}
                    >
                      {iv.error !== null
                        ? `${iv.error > 0 ? '+' : ''}${iv.error.toLocaleString()} MW`
                        : '—'}
                    </td>
                    <td className="py-2 pl-3 text-center">
                      {iv.isMatched ? (
                        <span className="text-forest text-[11px] font-sans">Matched</span>
                      ) : (
                        <span className="text-rust text-[11px] font-sans">Unmatched</span>
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

      {/* Pagination Strip */}
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
