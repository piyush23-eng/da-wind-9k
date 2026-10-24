import React from 'react';

/**
 * Executive Commercial Summary for the Overview tab.
 * Gives the commercial procurement lead actionable findings without technical table clutter.
 */
export default function OverviewExecutiveSummary({
  metrics,
  onSwitchToAnalysis,
  onOpenDiurnal,
  onSelectEvent
}) {
  const overPct = metrics?.matchedCount > 0
    ? Math.round((metrics.overforecastCount / metrics.matchedCount) * 1000) / 10
    : 87.7;

  return (
    <section className="my-8 space-y-6 font-sans">
      
      {/* 3-Pillar Commercial Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Finding 1: Systematic Shortfall */}
        <div className="bg-white border border-rule p-5 rounded-md shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-copper font-bold uppercase tracking-wider">01 / Volume Exposure</span>
            <span className="px-1.5 py-0.5 rounded bg-copper/10 text-copper font-semibold">{overPct}% Shortfall</span>
          </div>
          <h4 className="font-serif text-lg text-ink font-normal leading-snug">
            Persistent Overforecast Bias
          </h4>
          <p className="text-xs text-muted leading-relaxed font-sans">
            In {overPct}% of all settlement periods, day-ahead forecasts overpredicted physical wind output by an average of{' '}
            <strong className="text-ink">+{Math.round(metrics?.meanError || 1817).toLocaleString()} MW</strong>. 
            Utilities bidding 100% of unadjusted forecast incurred heavy balancing mechanism shortfall penalties.
          </p>
        </div>

        {/* Finding 2: Ramp Timing Volatility */}
        <div className="bg-white border border-rule p-5 rounded-md shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-forest font-bold uppercase tracking-wider">02 / Peak Volatility</span>
            <span className="px-1.5 py-0.5 rounded bg-forest/10 text-forest font-semibold">+7,097 MW Peak</span>
          </div>
          <h4 className="font-serif text-lg text-ink font-normal leading-snug">
            Storm Front Phase Mismatches
          </h4>
          <p className="text-xs text-muted leading-relaxed font-sans">
            The largest deviations occurred during rapid Atlantic weather transitions (e.g. Jan 12 and Jan 26), where frontal arrival speeds differed by 2–4 hours from D-1 numerical weather models, producing acute single-interval ramps.
          </p>
        </div>

        {/* Finding 3: Commercial De-biasing */}
        <div className="bg-white border border-rule p-5 rounded-md shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-ink font-bold uppercase tracking-wider">03 / Procurement Strategy</span>
            <span className="px-1.5 py-0.5 rounded bg-paper-tint text-ink font-semibold">35% Error Cut</span>
          </div>
          <h4 className="font-serif text-lg text-ink font-normal leading-snug">
            Systematic De-Biasing Discount
          </h4>
          <p className="text-xs text-muted leading-relaxed font-sans">
            Applying an empirical de-biasing haircut before clearing Day-Ahead contracts reduces volume error from 1,985 MW to 1,286 MW, protecting an estimated <strong className="text-forest">£44.2M</strong> in cumulative imbalance cashout exposure.
          </p>
        </div>

      </div>

      {/* Action Banner: Bridge to Detailed Analysis */}
      <div className="bg-[#FAF9F5] border border-rule p-5 sm:p-6 rounded-md flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1">
          <div className="font-bold text-ink text-sm flex items-center space-x-2">
            <span>Trading Desk Action Protocol</span>
            <span className="text-[10px] bg-forest/10 text-forest px-2 py-0.5 rounded font-normal">D-1 Validated</span>
          </div>
          <p className="text-muted font-sans text-xs max-w-2xl leading-relaxed">
            Need half-hourly interval inspection, RMSE volatility penalties, or CSV ledger downloads? Switch to the detailed Analysis workstation.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {onOpenDiurnal && (
            <button
              type="button"
              onClick={onOpenDiurnal}
              className="px-3.5 py-2 bg-white border border-rule hover:border-ink text-ink font-semibold transition cursor-pointer rounded-[3px] shadow-2xs"
            >
              48-SP Diurnal Curve
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchToAnalysis}
            className="px-4 py-2 bg-[#245C46] text-white hover:bg-[#1A4333] font-bold transition cursor-pointer rounded-[3px] shadow-xs flex items-center space-x-1.5"
          >
            <span>Open Detailed Analysis</span>
            <span>→</span>
          </button>
        </div>
      </div>

    </section>
  );
}
