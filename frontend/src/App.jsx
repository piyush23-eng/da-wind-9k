import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GenerationChart from './components/GenerationChart';
import EditorialInsightRow from './components/EditorialInsightRow';
import OverviewExecutiveSummary from './components/OverviewExecutiveSummary';
import IntervalAuditTable from './components/IntervalAuditTable';
import CollapsibleMethodology from './components/CollapsibleMethodology';
import DiurnalProfileModal from './components/DiurnalProfileModal';
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
  const [showDiurnalModal, setShowDiurnalModal] = useState(false);

  // Workstation 4.0 States
  const [viewMode, setViewMode] = useState('editorial'); // 'editorial' | 'analysis'
  const [selectedInterval, setSelectedInterval] = useState(null);

  // Global Keyboard Navigation: [ESC] dismisses, [←] and [→] step intervals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedInterval(null);
        setShowDiurnalModal(false);
      } else if (e.key === 'ArrowRight') {
        if (!generationData || !generationData.length) return;
        e.preventDefault();
        if (!selectedInterval) {
          setSelectedInterval(generationData[0]);
        } else {
          const idx = generationData.findIndex(
            (d) => d.startTime === selectedInterval.startTime
          );
          if (idx >= 0 && idx < generationData.length - 1) {
            setSelectedInterval(generationData[idx + 1]);
          }
        }
      } else if (e.key === 'ArrowLeft') {
        if (!generationData || !generationData.length) return;
        e.preventDefault();
        if (!selectedInterval) {
          setSelectedInterval(generationData[0]);
        } else {
          const idx = generationData.findIndex(
            (d) => d.startTime === selectedInterval.startTime
          );
          if (idx > 0) {
            setSelectedInterval(generationData[idx - 1]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInterval, generationData]);

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
    setSelectedInterval(null);
  };

  const handleCutoffChange = (newCutoff) => {
    setCutoffTime(newCutoff);
    setSelectedInterval(null);
  };

  // Quick jump directly to historic January 2026 market anomaly events
  const handleSelectEvent = (eventKey) => {
    if (eventKey === 'jan12') {
      // Jan 12 Peak Shortfall (+7,097 MW at SP 3, 01:00 UTC)
      setStartDate('2026-01-08');
      setEndDate('2026-01-14');
      setTimeout(() => {
        const item = generationData.find(
          (d) => d.startTime && d.startTime.startsWith('2026-01-12T01:00:00')
        );
        if (item) setSelectedInterval(item);
      }, 200);
    } else if (eventKey === 'jan8') {
      // Jan 8 Surge Spill (-3,312 MW at SP 38, 18:30 UTC)
      setStartDate('2026-01-08');
      setEndDate('2026-01-14');
      setTimeout(() => {
        const item = generationData.find(
          (d) => d.startTime && d.startTime.startsWith('2026-01-08T18:30:00')
        );
        if (item) setSelectedInterval(item);
      }, 200);
    } else if (eventKey === 'jan26') {
      // Jan 26 Front Gap (+4,133 MW at SP 35, 17:00 UTC)
      setStartDate('2026-01-25');
      setEndDate('2026-01-31');
      setTimeout(() => {
        const item = generationData.find(
          (d) => d.startTime && d.startTime.startsWith('2026-01-26T17:00:00')
        );
        if (item) setSelectedInterval(item);
      }, 200);
    }
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleOpenMethodology = () => {
    setShowMethodology(true);
    const el = document.getElementById('methodology');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-forest/15 selection:text-forest">
      
      {/* 1. SLIM EDITORIAL NAVIGATION & HEADLINE */}
      <Header
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenMethodology={handleOpenMethodology}
      />

      {/* 2. MAIN PUBLICATION SPREAD */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6">
        
        {/* Error Notice if connection fails */}
        {error && (
          <div className="my-4 p-4 border border-copper/40 bg-copper/5 text-copper font-mono text-xs flex justify-between items-center">
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

        {/* 3. HERO CHART & LINKED ERROR STRIP */}
        <section aria-label="Wind Generation Visualisation Instrument">
          <GenerationChart
            data={generationData}
            loading={loading}
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
            cutoffTime={cutoffTime}
            onCutoffChange={handleCutoffChange}
            viewMode={viewMode}
            selectedInterval={selectedInterval}
            onSelectInterval={setSelectedInterval}
            onCloseInspector={() => setSelectedInterval(null)}
            onSelectEvent={handleSelectEvent}
            onOpenDiurnal={() => setShowDiurnalModal(true)}
          />
        </section>

        {/* 2. SUMMARY INSIGHT ROW */}
        <EditorialInsightRow
          metrics={overview?.metrics}
          audit={overview?.audit}
          viewMode={viewMode}
        />

        {/* 3. DISTINCT WORKSPACE SPREADS */}
        {viewMode === 'editorial' ? (
          /* OVERVIEW TAB: Macro Findings & Commercial Procurement Recommendations */
          <div className="animate-fadeIn">
            <OverviewExecutiveSummary
              metrics={overview?.metrics}
              onSwitchToAnalysis={() => {
                setViewMode('analysis');
                window.scrollTo({ top: 100, behavior: 'smooth' });
              }}
              onOpenDiurnal={() => setShowDiurnalModal(true)}
              onSelectEvent={handleSelectEvent}
            />
          </div>
        ) : (
          /* ANALYSIS TAB: Quantitative Trading Workstation */
          <div className="space-y-8 animate-fadeIn">
            
            {/* Diurnal Profile Feature Banner */}
            <div className="mt-6 p-4 bg-white border border-rule rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-2xs">
              <div className="flex items-center space-x-3">
                <span className="p-2 bg-forest/10 text-forest rounded-[3px]">
                  <svg className="w-4 h-4 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div>
                  <div className="font-bold text-ink">48-Settlement-Period Diurnal Bias Profile</div>
                  <div className="text-muted font-sans text-xs">Examine intra-day hourly bias distribution across morning and evening demand peaks.</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiurnalModal(true)}
                className="px-3.5 py-1.5 bg-[#245C46] text-white hover:bg-[#1A4333] font-bold transition cursor-pointer rounded-[3px] shadow-xs self-start sm:self-auto shrink-0 flex items-center space-x-1"
              >
                <span>View Diurnal Curve</span>
                <span>→</span>
              </button>
            </div>

            {/* Settlement Period Audit Ledger with RMSE Summary */}
            <IntervalAuditTable
              startDate={startDate}
              endDate={endDate}
              cutoffTime={cutoffTime}
              metrics={overview?.metrics}
              selectedInterval={selectedInterval}
              onSelectInterval={(iv) => {
                setSelectedInterval(iv);
                window.scrollTo({ top: 120, behavior: 'smooth' });
              }}
            />

            {/* Collapsible Methodology Section */}
            <CollapsibleMethodology
              isOpenDefault={showMethodology}
              audit={overview?.audit}
              cutoffTime={cutoffTime}
            />

          </div>
        )}

      </main>

      {/* 6. SYSTEM FOOTER */}
      <footer className="py-12 border-t border-rule mt-12 bg-paper text-xs text-muted font-mono">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="font-bold tracking-widest text-ink">WINDSCOPE · ELEXON BMRS EVALUATION ENGINE</div>
            <div className="text-[11px] font-sans">
              UK wholesale electricity day-ahead procurement evaluation system.
            </div>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Elexon BMRS Stream</span>
            <span className="text-rule">/</span>
            <span>All times UTC (GMT)</span>
          </div>
        </div>
      </footer>

      {/* 7. DIURNAL 48-SP MODAL */}
      <DiurnalProfileModal
        isOpen={showDiurnalModal}
        onClose={() => setShowDiurnalModal(false)}
        data={generationData}
        viewMode={viewMode}
      />

    </div>
  );
}
