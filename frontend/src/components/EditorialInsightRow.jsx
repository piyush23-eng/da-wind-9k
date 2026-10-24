import React from 'react';

export default function EditorialInsightRow({ metrics }) {
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
    <section className="border-t border-b border-rule py-7 my-2 font-sans">
      
      {/* Three Figures Arranged as Editorial Columns Separated by Fine Vertical Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
        
        {/* Figure 1: MAE */}
        <div className="py-3 md:py-0 md:pr-8">
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
            Average absolute volume divergence between day-ahead contract commitments and physical delivery.
          </p>
        </div>

        {/* Figure 2: Mean Bias */}
        <div className="py-3 md:py-0 md:px-8">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
            02 / Systematic Forecast Bias
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`font-mono text-4xl sm:text-5xl font-medium tracking-tight ${
                isOver ? 'text-copper' : isUnder ? 'text-forest' : 'text-ink'
              }`}
            >
              {meanError > 0 ? `+${Math.round(meanError).toLocaleString()}` : Math.round(meanError).toLocaleString()}
            </span>
            <span className="font-mono text-sm text-muted">{units}</span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Directional skew. Positive numbers confirm a persistent tendency to overpredict wind availability.
          </p>
        </div>

        {/* Figure 3: Coverage */}
        <div className="py-3 md:py-0 md:pl-8">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted">
            03 / Decision Gate Coverage
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
            Half-hour settlement periods matched with deterministic forecasts published on or before the cutoff.
          </p>
        </div>

      </div>

      {/* Analytical Takeaway Derived from Calculations */}
      {matchedCount > 0 && (
        <div className="mt-7 pt-5 border-t border-rule/70 text-sm sm:text-base text-ink font-sans leading-relaxed max-w-4xl">
          <span className="font-mono text-xs text-muted uppercase tracking-wider mr-2">Analytical Finding:</span>
          Across January 2026, day-ahead forecasts overpredicted realised wind generation in{' '}
          <strong className="font-medium text-copper">{overPct}% of all settlement periods</strong> ({overforecastCount.toLocaleString()} intervals), creating a systematic shortfall bias of{' '}
          <strong className="font-medium text-copper">+{Math.round(meanError).toLocaleString()} MW</strong> at decision cutoff.
        </div>
      )}

    </section>
  );
}
