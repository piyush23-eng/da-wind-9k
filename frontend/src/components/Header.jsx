import React from 'react';

export default function Header({ onOpenMethodology }) {
  return (
    <header className="pt-8 pb-6 border-b border-rule">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Top Minimal Navigation Bar */}
        <div className="flex items-baseline justify-between text-xs tracking-wide">
          <div className="flex items-baseline space-x-3">
            <span className="font-mono font-bold tracking-widest text-ink text-sm">
              WINDSCOPE
            </span>
            <span className="text-muted text-[11px] hidden sm:inline">
              / Independent Wind Market Intelligence
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono text-muted">
            <span>January 2026 · Great Britain</span>
            <button
              onClick={onOpenMethodology}
              className="text-ink hover:text-forest transition underline underline-offset-4 decoration-rule hover:decoration-forest cursor-pointer"
            >
              Methodology
            </button>
          </div>
        </div>

        {/* Editorial Masthead Headline */}
        <div className="mt-10 mb-4 max-w-4xl">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-normal tracking-tight text-ink leading-[1.05]">
            The forecast is not the weather.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted font-sans font-normal max-w-2xl leading-relaxed">
            January 2026 · A closer look at expected versus realised wind generation across Great Britain.
          </p>
        </div>

      </div>
    </header>
  );
}
