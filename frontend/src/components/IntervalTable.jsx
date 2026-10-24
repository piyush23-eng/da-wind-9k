import React, { useState, useEffect } from 'react';
import { Table, ChevronLeft, ChevronRight, Download, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { fetchIntervals } from '../services/api';

export default function IntervalTable({ startDate, endDate, cutoffTime }) {
  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('startTime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadIntervals();
  }, [startDate, endDate, cutoffTime, page, pageSize, matchedOnly, sortBy, sortOrder]);

  const loadIntervals = async () => {
    setLoading(true);
    setError(null);
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
      setError(err.message);
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
    link.setAttribute('download', `windscope_intervals_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Table Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center">
            <Table className="h-4 w-4 text-teal-400 mr-2" />
            30-Minute Interval Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Granular breakdown of each half-hour delivery period with its matched D-1 forecast and actual power generation.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Matched Only Toggle */}
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={matchedOnly}
              onChange={(e) => {
                setMatchedOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
            />
            <span>Matched Only</span>
          </label>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 px-2.5 py-1 rounded transition"
          >
            <Download className="h-3.5 w-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#091124] text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('startTime')}
                className="py-2.5 px-3 cursor-pointer hover:text-teal-400 transition"
              >
                Delivery Time (UTC) {sortBy === 'startTime' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-2 text-center">SP</th>
              <th
                onClick={() => handleSort('actualGeneration')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-teal-400 transition"
              >
                Actual Wind (MW) {sortBy === 'actualGeneration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('forecastGeneration')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-teal-400 transition"
              >
                DA Forecast (MW) {sortBy === 'forecastGeneration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3">Forecast Published</th>
              <th
                onClick={() => handleSort('error')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-teal-400 transition"
              >
                Signed Error {sortBy === 'error' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('absoluteError')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-teal-400 transition"
              >
                Abs Error {sortBy === 'absoluteError' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-slate-400 font-sans">
                  <div className="inline-block h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <div>Loading interval records...</div>
                </td>
              </tr>
            ) : data.items && data.items.length > 0 ? (
              data.items.map((iv) => (
                <tr key={iv.startTime} className="hover:bg-slate-800/30 transition">
                  <td className="py-2 px-3 text-slate-300">
                    {iv.startTime.replace('T', ' ').replace('Z', '')}
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 font-semibold">
                    {iv.settlementPeriod}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-medium">
                    {iv.actualGeneration !== null ? iv.actualGeneration.toLocaleString() : (
                      <span className="text-slate-500 italic">Missing</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-cyan-300 font-medium">
                    {iv.forecastGeneration !== null ? iv.forecastGeneration.toLocaleString() : (
                      <span className="text-slate-500 italic">No forecast</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                    {iv.forecastPublishTime ? iv.forecastPublishTime.replace('T', ' ').replace('Z', '') : '-'}
                  </td>
                  <td className={`py-2 px-3 text-right font-medium ${
                    iv.error > 0 ? 'text-rose-400' : iv.error < 0 ? 'text-cyan-400' : 'text-slate-300'
                  }`}>
                    {iv.error !== null ? `${iv.error > 0 ? '+' : ''}${iv.error.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    {iv.absoluteError !== null ? iv.absoluteError.toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {iv.isMatched ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="h-2.5 w-2.5 mr-1" />
                        Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20" title={iv.missingReason}>
                        <AlertCircle className="h-2.5 w-2.5 mr-1" />
                        Unmatched
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-6 text-center text-slate-500 font-sans">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 font-mono gap-3 pt-2">
        <div>
          Showing page <span className="text-white font-bold">{page}</span> of{' '}
          <span className="text-white font-bold">{data.totalPages}</span> ({data.totalCount} total intervals)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            <span>Prev</span>
          </button>
          
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages || loading}
            className="flex items-center px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>
      </div>

    </div>
  );
}
