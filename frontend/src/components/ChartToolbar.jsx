import React, { useState, useRef, useEffect } from 'react';

/**
 * Accessible Control Tooltip with short hover delay and keyboard focus support.
 */
function ControlTooltip({ text, children, position = 'top', isDark = false }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 220); // 220ms short delay prevents flickering between adjacent controls
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
          className={`absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 whitespace-nowrap px-2.5 py-1 text-[11px] font-sans font-normal shadow-lg transition-opacity duration-150 rounded ${
            position === 'top'
              ? 'bottom-full mb-2'
              : 'top-full mt-2'
          } ${
            isDark
              ? 'bg-[#0E201A] text-[#F6F5EF] border border-[#2A5244] shadow-black/40'
              : 'bg-[#1C2922] text-[#F6F5EF] border border-[#2E3A33] shadow-ink/20'
          }`}
        >
          {text}
          {/* Subtle arrow pointer */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 ${
              position === 'top'
                ? 'top-full -mt-1 ' + (isDark ? 'bg-[#0E201A] border-r border-b border-[#2A5244]' : 'bg-[#1C2922] border-r border-b border-[#2E3A33]')
                : 'bottom-full -mb-1 ' + (isDark ? 'bg-[#0E201A] border-l border-t border-[#2A5244]' : 'bg-[#1C2922] border-l border-t border-[#2E3A33]')
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
  viewMode = 'editorial',
  onSelectEvent,
  onOpenDiurnal,
}) {
  const isDark = viewMode === 'analysis';

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
    <div
      className={`pb-3.5 mb-3 border-b flex flex-col gap-3 font-mono text-xs transition-colors duration-200 ${
        isDark ? 'border-[#2A5244]' : 'border-rule'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        
        {/* GROUP 1: HORIZON SEGMENTED CONTROL */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold select-none ${
              isDark ? 'text-sage' : 'text-muted'
            }`}
          >
            Horizon
          </span>

          <div
            className={`inline-flex p-0.5 rounded-[4px] border overflow-x-auto max-w-full transition-colors duration-150 ${
              isDark
                ? 'bg-[#0E201A] border-[#2A5244]'
                : 'bg-[#EDECE5] border-rule'
            }`}
            role="radiogroup"
            aria-label="Delivery Horizon Selection"
          >
            {horizons.map((h) => {
              const isSelected = startDate === h.start && endDate === h.end;

              return (
                <ControlTooltip
                  key={h.id}
                  text={h.tooltip}
                  isDark={isDark}
                  position="top"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onRangeChange(h.start, h.end)}
                    className={`px-2.5 py-1 text-xs font-mono tracking-tight transition-all duration-150 ease-out cursor-pointer select-none rounded-[3px] active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none ${
                      isSelected
                        ? isDark
                          ? 'bg-[#245C46] text-white font-semibold shadow-xs border border-[#3DD598]/40 focus-visible:ring-forest-bright'
                          : 'bg-[#245C46] text-white font-semibold shadow-xs border border-[#1A4333] focus-visible:ring-forest'
                        : isDark
                        ? 'text-[#A9BBAE] hover:text-[#F6F5EF] hover:bg-[#1A382E] focus-visible:ring-forest-bright'
                        : 'text-[#1C2922]/80 hover:text-[#1C2922] hover:bg-[#DCE4DF] focus-visible:ring-forest'
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
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold select-none ${
                isDark ? 'text-sage' : 'text-muted'
              }`}
            >
              Series
            </span>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              
              {/* Actual Generation Toggle */}
              <ControlTooltip
                text="Show or hide realised wind generation."
                isDark={isDark}
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showActual}
                  onClick={() => setShowActual(!showActual)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none ${
                    showActual
                      ? isDark
                        ? 'bg-[#3DD598]/15 border-[#3DD598] text-[#3DD598] font-semibold hover:bg-[#3DD598]/25 focus-visible:ring-forest-bright'
                        : 'bg-[#245C46]/10 border-[#245C46] text-[#245C46] font-semibold hover:bg-[#245C46]/15 focus-visible:ring-forest'
                      : isDark
                      ? 'bg-transparent border-[#2A5244] text-muted-light/70 hover:border-sage/60 hover:text-paper focus-visible:ring-forest-bright'
                      : 'bg-transparent border-rule text-muted hover:border-rule-dark hover:text-ink focus-visible:ring-forest'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${
                      showActual
                        ? isDark ? 'bg-[#3DD598]' : 'bg-[#245C46]'
                        : isDark ? 'border border-[#2A5244] bg-transparent' : 'border border-rule-dark bg-transparent'
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
                isDark={isDark}
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showForecast}
                  onClick={() => setShowForecast(!showForecast)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none ${
                    showForecast
                      ? isDark
                        ? 'bg-[#F97316]/15 border-[#F97316] text-[#F97316] font-semibold hover:bg-[#F97316]/25 focus-visible:ring-forest-bright'
                        : 'bg-[#B96848]/10 border-[#B96848] text-[#B96848] font-semibold hover:bg-[#B96848]/15 focus-visible:ring-forest'
                      : isDark
                      ? 'bg-transparent border-[#2A5244] text-muted-light/70 hover:border-sage/60 hover:text-paper focus-visible:ring-forest-bright'
                      : 'bg-transparent border-rule text-muted hover:border-rule-dark hover:text-ink focus-visible:ring-forest'
                  }`}
                >
                  <span
                    className={`w-3 h-0.5 border-b-2 border-dashed transition-colors ${
                      showForecast
                        ? isDark ? 'border-[#F97316]' : 'border-[#B96848]'
                        : isDark ? 'border-[#2A5244]' : 'border-rule-dark'
                    }`}
                  />
                  <span>Forecast</span>
                </button>
              </ControlTooltip>

              {/* Shading Difference Area Toggle */}
              <ControlTooltip
                text="Show or hide the difference area between actual and forecast."
                isDark={isDark}
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showShading}
                  onClick={() => setShowShading(!showShading)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none ${
                    showShading
                      ? isDark
                        ? 'bg-sage/15 border-sage text-paper font-semibold hover:bg-sage/25 focus-visible:ring-forest-bright'
                        : 'bg-ink/8 border-ink/40 text-ink font-semibold hover:bg-ink/12 focus-visible:ring-forest'
                      : isDark
                      ? 'bg-transparent border-[#2A5244] text-muted-light/70 hover:border-sage/60 hover:text-paper focus-visible:ring-forest-bright'
                      : 'bg-transparent border-rule text-muted hover:border-rule-dark hover:text-ink focus-visible:ring-forest'
                  }`}
                >
                  {/* Visual dual-tint area icon */}
                  <span
                    className={`w-2.5 h-2.5 rounded-[2px] flex overflow-hidden border ${
                      showShading
                        ? isDark ? 'border-sage/80' : 'border-ink/60'
                        : isDark ? 'border-[#2A5244]' : 'border-rule-dark'
                    }`}
                  >
                    <span
                      className={`w-1/2 h-full ${
                        showShading
                          ? isDark ? 'bg-[#F97316]/70' : 'bg-[#B96848]/70'
                          : isDark ? 'bg-transparent' : 'bg-transparent'
                      }`}
                    />
                    <span
                      className={`w-1/2 h-full ${
                        showShading
                          ? isDark ? 'bg-[#3DD598]/70' : 'bg-[#245C46]/70'
                          : isDark ? 'bg-transparent' : 'bg-transparent'
                      }`}
                    />
                  </span>
                  <span>Shading</span>
                </button>
              </ControlTooltip>

              {/* Error Strip Toggle */}
              <ControlTooltip
                text="Show or hide signed forecast error across the selected period."
                isDark={isDark}
                position="top"
              >
                <button
                  type="button"
                  aria-pressed={showErrorStrip}
                  onClick={() => setShowErrorStrip(!showErrorStrip)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[3px] border text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none ${
                    showErrorStrip
                      ? isDark
                        ? 'bg-paper/15 border-paper/50 text-paper font-semibold hover:bg-paper/20 focus-visible:ring-forest-bright'
                        : 'bg-ink/8 border-ink/40 text-ink font-semibold hover:bg-ink/12 focus-visible:ring-forest'
                      : isDark
                      ? 'bg-transparent border-[#2A5244] text-muted-light/70 hover:border-sage/60 hover:text-paper focus-visible:ring-forest-bright'
                      : 'bg-transparent border-rule text-muted hover:border-rule-dark hover:text-ink focus-visible:ring-forest'
                  }`}
                >
                  {/* Diverging bars icon */}
                  <svg
                    className={`w-3 h-3 ${
                      showErrorStrip
                        ? isDark ? 'text-paper' : 'text-ink'
                        : isDark ? 'text-muted-light/70' : 'text-muted'
                    }`}
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
          <div
            className={`hidden sm:block h-6 w-px self-center ${
              isDark ? 'bg-[#2A5244]' : 'bg-rule'
            }`}
          />

          {/* GROUP 3: DECISION CUTOFF SELECTOR */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold select-none ${
                isDark ? 'text-sage' : 'text-muted'
              }`}
            >
              Decision cutoff
            </span>

            <ControlTooltip
              text="Choose the procurement decision cutoff used to determine forecast eligibility."
              isDark={isDark}
              position="top"
            >
              <div className="relative inline-flex items-center">
                <select
                  value={cutoffTime}
                  onChange={(e) => onCutoffChange(e.target.value)}
                  aria-label="Decision cutoff time"
                  className={`appearance-none font-mono text-xs pl-2.5 pr-7 py-1 rounded-[3px] border shadow-2xs cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none ${
                    isDark
                      ? 'bg-[#0E201A] text-paper border-[#2A5244] hover:border-sage/70 hover:bg-[#142D25] focus-visible:ring-forest-bright'
                      : 'bg-paper-pure text-ink border-rule hover:border-ink/60 hover:bg-white focus-visible:ring-forest'
                  }`}
                >
                  <option value="11:00:00" className={isDark ? 'bg-[#0E201A] text-paper' : 'bg-white text-ink'}>
                    11:00 UTC (EPEX SPOT)
                  </option>
                  <option value="12:00:00" className={isDark ? 'bg-[#0E201A] text-paper' : 'bg-white text-ink'}>
                    12:00 UTC (NordPool GB)
                  </option>
                  <option value="14:00:00" className={isDark ? 'bg-[#0E201A] text-paper' : 'bg-white text-ink'}>
                    14:00 UTC (Post-Auction)
                  </option>
                  <option value="17:00:00" className={isDark ? 'bg-[#0E201A] text-paper' : 'bg-white text-ink'}>
                    17:00 UTC (Standard D-1)
                  </option>
                  <option value="23:00:00" className={isDark ? 'bg-[#0E201A] text-paper' : 'bg-white text-ink'}>
                    23:00 UTC (D-1 Final)
                  </option>
                </select>

                {/* Dropdown Chevron Indicator */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className={`w-3 h-3 ${isDark ? 'text-sage' : 'text-muted'}`}
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

      {/* SECONDARY ROW: MARKET EVENT ANOMALY QUICK-JUMPS & DIURNAL DRAWER */}
      <div
        className={`pt-2 mt-1 border-t flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-mono ${
          isDark ? 'border-[#1F3E33]' : 'border-rule/60'
        }`}
      >
        {/* Quick-Jump Event Badges */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className={`text-[10px] uppercase tracking-wider font-semibold mr-0.5 ${isDark ? 'text-sage' : 'text-muted'}`}>
            Market Events:
          </span>

          {/* Event 1: Jan 12 Peak Shortfall */}
          <button
            type="button"
            onClick={() => onSelectEvent && onSelectEvent('jan12')}
            className={`px-2 py-0.5 rounded-[3px] border transition cursor-pointer active:scale-[0.97] ${
              isDark
                ? 'bg-[#0E201A] border-[#F97316]/50 text-[#F97316] hover:bg-[#F97316]/20'
                : 'bg-copper/5 border-copper/40 text-copper hover:bg-copper/15'
            }`}
            title="Jump to Jan 12 01:00 UTC: Peak shortfall (+7,097 MW)"
          >
            ⚡ Jan 12 Shortfall (+7.1k MW)
          </button>

          {/* Event 2: Jan 8 Surge Spill */}
          <button
            type="button"
            onClick={() => onSelectEvent && onSelectEvent('jan8')}
            className={`px-2 py-0.5 rounded-[3px] border transition cursor-pointer active:scale-[0.97] ${
              isDark
                ? 'bg-[#0E201A] border-[#3DD598]/50 text-[#3DD598] hover:bg-[#3DD598]/20'
                : 'bg-forest/5 border-forest/40 text-forest hover:bg-forest/15'
            }`}
            title="Jump to Jan 8 18:30 UTC: Peak uncontracted spill (-3,312 MW)"
          >
            🌊 Jan 8 Spill (-3.3k MW)
          </button>

          {/* Event 3: Jan 26 Front Gap */}
          <button
            type="button"
            onClick={() => onSelectEvent && onSelectEvent('jan26')}
            className={`px-2 py-0.5 rounded-[3px] border transition cursor-pointer active:scale-[0.97] ${
              isDark
                ? 'bg-[#0E201A] border-[#2A5244] text-paper/80 hover:border-paper hover:text-paper'
                : 'bg-paper-pure border-rule text-ink/80 hover:border-ink hover:text-ink'
            }`}
            title="Jump to Jan 26 17:00 UTC: Sustained evening gap (+4,133 MW)"
          >
            🌬️ Jan 26 Atlantic Front (+4.1k MW)
          </button>
        </div>

        {/* Diurnal Curve & Insights Trigger */}
        <div className="flex items-center space-x-2">
          {onOpenDiurnal && (
            <button
              type="button"
              onClick={onOpenDiurnal}
              className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-[3px] border font-mono transition cursor-pointer active:scale-[0.97] ${
                isDark
                  ? 'bg-forest-dark border-forest-bright/60 text-forest-bright hover:bg-forest'
                  : 'bg-paper-pure border-ink/40 text-ink hover:border-forest hover:text-forest'
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
