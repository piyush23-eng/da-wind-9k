import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import GenerationChart from './components/GenerationChart';
import AccuracySection from './components/AccuracySection';
import IntervalTable from './components/IntervalTable';
import TransparencyModal from './components/TransparencyModal';
import { fetchOverview, fetchGenerationTimeseries, fetchAccuracy } from './services/api';
import { AlertTriangle, Info, Wind } from 'lucide-react';

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

  const handleRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleCutoffChange = (newCutoff) => {
    setCutoffTime(newCutoff);
  };

  return (
    <div className="min-h-screen bg-[#F5F4ED] text-[#1C2421] flex flex-col font-sans selection:bg-[#245C46]/15 selection:text-[#245C46]">
      
      {/* Top Header */}
      <Header
        dataSource={overview?.dataSource || 'live_elexon'}
        loading={loading}
        onRefresh={loadAllData}
        onOpenTransparency={() => setTransparencyOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Error Alert Banner */}
        {error && (
          <div className="bg-[#D76B42]/10 border border-[#D76B42]/30 rounded-2xl p-4 flex items-start space-x-3 text-[#B8532D]">
            <AlertTriangle className="h-5 w-5 text-[#D76B42] mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs font-mono">
              <span className="font-bold font-sans text-sm">Backend Connectivity Alert:</span> {error}
              <div className="mt-1 text-[#8A928D] font-sans">
                Ensure the FastAPI backend server is active on port 8000.
              </div>
            </div>
            <button
              onClick={loadAllData}
              className="text-xs bg-[#D76B42]/15 hover:bg-[#D76B42]/25 px-3 py-1 rounded-lg text-[#B8532D] font-bold transition font-mono"
            >
              Retry
            </button>
          </div>
        )}

        {/* Editorial Market Context Bar */}
        <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5C6460] shadow-sm gap-2">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-[#245C46] flex-shrink-0" />
            <span>
              Evaluating <strong className="text-[#1C2421]">Day-Ahead Wind Forecast Reliability</strong> for Great Britain Wholesale Procurement across{' '}
              <span className="font-mono text-[#245C46] font-bold">January 2026</span>.
            </span>
          </div>
          <div className="font-mono text-[#5C6460] text-[11px] flex items-center space-x-2">
            <span>Enforced Cutoff:</span>
            <span className="px-2 py-0.5 rounded bg-[#F0EFE7] border border-[#DBD8CA] text-[#1C2421] font-bold">
              D-1 @ {cutoffTime} UTC
            </span>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <KpiCards
          metrics={overview?.metrics}
          audit={overview?.audit}
        />

        {/* SIGNATURE PRIMARY INTERACTIVE TIME-SERIES VISUALIZATION */}
        <GenerationChart
          data={generationData}
          loading={loading}
          metrics={overview?.metrics}
          startDate={startDate}
          endDate={endDate}
          onRangeChange={handleRangeChange}
          cutoffTime={cutoffTime}
          onCutoffChange={handleCutoffChange}
        />

        {/* Accuracy Distribution & Volatility Breakdown */}
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

      {/* Methodology & Lineage Transparency Modal */}
      <TransparencyModal
        isOpen={transparencyOpen}
        onClose={() => setTransparencyOpen(false)}
        overviewData={overview}
      />

      {/* Editorial Footer */}
      <footer className="border-t border-[#DBD8CA] bg-[#FAF9F5] py-6 px-6 mt-12 text-xs text-[#5C6460]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Wind className="h-4 w-4 text-[#245C46]" />
            <span className="font-bold text-[#1C2421]">WindScope</span>
            <span>— Great Britain Electricity Day-Ahead Wind Evaluation Engine</span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Data: Elexon BMRS (FUELHH & WINDFOR)</span>
            <span className="text-[#DBD8CA]">|</span>
            <span>Timezone: UTC (GMT)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
