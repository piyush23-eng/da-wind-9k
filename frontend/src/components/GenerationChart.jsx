import React, { useMemo, useState } from 'react';
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

/**
 * High-precision research tooltip showing aligned numerical values.
 */
const InstrumentTooltip = ({ active, payload }) => {
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
    : '';

  const isOver = error !== null && error > 0;
  const isUnder = error !== null && error < 0;

  return (
    <div className="bg-[#FAF9F5] border border-divider p-4 shadow-sm text-xs font-sans max-w-xs transition-opacity duration-75">
      {/* Header */}
      <div className="flex items-baseline justify-between pb-2 mb-2.5 border-b border-divider font-mono">
        <span className="font-semibold text-ink text-[11px]">
          {formattedDate}
        </span>
        <span className="text-muted text-[11px]">
          SP {settlementPeriod}
        </span>
      </div>

      {/* Series Values */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-muted flex items-center font-sans text-xs">
            <span className="h-1.5 w-3 bg-forest mr-2 inline-block" />
            Actual Wind:
          </span>
          <span className="font-semibold text-forest">
            {actualGeneration !== null ? `${actualGeneration.toLocaleString()} MW` : 'Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted flex items-center font-sans text-xs">
            <span className="h-1.5 w-3 bg-copper mr-2 inline-block" />
            DA Forecast:
          </span>
          <span className="font-semibold text-copper">
            {forecastGeneration !== null ? `${forecastGeneration.toLocaleString()} MW` : 'Unscheduled'}
          </span>
        </div>

        {forecastPublishTime && (
          <div className="text-[10px] text-muted/70 pl-5 font-mono">
            Issued: {forecastPublishTime.replace('T', ' ').replace('Z', '')}
          </div>
        )}

        {isMatched && error !== null ? (
          <div className="mt-2.5 pt-2 border-t border-divider space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted font-sans text-xs">Signed Error:</span>
              <span className={`font-bold ${isOver ? 'text-copper' : isUnder ? 'text-forest' : 'text-ink'}`}>
                {error > 0 ? `+${error.toLocaleString()}` : error.toLocaleString()} MW
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted font-sans">
              <span>Risk Classification:</span>
              <span className="font-mono text-ink">
                {isOver ? 'Overforecast (Shortfall)' : isUnder ? 'Underforecast (Spill)' : 'Exact match'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted font-sans">
              <span>Absolute Error:</span>
              <span className="font-mono text-ink">
                {absoluteError?.toLocaleString()} MW
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 pt-2 border-t border-divider text-[11px] text-copper font-sans">
            Observation Status: {missingReason || 'Unmatched'}
          </div>
        )}
      </div>
    </div>
  );
};

export default function GenerationChart({
  data = [],
  loading = false,
  startDate,
  endDate,
  onRangeChange,
  cutoffTime,
  onCutoffChange
}) {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showShading, setShowShading] = useState(true);
  const [showErrorStrip, setShowErrorStrip] = useState(true);

  // Time-slice selectors
  const timeSlices = [
    { label: 'All of January', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Week 1 (1–7)', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Week 2 (8–14)', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Week 3 (15–21)', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Week 4 (22–28)', start: '2026-01-22', end: '2026-01-28' },
    { label: 'Late Jan (25–31)', start: '2026-01-25', end: '2026-01-31' },
  ];

  // Process data for the dual-tint difference area and linked error strip
  const processedData = useMemo(() => {
    if (!data || !data.length) return [];
    return data.map((item) => {
      const act = item.actualGeneration;
      const fc = item.forecastGeneration;
      const err = item.error;

      // Overforecast band: forecast > actual in soft copper
      const overforecastBand =
        act !== null && fc !== null && fc > act ? [act, fc] : null;

      // Underforecast band: actual > forecast in muted forest
      const underforecastBand =
        act !== null && fc !== null && act > fc ? [fc, act] : null;

      return {
        ...item,
        overforecastBand,
        underforecastBand,
        posError: err !== null && err > 0 ? err : 0,
        negError: err !== null && err < 0 ? err : 0,
      };
    });
  }, [data]);

  return (
    <div className="py-4">
      
      {/* 1. Meaningful Understated Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between pb-3 border-b border-divider gap-4 text-xs font-mono">
        
        {/* Typographic Series Legends & Toggles */}
        <div className="flex flex-wrap items-center gap-6 text-ink">
          
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center space-x-2 transition cursor-pointer ${
              showActual ? 'text-forest font-semibold' : 'text-muted/50'
            }`}
          >
            <span className="h-0.5 w-4 bg-forest inline-block" />
            <span>Actual Generation (MW)</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center space-x-2 transition cursor-pointer ${
              showForecast ? 'text-copper font-semibold' : 'text-muted/50'
            }`}
          >
            <span className="h-0.5 w-4 border-b border-dashed border-copper inline-block" />
            <span>Day-Ahead Forecast (MW)</span>
          </button>

          <button
            onClick={() => setShowShading(!showShading)}
            className={`flex items-center space-x-1.5 transition cursor-pointer ${
              showShading ? 'text-ink font-medium' : 'text-muted/50'
            }`}
          >
            <span className="h-2 w-2.5 bg-copper/20 border border-copper/40 inline-block mr-0.5" />
            <span className="h-2 w-2.5 bg-forest/20 border border-forest/40 inline-block mr-1" />
            <span>Difference Tints</span>
          </button>

          <button
            onClick={() => setShowErrorStrip(!showErrorStrip)}
            className={`transition cursor-pointer ${
              showErrorStrip ? 'text-ink font-medium' : 'text-muted/50'
            }`}
          >
            <span>Linked Error Strip</span>
          </button>

        </div>

        {/* Date Horizon Switcher & Cutoff Gate */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          
          {/* Horizon Links */}
          <div className="flex items-center space-x-2">
            {timeSlices.map((slice, idx) => {
              const active = startDate === slice.start && endDate === slice.end;
              return (
                <React.Fragment key={slice.label}>
                  <button
                    onClick={() => onRangeChange(slice.start, slice.end)}
                    className={`transition cursor-pointer ${
                      active
                        ? 'text-ink font-bold underline underline-offset-4 decoration-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {slice.label}
                  </button>
                  {idx < timeSlices.length - 1 && <span className="text-divider">·</span>}
                </React.Fragment>
              );
            })}
          </div>

          <span className="text-divider hidden lg:inline">|</span>

          {/* D-1 Decision Gate Selector */}
          <div className="flex items-center space-x-1.5">
            <span>Gate:</span>
            <select
              value={cutoffTime}
              onChange={(e) => onCutoffChange(e.target.value)}
              className="bg-transparent text-ink font-mono focus:outline-none cursor-pointer border-b border-divider hover:border-ink py-0.5"
            >
              <option value="11:00:00">11:00 UTC (EPEX SPOT)</option>
              <option value="12:00:00">12:00 UTC (NordPool GB)</option>
              <option value="14:00:00">14:00 UTC (Post-Auction)</option>
              <option value="17:00:00">17:00 UTC (Standard D-1 Close)</option>
              <option value="23:00:00">23:00 UTC (D-1 Final)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 2. Main Generation Canvas (The Hero Instrument) */}
      <div className="h-[420px] sm:h-[460px] w-full pt-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted font-mono text-xs">
            <div className="h-6 w-6 border-2 border-forest border-t-transparent animate-spin mb-3" />
            <span>Evaluating Elexon BMRS stream...</span>
          </div>
        ) : !processedData.length ? (
          <div className="h-full flex items-center justify-center text-muted font-mono text-xs">
            No observations available for selected delivery range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              syncId="windscopeInstrument"
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              {/* Minimal horizontal rules */}
              <CartesianGrid
                stroke="#DDDCD2"
                strokeWidth={0.7}
                vertical={false}
              />

              <XAxis
                dataKey="startTime"
                tickFormatter={(v) => {
                  if (!v) return '';
                  const parts = v.split('T');
                  if (parts.length === 2) {
                    const [year, month, day] = parts[0].split('-');
                    const time = parts[1].slice(0, 5);
                    return time === '00:00' ? `${day} Jan` : time;
                  }
                  return v;
                }}
                stroke="#777D74"
                tick={{ fontSize: 11, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
                minTickGap={45}
                axisLine={{ stroke: '#DDDCD2', strokeWidth: 1 }}
                tickLine={{ stroke: '#DDDCD2' }}
              />

              <YAxis
                stroke="#777D74"
                tick={{ fontSize: 11, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
                domain={['auto', 'auto']}
                axisLine={{ stroke: '#DDDCD2', strokeWidth: 1 }}
                tickLine={{ stroke: '#DDDCD2' }}
                width={65}
              />

              {/* Synchronized vertical crosshair */}
              <Tooltip
                content={<InstrumentTooltip />}
                cursor={{ stroke: '#777D74', strokeWidth: 1, strokeDasharray: '3 3' }}
                isAnimationActive={false}
              />

              {/* Overforecast Shading: Soft Copper Tint */}
              {showShading && (
                <Area
                  type="monotone"
                  dataKey="overforecastBand"
                  name="Overforecast Area"
                  stroke="none"
                  fill="#B96848"
                  fillOpacity={0.16}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Underforecast Shading: Muted Forest Green Tint */}
              {showShading && (
                <Area
                  type="monotone"
                  dataKey="underforecastBand"
                  name="Underforecast Area"
                  stroke="none"
                  fill="#245C46"
                  fillOpacity={0.12}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Actual Generation Line: Deep Forest Green */}
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  name="Actual (FUELHH)"
                  stroke="#245C46"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4.5, fill: '#245C46', stroke: '#F6F5EF', strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Day-Ahead Forecast Line: Burnt Copper Dashed */}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecastGeneration"
                  name="Forecast (WINDFOR)"
                  stroke="#B96848"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 4.5, fill: '#B96848', stroke: '#F6F5EF', strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3. Linked Synchronized Error Strip Directly Below */}
      {showErrorStrip && processedData.length > 0 && (
        <div className="pt-2 border-t border-divider/60">
          <div className="flex items-baseline justify-between text-[11px] font-mono text-muted mb-1 px-1">
            <span className="uppercase tracking-wider text-ink font-medium">
              Synchronized Error Strip (Signed Error: Forecast − Actual in MW)
            </span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center text-copper font-medium">
                <span className="h-1.5 w-1.5 bg-copper mr-1 inline-block" />
                + Overforecast (Shortfall)
              </span>
              <span className="flex items-center text-forest font-medium">
                <span className="h-1.5 w-1.5 bg-forest mr-1 inline-block" />
                - Underforecast (Spill)
              </span>
            </div>
          </div>

          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedData}
                syncId="windscopeInstrument"
                margin={{ top: 4, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid stroke="#DDDCD2" strokeWidth={0.6} vertical={false} />

                <XAxis dataKey="startTime" hide={true} />

                <YAxis
                  stroke="#777D74"
                  tick={{ fontSize: 10, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
                  domain={['auto', 'auto']}
                  axisLine={{ stroke: '#DDDCD2' }}
                  tickLine={{ stroke: '#DDDCD2' }}
                  width={65}
                />

                <ReferenceLine y={0} stroke="#777D74" strokeWidth={1} />

                <Tooltip content={<InstrumentTooltip />} isAnimationActive={false} />

                {/* Positive Error (Overforecast): Burnt Copper */}
                <Bar
                  dataKey="posError"
                  fill="#B96848"
                  opacity={0.85}
                  isAnimationActive={false}
                />

                {/* Negative Error (Underforecast): Deep Forest */}
                <Bar
                  dataKey="negError"
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
  );
}
