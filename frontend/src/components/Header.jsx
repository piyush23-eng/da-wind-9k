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
            {/* View Mode Toggle: Editorial vs Analysis */}
            <div className="flex items-center space-x-1 border border-rule px-1 py-0.5 bg-paper-pure text-[11px]">
              <button
                onClick={() => onToggleViewMode('editorial')}
                className={`px-2 py-0.5 transition cursor-pointer ${
                  viewMode === 'editorial'
                    ? 'bg-ink text-paper font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Editorial
              </button>
              <button
                onClick={() => onToggleViewMode('analysis')}
                className={`px-2 py-0.5 transition cursor-pointer ${
                  viewMode === 'analysis'
                    ? 'bg-forest-deep text-forest-bright font-semibold'
                    : 'text-muted hover:text-ink'
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

        {/* Hero Headline & Human Explanation */}
        <div className="mt-6 mb-1 max-w-4xl">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink leading-[1.1]">
            Wind is variable. Forecast error is measurable.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted font-sans max-w-2xl leading-relaxed">
            An empirical audit of Great Britain’s national day-ahead wind forecasts against realised physical generation across January 2026.
          </p>
        </div>

      </div>
    </header>
  );
}
