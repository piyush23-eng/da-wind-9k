import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

/**
 * Editorial Tooltip styled for a premium research publication.
 */
const ResearchTooltip = ({ active, payload }) => {
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
    <div className="bg-[#FAF9F5] border border-rule p-4 shadow-sm text-xs font-sans max-w-xs transition-opacity duration-75">
      <div className="flex items-baseline justify-between pb-2 mb-2.5 border-b border-rule">
        <span className="font-mono font-medium text-ink text-[11px]">
          {formattedDate}
        </span>
        <span className="font-mono text-muted text-[11px]">
          SP {settlementPeriod}
        </span>
      </div>

      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-muted flex items-center font-sans">
            <span className="h-2 w-2 rounded-none bg-forest mr-2 inline-block" />
            Actual (FUELHH):
          </span>
          <span className="font-medium text-forest">
            {actualGeneration !== null ? `${actualGeneration.toLocaleString()} MW` : 'Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted flex items-center font-sans">
            <span className="h-2 w-2 rounded-none bg-rust mr-2 inline-block" />
            Forecast (WINDFOR):
          </span>
          <span className="font-medium text-rust">
            {forecastGeneration !== null ? `${forecastGeneration.toLocaleString()} MW` : 'None'}
          </span>
        </div>

        {forecastPublishTime && (
          <div className="text-[10px] text-muted/80 pl-4 font-mono">
            Published: {forecastPublishTime.replace('T', ' ').replace('Z', ' UTC')}
          </div>
        )}

        {isMatched && error !== null ? (
          <div className="mt-2.5 pt-2 border-t border-rule space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted font-sans">Signed Error:</span>
              <span className={`font-semibold ${isOver ? 'text-rust' : isUnder ? 'text-forest' : 'text-ink'}`}>
                {error > 0 ? `+${error.toLocaleString()}` : error.toLocaleString()} MW
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span className="font-sans">Classification:</span>
              <span className="font-mono">
                {isOver ? 'Overforecast (+)' : isUnder ? 'Underforecast (-)' : 'Zero bias'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span className="font-sans">Absolute Error:</span>
              <span className="font-mono text-ink">
                {absoluteError?.toLocaleString()} MW
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 pt-2 border-t border-rule text-[11px] text-rust font-sans">
            Status: {missingReason || 'Unmatched observation'}
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
  const [showDifference, setShowDifference] = useState(true);

  // Time-slice navigation links
  const timeSlices = [
    { label: 'All of January', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Week 1', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Week 2', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Week 3', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Week 4', start: '2026-01-22', end: '2026-01-28' },
    { label: 'Late Jan', start: '2026-01-25', end: '2026-01-31' },
  ];

  // Prepare data with range band for difference shading
  const processedData = useMemo(() => {
    if (!data || !data.length) return [];
    return data.map((item) => {
      const act = item.actualGeneration;
      const fc = item.forecastGeneration;
      return {
        ...item,
        // Range area [lower, upper] renders difference shading
        gapRange: act !== null && fc !== null ? [Math.min(act, fc), Math.max(act, fc)] : null,
      };
    });
  }, [data]);

  return (
    <div className="py-6">
      
      {/* Editorial Controls & Legend Bar */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between pb-4 gap-4 text-xs font-mono">
        
        {/* Typographically Refined Legend */}
        <div className="flex flex-wrap items-center gap-5 text-ink">
          
          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center space-x-2 transition cursor-pointer ${
              showActual ? 'opacity-100 font-medium' : 'opacity-40'
            }`}
          >
            <span className="h-0.5 w-4 bg-forest inline-block" />
            <span>Actual Wind Generation</span>
          </button>

          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center space-x-2 transition cursor-pointer ${
              showForecast ? 'opacity-100 font-medium' : 'opacity-40'
            }`}
          >
            <span className="h-0.5 w-4 border-b border-dashed border-rust inline-block" />
            <span>Eligible Day-Ahead Forecast</span>
          </button>

          <button
            onClick={() => setShowDifference(!showDifference)}
            className={`flex items-center space-x-2 transition cursor-pointer ${
              showDifference ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span className="h-2.5 w-3 bg-rust/20 inline-block border border-rust/40" />
            <span className="text-muted">Difference Gap</span>
          </button>

        </div>

        {/* Minimal Date Horizon & Cutoff Switchers */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
          
          {/* Subtle Horizon Text Links */}
          <div className="flex items-center space-x-2.5">
            {timeSlices.map((slice, idx) => {
              const active = startDate === slice.start && endDate === slice.end;
              return (
                <React.Fragment key={slice.label}>
                  <button
                    onClick={() => onRangeChange(slice.start, slice.end)}
                    className={`transition cursor-pointer ${
                      active
                        ? 'text-ink font-semibold underline underline-offset-4 decoration-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {slice.label}
                  </button>
                  {idx < timeSlices.length - 1 && <span className="text-rule">·</span>}
                </React.Fragment>
              );
            })}
          </div>

          <span className="text-rule hidden lg:inline">|</span>

          {/* Restrained Cutoff Control */}
          <div className="flex items-center space-x-1.5 text-muted">
            <span>Cutoff:</span>
            <select
              value={cutoffTime}
              onChange={(e) => onCutoffChange(e.target.value)}
              className="bg-transparent text-ink font-mono focus:outline-none cursor-pointer border-b border-rule hover:border-ink py-0.5"
            >
              <option value="11:00:00">11:00 UTC (EPEX Auction)</option>
              <option value="12:00:00">12:00 UTC (NordPool GB)</option>
              <option value="14:00:00">14:00 UTC (Post-Auction)</option>
              <option value="17:00:00">17:00 UTC (Standard D-1)</option>
              <option value="23:00:00">23:00 UTC (End of D-1)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Hero Canvas Area */}
      <div className="h-[460px] sm:h-[500px] w-full pt-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-muted font-mono text-xs">
            <div className="h-6 w-6 border-2 border-forest border-t-transparent rounded-none animate-spin mb-3" />
            <span>Loading Elexon stream observations...</span>
          </div>
        ) : !processedData.length ? (
          <div className="h-full flex items-center justify-center text-muted font-mono text-xs">
            No observations available for selected delivery range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              {/* Ultra-subtle horizontal rules only */}
              <CartesianGrid
                stroke="#DFDED5"
                strokeWidth={0.8}
                vertical={false}
              />

              {/* Time X-Axis */}
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
                stroke="#777A70"
                tick={{ fontSize: 11, fill: '#777A70', fontFamily: 'IBM Plex Mono' }}
                minTickGap={45}
                axisLine={{ stroke: '#DFDED5', strokeWidth: 1 }}
                tickLine={{ stroke: '#DFDED5' }}
              />

              {/* Power Y-Axis */}
              <YAxis
                stroke="#777A70"
                tick={{ fontSize: 11, fill: '#777A70', fontFamily: 'IBM Plex Mono' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
                domain={['auto', 'auto']}
                axisLine={{ stroke: '#DFDED5', strokeWidth: 1 }}
                tickLine={{ stroke: '#DFDED5' }}
                width={65}
              />

              {/* Fine vertical crosshair */}
              <Tooltip
                content={<ResearchTooltip />}
                cursor={{ stroke: '#777A70', strokeWidth: 0.8, strokeDasharray: '3 3' }}
                isAnimationActive={false}
              />

              {/* Translucent Difference Gap Area */}
              {showDifference && (
                <Area
                  type="monotone"
                  dataKey="gapRange"
                  name="Forecast Gap"
                  stroke="none"
                  fill="#B96745"
                  fillOpacity={0.14}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Forest Green Line for Actuals */}
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  name="Actual (FUELHH)"
                  stroke="#245C46"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#245C46', stroke: '#F7F6F0', strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Rust Dashed Line for Day-Ahead Forecast */}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecastGeneration"
                  name="Forecast (WINDFOR)"
                  stroke="#B96745"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 4, fill: '#B96745', stroke: '#F7F6F0', strokeWidth: 2 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
