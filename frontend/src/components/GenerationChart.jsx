import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Layers, Eye, EyeOff } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const {
    startTime,
    deliveryDate,
    settlementPeriod,
    actualGeneration,
    forecastGeneration,
    forecastPublishTime,
    error,
    isMatched
  } = dataPoint;

  const formattedTime = startTime ? startTime.replace('T', ' ').replace('Z', ' UTC') : label;

  return (
    <div className="bg-[#091124] border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs font-mono max-w-sm">
      <div className="border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-200">{formattedTime}</span>
        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-bold">
          SP {settlementPeriod}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-emerald-400 flex items-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5" />
            Actual (FUELHH):
          </span>
          <span className="font-bold text-slate-100">
            {actualGeneration !== null ? `${actualGeneration.toLocaleString()} MW` : 'N/A (Missing)'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-cyan-400 flex items-center">
            <span className="h-2 w-2 rounded-full bg-cyan-400 mr-1.5" />
            Day-Ahead Forecast:
          </span>
          <span className="font-bold text-slate-100">
            {forecastGeneration !== null ? `${forecastGeneration.toLocaleString()} MW` : 'N/A (No forecast)'}
          </span>
        </div>

        {forecastPublishTime && (
          <div className="text-[10px] text-slate-400 pl-3.5">
            Published: {forecastPublishTime.replace('T', ' ').replace('Z', ' UTC')}
          </div>
        )}

        {isMatched && error !== null && (
          <div className="border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
            <span className="text-slate-400">Forecast Error:</span>
            <span className={`font-bold ${error > 0 ? 'text-rose-400' : error < 0 ? 'text-cyan-400' : 'text-slate-300'}`}>
              {error > 0 ? `+${error}` : error} MW ({error > 0 ? 'Over' : 'Under'})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function GenerationChart({ data, loading }) {
  const [showErrorBar, setShowErrorBar] = useState(false);
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);

  if (loading) {
    return (
      <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-6 h-96 flex flex-col items-center justify-center text-slate-400">
        <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-mono">Loading time-series generation data...</span>
      </div>
    );
  }

  if (!data || !data.length) {
    return (
      <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-6 h-96 flex items-center justify-center text-slate-400">
        <span className="text-sm font-mono">No generation intervals available for the selected range.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-5 shadow-sm">
      
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center">
            <TrendingUp className="h-4 w-4 text-teal-400 mr-2" />
            National Wind Generation: Actual vs. Day-Ahead Forecast
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing 30-minute FUELHH actual wind generation against the latest WINDFOR forecast published prior to the D-1 cutoff.
          </p>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1 transition ${
              showActual ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700 text-slate-500'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1" />
            <span>Actual</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1 transition ${
              showForecast ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-slate-800/40 border-slate-700 text-slate-500'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-cyan-400 mr-1" />
            <span>Forecast</span>
          </button>

          <button
            onClick={() => setShowErrorBar(!showErrorBar)}
            className={`px-2.5 py-1 rounded border flex items-center space-x-1 transition ${
              showErrorBar ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-800/40 border-slate-700 text-slate-500'
            }`}
          >
            <span>Error Bars</span>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="mt-4 h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="startTime"
              tickFormatter={(v) => {
                if (!v) return '';
                // Format: MM-DD HH:mm
                const parts = v.split('T');
                if (parts.length === 2) {
                  const dateParts = parts[0].split('-');
                  const timeParts = parts[1].slice(0, 5);
                  return `${dateParts[1]}/${dateParts[2]} ${timeParts}`;
                }
                return v;
              }}
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={40}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              unit=" MW"
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#334155" />

            {/* Error Bars if toggled */}
            {showErrorBar && (
              <Bar
                dataKey="error"
                name="Signed Error (MW)"
                fill="#f59e0b"
                opacity={0.4}
              />
            )}

            {/* Actual Generation Area */}
            {showActual && (
              <Area
                type="monotone"
                dataKey="actualGeneration"
                name="Actual Wind (FUELHH)"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#actualGradient)"
                connectNulls={false}
              />
            )}

            {/* Forecast Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecastGeneration"
                name="Day-Ahead Forecast (WINDFOR)"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                connectNulls={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend / Notes */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-4 bg-[#10b981]" />
            <span>Actual (FUELHH WIND)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-4 border-b-2 border-dashed border-[#06b6d4]" />
            <span>Day-Ahead Forecast (WINDFOR)</span>
          </div>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Resolution: 30-min settlement periods (UK GMT / UTC+00:00)
        </div>
      </div>

    </div>
  );
}
