import React, { useState } from 'react';

export default function CollapsibleMethodology({ isOpenDefault = false, audit = {}, cutoffTime }) {
  const [open, setOpen] = useState(isOpenDefault);

  return (
    <section id="methodology" className="py-8 border-b border-rule font-sans">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="font-serif text-2xl text-ink font-normal">
            Methodology & Technical Lineage
          </h3>
          <p className="text-xs text-muted mt-1">
            Documentation of official Elexon BMRS data streams, deterministic cutoff logic, and unit conversions.
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-mono text-ink hover:text-forest underline underline-offset-4 decoration-rule hover:decoration-forest cursor-pointer"
        >
          {open ? 'Hide documentation ↑' : 'Read documentation ↓'}
        </button>
      </div>

      {open && (
        <div className="pt-4 space-y-6 text-xs text-ink leading-relaxed max-w-4xl border-t border-rule/70">
          
          {/* Note 1 */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold mb-1.5">
              01 / Official Elexon BMRS Datasets
            </h4>
            <p className="text-muted leading-relaxed">
              All data is ingested directly from the official <strong>Elexon Balancing Mechanism Reporting Service (BMRS)</strong> API.
              Actual generation is extracted from the <code className="font-mono text-ink bg-paper-tint px-1 py-0.5">FUELHH</code> stream, filtered strictly to fuel type <code className="font-mono text-forest bg-paper-tint px-1 py-0.5">WIND</code>, representing physical national outturn power across Great Britain at 30-minute settlement period resolution.
              Forecast generation is queried from the <code className="font-mono text-ink bg-paper-tint px-1 py-0.5">WINDFOR</code> stream, which publishes National Grid ESO day-ahead and multi-day forward wind predictions.
            </p>
          </div>

          {/* Note 2 */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold mb-1.5">
              02 / Deterministic Selection & Look-Ahead Bias Prevention
            </h4>
            <p className="text-muted leading-relaxed">
              In UK wholesale power trading, day-ahead purchase decisions are committed on Day <code className="font-mono text-ink">D-1</code> prior to market auction gate closure (e.g. 11:00 UTC for EPEX SPOT or 17:00 UTC standard close). Any forecast issued after the cutoff was physically unavailable to trading desks at decision time.
            </p>
            <div className="mt-2.5 p-3.5 bg-paper-pure border border-rule font-mono text-[11px] text-ink space-y-1">
              <div>target_interval = Delivery Timestamp (Day D)</div>
              <div>decision_cutoff = (Day D − 1) at {cutoffTime || '17:00:00'} UTC</div>
              <div className="text-forest font-semibold">
                selected_forecast = max(publishTime) WHERE publishTime &lt;= decision_cutoff
              </div>
            </div>
            <p className="text-muted text-[11px] mt-1.5">
              Intra-day forecasts published after the cutoff are strictly excluded to avoid look-ahead bias. If an interval lacks an eligible forecast, it is reported honestly as an unmatched observation.
            </p>
          </div>

          {/* Note 3 */}
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-muted font-semibold mb-1.5">
              03 / Units: Instantaneous Power (MW) vs. Delivered Energy (MWh)
            </h4>
            <p className="text-muted leading-relaxed">
              Both Elexon source datasets report instantaneous power generation in <strong>Megawatts (MW)</strong>. 
              Because UK electricity settlement periods have a duration of 30 minutes (0.5 hour), the energy delivered in <strong>Megawatt-hours (MWh)</strong> is calculated as:
            </p>
            <div className="mt-2 p-2.5 bg-paper-pure border border-rule font-mono text-xs text-ink inline-block">
              Delivered Energy (MWh) = Power (MW) × 0.5 hours
            </div>
            <p className="text-muted text-[11px] mt-1.5">
              Signed error follows the industry convention: <code className="font-mono text-ink">Error = Forecast − Actual</code>. A positive error indicates an overforecast (shortfall risk), while a negative error denotes an underforecast (spill risk).
            </p>
          </div>

        </div>
      )}
    </section>
  );
}
