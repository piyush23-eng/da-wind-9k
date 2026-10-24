import React from 'react';

export default function Header({ onOpenMethodology }) {
  return (
    <header className="pt-6 pb-5 border-b border-divider">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Slim, Understated Navigation Bar */}
        <nav className="flex items-baseline justify-between text-xs font-mono">
          <div className="flex items-baseline space-x-3">
            <span className="font-mono font-bold tracking-[0.2em] text-ink text-sm">
              WINDSCOPE
            </span>
            <span className="text-muted text-[11px] hidden sm:inline font-sans">
              / The Shape of Uncertainty
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-muted font-mono">
            <span>January 2026 · Great Britain</span>
            <button
              onClick={onOpenMethodology}
              className="text-ink hover:text-forest transition underline underline-offset-4 decoration-divider hover:decoration-forest cursor-pointer"
            >
              Methodology & Notes
            </button>
          </div>
        </nav>

        {/* Hero Headline & Human Explanation */}
        <div className="mt-8 mb-2 max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink leading-[1.08]">
            Wind is variable. Forecast error is measurable.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted font-sans max-w-2xl leading-relaxed">
            An empirical audit of Great Britain’s national day-ahead wind forecasts against realised physical generation across January 2026.
          </p>
        </div>

      </div>
    </header>
  );
}
