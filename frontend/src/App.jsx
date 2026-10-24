import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GenerationChart from './components/GenerationChart';
import EditorialInsightRow from './components/EditorialInsightRow';
import ErrorTimelineChart from './components/ErrorTimelineChart';
import IntervalAuditTable from './components/IntervalAuditTable';
import CollapsibleMethodology from './components/CollapsibleMethodology';
import { fetchOverview, fetchGenerationTimeseries } from './services/api';

export default function App() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [cutoffTime, setCutoffTime] = useState('17:00:00');

  const [overview, setOverview] = useState(null);
  const [generationData, setGenerationData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, cutoffTime]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, gen] = await Promise.all([
        fetchOverview(startDate, endDate, cutoffTime),
        fetchGenerationTimeseries(startDate, endDate, cutoffTime)
      ]);

      setOverview(ov);
      setGenerationData(gen.data || []);
    } catch (err) {
      console.error('Failed to load WindScope publication data:', err);
      setError(err.message || 'Error communicating with WindScope API.');
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleCutoffChange = (newCutoff) => {
    setCutoffTime(newCutoff);
  };

  const handleOpenMethodology = () => {
    setShowMethodology(true);
    const el = document.getElementById('methodology');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-forest/15 selection:text-forest">
      
      {/* 1. EDITORIAL HEADER & MASTHEAD */}
      <Header onOpenMethodology={handleOpenMethodology} />

      {/* MAIN PUBLICATION SPREAD */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6">
        
        {/* Error Notice */}
        {error && (
          <div className="my-4 p-4 border border-rust/40 bg-rust/5 text-rust font-mono text-xs flex justify-between items-center">
            <div>
              <strong>Stream Connection Error:</strong> {error}
            </div>
            <button
              onClick={loadData}
              className="underline hover:text-ink cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. THE HERO CHART */}
        <section aria-label="Hero Wind Generation Time-Series">
          <GenerationChart
            data={generationData}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
            cutoffTime={cutoffTime}
            onCutoffChange={handleCutoffChange}
          />
        </section>

        {/* 3. SINGLE EDITORIAL INSIGHT ROW */}
        <EditorialInsightRow
          metrics={overview?.metrics}
          audit={overview?.audit}
        />

        {/* 4. BELOW THE FOLD: QUIETER ANALYTICAL DEPTH */}
        
        {/* Compact Forecast Error Chronology */}
        <ErrorTimelineChart
          data={generationData}
          loading={loading}
        />

        {/* Settlement Period Audit Ledger */}
        <IntervalAuditTable
          startDate={startDate}
          endDate={endDate}
          cutoffTime={cutoffTime}
        />

        {/* Collapsible Methodology Section */}
        <CollapsibleMethodology
          isOpenDefault={showMethodology}
          audit={overview?.audit}
          cutoffTime={cutoffTime}
        />

      </main>

      {/* 5. EDITORIAL FOOTER */}
      <footer className="py-12 border-t border-rule mt-12 bg-paper text-xs text-muted font-mono">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold text-ink">WINDSCOPE — FIELD NOTES ON WIND</div>
            <div className="text-[11px]">
              Independent quantitative analysis of British wholesale electricity markets.
            </div>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Data: Elexon BMRS (FUELHH & WINDFOR)</span>
            <span className="text-rule">/</span>
            <span>All times UTC (GMT)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
