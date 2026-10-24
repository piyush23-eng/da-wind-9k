import React from 'react';
import { X, ShieldCheck, Database, GitBranch, AlertTriangle, Layers, BookOpen } from 'lucide-react';

export default function TransparencyModal({ isOpen, onClose, overviewData }) {
  if (!isOpen) return null;

  const audit = overviewData?.audit || {};
  const cutoffPolicy = overviewData?.cutoffPolicy || {};
  const dataSource = overviewData?.dataSource || 'unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#091124] border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Data Lineage & Methodology Transparency</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Official Data Sources */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center">
            <Database className="h-3.5 w-3.5 mr-1.5" />
            1. Official Elexon BMRS Datasets
          </h4>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-2 font-mono">
            <div>
              <span className="text-emerald-400 font-semibold">Actual Generation (FUELHH):</span>
              <p className="text-slate-400 font-sans mt-0.5">
                Official half-hourly outturn generation dataset. Filtered strictly to fuel type <code className="text-teal-300">WIND</code>. National-level MW per 30-minute settlement period.
              </p>
            </div>
            <div>
              <span className="text-cyan-400 font-semibold">Forecast Generation (WINDFOR):</span>
              <p className="text-slate-400 font-sans mt-0.5">
                Wind power forecast generation stream published by National Grid ESO / Elexon BMRS. Contains periodic forecast runs with multi-day forward horizons.
              </p>
            </div>
            <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-800">
              Active Ingestion Mode: <span className="text-emerald-400 font-bold">{dataSource.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* 2. Forecast Selection & Look-Ahead Bias Prevention */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            2. Decision Cutoff & Look-Ahead Bias Prevention
          </h4>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5 font-sans leading-relaxed text-slate-300">
            <p>
              In wholesale power trading, day-ahead purchase decisions are made on Day <code className="text-teal-300 font-mono">D-1</code> prior to auction gate closure.
            </p>
            <p className="font-semibold text-white">
              Effective Selection Rule:
            </p>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-xs text-amber-300">
              target_time = Delivery Interval (Day D)<br />
              decision_cutoff = (D - 1 day) at {audit.cutoffTimeOfDay || '17:00:00'} UTC<br />
              selected_forecast = max(publishTime) WHERE publishTime &lt;= decision_cutoff
            </div>
            <p className="text-slate-400 text-xs">
              Any forecast published <em>after</em> the cutoff is strictly excluded. This guarantees that evaluated forecasts reflect the exact intelligence accessible to traders at bidding time, preventing look-ahead bias.
            </p>
          </div>
        </div>

        {/* 3. Mathematical Metric Definitions */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            3. Accuracy Formulas & Conventions
          </h4>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-2 font-mono text-slate-300">
            <div>
              <span className="text-white font-bold">Signed Error:</span> <code className="text-teal-300">Error = Forecast - Actual (MW)</code>
              <p className="text-slate-400 font-sans text-[11px] mt-0.5">
                Positive error = Overforecast (procurement shortfall risk). Negative error = Underforecast (spill / distress buying risk).
              </p>
            </div>
            <div>
              <span className="text-white font-bold">MAE:</span> <code className="text-teal-300">(1 / N) * ∑ |Forecast_i - Actual_i|</code>
            </div>
            <div>
              <span className="text-white font-bold">RMSE:</span> <code className="text-teal-300">√ [ (1 / N) * ∑ (Forecast_i - Actual_i)² ]</code>
            </div>
            <div>
              <span className="text-white font-bold">Power (MW) vs Energy (MWh):</span>
              <p className="text-slate-400 font-sans text-[11px] mt-0.5">
                Elexon values are power in MW. Over a 30-minute settlement period, energy delivered in MWh equals <code className="text-teal-300 font-mono">MW * 0.5 hours</code>.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Audit Counts */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            4. Current Evaluation Audit
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Target SPs</div>
              <div className="text-white font-bold mt-0.5">{audit.totalTargetIntervals || 0}</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Matched SPs</div>
              <div className="text-emerald-400 font-bold mt-0.5">{audit.matchedCount || 0}</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Coverage Rate</div>
              <div className="text-teal-300 font-bold mt-0.5">{audit.coverageRate || 0}%</div>
            </div>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">Missing SPs</div>
              <div className="text-slate-300 font-bold mt-0.5">{audit.unmatchedCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-medium transition"
          >
            Close Transparency View
          </button>
        </div>

      </div>
    </div>
  );
}
