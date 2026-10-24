import React from 'react';
import { Activity, AlertTriangle, ArrowUpRight, ArrowDownRight, CheckCircle2, Zap } from 'lucide-react';

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
      <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Mean Absolute Error (MAE)
          </span>
          <Activity className="h-4 w-4 text-teal-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {mae.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-slate-400">{units}</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Average deviation magnitude</span>
          <span className="font-mono text-slate-300">{(mae * 0.5).toFixed(1)} MWh/SP</span>
        </div>
      </div>

      {/* 2. RMSE Card */}
      <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Root Mean Squared Error (RMSE)
          </span>
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {rmse.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-slate-400">{units}</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Penalizes extreme tail errors</span>
          <span className="font-mono text-amber-300/90 font-medium">
            +{(rmse - mae).toFixed(1)} {units} vs MAE
          </span>
        </div>
      </div>

      {/* 3. Mean Bias Card */}
      <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Systematic Bias (Mean Error)
          </span>
          {isOverforecastBias ? (
            <ArrowUpRight className="h-4 w-4 text-rose-400" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-cyan-400" />
          )}
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-2xl font-bold font-mono ${
            isOverforecastBias ? 'text-rose-400' : isNeutralBias ? 'text-slate-200' : 'text-cyan-400'
          }`}>
            {meanError > 0 ? `+${meanError}` : meanError}
          </span>
          <span className="text-xs font-mono text-slate-400">{units}</span>
        </div>
        <div className="mt-2 text-xs flex items-center justify-between">
          <span className="text-slate-400">Directional tendency:</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium font-mono ${
            isOverforecastBias ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
          }`}>
            {isOverforecastBias ? 'Overforecast (+)' : 'Underforecast (-)'}
          </span>
        </div>
      </div>

      {/* 4. Match & Coverage Card */}
      <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Data Coverage & Match Rate
          </span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {coverageRate}%
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({matchedCount}/{totalTargetIntervals} SPs)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Over vs Under:</span>
          <span className="font-mono text-slate-300">
            <span className="text-rose-300">{overforecastCount}</span> / <span className="text-cyan-300">{underforecastCount}</span>
          </span>
        </div>
      </div>

    </div>
  );
}
