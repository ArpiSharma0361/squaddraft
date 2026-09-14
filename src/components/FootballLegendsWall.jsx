import React, { useState } from 'react';
import { FOOTBALL_LEGENDS } from '../data/footballLegends';
import { Trophy, Star, Shield, Sparkles, Award, Globe } from 'lucide-react';

/**
 * Football Legends Gallery Wall & Museum Display Cabinet
 * Renders handcrafted legend tribute cards with graceful image fallbacks,
 * authentic labels, country badges, era tags, and touch/hover micro-interactions.
 */
export default function FootballLegendsWall() {
  const [activeLegendId, setActiveLegendId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#080f1e] via-[#0b1426] to-[#040814] border border-amber-500/30 shadow-2xl p-4 sm:p-6 lg:p-7 overflow-hidden">
      {/* Top Ambient Museum Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-amber-500/20 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>MUSEUM HALL OF FAME</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>FOOTBALL LEGENDS</span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
            Different eras. Same passion.
          </p>
        </div>
        <div className="text-[11px] font-bold text-amber-300/80 bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-500/20 self-start sm:self-auto">
          {FOOTBALL_LEGENDS.length} TRIBUTES
        </div>
      </div>

      {/* Grid Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 relative z-10">
        {FOOTBALL_LEGENDS.map((legend) => {
          const hasImageFailed = !legend.image || !!imageErrors[legend.id];
          const isFocused = activeLegendId === legend.id;

          return (
            <div
              key={legend.id}
              onMouseEnter={() => setActiveLegendId(legend.id)}
              onMouseLeave={() => setActiveLegendId(null)}
              onClick={() => setActiveLegendId(isFocused ? null : legend.id)}
              className="group relative rounded-2xl border border-amber-500/20 hover:border-amber-400/60 bg-gradient-to-b from-slate-900/90 to-slate-950/95 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer select-none flex flex-col justify-between"
            >
              {/* Card Spotlight Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${legend.accentColor}25, transparent 70%)`
                }}
              />

              {/* Upper Section: Image or Museum Tribute Placard */}
              <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-slate-800 to-slate-950 overflow-hidden flex items-center justify-center">
                {!hasImageFailed ? (
                  <img
                    src={legend.image}
                    alt={`${legend.name} football legend`}
                    loading="lazy"
                    onError={() => handleImageError(legend.id)}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  /* Premium Fallback Placard */
                  <div className="w-full h-full p-3.5 flex flex-col justify-between items-center text-center bg-gradient-to-b from-[#111c33] via-[#0d1627] to-[#080d1a]">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-base sm:text-lg">{legend.flag}</span>
                      <span className="text-[9px] font-black text-amber-400/80 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase">
                        {legend.era}
                      </span>
                    </div>

                    <div className="my-auto space-y-1.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-400/30 flex items-center justify-center mx-auto shadow-inner">
                        <Award className="w-6 h-6 text-amber-400" />
                      </div>
                      <div className="font-black text-xs sm:text-sm text-white tracking-wider uppercase">
                        {legend.shortName}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {legend.nationality}
                      </div>
                    </div>

                    <div className="w-full py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] font-black text-amber-300 uppercase tracking-widest">
                      {legend.position}
                    </div>
                  </div>
                )}

                {/* Subtle Gradient Fade at bottom of image */}
                {!hasImageFailed && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                )}

                {/* Top Flag / Era Badge */}
                {!hasImageFailed && (
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-white shadow-md">
                    <span>{legend.flag}</span>
                    <span className="text-[9px] font-bold text-slate-300">{legend.nationality}</span>
                  </div>
                )}
              </div>

              {/* Bottom Metadata Panel */}
              <div className="p-3 bg-gradient-to-b from-slate-950 to-[#060b17] border-t border-amber-500/10 relative z-10">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-black text-xs sm:text-sm text-white tracking-wide truncate group-hover:text-amber-300 transition-colors">
                    {legend.shortName}
                  </h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                    {legend.era}
                  </span>
                </div>

                {/* Short Descriptive Label */}
                <p className="text-[11px] font-bold text-amber-400/90 mt-0.5 tracking-wide truncate">
                  {legend.label}
                </p>

                {/* Detailed Drawer on Hover/Tap */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span className="truncate">{legend.position}</span>
                  <span className="text-slate-500 flex items-center gap-0.5">
                    <span>{legend.flag}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Museum Plaque Footer Quote */}
      <div className="relative z-10 mt-6 pt-4 border-t border-amber-500/20 text-center text-xs text-slate-400 font-medium">
        <span>⚽ Preserving football heritage across generations. Different eras. One beautiful game.</span>
      </div>
    </div>
  );
}
