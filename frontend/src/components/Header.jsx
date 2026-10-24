import React from 'react';
import { Wind, Clock, RefreshCw, Calendar, Database, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Header({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  cutoffTime,
  setCutoffTime,
  dataSource,
  loading,
  onRefresh,
  onOpenTransparency
}) {
  const quickRanges = [
    { label: 'Full Month (Jan 1-31)', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Week 1 (Jan 1-7)', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Week 2 (Jan 8-14)', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Week 3 (Jan 15-21)', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Week 4 (Jan 22-28)', start: '2026-01-22', end: '2026-01-28' },
    { label: 'Late Jan (Jan 25-31)', start: '2026-01-25', end: '2026-01-31' },
  ];

  const cutoffs = [
    { value: '11:00:00', label: '11:00 UTC (EPEX Auction)' },
    { value: '12:00:00', label: '12:00 UTC (NordPool GB DA)' },
    { value: '14:00:00', label: '14:00 UTC (Post-Auction)' },
    { value: '17:00:00', label: '17:00 UTC (Standard D-1 Close)' },
    { value: '23:00:00', label: '23:00 UTC (End of D-1)' },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#090f1f]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Brand & Purpose */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
            <Wind className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                WindScope
                <span className="ml-2 px-2 py-0.5 text-xs font-mono rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  GB Wholesale DA
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              National Wind Power Day-Ahead Forecast Accuracy & Procurement Intelligence
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Date Range Dropdown */}
          <div className="flex items-center bg-[#0d162b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400 mr-2" />
            <select
              value={`${startDate}_${endDate}`}
              onChange={(e) => {
                const [s, end] = e.target.value.split('_');
                setStartDate(s);
                setEndDate(end);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              {quickRanges.map(r => (
                <option key={r.label} value={`${r.start}_${r.end}`} className="bg-slate-900 text-slate-200">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* D-1 Decision Cutoff Selector */}
          <div className="flex items-center bg-[#0d162b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-teal-400 mr-2" />
            <span className="text-slate-400 mr-1.5">Cutoff (D-1):</span>
            <select
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="bg-transparent font-mono text-teal-300 font-medium focus:outline-none cursor-pointer"
              title="Only forecasts published on or before this time on Day D-1 are considered eligible"
            >
              {cutoffs.map(c => (
                <option key={c.value} value={c.value} className="bg-slate-900 text-slate-200 font-mono">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data Source Status Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
              dataSource === 'live_elexon' || dataSource === 'cached_elexon'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title="Elexon BMRS live stream ingestion status"
          >
            <div className={`h-2 w-2 rounded-full ${dataSource.includes('elexon') ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{dataSource.includes('elexon') ? 'Elexon Live Stream' : 'Demo Mode (Fixtures)'}</span>
          </div>

          {/* Methodology / Transparency Trigger */}
          <button
            onClick={onOpenTransparency}
            className="flex items-center space-x-1 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs transition"
            title="Inspect Data Lineage & Methodology"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>Methodology</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-teal-600/80 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
            title="Re-evaluate with selected filters"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Refresh'}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
