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
    <div className="bg-[#FAF9F5] border border-rule p-3 shadow-sm text-xs font-mono max-w-xs">
      <div className="text-muted text-[11px] pb-1 border-b border-rule flex justify-between">
        <span>{pt.startTime?.replace('T', ' ').replace('Z', ' UTC')}</span>
        <span>SP {pt.settlementPeriod}</span>
      </div>
      <div className="mt-1.5 flex justify-between items-baseline">
        <span className="text-muted font-sans text-xs">Forecast Error:</span>
        <span className={`font-semibold ${isOver ? 'text-rust' : isUnder ? 'text-forest' : 'text-ink'}`}>
          {pt.error > 0 ? `+${pt.error.toLocaleString()}` : pt.error?.toLocaleString()} MW
        </span>
      </div>
      <div className="text-[10px] text-muted text-right mt-0.5 font-sans">
        {isOver ? 'Overforecast (Shortfall Risk)' : isUnder ? 'Underforecast (Spill)' : 'Neutral'}
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
    <div className="py-6 border-b border-rule">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-3 text-xs">
        <div>
          <h3 className="font-sans font-medium text-ink text-sm">
            Forecast Error Chronology
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Signed half-hourly discrepancy (Forecast − Actual in MW) across the target period.
          </p>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[11px] text-muted mt-2 sm:mt-0">
          <span className="flex items-center">
            <span className="h-2 w-2 bg-rust mr-1.5 inline-block" />
            + Overforecast (Shortfall)
          </span>
          <span className="flex items-center">
            <span className="h-2 w-2 bg-forest mr-1.5 inline-block" />
            - Underforecast (Spill)
          </span>
        </div>
      </div>

      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartPoints}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid stroke="#DFDED5" strokeWidth={0.6} vertical={false} />

            <XAxis
              dataKey="startTime"
              tickFormatter={(v) => {
                if (!v) return '';
                const parts = v.split('T');
                return parts.length === 2 && parts[1].slice(0, 5) === '00:00'
                  ? `${parts[0].split('-')[2]} Jan`
                  : '';
              }}
              stroke="#777A70"
              tick={{ fontSize: 10, fill: '#777A70', fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: '#DFDED5' }}
              tickLine={{ stroke: '#DFDED5' }}
              minTickGap={30}
            />

            <YAxis
              stroke="#777A70"
              tick={{ fontSize: 10, fill: '#777A70', fontFamily: 'IBM Plex Mono' }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(0)}k`}
              axisLine={{ stroke: '#DFDED5' }}
              tickLine={{ stroke: '#DFDED5' }}
              width={65}
            />

            <ReferenceLine y={0} stroke="#777A70" strokeWidth={1} />

            <Tooltip content={<ErrorTooltip />} isAnimationActive={false} />

            <Bar dataKey="posError" fill="#B96745" opacity={0.85} isAnimationActive={false} />
            <Bar dataKey="negError" fill="#245C46" opacity={0.85} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
