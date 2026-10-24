import React from 'react';
import { Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

export default function KpiCards({ metrics, audit }) {
  if (!metrics) return null;

  const {
    mae = 0,
    rmse = 0,
    meanError = 0,
    matchedCount = 0,
    totalTargetIntervals = 0,
    coverageRate = 0,
    overforecastCount = 0,
    underforecastCount = 0,
    units = 'MW'
  } = metrics;

  const isOverforecastBias = meanError > 0;
  const isNeutralBias = meanError === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. MAE Card */}
      <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-5 shadow-sm hover:border-[#B4BCB7] transition">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5C6460] uppercase tracking-wider font-sans">
          <span>Mean Absolute Error (MAE)</span>
          <Activity className="h-4 w-4 text-[#245C46]" />
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-[#1C2421]">
            {mae.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-[#5C6460] font-semibold">{units}</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-[#E6E4D9] text-xs text-[#5C6460] flex items-center justify-between font-mono">
          <span className="font-sans">Avg error magnitude:</span>
          <span className="font-bold text-[#245C46]">{(mae * 0.5).toFixed(1)} MWh/SP</span>
        </div>
      </div>

      {/* 2. RMSE Card */}
      <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-5 shadow-sm hover:border-[#B4BCB7] transition">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5C6460] uppercase tracking-wider font-sans">
          <span>Root Mean Squared Error</span>
          <AlertTriangle className="h-4 w-4 text-[#C69A42]" />
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-[#1C2421]">
            {rmse.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-[#5C6460] font-semibold">{units}</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-[#E6E4D9] text-xs text-[#5C6460] flex items-center justify-between font-mono">
          <span className="font-sans">Tail volatility penalty:</span>
          <span className="font-bold text-[#A67F30]">
            +{(rmse - mae).toFixed(1)} {units} vs MAE
          </span>
        </div>
      </div>

      {/* 3. Systematic Bias Card */}
      <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-5 shadow-sm hover:border-[#B4BCB7] transition">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5C6460] uppercase tracking-wider font-sans">
          <span>Directional Bias (Mean Error)</span>
          {isOverforecastBias ? (
            <ArrowUpRight className="h-4 w-4 text-[#D76B42]" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-[#245C46]" />
          )}
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span
            className={`text-3xl font-bold font-mono ${
              isOverforecastBias
                ? 'text-[#D76B42]'
                : isNeutralBias
                ? 'text-[#1C2421]'
                : 'text-[#245C46]'
            }`}
          >
            {meanError > 0 ? `+${meanError}` : meanError}
          </span>
          <span className="text-xs font-mono text-[#5C6460] font-semibold">{units}</span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-[#E6E4D9] text-xs text-[#5C6460] flex items-center justify-between font-mono">
          <span className="font-sans">Market tendency:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isOverforecastBias
                ? 'bg-[#D76B42]/10 text-[#B8532D] border border-[#D76B42]/30'
                : 'bg-[#245C46]/10 text-[#245C46] border border-[#245C46]/30'
            }`}
          >
            {isOverforecastBias ? 'Overforecast (+)' : 'Underforecast (-)'}
          </span>
        </div>
      </div>

      {/* 4. Match & Coverage Card */}
      <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-5 shadow-sm hover:border-[#B4BCB7] transition">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5C6460] uppercase tracking-wider font-sans">
          <span>Decision Horizon Coverage</span>
          <CheckCircle2 className="h-4 w-4 text-[#245C46]" />
        </div>
        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-3xl font-bold font-mono text-[#1C2421]">
            {coverageRate}%
          </span>
          <span className="text-xs font-mono text-[#5C6460]">
            ({matchedCount}/{totalTargetIntervals} SPs)
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-[#E6E4D9] text-xs text-[#5C6460] flex items-center justify-between font-mono">
          <span className="font-sans">Over vs Under intervals:</span>
          <span>
            <strong className="text-[#D76B42]">{overforecastCount}</strong> /{' '}
            <strong className="text-[#245C46]">{underforecastCount}</strong>
          </span>
        </div>
      </div>

    </div>
  );
}
