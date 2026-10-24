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
    <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl p-6 shadow-sm space-y-5">
      
      {/* Section Header & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E6E4D9] gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1C2421] flex items-center font-sans">
            <BarChart2 className="h-4 w-4 text-[#245C46] mr-2" />
            Empirical Error Distribution & Volatility Analysis
          </h2>
          <p className="text-xs text-[#5C6460] mt-0.5 font-sans">
            Statistical breakdown of forecast errors across the selected January 2026 delivery period.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-[#F0EFE7] border border-[#DBD8CA] p-1 rounded-xl text-xs font-mono">
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'distribution'
                ? 'bg-[#245C46] text-[#F5F4ED] font-semibold shadow-sm'
                : 'text-[#5C6460] hover:text-[#1C2421]'
            }`}
          >
            Error Distribution
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-[#245C46] text-[#F5F4ED] font-semibold shadow-sm'
                : 'text-[#5C6460] hover:text-[#1C2421]'
            }`}
          >
            Daily Breakdown
          </button>
          <button
            onClick={() => setActiveTab('tailErrors')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'tailErrors'
                ? 'bg-[#245C46] text-[#F5F4ED] font-semibold shadow-sm'
                : 'text-[#5C6460] hover:text-[#1C2421]'
            }`}
          >
            Tail Deviations
          </button>
        </div>
      </div>

      {/* Tab 1: Histogram */}
      {activeTab === 'distribution' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#5C6460] font-mono">
            <span>Signed Error Frequency Bins (Forecast - Actual in MW)</span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-[#245C46] mr-1.5" />
                Underforecast (&lt;0 MW)
              </span>
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-[#D76B42] mr-1.5" />
                Overforecast (&gt;0 MW)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#E2DFD2" vertical={false} />
                <XAxis
                  dataKey="binCenter"
                  stroke="#8A928D"
                  tick={{ fontSize: 10, fill: '#5C6460', fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}`}
                  label={{ value: 'Error Range (MW)', position: 'insideBottom', offset: -10, fill: '#5C6460', fontSize: 11 }}
                />
                <YAxis
                  stroke="#8A928D"
                  tick={{ fontSize: 10, fill: '#5C6460', fontFamily: 'IBM Plex Mono' }}
                  label={{ value: 'Interval Count', angle: -90, position: 'insideLeft', fill: '#5C6460', fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#FAF9F5] border border-[#DBD8CA] p-2.5 rounded-lg shadow-lg text-xs font-mono">
                        <div className="font-semibold text-[#1C2421]">{item.bin}</div>
                        <div className="text-[#245C46] font-bold mt-1">Count: {item.count} settlement periods</div>
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
                        fill={isPositive ? '#D76B42' : '#245C46'}
                        opacity={0.85}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Table */}
      {activeTab === 'daily' && (
        <div className="overflow-x-auto max-h-72 border border-[#DBD8CA] rounded-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F0EFE7] text-[#5C6460] uppercase tracking-wider sticky top-0 border-b border-[#DBD8CA]">
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
            <tbody className="divide-y divide-[#E6E4D9] text-[#1C2421] bg-[#FAF9F5]">
              {dailySummary.map((d) => (
                <tr key={d.date} className="hover:bg-[#F0EFE7]/50 transition">
                  <td className="py-2 px-3 font-semibold text-[#1C2421]">{d.date}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#245C46]">{d.mae.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-[#A67F30]">{d.rmse.toLocaleString()}</td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      d.meanError > 0 ? 'text-[#D76B42]' : d.meanError < 0 ? 'text-[#245C46]' : 'text-[#5C6460]'
                    }`}
                  >
                    {d.meanError > 0 ? `+${d.meanError}` : d.meanError} MW
                  </td>
                  <td className="py-2 px-3 text-right text-[#245C46]">{d.actualEnergyGWh.toFixed(1)} GWh</td>
                  <td className="py-2 px-3 text-right text-[#A67F30]">{d.forecastEnergyGWh.toFixed(1)} GWh</td>
                  <td className="py-2 px-3 text-right text-[#5C6460]">{d.matchedCount} / {d.totalIntervals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Tail Errors */}
      {activeTab === 'tailErrors' && (
        <div className="space-y-3">
          <div className="text-xs text-[#5C6460]">
            Top observed prediction discrepancies in the selected period. These intervals represent acute imbalance settlement exposures.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(largestErrors || []).map((err, idx) => (
              <div
                key={idx}
                className="bg-[#F0EFE7]/60 border border-[#DBD8CA] rounded-xl p-3.5 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between border-b border-[#DBD8CA] pb-1.5">
                  <span className="font-bold text-[#1C2421]">
                    {err.startTime.replace('T', ' ').replace('Z', ' UTC')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF9F5] border border-[#DBD8CA] text-[#5C6460]">
                    SP {err.settlementPeriod}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5C6460] font-sans">Actual:</span>
                  <span className="font-bold text-[#245C46]">{err.actualGeneration?.toLocaleString()} MW</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5C6460] font-sans">DA Forecast:</span>
                  <span className="font-bold text-[#A67F30]">{err.forecastGeneration?.toLocaleString()} MW</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-[#DBD8CA]">
                  <span className="text-[#5C6460] font-sans">Signed Error:</span>
                  <span
                    className={`font-bold ${
                      err.error > 0 ? 'text-[#D76B42]' : 'text-[#245C46]'
                    }`}
                  >
                    {err.error > 0 ? `+${err.error.toLocaleString()}` : err.error.toLocaleString()} MW
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
