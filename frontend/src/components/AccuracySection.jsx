import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { BarChart2, Calendar, AlertOctagon, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AccuracySection({ accuracyData, largestErrors }) {
  const [activeTab, setActiveTab] = useState('distribution'); // 'distribution' | 'daily' | 'tailErrors'

  if (!accuracyData) return null;

  const { metrics, dailySummary = [], errorDistribution = [] } = accuracyData;

  return (
    <div className="bg-[#0b1329] border border-slate-800/80 rounded-xl p-5 shadow-sm space-y-4">
      
      {/* Section Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center">
            <BarChart2 className="h-4 w-4 text-teal-400 mr-2" />
            Forecast Accuracy & Discrepancy Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical breakdown of forecast errors: distribution profile, daily aggregations, and extreme tail variance.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'distribution' ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Error Distribution
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'daily' ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily Breakdown
          </button>
          <button
            onClick={() => setActiveTab('tailErrors')}
            className={`px-3 py-1 rounded transition ${
              activeTab === 'tailErrors' ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Largest Deviations
          </button>
        </div>
      </div>

      {/* Tab 1: Error Distribution Histogram */}
      {activeTab === 'distribution' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Histogram of Signed Errors (Forecast - Actual in MW)</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-cyan-400 mr-1" />
                Underforecast (&lt;0 MW)
              </span>
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-rose-400 mr-1" />
                Overforecast (&gt;0 MW)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="binCenter"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
                  label={{ value: 'Error Range (MW)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  label={{ value: 'Interval Count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#091124] border border-slate-700 p-2.5 rounded shadow-lg text-xs font-mono">
                        <div className="font-semibold text-slate-200">{item.bin}</div>
                        <div className="text-teal-400 mt-1">Count: {item.count} intervals</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {errorDistribution.map((entry, index) => {
                    const isPositive = entry.binCenter > 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isPositive ? '#f43f5e' : '#06b6d4'}
                        opacity={0.8}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Breakdown Table */}
      {activeTab === 'daily' && (
        <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#091124] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Delivery Date</th>
                <th className="py-2.5 px-3 text-right">MAE (MW)</th>
                <th className="py-2.5 px-3 text-right">RMSE (MW)</th>
                <th className="py-2.5 px-3 text-right">Mean Bias</th>
                <th className="py-2.5 px-3 text-right">Actual Energy</th>
                <th className="py-2.5 px-3 text-right">Forecast Energy</th>
                <th className="py-2.5 px-3 text-right">Matched SPs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {dailySummary.map((d) => (
                <tr key={d.date} className="hover:bg-slate-800/30 transition">
                  <td className="py-2 px-3 font-medium text-white">{d.date}</td>
                  <td className="py-2 px-3 text-right text-teal-300">{d.mae.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-amber-300">{d.rmse.toLocaleString()}</td>
                  <td className={`py-2 px-3 text-right font-semibold ${
                    d.meanError > 0 ? 'text-rose-400' : d.meanError < 0 ? 'text-cyan-400' : 'text-slate-300'
                  }`}>
                    {d.meanError > 0 ? `+${d.meanError}` : d.meanError} MW
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400">{d.actualEnergyGWh.toFixed(1)} GWh</td>
                  <td className="py-2 px-3 text-right text-cyan-300">{d.forecastEnergyGWh.toFixed(1)} GWh</td>
                  <td className="py-2 px-3 text-right text-slate-400">{d.matchedCount} / {d.totalIntervals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Largest Discrepancies */}
      {activeTab === 'tailErrors' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Top observed absolute prediction discrepancies in the selected period. These intervals represent high imbalance risk.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(largestErrors || []).map((err, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-semibold text-slate-200">{err.startTime.replace('T', ' ').replace('Z', ' UTC')}</span>
                  <span className="text-slate-400">SP {err.settlementPeriod}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Actual:</span>
                  <span className="font-bold text-emerald-400">{err.actualGeneration?.toLocaleString()} MW</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Day-Ahead Forecast:</span>
                  <span className="font-bold text-cyan-400">{err.forecastGeneration?.toLocaleString()} MW</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Error:</span>
                  <span className={`font-bold ${err.error > 0 ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {err.error > 0 ? `+${err.error}` : err.error} MW ({err.error > 0 ? 'Overforecast' : 'Underforecast'})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
