import React from 'react';

export default function EditorialInsightRow({ metrics, audit }) {
  if (!metrics) return null;

  const {
    mae = 0,
    meanError = 0,
    matchedCount = 0,
    totalTargetIntervals = 0,
    coverageRate = 0,
    overforecastCount = 0,
    units = 'MW'
  } = metrics;

  const isOver = meanError > 0;
  const isUnder = meanError < 0;
  const overPct = matchedCount > 0 ? Math.round((overforecastCount / matchedCount) * 1000) / 10 : 0;

  return (
    <section className="border-t border-b border-rule py-8 my-4">
      
      {/* Three Editorial Columns Separated by Fine Vertical Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
        
        {/* Column 1: MAE */}
        <div className="py-4 md:py-0 md:pr-8">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
            01 / Mean Absolute Error
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-4xl sm:text-5xl font-medium tracking-tight text-ink">
              {Math.round(mae).toLocaleString()}
            </span>
            <span className="font-mono text-sm text-muted">{units}</span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Average absolute procurement volume deviation between day-ahead market commitment and physical delivery.
          </p>
        </div>

        {/* Column 2: Directional Bias */}
        <div className="py-4 md:py-0 md:px-8">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
            02 / Systematic Forecast Bias
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`font-mono text-4xl sm:text-5xl font-medium tracking-tight ${
                isOver ? 'text-rust' : isUnder ? 'text-forest' : 'text-ink'
              }`}
            >
              {meanError > 0 ? `+${Math.round(meanError).toLocaleString()}` : Math.round(meanError).toLocaleString()}
            </span>
            <span className="font-mono text-sm text-muted">{units}</span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Directional skew across the horizon. Positive figures denote persistent day-ahead overprediction.
          </p>
        </div>

        {/* Column 3: Coverage */}
        <div className="py-4 md:py-0 md:pl-8">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
            03 / Procurement Gate Coverage
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-4xl sm:text-5xl font-medium tracking-tight text-ink">
              {coverageRate}%
            </span>
            <span className="font-mono text-xs text-muted">
              ({matchedCount}/{totalTargetIntervals} SPs)
            </span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Half-hour settlement periods matched with deterministic forecasts published on or before the D-1 decision gate.
          </p>
        </div>

      </div>

      {/* Concise Real-Data Finding Sentence */}
      {matchedCount > 0 && (
        <div className="mt-8 pt-6 border-t border-rule/60 text-sm sm:text-base text-ink font-sans leading-relaxed max-w-4xl">
          <span className="font-mono text-xs text-muted uppercase tracking-wider mr-2">Key Finding:</span>
          Across January 2026, day-ahead forecasts overpredicted realised wind generation in{' '}
          <strong className="font-medium text-rust">{overPct}% of all settlement periods</strong> ({overforecastCount.toLocaleString()} intervals), creating a systematic shortfall bias of{' '}
          <strong className="font-medium text-rust">+{Math.round(meanError).toLocaleString()} MW</strong> at decision cutoff.
        </div>
      )}

    </section>
  );
}
