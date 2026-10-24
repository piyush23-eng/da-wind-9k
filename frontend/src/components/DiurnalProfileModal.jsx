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
function DiurnalTooltip({ active, payload, isDark }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div
      className={`p-3 text-xs font-mono border shadow-md ${
        isDark ? 'bg-[#0E201A] border-[#2A5244] text-paper' : 'bg-[#FAF9F5] border-rule text-ink'
      }`}
    >
      <div className="font-bold border-b pb-1 mb-1.5 flex justify-between">
        <span>SP {d.sp}</span>
        <span className="text-muted">{d.clockTime} UTC</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between space-x-4">
          <span className={isDark ? 'text-forest-bright' : 'text-forest'}>Avg Actual:</span>
          <span className="font-bold">{Math.round(d.avgActual).toLocaleString()} MW</span>
        </div>
        <div className="flex justify-between space-x-4">
          <span className={isDark ? 'text-copper-bright' : 'text-copper'}>Avg Forecast:</span>
          <span className="font-bold">{Math.round(d.avgForecast).toLocaleString()} MW</span>
        </div>
        <div className="flex justify-between space-x-4 pt-1 border-t border-rule/50">
          <span className="text-muted">Mean Bias:</span>
          <span className="font-bold text-copper">+{Math.round(d.avgBias).toLocaleString()} MW</span>
        </div>
      </div>
    </div>
  );
}

export default function DiurnalProfileModal({ isOpen, onClose, data = [], viewMode = 'editorial' }) {
  if (!isOpen) return null;

  const isDark = viewMode === 'analysis';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto border shadow-2xl transition-colors duration-200 ${
          isDark
            ? 'bg-forest-deep border-[#2A5244] text-paper'
            : 'bg-paper border-rule text-ink'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-baseline justify-between p-6 border-b ${
            isDark ? 'border-[#2A5244]' : 'border-rule'
          }`}
        >
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold">
                Market Analytics
              </span>
              <span className="text-rule">/</span>
              <span className="font-mono text-xs font-bold text-copper">Diurnal Profile</span>
            </div>
            <h3 className="font-serif text-2xl font-normal mt-1">
              48-Settlement-Period Diurnal Bias Curve
            </h3>
            <p className="text-xs text-muted font-sans mt-0.5">
              Average actual versus day-ahead forecast generation by half-hour settlement period across January 2026.
            </p>
          </div>

          <button
            onClick={onClose}
            className={`font-mono text-xs px-2.5 py-1 border transition cursor-pointer ${
              isDark
                ? 'border-[#2A5244] text-sage hover:text-paper hover:border-paper'
                : 'border-rule text-muted hover:text-ink hover:border-ink'
            }`}
          >
            Close [ESC]
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Main Diurnal Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={diurnalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  stroke={isDark ? '#1F3E33' : '#DDDCD2'}
                  strokeWidth={0.6}
                  vertical={false}
                />
                <XAxis
                  dataKey="sp"
                  stroke={isDark ? '#A9BBAE' : '#777D74'}
                  tick={{ fontSize: 10, fill: isDark ? '#A9BBAE' : '#777D74', fontFamily: 'IBM Plex Mono' }}
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
                  stroke={isDark ? '#A9BBAE' : '#777D74'}
                  tick={{ fontSize: 10, fill: isDark ? '#A9BBAE' : '#777D74', fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                  width={45}
                />
                <Tooltip content={<DiurnalTooltip isDark={isDark} />} />
                <ReferenceLine y={0} stroke={isDark ? '#2A5244' : '#DDDCD2'} />

                {/* Actual Line */}
                <Line
                  type="monotone"
                  dataKey="avgActual"
                  name="Avg Actual"
                  stroke={isDark ? '#3DD598' : '#245C46'}
                  strokeWidth={2.4}
                  dot={false}
                />

                {/* Forecast Line */}
                <Line
                  type="monotone"
                  dataKey="avgForecast"
                  name="Avg Forecast"
                  stroke={isDark ? '#F97316' : '#B96848'}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Diurnal Signed Bias Bars */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2 text-muted">
              <span className="uppercase text-[10px] tracking-wider font-semibold">
                Mean Error by Settlement Period (MW)
              </span>
              <div className="flex items-center space-x-4 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-xs ${isDark ? 'bg-[#F97316]' : 'bg-[#B96848]'}`} />
                  <span>Forecast Overprediction</span>
                </span>
              </div>
            </div>

            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={diurnalData} margin={{ top: 2, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={isDark ? '#1F3E33' : '#DDDCD2'} strokeWidth={0.5} vertical={false} />
                  <XAxis dataKey="sp" hide={true} />
                  <YAxis
                    stroke={isDark ? '#A9BBAE' : '#777D74'}
                    tick={{ fontSize: 9, fill: isDark ? '#A9BBAE' : '#777D74', fontFamily: 'IBM Plex Mono' }}
                    tickFormatter={(v) => `+${(v / 1000).toFixed(1)}k`}
                    width={45}
                  />
                  <ReferenceLine y={0} stroke={isDark ? '#A9BBAE' : '#777D74'} strokeWidth={0.8} />
                  <Bar
                    dataKey="avgBias"
                    fill={isDark ? '#F97316' : '#B96848'}
                    opacity={0.85}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analytical Takeaway Card */}
          {stats && (
            <div
              className={`p-4 border font-sans text-xs leading-relaxed ${
                isDark ? 'bg-[#0E201A] border-[#2A5244]' : 'bg-paper-tint border-rule'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
                Quantitative Trading Insight
              </div>
              <p className="text-ink">
                Day-ahead forecasts exhibited a persistent positive bias in <strong>every settlement period (1–48)</strong>. 
                The most severe overprediction occurred during the early morning wind ramp (
                <strong className="text-copper">
                  SP {stats.peakSP.sp} ({stats.peakSP.clockTime} UTC) at +{Math.round(stats.peakSP.avgBias).toLocaleString()} MW average shortfall
                </strong>
                ). The forecast was most accurate during late afternoon (
                <strong>
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
