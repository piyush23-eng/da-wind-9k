import React from 'react';

export default function EditorialInsightRow({ metrics, viewMode = 'editorial' }) {
  if (!metrics) return null;

  const {
    mae = 0,
    rmse = 0,
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
  const rmseRatio = mae > 0 ? (rmse / mae).toFixed(2) : '1.00';

  const isAnalysis = viewMode === 'analysis';

  return (
    <section className="border-t border-b border-rule py-7 my-2 font-sans transition-all duration-300 ease-in-out">
      
      {/* Dynamic Columns: 3 columns in Editorial, 4 columns in Analysis with smooth transition */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isAnalysis
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-rule gap-y-4 sm:gap-y-0'
            : 'grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule gap-y-4 md:gap-y-0'
        }`}
      >
        
        {/* Figure 1: MAE */}
        <div className={`py-2 sm:py-0 transition-all duration-300 ${isAnalysis ? 'sm:px-4 first:sm:pl-0' : 'md:pr-8'}`}>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            01 / Mean Absolute Error (MAE)
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-ink">
              {Math.round(mae).toLocaleString()}
            </span>
            <span className="font-mono text-xs text-muted">{units}</span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Mean absolute difference between day-ahead forecast and delivered wind.
          </p>
        </div>

        {/* Figure 2: RMSE (Revealed in Analysis View) */}
        {isAnalysis && (
          <div className="py-2 sm:py-0 sm:px-4 transition-all duration-300 animate-fadeIn">
            <div className="text-[11px] font-mono uppercase tracking-wider text-forest font-bold">
              02 / Root Mean Squared Error (RMSE)
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-ink">
                {Math.round(rmse).toLocaleString()}
              </span>
              <span className="font-mono text-xs text-muted">{units}</span>
            </div>
            <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
              Quadratic penalty capturing peak ramp deviations ({rmseRatio}× MAE ratio).
            </p>
          </div>
        )}

        {/* Figure 3: Mean Bias */}
        <div className={`py-2 sm:py-0 transition-all duration-300 ${isAnalysis ? 'sm:px-4' : 'md:px-8'}`}>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            {isAnalysis ? '03 / Mean Forecast Error (Bias)' : '02 / Mean Forecast Error (Bias)'}
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span
              className={`font-mono text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight ${
                isOver ? 'text-copper' : isUnder ? 'text-forest' : 'text-ink'
              }`}
            >
              {meanError > 0 ? `+${Math.round(meanError).toLocaleString()}` : Math.round(meanError).toLocaleString()}
            </span>
            <span className="font-mono text-xs text-muted">{units}</span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Systematic directional bias. Positive values indicate overpredicted wind.
          </p>
        </div>

        {/* Figure 4: Coverage */}
        <div className={`py-2 sm:py-0 transition-all duration-300 ${isAnalysis ? 'sm:px-4 last:sm:pr-0' : 'md:pl-8'}`}>
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted font-bold">
            {isAnalysis ? '04 / Forecast Coverage' : '03 / Forecast Coverage'}
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-ink">
              {coverageRate}%
            </span>
            <span className="font-mono text-xs text-muted">
              ({matchedCount}/{totalTargetIntervals} SPs)
            </span>
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed font-sans max-w-xs">
            Settlement periods matched with forecasts published prior to decision cutoff.
          </p>
        </div>

      </div>

      {/* Summary Row */}
      {matchedCount > 0 && (
        <div className="mt-7 pt-5 border-t border-rule/70 text-sm sm:text-base text-ink font-sans leading-relaxed transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-baseline justify-between gap-4">
            <div className="max-w-3xl">
              <span className="font-mono text-xs text-muted uppercase tracking-wider mr-2 font-bold">Summary:</span>
              Across January 2026, day-ahead forecasts overpredicted realised wind generation in{' '}
              <strong className="font-medium text-copper">{overPct}% of settlement periods</strong> ({overforecastCount.toLocaleString()} intervals), with an average positive bias of{' '}
              <strong className="font-medium text-copper">+{Math.round(meanError).toLocaleString()} MW</strong> at decision cutoff.
            </div>
            {isAnalysis && metrics.estimatedImbalanceExposureGbp && (
              <div className="shrink-0 flex items-center space-x-3 text-xs font-mono bg-white border border-rule px-3.5 py-2 rounded-[4px] shadow-2xs self-start lg:self-auto">
                <div>
                  <span className="text-muted block text-[10px] uppercase">Cashout Exposure</span>
                  <strong className="text-copper font-bold text-sm">
                    £{(metrics.estimatedImbalanceExposureGbp / 1e6).toFixed(1)}M
                  </strong>
                </div>
                <span className="text-rule text-base">|</span>
                <div>
                  <span className="text-muted block text-[10px] uppercase">De-biasing Savings</span>
                  <strong className="text-forest font-bold text-sm">
                    £{(metrics.potentialSavingsGbp / 1e6).toFixed(1)}M
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </section>
  );
}
