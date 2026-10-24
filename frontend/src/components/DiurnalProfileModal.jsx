import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

/**
 * Custom tooltip for the Diurnal 48-Settlement-Period curve.
 */
function DiurnalTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="p-3 text-xs font-mono bg-white border-2 border-rule shadow-xl text-ink rounded-[3px]">
      <div className="font-bold border-b border-rule pb-1 mb-1.5 flex justify-between">
        <span className="font-semibold text-ink">SP {d.sp}</span>
        <span className="text-muted">{d.clockTime} UTC</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between space-x-5">
          <span className="text-forest font-medium">Avg Actual:</span>
          <span className="font-bold text-ink">{Math.round(d.avgActual).toLocaleString()} MW</span>
        </div>
        <div className="flex justify-between space-x-5">
          <span className="text-copper font-medium">Avg Forecast:</span>
          <span className="font-bold text-ink">{Math.round(d.avgForecast).toLocaleString()} MW</span>
        </div>
        <div className="flex justify-between space-x-5 pt-1 border-t border-rule">
          <span className="text-muted">Mean Bias:</span>
          <span className={`font-bold ${d.avgBias >= 0 ? 'text-copper' : 'text-forest'}`}>
            {d.avgBias > 0 ? '+' : ''}{Math.round(d.avgBias).toLocaleString()} MW
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DiurnalProfileModal({ isOpen, onClose, data = [] }) {
  if (!isOpen) return null;

  // Compute 48 SP aggregates
  const diurnalData = useMemo(() => {
    const spMap = Array.from({ length: 48 }, (_, i) => ({
      sp: i + 1,
      clockTime: `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`,
      actSum: 0,
      fcSum: 0,
      errSum: 0,
      count: 0
    }));

    (data || []).forEach((item) => {
      const sp = item.settlementPeriod;
      if (sp >= 1 && sp <= 48 && item.actualGeneration !== null && item.forecastGeneration !== null) {
        const entry = spMap[sp - 1];
        entry.actSum += item.actualGeneration;
        entry.fcSum += item.forecastGeneration;
        entry.errSum += (item.error !== null ? item.error : item.forecastGeneration - item.actualGeneration);
        entry.count += 1;
      }
    });

    return spMap.map((entry) => ({
      sp: entry.sp,
      clockTime: entry.clockTime,
      avgActual: entry.count ? entry.actSum / entry.count : 0,
      avgForecast: entry.count ? entry.fcSum / entry.count : 0,
      avgBias: entry.count ? entry.errSum / entry.count : 0,
      count: entry.count
    }));
  }, [data]);

  // Find peak and trough bias
  const stats = useMemo(() => {
    if (!diurnalData.length) return null;
    const sorted = [...diurnalData].sort((a, b) => b.avgBias - a.avgBias);
    return {
      peakSP: sorted[0],
      troughSP: sorted[sorted.length - 1],
      overallMeanBias: diurnalData.reduce((acc, c) => acc + c.avgBias, 0) / (diurnalData.length || 1)
    };
  }, [diurnalData]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* 100% Solid, Fully Opaque Modal Card */}
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-rule-dark shadow-2xl rounded-md text-ink relative z-[101]">
        
        {/* Solid Header */}
        <div className="flex items-baseline justify-between p-6 border-b border-rule bg-[#FAF9F5]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted font-bold">
                Market Analytics
              </span>
              <span className="text-rule">/</span>
              <span className="font-mono text-xs font-bold text-copper">Diurnal Profile</span>
            </div>
            <h3 className="font-serif text-2xl font-normal text-ink mt-1">
              48-Settlement-Period Diurnal Bias Curve
            </h3>
            <p className="text-xs text-muted font-sans mt-0.5">
              Average actual versus day-ahead forecast generation by half-hour settlement period across January 2026.
            </p>
          </div>

          <button
            onClick={onClose}
            className="font-mono text-xs px-3 py-1.5 bg-white border border-rule hover:border-ink hover:text-ink text-muted font-semibold transition cursor-pointer rounded-[3px] shadow-2xs"
          >
            Close [ESC]
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 bg-white">
          
          {/* Main Diurnal Chart */}
          <div className="p-4 bg-[#FAF9F5] border border-rule rounded-sm">
            <div className="flex items-center justify-between text-xs font-mono mb-2 text-muted">
              <span className="uppercase text-[10px] tracking-wider font-semibold text-ink">
                Average Generation (MW) by Settlement Period
              </span>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-forest inline-block" />
                  <span className="text-forest font-bold">Avg Actual</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 border-b border-dashed border-copper inline-block" />
                  <span className="text-copper font-bold">Avg Forecast</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart syncId="diurnalSync" data={diurnalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    stroke="#E5E4DC"
                    strokeWidth={0.7}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="sp"
                    stroke="#777D74"
                    tick={{ fontSize: 10, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
                    tickFormatter={(sp) => {
                      if (sp === 1) return '00:00';
                      if (sp === 9) return '04:00';
                      if (sp === 17) return '08:00';
                      if (sp === 25) return '12:00';
                      if (sp === 33) return '16:00';
                      if (sp === 41) return '20:00';
                      if (sp === 48) return '23:30';
                      return '';
                    }}
                    interval={0}
                  />
                  <YAxis
                    stroke="#777D74"
                    tick={{ fontSize: 10, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    width={45}
                  />
                  <Tooltip content={<DiurnalTooltip />} />
                  <ReferenceLine y={0} stroke="#DDDCD2" />

                  {/* Actual Line */}
                  <Line
                    type="monotone"
                    dataKey="avgActual"
                    name="Avg Actual"
                    stroke="#245C46"
                    strokeWidth={2.4}
                    dot={false}
                  />

                  {/* Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="avgForecast"
                    name="Avg Forecast"
                    stroke="#B96848"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diurnal Signed Bias Bars */}
          <div className="p-4 bg-[#FAF9F5] border border-rule rounded-sm">
            <div className="flex items-center justify-between text-xs font-mono mb-2 text-muted">
              <span className="uppercase text-[10px] tracking-wider font-semibold text-ink">
                Average Signed Bias by Settlement Period (MW)
              </span>
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-copper">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#B96848] inline-block" />
                <span>Forecast Overprediction (Shortfall)</span>
              </div>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart syncId="diurnalSync" data={diurnalData} margin={{ top: 2, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#E5E4DC" strokeWidth={0.6} vertical={false} />
                  <XAxis dataKey="sp" hide={true} />
                  <YAxis
                    stroke="#777D74"
                    tick={{ fontSize: 9, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
                    tickFormatter={(v) => `+${(v / 1000).toFixed(1)}k`}
                    width={45}
                  />
                  <Tooltip content={<DiurnalTooltip />} />
                  <ReferenceLine y={0} stroke="#777D74" strokeWidth={1} />
                  <Bar
                    dataKey="avgBias"
                    fill="#B96848"
                    opacity={0.88}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analytical Takeaway Card */}
          {stats && (
            <div className="p-4 bg-[#F6F5EF] border border-rule rounded-sm font-sans text-xs leading-relaxed text-ink">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-1">
                Quantitative Trading Insight
              </div>
              <p>
                Day-ahead forecasts exhibited a persistent positive bias across <strong>every settlement period (1–48)</strong>. 
                The most severe overprediction occurred during the early morning wind ramp (
                <strong className="text-copper font-bold">
                  SP {stats.peakSP.sp} ({stats.peakSP.clockTime} UTC) at +{Math.round(stats.peakSP.avgBias).toLocaleString()} MW average shortfall
                </strong>
                ). The forecast was closest to actual generation during the late afternoon (
                <strong className="text-forest font-bold">
                  SP {stats.troughSP.sp} ({stats.troughSP.clockTime} UTC) with +{Math.round(stats.troughSP.avgBias).toLocaleString()} MW bias
                </strong>
                ).
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
