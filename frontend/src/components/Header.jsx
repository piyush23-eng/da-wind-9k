import React from 'react';

export default function Header({
  viewMode = 'editorial',
  onToggleViewMode,
  onOpenMethodology
}) {
  return (
    <header className="pt-5 pb-4 border-b border-rule">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Slim Top Navigation */}
        <nav className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-baseline space-x-3">
            <span className="font-mono font-bold tracking-[0.22em] text-ink text-sm">
              WINDSCOPE
            </span>
            <span className="text-muted text-[11px] hidden sm:inline font-sans">
              / The Shape of Uncertainty
            </span>
          </div>

          <div className="flex items-center space-x-5 text-xs text-muted font-mono">
            {/* View Mode Toggle: Animated Sliding Segmented Tab */}
            <div className="relative flex items-center p-0.5 rounded-[4px] border border-rule bg-[#EDECE5] text-[11px] select-none">
              {/* Sliding Pill Indicator */}
              <div
                className={`absolute top-0.5 bottom-0.5 transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) rounded-[3px] shadow-xs ${
                  viewMode === 'editorial'
                    ? 'left-0.5 w-[calc(50%-2px)] bg-[#1C2922]'
                    : 'left-[calc(50%+1px)] w-[calc(50%-2px)] bg-[#245C46]'
                }`}
              />

              <button
                type="button"
                onClick={() => onToggleViewMode('editorial')}
                className={`relative z-10 px-3 py-1 transition-colors duration-200 cursor-pointer ${
                  viewMode === 'editorial'
                    ? 'text-white font-semibold'
                    : 'text-[#1C2922]/70 hover:text-[#1C2922] font-medium'
                }`}
              >
                Editorial
              </button>
              <button
                type="button"
                onClick={() => onToggleViewMode('analysis')}
                className={`relative z-10 px-3 py-1 transition-colors duration-200 cursor-pointer ${
                  viewMode === 'analysis'
                    ? 'text-white font-semibold'
                    : 'text-[#1C2922]/70 hover:text-[#1C2922] font-medium'
                }`}
              >
                Analysis
              </button>
            </div>

            <span className="hidden md:inline text-rule">|</span>

            <span className="hidden md:inline">January 2026 · Great Britain</span>

            <button
              onClick={onOpenMethodology}
              className="text-ink hover:text-forest transition underline underline-offset-4 decoration-rule hover:decoration-forest cursor-pointer"
            >
              Methodology
            </button>
          </div>
        </nav>

        {/* Smooth Transitioning Hero Header Area */}
        <div className="relative mt-6 mb-1 min-h-[75px] sm:min-h-[85px]">
          {/* Editorial Headline */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              viewMode === 'editorial'
                ? 'opacity-100 translate-y-0 relative'
                : 'opacity-0 -translate-y-2 absolute inset-0 pointer-events-none'
            }`}
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink leading-[1.1]">
              Wind is variable. Forecast error is measurable.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted font-sans max-w-2xl leading-relaxed">
              An empirical audit of Great Britain’s national day-ahead wind forecasts against realised physical generation across January 2026.
            </p>
          </div>

          {/* Analysis Workstation Headline */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              viewMode === 'analysis'
                ? 'opacity-100 translate-y-0 relative'
                : 'opacity-0 translate-y-2 absolute inset-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-[3px] bg-forest/10 border border-forest/40 text-forest font-mono text-[10px] font-bold uppercase tracking-wider">
                Workstation Mode
              </span>
              <span className="font-mono text-xs text-muted">
                D-1 Procurement Auction Evaluation
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-ink leading-[1.1]">
              Quantitative Risk & Volatility Workstation
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-muted font-sans max-w-2xl leading-relaxed">
              High-density settlement ledger, statistical error distributions, and peak imbalance risk telemetry.
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
