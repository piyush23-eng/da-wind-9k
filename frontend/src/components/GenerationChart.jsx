import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Activity,
  Layers,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

/**
 * Editorial Tooltip styled for financial research and energy analytics.
 */
const EditorialTooltip = ({ active, payload, label, selectedPoint }) => {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  const {
    startTime,
    settlementPeriod,
    actualGeneration,
    forecastGeneration,
    forecastPublishTime,
    error,
    absoluteError,
    isMatched,
    missingReason
  } = point;

  const formattedDate = startTime
    ? startTime.replace('T', ' ').replace('Z', ' UTC')
    : label;

  const isOver = error > 0;
  const isUnder = error < 0;

  return (
    <div className="bg-[#FAF9F5] border border-[#DBD8CA] p-3.5 rounded-lg shadow-xl text-xs font-sans max-w-xs transition-all pointer-events-none">
      {/* Tooltip Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E6E4D9]">
        <div>
          <span className="font-mono font-semibold text-[#1C2421] tracking-tight">
            {formattedDate}
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-[#EDECE3] text-[#1C2421] font-mono text-[10px] font-medium border border-[#DBD8CA]">
          SP {settlementPeriod}
        </span>
      </div>

      {/* Series Data */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[#5C6460] flex items-center font-sans">
            <span className="h-2 w-2 rounded-full bg-[#245C46] mr-1.5" />
            Actual (FUELHH):
          </span>
          <span className="font-bold text-[#245C46]">
            {actualGeneration !== null ? `${actualGeneration.toLocaleString()} MW` : 'Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#5C6460] flex items-center font-sans">
            <span className="h-2 w-2 rounded-full bg-[#C69A42] mr-1.5" />
            Day-Ahead Forecast:
          </span>
          <span className="font-bold text-[#A67F30]">
            {forecastGeneration !== null ? `${forecastGeneration.toLocaleString()} MW` : 'No forecast'}
          </span>
        </div>

        {forecastPublishTime && (
          <div className="text-[10px] text-[#8A928D] pl-3.5 pt-0.5 font-mono">
            Published: {forecastPublishTime.replace('T', ' ').replace('Z', '')}
          </div>
        )}

        {isMatched && error !== null ? (
          <div className="mt-2 pt-2 border-t border-[#E6E4D9] flex items-center justify-between">
            <span className="text-[#5C6460] font-sans">Forecast Error:</span>
            <span
              className={`font-bold ${
                isOver ? 'text-[#D76B42]' : isUnder ? 'text-[#245C46]' : 'text-[#5C6460]'
              }`}
            >
              {error > 0 ? `+${error.toLocaleString()}` : error.toLocaleString()} MW
              <span className="text-[10px] font-normal ml-1 text-[#8A928D]">
                ({isOver ? 'Over' : isUnder ? 'Under' : 'Exact'})
              </span>
            </span>
          </div>
        ) : (
          <div className="mt-1 pt-1 text-[11px] text-[#D76B42] font-sans">
            Status: {missingReason || 'Unmatched Interval'}
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-[#8A928D] text-right font-sans italic">
        Click to lock interval inspection
      </div>
    </div>
  );
};

export default function GenerationChart({
  data = [],
  loading = false,
  metrics = null,
  startDate,
  endDate,
  onRangeChange,
  cutoffTime,
  onCutoffChange
}) {
  // Visual Toggles
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showGapArea, setShowGapArea] = useState(true);
  const [showErrorRibbon, setShowErrorRibbon] = useState(true);

  // Inspector State for clicked interval
  const [selectedInterval, setSelectedInterval] = useState(null);

  // Quick range filters
  const quickTimeframes = [
    { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Week 1 (1–7)', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Week 2 (8–14)', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Week 3 (15–21)', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Week 4 (22–28)', start: '2026-01-22', end: '2026-01-28' },
    { label: 'Late Jan (25–31)', start: '2026-01-25', end: '2026-01-31' },
  ];

  // Process data for the gap visualization and dual series
  const chartData = useMemo(() => {
    if (!data || !data.length) return [];
    return data.map((item) => {
      const act = item.actualGeneration;
      const fc = item.forecastGeneration;
      const err = item.error;

      return {
        ...item,
        // Lower and upper bounds for gap shading
        gapLower: act !== null && fc !== null ? Math.min(act, fc) : null,
        gapUpper: act !== null && fc !== null ? Math.max(act, fc) : null,
        // Split errors for the synchronized ribbon
        positiveError: err !== null && err > 0 ? err : 0,
        negativeError: err !== null && err < 0 ? err : 0,
      };
    });
  }, [data]);

  // Compute active slice summary stats on the fly
  const periodStats = useMemo(() => {
    if (!chartData || !chartData.length) return null;
    const matched = chartData.filter((d) => d.isMatched && d.error !== null);
    if (!matched.length) return null;

    const absErrors = matched.map((d) => Math.abs(d.error));
    const errors = matched.map((d) => d.error);
    const mae = absErrors.reduce((a, b) => a + b, 0) / matched.length;
    const rmse = Math.sqrt(
      errors.reduce((a, b) => a + b * b, 0) / matched.length
    );
    const meanBias = errors.reduce((a, b) => a + b, 0) / matched.length;

    // Total actual & forecast energy (MWh = sum(MW * 0.5h))
    const actualMWh =
      matched.reduce((sum, d) => sum + (d.actualGeneration || 0) * 0.5, 0) / 1000;
    const forecastMWh =
      matched.reduce((sum, d) => sum + (d.forecastGeneration || 0) * 0.5, 0) / 1000;

    return {
      count: chartData.length,
      matchedCount: matched.length,
      mae: Math.round(mae * 10) / 10,
      rmse: Math.round(rmse * 10) / 10,
      bias: Math.round(meanBias * 10) / 10,
      actualGWh: Math.round(actualMWh * 10) / 10,
      forecastGWh: Math.round(forecastMWh * 10) / 10,
    };
  }, [chartData]);

  const handleChartClick = (e) => {
    if (e && e.activePayload && e.activePayload.length) {
      setSelectedInterval(e.activePayload[0].payload);
    }
  };

  return (
    <div className="bg-[#FAF9F5] border border-[#DBD8CA] rounded-2xl shadow-sm overflow-hidden">
      
      {/* 1. EDITORIAL HEADER & METRIC MASTHEAD */}
      <div className="p-6 pb-4 border-b border-[#E6E4D9]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#5C6460] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#245C46]" />
              <span>Great Britain National Grid</span>
              <span>•</span>
              <span>Day-Ahead Decision Horizon</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C2421] mt-1 font-sans">
              National Wind Power Generation vs. Eligible Day-Ahead Forecast
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6460] mt-1 max-w-3xl leading-relaxed">
              Continuous 30-minute settlement period comparison between outturn generation (FUELHH WIND) and the latest forecast (WINDFOR) published prior to the D-1 purchasing cutoff.
            </p>
          </div>

          {/* Timeframe Range Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F0EFE7] p-1.5 rounded-xl border border-[#DBD8CA] text-xs font-medium">
            <span className="text-[11px] text-[#5C6460] px-2 font-mono flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-[#5C6460]" />
              Horizon:
            </span>
            {quickTimeframes.map((tf) => {
              const isActive = startDate === tf.start && endDate === tf.end;
              return (
                <button
                  key={tf.label}
                  onClick={() => onRangeChange(tf.start, tf.end)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all font-mono ${
                    isActive
                      ? 'bg-[#245C46] text-[#F5F4ED] font-semibold shadow-sm'
                      : 'text-[#5C6460] hover:text-[#1C2421] hover:bg-[#FAF9F5]'
                  }`}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* COMPACT SELECTED PERIOD SUMMARY STRIP */}
        {periodStats && (
          <div className="mt-4 pt-4 border-t border-[#E6E4D9] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            
            <div className="bg-[#FAF9F5] border border-[#E6E4D9] p-2.5 rounded-xl">
              <div className="text-[11px] text-[#5C6460] font-sans font-medium">
                Period Evaluated
              </div>
              <div className="text-[#1C2421] font-bold mt-0.5 text-xs truncate">
                {startDate.slice(5)} to {endDate.slice(5)}, 2026
              </div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E6E4D9] p-2.5 rounded-xl">
              <div className="text-[11px] text-[#5C6460] font-sans font-medium">
                Coverage / SPs
              </div>
              <div className="text-[#1C2421] font-bold mt-0.5 text-xs">
                {periodStats.matchedCount} / {periodStats.count} (
                {Math.round((periodStats.matchedCount / periodStats.count) * 100)}%)
              </div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E6E4D9] p-2.5 rounded-xl">
              <div className="text-[11px] text-[#5C6460] font-sans font-medium">
                Period MAE
              </div>
              <div className="text-[#245C46] font-bold mt-0.5 text-sm">
                {periodStats.mae.toLocaleString()} <span className="text-[10px] text-[#5C6460]">MW</span>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E6E4D9] p-2.5 rounded-xl">
              <div className="text-[11px] text-[#5C6460] font-sans font-medium">
                Period RMSE
              </div>
              <div className="text-[#A67F30] font-bold mt-0.5 text-sm">
                {periodStats.rmse.toLocaleString()} <span className="text-[10px] text-[#5C6460]">MW</span>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E6E4D9] p-2.5 rounded-xl">
              <div className="text-[11px] text-[#5C6460] font-sans font-medium">
                Mean Bias
              </div>
              <div
                className={`font-bold mt-0.5 text-sm ${
                  periodStats.bias > 0
                    ? 'text-[#D76B42]'
                    : periodStats.bias < 0
                    ? 'text-[#245C46]'
                    : 'text-[#1C2421]'
                }`}
              >
                {periodStats.bias > 0 ? `+${periodStats.bias}` : periodStats.bias}{' '}
                <span className="text-[10px] font-sans text-[#5C6460]">
                  ({periodStats.bias > 0 ? 'Over' : 'Under'})
                </span>
              </div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E6E4D9] p-2.5 rounded-xl">
              <div className="text-[11px] text-[#5C6460] font-sans font-medium">
                Energy (Act vs Fc)
              </div>
              <div className="text-[#1C2421] font-bold mt-0.5 text-xs truncate">
                {periodStats.actualGWh} vs {periodStats.forecastGWh} GWh
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 2. CHART TOOLBAR & INTERACTIVE TOGGLES */}
      <div className="px-6 py-2.5 bg-[#F0EFE7]/60 border-b border-[#E6E4D9] flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Series Legends & Toggles */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <span className="text-[#5C6460] text-[11px] font-sans mr-1">Series:</span>

          <button
            onClick={() => setShowActual(!showActual)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showActual
                ? 'bg-[#245C46]/10 border-[#245C46]/40 text-[#245C46] font-semibold'
                : 'bg-[#FAF9F5] border-[#DBD8CA] text-[#8A928D]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#245C46]" />
            <span>Actual Wind</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showForecast
                ? 'bg-[#C69A42]/15 border-[#C69A42]/50 text-[#A67F30] font-semibold'
                : 'bg-[#FAF9F5] border-[#DBD8CA] text-[#8A928D]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#C69A42]" />
            <span>Day-Ahead Forecast</span>
          </button>

          <button
            onClick={() => setShowGapArea(!showGapArea)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showGapArea
                ? 'bg-[#D76B42]/15 border-[#D76B42]/40 text-[#B8532D] font-semibold'
                : 'bg-[#FAF9F5] border-[#DBD8CA] text-[#8A928D]'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Gap Shading</span>
          </button>

          <button
            onClick={() => setShowErrorRibbon(!showErrorRibbon)}
            className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
              showErrorRibbon
                ? 'bg-[#1C2421]/10 border-[#1C2421]/30 text-[#1C2421] font-semibold'
                : 'bg-[#FAF9F5] border-[#DBD8CA] text-[#8A928D]'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span>Synchronized Error Strip</span>
          </button>
        </div>

        {/* D-1 Cutoff Controller */}
        <div className="flex items-center space-x-2 font-mono">
          <Clock className="h-3.5 w-3.5 text-[#5C6460]" />
          <span className="text-[#5C6460] font-sans text-xs">Decision Gate (D-1):</span>
          <select
            value={cutoffTime}
            onChange={(e) => onCutoffChange(e.target.value)}
            className="bg-[#FAF9F5] border border-[#DBD8CA] text-[#1C2421] font-mono font-medium rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
          >
            <option value="11:00:00">11:00 UTC (EPEX SPOT Auction)</option>
            <option value="12:00:00">12:00 UTC (NordPool GB DA)</option>
            <option value="14:00:00">14:00 UTC (Post-Auction)</option>
            <option value="17:00:00">17:00 UTC (Standard D-1 Close)</option>
            <option value="23:00:00">23:00 UTC (D-1 Final)</option>
          </select>
        </div>

      </div>

      {/* 3. MAIN SIGNATURE TIME-SERIES VISUALIZATION */}
      <div className="p-6 pt-4 space-y-4">
        
        {loading ? (
          <div className="h-[440px] flex flex-col items-center justify-center text-[#5C6460] bg-[#FAF9F5]">
            <div className="h-8 w-8 border-2 border-[#245C46] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="font-mono text-sm">Evaluating time-series stream...</span>
          </div>
        ) : !chartData.length ? (
          <div className="h-[440px] flex items-center justify-center text-[#8A928D] font-mono text-sm">
            No data available for the selected delivery interval.
          </div>
        ) : (
          <div className="space-y-2">
            
            {/* Primary Generation Canvas (360px) */}
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  syncId="windscopeSync"
                  onClick={handleChartClick}
                  margin={{ top: 12, right: 16, left: 10, bottom: 0 }}
                >
                  <defs>
                    {/* Subtle Forest Green Gradient under Actual */}
                    <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#245C46" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#245C46" stopOpacity={0.0} />
                    </linearGradient>

                    {/* Muted Amber Gap Shading between Forecast and Actual */}
                    <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C69A42" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#D76B42" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>

                  {/* Extremely subtle editorial gridlines */}
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="#E2DFD2"
                    vertical={false}
                  />

                  {/* Date & Time X-Axis */}
                  <XAxis
                    dataKey="startTime"
                    tickFormatter={(v) => {
                      if (!v) return '';
                      const parts = v.split('T');
                      if (parts.length === 2) {
                        const [year, month, day] = parts[0].split('-');
                        const time = parts[1].slice(0, 5);
                        // Format clean editorial date: '01/05' or '01/05 12:00'
                        return `${month}/${day} ${time === '00:00' ? '' : time}`;
                      }
                      return v;
                    }}
                    stroke="#8A928D"
                    tick={{ fontSize: 11, fill: '#5C6460', fontFamily: 'IBM Plex Mono' }}
                    minTickGap={45}
                    axisLine={{ stroke: '#DBD8CA' }}
                    tickLine={{ stroke: '#DBD8CA' }}
                  />

                  {/* Generation Y-Axis */}
                  <YAxis
                    stroke="#8A928D"
                    tick={{ fontSize: 11, fill: '#5C6460', fontFamily: 'IBM Plex Mono' }}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    unit=" MW"
                    domain={['auto', 'auto']}
                    axisLine={{ stroke: '#DBD8CA' }}
                    tickLine={{ stroke: '#DBD8CA' }}
                    width={60}
                  />

                  <Tooltip
                    content={<EditorialTooltip selectedPoint={selectedInterval} />}
                    isAnimationActive={false}
                  />

                  {/* Gap Shading Area: Highlights the spread between Forecast and Actual */}
                  {showGapArea && (
                    <Area
                      type="monotone"
                      dataKey="forecastGeneration"
                      fill="url(#gapGradient)"
                      stroke="none"
                      connectNulls={false}
                    />
                  )}

                  {/* Actual Wind Generation (Forest Green) */}
                  {showActual && (
                    <Area
                      type="monotone"
                      dataKey="actualGeneration"
                      name="Actual Wind (FUELHH)"
                      stroke="#245C46"
                      strokeWidth={2.5}
                      fill="url(#actualAreaGradient)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#245C46', stroke: '#FAF9F5', strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  )}

                  {/* Day-Ahead Forecast (Muted Amber) */}
                  {showForecast && (
                    <Line
                      type="monotone"
                      dataKey="forecastGeneration"
                      name="Day-Ahead Forecast (WINDFOR)"
                      stroke="#C69A42"
                      strokeWidth={2.2}
                      strokeDasharray="5 3"
                      dot={false}
                      activeDot={{ r: 5, fill: '#C69A42', stroke: '#FAF9F5', strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Synchronized Error Ribbon (Zero-Centred Strip, 120px) */}
            {showErrorRibbon && (
              <div className="pt-2 border-t border-[#E6E4D9]">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#5C6460] mb-1 px-1">
                  <span className="font-sans font-semibold uppercase tracking-wider text-[#1C2421]">
                    Synchronized Forecast Error Ribbon (Forecast - Actual in MW)
                  </span>
                  <div className="flex items-center space-x-3 text-[10px]">
                    <span className="flex items-center text-[#D76B42] font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D76B42] mr-1" />
                      + Overforecast (Shortfall Risk)
                    </span>
                    <span className="flex items-center text-[#245C46] font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#245C46] mr-1" />
                      - Underforecast (Spill Risk)
                    </span>
                  </div>
                </div>

                <div className="h-[105px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      syncId="windscopeSync"
                      onClick={handleChartClick}
                      margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="2 4" stroke="#E2DFD2" vertical={false} />

                      <XAxis
                        dataKey="startTime"
                        hide={true}
                      />

                      <YAxis
                        stroke="#8A928D"
                        tick={{ fontSize: 10, fill: '#5C6460', fontFamily: 'IBM Plex Mono' }}
                        tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
                        domain={['auto', 'auto']}
                        axisLine={{ stroke: '#DBD8CA' }}
                        tickLine={{ stroke: '#DBD8CA' }}
                        width={60}
                      />

                      <ReferenceLine y={0} stroke="#5C6460" strokeWidth={1.2} />

                      <Tooltip
                        content={<EditorialTooltip selectedPoint={selectedInterval} />}
                        isAnimationActive={false}
                      />

                      {/* Positive Error (Overforecast): Signal Orange */}
                      <Bar
                        dataKey="positiveError"
                        fill="#D76B42"
                        opacity={0.85}
                        isAnimationActive={false}
                      />

                      {/* Negative Error (Underforecast): Forest Green */}
                      <Bar
                        dataKey="negativeError"
                        fill="#245C46"
                        opacity={0.85}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 4. CLICK-TO-INSPECT INTERVAL DRAWER */}
        {selectedInterval && (
          <div className="mt-4 p-4 rounded-xl bg-[#F0EFE7] border border-[#DBD8CA] transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-[#DBD8CA] gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-[#245C46] text-[#F5F4ED] font-mono text-xs font-bold">
                  SP {selectedInterval.settlementPeriod}
                </span>
                <span className="font-mono font-bold text-sm text-[#1C2421]">
                  Target Delivery: {selectedInterval.startTime?.replace('T', ' ').replace('Z', ' UTC')}
                </span>
              </div>
              <button
                onClick={() => setSelectedInterval(null)}
                className="text-xs text-[#5C6460] hover:text-[#1C2421] font-mono underline self-start sm:self-auto"
              >
                Close Inspector
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E6E4D9]">
                <div className="text-[11px] text-[#5C6460] font-sans">Actual Outturn</div>
                <div className="font-bold text-[#245C46] text-sm mt-0.5">
                  {selectedInterval.actualGeneration?.toLocaleString()} MW
                </div>
                <div className="text-[10px] text-[#8A928D] mt-0.5">
                  {(selectedInterval.actualGeneration * 0.5).toFixed(1)} MWh
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E6E4D9]">
                <div className="text-[11px] text-[#5C6460] font-sans">Day-Ahead Forecast</div>
                <div className="font-bold text-[#A67F30] text-sm mt-0.5">
                  {selectedInterval.forecastGeneration?.toLocaleString()} MW
                </div>
                <div className="text-[10px] text-[#8A928D] mt-0.5">
                  {(selectedInterval.forecastGeneration * 0.5).toFixed(1)} MWh
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E6E4D9]">
                <div className="text-[11px] text-[#5C6460] font-sans">Signed Discrepancy</div>
                <div
                  className={`font-bold text-sm mt-0.5 ${
                    selectedInterval.error > 0 ? 'text-[#D76B42]' : 'text-[#245C46]'
                  }`}
                >
                  {selectedInterval.error > 0
                    ? `+${selectedInterval.error.toLocaleString()}`
                    : selectedInterval.error?.toLocaleString()}{' '}
                  MW
                </div>
                <div className="text-[10px] text-[#5C6460] font-sans mt-0.5">
                  {selectedInterval.error > 0 ? 'Overforecast Shortfall' : 'Underforecast Spill'}
                </div>
              </div>

              <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E6E4D9]">
                <div className="text-[11px] text-[#5C6460] font-sans">Winning Forecast Vintage</div>
                <div className="font-bold text-[#1C2421] text-[11px] mt-0.5 truncate">
                  {selectedInterval.forecastPublishTime?.replace('T', ' ').replace('Z', '') || 'N/A'}
                </div>
                <div className="text-[10px] text-[#8A928D] mt-0.5 truncate">
                  Cutoff: {selectedInterval.decisionCutoffTime?.replace('T', ' ').replace('Z', '')}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 5. EDITORIAL CHART FOOTNOTE */}
      <div className="px-6 py-3 bg-[#F0EFE7]/40 border-t border-[#E6E4D9] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#5C6460] font-mono gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center">
            <span className="h-0.5 w-3.5 bg-[#245C46] mr-1.5" />
            Actual (FUELHH WIND)
          </span>
          <span className="flex items-center">
            <span className="h-0.5 w-3.5 border-b border-dashed border-[#C69A42] mr-1.5" />
            DA Forecast (WINDFOR)
          </span>
          <span className="flex items-center">
            <span className="h-2 w-2 rounded bg-[#D76B42]/30 mr-1.5" />
            Gap Shading
          </span>
        </div>
        <div className="text-[10px] text-[#8A928D]">
          Resolution: 30-min Settlement Periods (GMT / UTC+00:00) • Zero-lookahead gate enforced
        </div>
      </div>

    </div>
  );
}
