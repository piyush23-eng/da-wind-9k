import React, { useState, useEffect } from 'react';
import { Table, ChevronLeft, ChevronRight, Download, CheckCircle, AlertCircle } from 'lucide-react';
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
    <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-6 shadow-sm space-y-4">
      
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E6E4D9] gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1C2421] flex items-center font-sans">
            <Table className="h-4 w-4 text-[#245C46] mr-2" />
            30-Minute Settlement Interval Ledger
          </h2>
          <p className="text-xs text-[#5C6460] mt-0.5 font-sans">
            Auditable record of all half-hour settlement periods with eligible Day-Ahead forecasts and FUELHH outturns.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <label className="flex items-center space-x-1.5 cursor-pointer text-[#5C6460] hover:text-[#1C2421]">
            <input
              type="checkbox"
              checked={matchedOnly}
              onChange={(e) => {
                setMatchedOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-[#DBD8CA] text-[#245C46] focus:ring-0"
            />
            <span>Matched Only</span>
          </label>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 bg-[#F0EFE7] hover:bg-[#E6E4D9] border border-[#DBD8CA] text-[#1C2421] px-3 py-1.5 rounded-lg transition font-medium"
          >
            <Download className="h-3.5 w-3.5 text-[#245C46]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto border border-[#DBD8CA] rounded-xl">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#F0EFE7] text-[#5C6460] uppercase tracking-wider border-b border-[#DBD8CA]">
            <tr>
              <th
                onClick={() => handleSort('startTime')}
                className="py-2.5 px-3 cursor-pointer hover:text-[#245C46] transition"
              >
                Delivery Time (UTC) {sortBy === 'startTime' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-2 text-center">SP</th>
              <th
                onClick={() => handleSort('actualGeneration')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#245C46] transition"
              >
                Actual Wind (MW) {sortBy === 'actualGeneration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('forecastGeneration')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#245C46] transition"
              >
                DA Forecast (MW) {sortBy === 'forecastGeneration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3">Forecast Published</th>
              <th
                onClick={() => handleSort('error')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#245C46] transition"
              >
                Signed Error {sortBy === 'error' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('absoluteError')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[#245C46] transition"
              >
                Abs Error {sortBy === 'absoluteError' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E4D9] text-[#1C2421] bg-[#FAF9F5]">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-[#5C6460] font-sans">
                  <div className="inline-block h-6 w-6 border-2 border-[#245C46] border-t-transparent rounded-full animate-spin mb-2" />
                  <div>Loading interval records...</div>
                </td>
              </tr>
            ) : data.items && data.items.length > 0 ? (
              data.items.map((iv) => (
                <tr key={iv.startTime} className="hover:bg-[#F0EFE7]/50 transition">
                  <td className="py-2 px-3 font-medium text-[#1C2421]">
                    {iv.startTime.replace('T', ' ').replace('Z', '')}
                  </td>
                  <td className="py-2 px-2 text-center text-[#5C6460] font-semibold">
                    {iv.settlementPeriod}
                  </td>
                  <td className="py-2 px-3 text-right text-[#245C46] font-bold">
                    {iv.actualGeneration !== null ? iv.actualGeneration.toLocaleString() : (
                      <span className="text-[#8A928D] italic">Missing</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-[#A67F30] font-bold">
                    {iv.forecastGeneration !== null ? iv.forecastGeneration.toLocaleString() : (
                      <span className="text-[#8A928D] italic">No forecast</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-[#5C6460] text-[11px]">
                    {iv.forecastPublishTime ? iv.forecastPublishTime.replace('T', ' ').replace('Z', '') : '-'}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      iv.error > 0 ? 'text-[#D76B42]' : iv.error < 0 ? 'text-[#245C46]' : 'text-[#5C6460]'
                    }`}
                  >
                    {iv.error !== null ? `${iv.error > 0 ? '+' : ''}${iv.error.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-2 px-3 text-right text-[#1C2421]">
                    {iv.absoluteError !== null ? iv.absoluteError.toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {iv.isMatched ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#245C46]/10 text-[#245C46] border border-[#245C46]/20">
                        <CheckCircle className="h-2.5 w-2.5 mr-1" />
                        Matched
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#D76B42]/10 text-[#B8532D] border border-[#D76B42]/20"
                        title={iv.missingReason}
                      >
                        <AlertCircle className="h-2.5 w-2.5 mr-1" />
                        Unmatched
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-6 text-center text-[#8A928D] font-sans">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5C6460] font-mono gap-3 pt-2">
        <div>
          Showing page <span className="text-[#1C2421] font-bold">{page}</span> of{' '}
          <span className="text-[#1C2421] font-bold">{data.totalPages}</span> ({data.totalCount} total intervals)
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#DBD8CA] hover:bg-[#F0EFE7] disabled:opacity-40 transition font-medium text-[#1C2421]"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            <span>Prev</span>
          </button>
          
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page >= data.totalPages || loading}
            className="flex items-center px-2.5 py-1 rounded-lg bg-[#FAF9F5] border border-[#DBD8CA] hover:bg-[#F0EFE7] disabled:opacity-40 transition font-medium text-[#1C2421]"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>
      </div>

    </div>
  );
}
