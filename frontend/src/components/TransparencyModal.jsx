import React from 'react';
import { X, ShieldCheck, Database, GitBranch, BookOpen, Layers } from 'lucide-react';

export default function TransparencyModal({ isOpen, onClose, overviewData }) {
  if (!isOpen) return null;

  const audit = overviewData?.audit || {};
  const cutoffPolicy = overviewData?.cutoffPolicy || {};
  const dataSource = overviewData?.dataSource || 'unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 text-[#1C2421]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#DBD8CA] pb-3">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="h-5 w-5 text-[#245C46]" />
            <h3 className="text-base font-bold text-[#1C2421] font-sans">
              Data Lineage & Methodology Transparency
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#5C6460] hover:text-[#1C2421] hover:bg-[#F0EFE7] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. Official Data Sources */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#245C46] flex items-center font-mono">
            <Database className="h-3.5 w-3.5 mr-1.5" />
            1. Official Elexon BMRS Datasets
          </h4>
          <div className="bg-[#F0EFE7] border border-[#DBD8CA] rounded-xl p-3.5 text-xs space-y-2.5 font-mono">
            <div>
              <span className="text-[#245C46] font-bold">Actual Generation (FUELHH):</span>
              <p className="text-[#5C6460] font-sans mt-0.5 leading-relaxed">
                Official half-hourly outturn generation dataset. Filtered strictly to fuel type <code className="text-[#245C46] font-bold">WIND</code>. National-level MW per 30-minute settlement period.
              </p>
            </div>
            <div>
              <span className="text-[#A67F30] font-bold">Forecast Generation (WINDFOR):</span>
              <p className="text-[#5C6460] font-sans mt-0.5 leading-relaxed">
                National wind generation forecast stream published by Elexon BMRS / National Grid ESO. Contains forward projections across multi-day scheduling horizons.
              </p>
            </div>
            <div className="pt-2 text-[11px] text-[#5C6460] border-t border-[#DBD8CA] flex items-center justify-between">
              <span>Active Ingestion Mode:</span>
              <span className="text-[#245C46] font-bold">{dataSource.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* 2. Forecast Selection & Look-Ahead Bias Prevention */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#245C46] flex items-center font-mono">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            2. Decision Cutoff & Look-Ahead Bias Prevention
          </h4>
          <div className="bg-[#F0EFE7] border border-[#DBD8CA] rounded-xl p-3.5 text-xs space-y-2 font-sans leading-relaxed text-[#1C2421]">
            <p>
              In wholesale electricity trading, day-ahead purchase decisions are committed on Day <code className="text-[#245C46] font-mono font-bold">D-1</code> prior to market gate closure.
            </p>
            <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#DBD8CA] font-mono text-xs text-[#A67F30] leading-relaxed">
              target_time = Delivery Interval (Day D)<br />
              decision_cutoff = (D - 1 day) at {audit.cutoffTimeOfDay || '17:00:00'} UTC<br />
              selected_forecast = max(publishTime) WHERE publishTime &lt;= decision_cutoff
            </div>
            <p className="text-[#5C6460] text-xs">
              Any forecast published <em>after</em> the cutoff is strictly excluded. This guarantees that evaluated forecasts reflect the exact intelligence accessible to traders at bidding time, preventing look-ahead bias.
            </p>
          </div>
        </div>

        {/* 3. Mathematical Formulas */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#245C46] flex items-center font-mono">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            3. Accuracy Formulas & Conventions
          </h4>
          <div className="bg-[#F0EFE7] border border-[#DBD8CA] rounded-xl p-3.5 text-xs space-y-2 font-mono text-[#1C2421]">
            <div>
              <span className="font-bold text-[#1C2421]">Signed Error:</span> <code className="text-[#245C46] font-bold">Error = Forecast - Actual (MW)</code>
              <p className="text-[#5C6460] font-sans text-[11px] mt-0.5">
                Positive error = Overforecast (shortfall risk). Negative error = Underforecast (spill risk).
              </p>
            </div>
            <div>
              <span className="font-bold text-[#1C2421]">MAE:</span> <code className="text-[#245C46] font-bold">(1 / N) * ∑ |Forecast_i - Actual_i|</code>
            </div>
            <div>
              <span className="font-bold text-[#1C2421]">RMSE:</span> <code className="text-[#A67F30] font-bold">√ [ (1 / N) * ∑ (Forecast_i - Actual_i)² ]</code>
            </div>
            <div>
              <span className="font-bold text-[#1C2421]">Power (MW) vs Energy (MWh):</span>
              <p className="text-[#5C6460] font-sans text-[11px] mt-0.5">
                Elexon values are power in MW. Over a 30-minute settlement period, energy delivered in MWh equals <code className="text-[#245C46] font-bold">MW * 0.5 hours</code>.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Audit Counts */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#245C46] flex items-center font-mono">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            4. Current Evaluation Audit
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="bg-[#F0EFE7] p-2.5 rounded-xl border border-[#DBD8CA]">
              <div className="text-[#5C6460] text-[10px] font-sans">Target SPs</div>
              <div className="text-[#1C2421] font-bold mt-0.5">{audit.totalTargetIntervals || 0}</div>
            </div>
            <div className="bg-[#F0EFE7] p-2.5 rounded-xl border border-[#DBD8CA]">
              <div className="text-[#5C6460] text-[10px] font-sans">Matched SPs</div>
              <div className="text-[#245C46] font-bold mt-0.5">{audit.matchedCount || 0}</div>
            </div>
            <div className="bg-[#F0EFE7] p-2.5 rounded-xl border border-[#DBD8CA]">
              <div className="text-[#5C6460] text-[10px] font-sans">Coverage Rate</div>
              <div className="text-[#245C46] font-bold mt-0.5">{audit.coverageRate || 0}%</div>
            </div>
            <div className="bg-[#F0EFE7] p-2.5 rounded-xl border border-[#DBD8CA]">
              <div className="text-[#5C6460] text-[10px] font-sans">Missing SPs</div>
              <div className="text-[#5C6460] font-bold mt-0.5">{audit.unmatchedCount || 0}</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-3 border-t border-[#DBD8CA] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#245C46] hover:bg-[#1A4333] text-[#F5F4ED] px-4 py-2 rounded-xl text-xs font-medium transition shadow-sm"
          >
            Close Transparency View
          </button>
        </div>

      </div>
    </div>
  );
}
