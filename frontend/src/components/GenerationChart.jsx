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
import ChartToolbar from './ChartToolbar';

/**
 * Aligned numerical research tooltip.
 */
const InstrumentTooltip = ({ active, payload, viewMode = 'editorial' }) => {
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
  const isDark = viewMode === 'analysis';

  return (
    <div
      className={`p-4 border shadow-md text-xs font-sans max-w-xs transition-opacity duration-75 ${
        isDark
          ? 'bg-[#142D25] border-[#2A5244] text-[#F6F5EF]'
          : 'bg-[#FAF9F5] border-rule text-ink'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-baseline justify-between pb-2 mb-2.5 border-b font-mono ${
          isDark ? 'border-[#2A5244]' : 'border-rule'
        }`}
      >
        <span className="font-semibold text-[11px]">{formattedDate}</span>
        <span className={isDark ? 'text-sage' : 'text-muted'}>SP {settlementPeriod}</span>
      </div>

      {/* Numerical Data */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className={`flex items-center font-sans text-xs ${isDark ? 'text-sage' : 'text-muted'}`}>
            <span
              className={`h-1.5 w-3 mr-2 inline-block ${
                isDark ? 'bg-forest-bright' : 'bg-forest'
              }`}
            />
            Actual Wind:
          </span>
          <span
            className={`font-semibold ${
              isDark ? 'text-forest-bright' : 'text-forest'
            }`}
          >
            {actualGeneration !== null ? `${actualGeneration.toLocaleString()} MW` : 'Missing'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className={`flex items-center font-sans text-xs ${isDark ? 'text-sage' : 'text-muted'}`}>
            <span
              className={`h-1.5 w-3 mr-2 inline-block ${
                isDark ? 'bg-copper-bright' : 'bg-copper'
              }`}
            />
            DA Forecast:
          </span>
          <span
            className={`font-semibold ${
              isDark ? 'text-copper-bright' : 'text-copper'
            }`}
          >
            {forecastGeneration !== null ? `${forecastGeneration.toLocaleString()} MW` : 'Unscheduled'}
          </span>
        </div>

        {forecastPublishTime && (
          <div className={`text-[10px] pl-5 font-mono ${isDark ? 'text-sage/70' : 'text-muted/70'}`}>
            Issued: {forecastPublishTime.replace('T', ' ').replace('Z', '')}
          </div>
        )}

        {isMatched && error !== null ? (
          <div
            className={`mt-2.5 pt-2 border-t space-y-1 ${
              isDark ? 'border-[#2A5244]' : 'border-rule'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-sans text-xs ${isDark ? 'text-sage' : 'text-muted'}`}>
                Signed Error:
              </span>
              <span
                className={`font-bold ${
                  isOver
                    ? isDark ? 'text-copper-bright' : 'text-copper'
                    : isUnder
                    ? isDark ? 'text-forest-bright' : 'text-forest'
                    : 'text-ink'
                }`}
              >
                {error > 0 ? `+${error.toLocaleString()}` : error.toLocaleString()} MW
              </span>
            </div>
            <div className={`flex items-center justify-between text-[11px] font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
              <span>Classification:</span>
              <span className="font-mono">
                {isOver ? 'Overforecast (Shortfall)' : isUnder ? 'Underforecast (Spill)' : 'Exact'}
              </span>
            </div>
            <div className={`flex items-center justify-between text-[11px] font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
              <span>Absolute Error:</span>
              <span className="font-mono">
                {absoluteError?.toLocaleString()} MW
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`mt-2 pt-2 border-t text-[11px] font-sans ${
              isDark ? 'border-[#2A5244] text-copper-bright' : 'border-rule text-copper'
            }`}
          >
            Status: {missingReason || 'Unmatched'}
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
  onCutoffChange,
  viewMode = 'editorial',
  selectedInterval = null,
  onSelectInterval,
  onCloseInspector
}) {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showShading, setShowShading] = useState(true);
  const [showErrorStrip, setShowErrorStrip] = useState(true);

  const isDark = viewMode === 'analysis';

  // Process data for dual-tint difference area
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

  const handleChartClick = (e) => {
    if (e && e.activePayload && e.activePayload.length && onSelectInterval) {
      onSelectInterval(e.activePayload[0].payload);
    }
  };

  return (
    <div
      className={`py-4 transition-colors duration-200 ${
        isDark ? 'bg-forest-deep text-paper p-5 -mx-6 px-6 sm:px-10 border-b border-[#2A5244]' : ''
      }`}
    >
      
      {/* 1. Polished Segmented Workstation Toolbar */}
      <ChartToolbar
        startDate={startDate}
        endDate={endDate}
        onRangeChange={onRangeChange}
        cutoffTime={cutoffTime}
        onCutoffChange={onCutoffChange}
        showActual={showActual}
        setShowActual={setShowActual}
        showForecast={showForecast}
        setShowForecast={setShowForecast}
        showShading={showShading}
        setShowShading={setShowShading}
        showErrorStrip={showErrorStrip}
        setShowErrorStrip={setShowErrorStrip}
        viewMode={viewMode}
      />

      {/* 2. Main Generation Canvas (The Centerpiece) */}
      <div className="h-[400px] sm:h-[450px] w-full pt-2">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center font-mono text-xs">
            <div
              className={`h-6 w-6 border-2 border-t-transparent animate-spin mb-3 ${
                isDark ? 'border-forest-bright' : 'border-forest'
              }`}
            />
            <span className={isDark ? 'text-sage' : 'text-muted'}>
              Evaluating Elexon stream observations...
            </span>
          </div>
        ) : !processedData.length ? (
          <div
            className={`h-full flex items-center justify-center font-mono text-xs ${
              isDark ? 'text-sage' : 'text-muted'
            }`}
          >
            No observations available for selected delivery range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              syncId="windscopeInstrument"
              onClick={handleChartClick}
              margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                stroke={isDark ? '#1F3E33' : '#DDDCD2'}
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
                stroke={isDark ? '#A9BBAE' : '#777D74'}
                tick={{
                  fontSize: 11,
                  fill: isDark ? '#A9BBAE' : '#777D74',
                  fontFamily: 'IBM Plex Mono',
                }}
                minTickGap={45}
                axisLine={{ stroke: isDark ? '#2A5244' : '#DDDCD2', strokeWidth: 1 }}
                tickLine={{ stroke: isDark ? '#2A5244' : '#DDDCD2' }}
              />

              <YAxis
                stroke={isDark ? '#A9BBAE' : '#777D74'}
                tick={{
                  fontSize: 11,
                  fill: isDark ? '#A9BBAE' : '#777D74',
                  fontFamily: 'IBM Plex Mono',
                }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                unit=" MW"
                domain={['auto', 'auto']}
                axisLine={{ stroke: isDark ? '#2A5244' : '#DDDCD2', strokeWidth: 1 }}
                tickLine={{ stroke: isDark ? '#2A5244' : '#DDDCD2' }}
                width={65}
              />

              <Tooltip
                content={<InstrumentTooltip viewMode={viewMode} />}
                cursor={{
                  stroke: isDark ? '#A9BBAE' : '#777D74',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
                isAnimationActive={false}
              />

              {/* Overforecast Shading (Soft Copper) */}
              {showShading && (
                <Area
                  type="monotone"
                  dataKey="overforecastBand"
                  name="Overforecast Area"
                  stroke="none"
                  fill={isDark ? '#F97316' : '#B96848'}
                  fillOpacity={isDark ? 0.22 : 0.16}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Underforecast Shading (Muted Forest) */}
              {showShading && (
                <Area
                  type="monotone"
                  dataKey="underforecastBand"
                  name="Underforecast Area"
                  stroke="none"
                  fill={isDark ? '#3DD598' : '#245C46'}
                  fillOpacity={isDark ? 0.18 : 0.12}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Actual Generation Line */}
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actualGeneration"
                  name="Actual (FUELHH)"
                  stroke={isDark ? '#3DD598' : '#245C46'}
                  strokeWidth={2.4}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: isDark ? '#3DD598' : '#245C46',
                    stroke: isDark ? '#142D25' : '#F6F5EF',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}

              {/* Day-Ahead Forecast Line */}
              {showForecast && (
                <Line
                  type="monotone"
                  dataKey="forecastGeneration"
                  name="Forecast (WINDFOR)"
                  stroke={isDark ? '#F97316' : '#B96848'}
                  strokeWidth={1.9}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: isDark ? '#F97316' : '#B96848',
                    stroke: isDark ? '#142D25' : '#F6F5EF',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3. Linked Synchronized Error Strip */}
      {showErrorStrip && processedData.length > 0 && (
        <div
          className={`pt-2.5 mt-2 border-t ${
            isDark ? 'border-[#2A5244]' : 'border-rule/70'
          }`}
        >
          <div className="flex items-baseline justify-between text-[11px] font-mono mb-1 px-1">
            <span
              className={`uppercase tracking-wider font-medium ${
                isDark ? 'text-paper' : 'text-ink'
              }`}
            >
              Linked Signed Error Strip (Forecast − Actual in MW)
            </span>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className={`flex items-center font-medium ${isDark ? 'text-copper-bright' : 'text-copper'}`}>
                <span
                  className={`h-1.5 w-1.5 mr-1 inline-block ${
                    isDark ? 'bg-copper-bright' : 'bg-copper'
                  }`}
                />
                + Overforecast (Shortfall)
              </span>
              <span className={`flex items-center font-medium ${isDark ? 'text-forest-bright' : 'text-forest'}`}>
                <span
                  className={`h-1.5 w-1.5 mr-1 inline-block ${
                    isDark ? 'bg-forest-bright' : 'bg-forest'
                  }`}
                />
                - Underforecast (Spill)
              </span>
            </div>
          </div>

          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={processedData}
                syncId="windscopeInstrument"
                onClick={handleChartClick}
                margin={{ top: 2, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  stroke={isDark ? '#1F3E33' : '#DDDCD2'}
                  strokeWidth={0.6}
                  vertical={false}
                />

                <XAxis dataKey="startTime" hide={true} />

                <YAxis
                  stroke={isDark ? '#A9BBAE' : '#777D74'}
                  tick={{
                    fontSize: 10,
                    fill: isDark ? '#A9BBAE' : '#777D74',
                    fontFamily: 'IBM Plex Mono',
                  }}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
                  domain={['auto', 'auto']}
                  axisLine={{ stroke: isDark ? '#2A5244' : '#DDDCD2' }}
                  tickLine={{ stroke: isDark ? '#2A5244' : '#DDDCD2' }}
                  width={65}
                />

                <ReferenceLine
                  y={0}
                  stroke={isDark ? '#A9BBAE' : '#777D74'}
                  strokeWidth={1}
                />

                <Tooltip content={<InstrumentTooltip viewMode={viewMode} />} isAnimationActive={false} />

                <Bar
                  dataKey="posError"
                  fill={isDark ? '#F97316' : '#B96848'}
                  opacity={0.88}
                  isAnimationActive={false}
                />

                <Bar
                  dataKey="negError"
                  fill={isDark ? '#3DD598' : '#245C46'}
                  opacity={0.88}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Selected-Interval Contextual Inspector */}
      {selectedInterval && (
        <div
          className={`mt-4 p-4 border transition-all animate-fadeIn ${
            isDark
              ? 'bg-[#18362D] border-[#2A5244] text-paper'
              : 'bg-paper-tint border-rule text-ink'
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-baseline justify-between pb-2 mb-3 border-b gap-2 ${
              isDark ? 'border-[#2A5244]' : 'border-rule'
            }`}
          >
            <div className="flex items-baseline space-x-3">
              <span
                className={`font-mono text-xs px-2 py-0.5 font-bold ${
                  isDark ? 'bg-forest-bright text-forest-deep' : 'bg-forest text-paper'
                }`}
              >
                SP {selectedInterval.settlementPeriod}
              </span>
              <span className="font-mono font-bold text-sm">
                {selectedInterval.startTime?.replace('T', ' ').replace('Z', ' UTC')}
              </span>
              <span className={`text-xs ${isDark ? 'text-sage' : 'text-muted'}`}>
                (Delivery Period)
              </span>
            </div>

            <button
              onClick={onCloseInspector}
              className={`text-xs font-mono underline cursor-pointer self-start sm:self-auto ${
                isDark ? 'text-sage hover:text-paper' : 'text-muted hover:text-ink'
              }`}
            >
              Close Inspector [ESC]
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className={`text-[11px] font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
                Actual Generation
              </span>
              <div
                className={`text-base font-bold mt-0.5 ${
                  isDark ? 'text-forest-bright' : 'text-forest'
                }`}
              >
                {selectedInterval.actualGeneration?.toLocaleString()} MW
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? 'text-sage/80' : 'text-muted'}`}>
                {(selectedInterval.actualGeneration * 0.5).toFixed(1)} MWh
              </div>
            </div>

            <div>
              <span className={`text-[11px] font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
                Eligible DA Forecast
              </span>
              <div
                className={`text-base font-bold mt-0.5 ${
                  isDark ? 'text-copper-bright' : 'text-copper'
                }`}
              >
                {selectedInterval.forecastGeneration?.toLocaleString()} MW
              </div>
              <div className={`text-[10px] mt-0.5 ${isDark ? 'text-sage/80' : 'text-muted'}`}>
                {(selectedInterval.forecastGeneration * 0.5).toFixed(1)} MWh
              </div>
            </div>

            <div>
              <span className={`text-[11px] font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
                Signed Error / Bias
              </span>
              <div
                className={`text-base font-bold mt-0.5 ${
                  selectedInterval.error > 0
                    ? isDark ? 'text-copper-bright' : 'text-copper'
                    : isDark ? 'text-forest-bright' : 'text-forest'
                }`}
              >
                {selectedInterval.error > 0
                  ? `+${selectedInterval.error.toLocaleString()}`
                  : selectedInterval.error?.toLocaleString()}{' '}
                MW
              </div>
              <div className={`text-[10px] mt-0.5 font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
                {selectedInterval.error > 0 ? 'Overforecast Shortfall' : 'Underforecast Spill'}
              </div>
            </div>

            <div>
              <span className={`text-[11px] font-sans ${isDark ? 'text-sage' : 'text-muted'}`}>
                Winning Vintage & Cutoff
              </span>
              <div className="text-[11px] font-bold mt-0.5 truncate">
                Issued: {selectedInterval.forecastPublishTime?.replace('T', ' ').replace('Z', '') || 'None'}
              </div>
              <div className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-sage' : 'text-muted'}`}>
                Cutoff: {selectedInterval.decisionCutoffTime?.replace('T', ' ').replace('Z', '')}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
