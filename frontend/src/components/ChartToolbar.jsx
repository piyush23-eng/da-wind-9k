import React, { useState, useRef, useEffect } from 'react';

/**
 * Accessible Control Tooltip with short hover delay and keyboard focus support.
 */
function ControlTooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const handleFocus = () => setVisible(true);
  const handleBlur = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap px-2.5 py-1 text-[11px] font-sans font-normal shadow-lg transition-opacity duration-150 rounded bg-[#1C2922] text-white border border-[#2E3A33] shadow-ink/20 ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {text}
          {/* Arrow pointer */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-[#1C2922] border-r border-b border-[#2E3A33] ${
              position === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1'
            }`}
          />
        </div>
      )}
    </div>
  );
}

export default function ChartToolbar({
  startDate,
  endDate,
  onRangeChange,
  cutoffTime,
  onCutoffChange,
  showActual,
  setShowActual,
  showForecast,
  setShowForecast,
  showShading,
  setShowShading,
  showErrorStrip,
  setShowErrorStrip,
  onSelectEvent,
  onOpenDiurnal,
}) {
  // Exact 6 Horizon options as specified
  const horizons = [
    {
      id: 'all',
      label: 'All of January',
      start: '2026-01-01',
      end: '2026-01-31',
      tooltip: 'View all available settlement periods in January 2026.',
    },
    {
      id: 'w1',
      label: 'Week 1',
      start: '2026-01-01',
      end: '2026-01-07',
      tooltip: 'View the corresponding date range in January 2026.',
    },
    {
      id: 'w2',
      label: 'Week 2',
      start: '2026-01-08',
      end: '2026-01-14',
      tooltip: 'View the corresponding date range in January 2026.',
    },
    {
      id: 'w3',
      label: 'Week 3',
      start: '2026-01-15',
      end: '2026-01-21',
      tooltip: 'View the corresponding date range in January 2026.',
    },
    {
      id: 'w4',
      label: 'Week 4',
      start: '2026-01-22',
      end: '2026-01-28',
      tooltip: 'View the corresponding date range in January 2026.',
    },
    {
      id: 'late',
      label: 'Late January',
      start: '2026-01-25',
      end: '2026-01-31',
      tooltip: 'View the final available date range of the month.',
    },
  ];

  return (
    <div className="pb-3.5 mb-3 border-b border-rule flex flex-col gap-3 font-mono text-xs">
      
      {/* PRIMARY CONTROLS ROW */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* GROUP 1: HORIZON SEGMENTED CONTROL */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-muted select-none">
            Horizon
          </span>

          <div
            className="inline-flex p-0.5 rounded-[4px] border border-rule bg-[#EDECE5] overflow-x-auto max-w-full"
            role="radiogroup"
            aria-label="Delivery Horizon Selection"
          >
            {horizons.map((h) => {
              const isSelected = startDate === h.start && endDate === h.end;

              return (
                <ControlTooltip
                  key={h.id}
                  text={h.tooltip}
                  position="top"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onRangeChange(h.start, h.end)}
                    className={`px-2.5 py-1 text-xs font-mono tracking-tight transition-all duration-150 ease-out cursor-pointer select-none rounded-[3px] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none ${
                      isSelected
                        ? 'bg-[#245C46] text-white font-bold shadow-xs border border-[#1A4333]'
                        : 'text-[#1C2922]/85 hover:text-[#1C2922] hover:bg-[#DCE4DF] font-medium'
                    }`}
                  >
                    {h.label}
                  </button>
                </ControlTooltip>
              );
            })}
          </div>
        </div>

        {/* RIGHT SECTION: SERIES TOGGLES & DECISION CUTOFF */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          
          {/* GROUP 2: SERIES VISIBILITY TOGGLES */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted select-none">
              Series
            </span>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              
              {/* Actual Generation Toggle */}
              <ControlTooltip
                text="Show or hide realised wind generation."
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showActual}
                  onClick={() => setShowActual(!showActual)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none ${
                    showActual
                      ? 'bg-[#245C46]/10 border-2 border-[#245C46] text-[#245C46] font-bold shadow-xs hover:bg-[#245C46]/20'
                      : 'bg-white border border-rule text-muted hover:border-ink hover:text-ink font-medium'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${
                      showActual
                        ? 'bg-[#245C46]'
                        : 'border border-rule-dark bg-transparent'
                    }`}
                  >
                    {showActual && (
                      <span className="w-1 h-1 rounded-full bg-white" />
                    )}
                  </span>
                  <span>Actual</span>
                </button>
              </ControlTooltip>

              {/* Forecast Generation Toggle */}
              <ControlTooltip
                text="Show or hide the eligible day-ahead forecast."
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showForecast}
                  onClick={() => setShowForecast(!showForecast)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none ${
                    showForecast
                      ? 'bg-[#B96848]/10 border-2 border-[#B96848] text-[#B96848] font-bold shadow-xs hover:bg-[#B96848]/20'
                      : 'bg-white border border-rule text-muted hover:border-ink hover:text-ink font-medium'
                  }`}
                >
                  <span
                    className={`w-3 h-0.5 border-b-2 border-dashed transition-colors ${
                      showForecast
                        ? 'border-[#B96848]'
                        : 'border-rule-dark'
                    }`}
                  />
                  <span>Forecast</span>
                </button>
              </ControlTooltip>

              {/* Shading Difference Area Toggle */}
              <ControlTooltip
                text="Show or hide the difference area between actual and forecast."
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showShading}
                  onClick={() => setShowShading(!showShading)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none ${
                    showShading
                      ? 'bg-ink/10 border-2 border-ink text-ink font-bold shadow-xs hover:bg-ink/15'
                      : 'bg-white border border-rule text-muted hover:border-ink hover:text-ink font-medium'
                  }`}
                >
                  {/* Visual dual-tint area icon */}
                  <span
                    className={`w-2.5 h-2.5 rounded-[2px] flex overflow-hidden border ${
                      showShading ? 'border-ink' : 'border-rule-dark'
                    }`}
                  >
                    <span className={`w-1/2 h-full ${showShading ? 'bg-[#B96848]' : 'bg-transparent'}`} />
                    <span className={`w-1/2 h-full ${showShading ? 'bg-[#245C46]' : 'bg-transparent'}`} />
                  </span>
                  <span>Shading</span>
                </button>
              </ControlTooltip>

              {/* Error Strip Toggle */}
              <ControlTooltip
                text="Show or hide signed forecast error across the selected period."
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showErrorStrip}
                  onClick={() => setShowErrorStrip(!showErrorStrip)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none ${
                    showErrorStrip
                      ? 'bg-ink/10 border-2 border-ink text-ink font-bold shadow-xs hover:bg-ink/15'
                      : 'bg-white border border-rule text-muted hover:border-ink hover:text-ink font-medium'
                  }`}
                >
                  <svg
                    className={`w-3 h-3 ${showErrorStrip ? 'text-ink' : 'text-muted'}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <line x1="1" y1="6" x2="11" y2="6" strokeDasharray="1 1" />
                    <rect x="3" y="2" width="2" height="4" fill="currentColor" stroke="none" />
                    <rect x="7" y="6" width="2" height="4" fill="currentColor" stroke="none" />
                  </svg>
                  <span>Error Strip</span>
                </button>
              </ControlTooltip>

            </div>
          </div>

          {/* Thin subtle group separator */}
          <div className="hidden sm:block h-6 w-px bg-rule self-center" />

          {/* GROUP 3: DECISION CUTOFF SELECTOR */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted select-none">
              Decision cutoff
            </span>

            <ControlTooltip
              text="Choose the procurement decision cutoff used to determine forecast eligibility."
              position="top"
            >
              <div className="relative inline-flex items-center">
                <select
                  value={cutoffTime}
                  onChange={(e) => onCutoffChange(e.target.value)}
                  aria-label="Decision cutoff time"
                  className="appearance-none font-mono text-xs pl-2.5 pr-7 py-1 rounded-[3px] border border-rule bg-white text-ink hover:border-ink font-semibold shadow-2xs cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:ring-forest focus-visible:outline-none"
                >
                  <option value="11:00:00" className="bg-white text-ink">
                    11:00 UTC (EPEX SPOT)
                  </option>
                  <option value="12:00:00" className="bg-white text-ink">
                    12:00 UTC (NordPool GB)
                  </option>
                  <option value="14:00:00" className="bg-white text-ink">
                    14:00 UTC (Post-Auction)
                  </option>
                  <option value="17:00:00" className="bg-white text-ink">
                    17:00 UTC (Standard D-1)
                  </option>
                  <option value="23:00:00" className="bg-white text-ink">
                    23:00 UTC (D-1 Final)
                  </option>
                </select>

                {/* Dropdown Chevron Indicator */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-3 h-3 text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </ControlTooltip>
          </div>

        </div>

      </div>

      {/* SECONDARY ROW: MARKET EVENT ANOMALY QUICK-JUMPS & DIURNAL BUTTON */}
      <div className="pt-2 mt-1 border-t border-rule/70 flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-mono">
        
        {/* Quick-Jump Event Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-ink mr-1">
            Market Events:
          </span>

          {/* Event 1: Jan 12 Peak Shortfall */}
          <button
            type="button"
            onClick={() => onSelectEvent && onSelectEvent('jan12')}
            className="px-2.5 py-1 rounded-[3px] border border-copper/60 bg-copper/10 text-copper font-bold hover:bg-copper/20 hover:border-copper transition cursor-pointer active:scale-[0.97] shadow-2xs"
            title="Jump to Jan 12 01:00 UTC: Peak shortfall (+7,097 MW)"
          >
            ⚡ Jan 12 Shortfall (+7.1k MW)
          </button>

          {/* Event 2: Jan 8 Surge Spill */}
          <button
            type="button"
            onClick={() => onSelectEvent && onSelectEvent('jan8')}
            className="px-2.5 py-1 rounded-[3px] border border-forest/60 bg-forest/10 text-forest font-bold hover:bg-forest/20 hover:border-forest transition cursor-pointer active:scale-[0.97] shadow-2xs"
            title="Jump to Jan 8 18:30 UTC: Peak uncontracted spill (-3,312 MW)"
          >
            🌊 Jan 8 Spill (-3.3k MW)
          </button>

          {/* Event 3: Jan 26 Front Gap */}
          <button
            type="button"
            onClick={() => onSelectEvent && onSelectEvent('jan26')}
            className="px-2.5 py-1 rounded-[3px] border border-ink/40 bg-white text-ink font-bold hover:border-ink hover:bg-paper-tint transition cursor-pointer active:scale-[0.97] shadow-2xs"
            title="Jump to Jan 26 17:00 UTC: Sustained evening gap (+4,133 MW)"
          >
            🌬️ Jan 26 Atlantic Front (+4.1k MW)
          </button>
        </div>

        {/* Diurnal Curve Action */}
        <div className="flex items-center space-x-2">
          {onOpenDiurnal && (
            <button
              type="button"
              onClick={onOpenDiurnal}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-[3px] bg-[#245C46] text-white hover:bg-[#1A4333] font-bold font-mono transition cursor-pointer active:scale-[0.97] shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>48-SP Diurnal Curve</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
