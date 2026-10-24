import React from 'react';
import { Wind, Clock, RefreshCw, Calendar, Database, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Header({
  dataSource,
  loading,
  onRefresh,
  onOpenTransparency
}) {
  return (
    <header className="border-b border-[#DBD8CA] bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Brand & Editorial Title */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#245C46] flex items-center justify-center text-[#F5F4ED] shadow-sm">
            <Wind className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-[#1C2421] font-sans flex items-center">
                WindScope
                <span className="ml-2.5 px-2 py-0.5 text-[11px] font-mono rounded-md bg-[#245C46]/10 text-[#245C46] border border-[#245C46]/20 font-semibold">
                  GB Wholesale Market
                </span>
              </h1>
            </div>
            <p className="text-xs text-[#5C6460] font-sans">
              National Day-Ahead Wind Forecast Accuracy & Procurement Intelligence
            </p>
          </div>
        </div>

        {/* Right Status & Meta Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Data Source Badge */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${
              dataSource === 'live_elexon' || dataSource === 'cached_elexon'
                ? 'bg-[#245C46]/10 border-[#245C46]/30 text-[#245C46]'
                : 'bg-[#C69A42]/15 border-[#C69A42]/40 text-[#A67F30]'
            }`}
            title="Elexon BMRS Stream Ingestion Status"
          >
            <div
              className={`h-2 w-2 rounded-full ${
                dataSource.includes('elexon') ? 'bg-[#245C46] animate-pulse' : 'bg-[#C69A42]'
              }`}
            />
            <span>{dataSource.includes('elexon') ? 'Elexon BMRS Stream (Live)' : 'Demo Fixtures Mode'}</span>
          </div>

          {/* Methodology Modal Trigger */}
          <button
            onClick={onOpenTransparency}
            className="flex items-center space-x-1.5 bg-[#FAF9F5] hover:bg-[#F0EFE7] border border-[#DBD8CA] text-[#1C2421] px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
            title="Inspect Data Lineage & Methodology"
          >
            <HelpCircle className="h-3.5 w-3.5 text-[#5C6460]" />
            <span>Methodology</span>
          </button>

          {/* Refresh Action Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-[#245C46] hover:bg-[#1A4333] text-[#F5F4ED] px-3.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 shadow-sm"
            title="Re-fetch evaluation data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Refresh'}</span>
          </button>

        </div>

      </div>
    </header>
  );
}
