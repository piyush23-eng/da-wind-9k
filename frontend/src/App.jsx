import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import GenerationChart from './components/GenerationChart';
import AccuracySection from './components/AccuracySection';
import IntervalTable from './components/IntervalTable';
import TransparencyModal from './components/TransparencyModal';
import { fetchOverview, fetchGenerationTimeseries, fetchAccuracy } from './services/api';
import { AlertTriangle, ExternalLink, Github, Info, Wind } from 'lucide-react';

export default function App() {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [cutoffTime, setCutoffTime] = useState('17:00:00');

  const [overview, setOverview] = useState(null);
  const [generationData, setGenerationData] = useState([]);
  const [accuracyData, setAccuracyData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transparencyOpen, setTransparencyOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [startDate, endDate, cutoffTime]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, gen, acc] = await Promise.all([
        fetchOverview(startDate, endDate, cutoffTime),
        fetchGenerationTimeseries(startDate, endDate, cutoffTime),
        fetchAccuracy(startDate, endDate, cutoffTime)
      ]);

      setOverview(ov);
      setGenerationData(gen.data || []);
      setAccuracyData(acc);
    } catch (err) {
      console.error('Failed to load WindScope dashboard data:', err);
      setError(err.message || 'Error communicating with the WindScope backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        cutoffTime={cutoffTime}
        setCutoffTime={setCutoffTime}
        dataSource={overview?.dataSource || 'live_elexon'}
        loading={loading}
        onRefresh={loadAllData}
        onOpenTransparency={() => setTransparencyOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Error State Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start space-x-3 text-rose-300">
            <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold">Backend Connection Issue:</span> {error}
              <div className="mt-1 text-xs text-rose-400/80">
                Please verify that the FastAPI backend server is running on port 8000.
              </div>
            </div>
            <button
              onClick={loadAllData}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1 rounded-md text-white transition font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Informational Sub-banner for Utility Traders */}
        <div className="bg-[#0b1329]/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-teal-400 flex-shrink-0" />
            <span>
              Evaluating <strong className="text-white">Day-Ahead Wind Forecasts</strong> for GB Wholesale Procurement during{' '}
              <span className="font-mono text-teal-300 font-medium">January 2026</span>.
            </span>
          </div>
          <div className="font-mono text-slate-400 text-[11px]">
            Cutoff Policy: <span className="text-amber-300">D-1 @ {cutoffTime} UTC</span>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <KpiCards
          metrics={overview?.metrics}
          audit={overview?.audit}
        />

        {/* Primary Time-Series Visualizer */}
        <GenerationChart
          data={generationData}
          loading={loading}
        />

        {/* Forecast Accuracy & Error Breakdown */}
        <AccuracySection
          accuracyData={accuracyData}
          largestErrors={overview?.largestErrors}
        />

        {/* Granular 30-min Settlement Interval Ledger */}
        <IntervalTable
          startDate={startDate}
          endDate={endDate}
          cutoffTime={cutoffTime}
        />

      </main>

      {/* Transparency & Lineage Modal */}
      <TransparencyModal
        isOpen={transparencyOpen}
        onClose={() => setTransparencyOpen(false)}
        overviewData={overview}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060a14] py-6 px-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Wind className="h-4 w-4 text-teal-500" />
            <span className="font-semibold text-slate-400">WindScope</span>
            <span>— UK Electricity Day-Ahead Wind Evaluation Engine</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-500 font-mono">Data: Elexon BMRS (FUELHH & WINDFOR)</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 font-mono">Timezone: UTC (GMT)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
