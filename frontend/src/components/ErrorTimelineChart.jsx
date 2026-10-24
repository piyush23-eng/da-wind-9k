import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

const ErrorTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;

  const isOver = pt.error > 0;
  const isUnder = pt.error < 0;

  return (
    <div className="bg-[#FAF9F5] border border-divider p-3 shadow-sm text-xs font-mono max-w-xs">
      <div className="text-muted text-[11px] pb-1 border-b border-divider flex justify-between">
        <span>{pt.startTime?.replace('T', ' ').replace('Z', ' UTC')}</span>
        <span>SP {pt.settlementPeriod}</span>
      </div>
      <div className="mt-1.5 flex justify-between items-baseline">
        <span className="text-muted font-sans text-xs">Forecast Error:</span>
        <span className={`font-semibold ${isOver ? 'text-copper' : isUnder ? 'text-forest' : 'text-ink'}`}>
          {pt.error > 0 ? `+${pt.error.toLocaleString()}` : pt.error?.toLocaleString()} MW
        </span>
      </div>
      <div className="text-[10px] text-muted text-right mt-0.5 font-sans">
        {isOver ? 'Overforecast (Shortfall)' : isUnder ? 'Underforecast (Spill)' : 'Neutral'}
      </div>
    </div>
  );
};

export default function ErrorTimelineChart({ data = [], loading = false }) {
  if (loading || !data || !data.length) return null;

  const chartPoints = data.map((d) => ({
    ...d,
    posError: d.error !== null && d.error > 0 ? d.error : 0,
    negError: d.error !== null && d.error < 0 ? d.error : 0,
  }));

  return (
    <div className="py-6 border-b border-divider font-sans">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 text-xs">
        <div>
          <h3 className="font-sans font-medium text-ink text-sm">
            Forecast Error Chronology & Volatility
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Half-hourly signed error magnitude (Forecast − Actual in MW) across the evaluated delivery horizon.
          </p>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px] text-muted mt-2 sm:mt-0">
          <span className="flex items-center">
            <span className="h-2 w-2 bg-copper mr-1.5 inline-block" />
            + Overforecast (Shortfall Risk)
          </span>
          <span className="flex items-center">
            <span className="h-2 w-2 bg-forest mr-1.5 inline-block" />
            - Underforecast (Spill Risk)
          </span>
        </div>
      </div>

      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartPoints}
            syncId="windscopeInstrument"
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid stroke="#DDDCD2" strokeWidth={0.6} vertical={false} />

            <XAxis
              dataKey="startTime"
              tickFormatter={(v) => {
                if (!v) return '';
                const parts = v.split('T');
                return parts.length === 2 && parts[1].slice(0, 5) === '00:00'
                  ? `${parts[0].split('-')[2]} Jan`
                  : '';
              }}
              stroke="#777D74"
              tick={{ fontSize: 10, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: '#DDDCD2' }}
              tickLine={{ stroke: '#DDDCD2' }}
              minTickGap={30}
            />

            <YAxis
              stroke="#777D74"
              tick={{ fontSize: 10, fill: '#777D74', fontFamily: 'IBM Plex Mono' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: '#DDDCD2' }}
              tickLine={{ stroke: '#DDDCD2' }}
              width={65}
            />

            <ReferenceLine y={0} stroke="#777D74" strokeWidth={1} />

            <Tooltip content={<ErrorTooltip />} isAnimationActive={false} />

            <Bar dataKey="posError" fill="#B96848" opacity={0.85} isAnimationActive={false} />
            <Bar dataKey="negError" fill="#245C46" opacity={0.85} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
