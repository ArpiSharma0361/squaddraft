import React, { useState } from 'react';
import { FOOTBALL_LEGENDS } from '../data/footballLegends';
import { Trophy, Sparkles, Image as ImageIcon } from 'lucide-react';

const POSITION_BADGES = {
  GK: { label: 'GK', bg: 'bg-amber-100 text-amber-800 border-amber-300/90' },
  DEF: { label: 'DEF', bg: 'bg-blue-100 text-blue-800 border-blue-300/90' },
  MID: { label: 'MID', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300/90' },
  ST: { label: 'ST', bg: 'bg-orange-100 text-orange-800 border-orange-300/90' }
};

/**
 * Compact Football Legends Museum Hall of Fame Gallery (Phase 3.3.2)
 * Height-optimized 2-row collection on desktop (9 cards row 1, 8 cards row 2).
 * Fast, lightweight, and clean.
 */
export default function FootballLegendsWall() {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-sm p-4 sm:p-5 overflow-hidden text-[#0B2341]">
      {/* Subtle Warm Amber / Daylight Top Accent Glow */}
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#FFF8E8] via-[#FFFDF8] to-transparent pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF8E8] border border-[#D7A52A]/40 text-[#D7A52A] text-[10px] font-black uppercase tracking-wider mb-1">
            <Trophy className="w-3 h-3 text-[#D7A52A]" />
            <span className="text-[#0B2341] font-bold">MUSEUM HALL OF FAME</span>
          </div>
          <h2 aria-label="FOOTBALL LEGENDS" className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="text-[#0B2341]">FOOTBALL</span> <span className="text-[#07883F]">LEGENDS</span>
          </h2>
          <p className="text-xs text-[#536273] font-semibold">
            Different eras. Same passion.
          </p>
        </div>
        <div className="text-xs font-black text-[#D7A52A] bg-[#FFF8E8] px-3 py-1 rounded-xl border border-[#D7A52A]/30 self-start sm:self-auto shadow-2xs">
          {FOOTBALL_LEGENDS.length} LEGENDS
        </div>
      </div>

      {/* Compact Cards Grid: 2 cols on mobile, 4 on sm, 6 on md, 8 on lg, 9 on xl (2 rows total on desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-2 sm:gap-2.5 relative z-10">
        {FOOTBALL_LEGENDS.map((legend) => {
          const hasImageFailed = !!imageErrors[legend.id];
          const posStyle = POSITION_BADGES[legend.position] || POSITION_BADGES.MID;

          return (
            <div
              key={legend.id}
              className="group relative rounded-xl bg-white border border-[#E5E7EB] hover:border-[#13A653] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer select-none flex flex-col justify-between"
            >
              {/* Card Photo Area (Compact 4:3 Aspect Ratio) */}
              <div className="relative w-full aspect-[4/3] bg-[#F8F7F2] overflow-hidden flex items-center justify-center border-b border-[#E5E7EB]/80">
                {!hasImageFailed ? (
                  <img
                    src={legend.image}
                    alt={`${legend.name} football legend`}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(legend.id)}
                    style={{ objectPosition: legend.objectPosition || 'center 25%' }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-106"
                  />
                ) : (
                  /* Fallback Placeholder */
                  <div className="w-full h-full p-2 flex flex-col justify-center items-center text-center bg-gradient-to-b from-[#FFF8E8] to-[#FFFFFF]">
                    <span className="text-base">{legend.flag}</span>
                    <div className="text-[8px] font-black text-[#0B2341] tracking-wide mt-1">
                      {legend.shortName}
                    </div>
                  </div>
                )}

                {/* Corner Position Badge */}
                {!hasImageFailed && (
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E7EB] shadow-2xs text-[9px]">
                    <span className="font-black text-[#0B2341] text-[8px]">{legend.position}</span>
                  </div>
                )}
              </div>

              {/* Card Metadata Bar */}
              <div className="p-2 bg-white flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`px-1 py-0.2 rounded text-[8px] font-black border uppercase tracking-wider ${posStyle.bg}`}>
                      {posStyle.label}
                    </span>
                    <span className="text-[11px]">{legend.flag}</span>
                  </div>

                  {/* Player Name */}
                  <h3 className="font-black text-[11px] sm:text-xs text-[#0B2341] tracking-tight truncate group-hover:text-[#07883F] transition-colors">
                    {legend.shortName}
                  </h3>

                  {/* Descriptive Nickname */}
                  <p className="text-[9px] sm:text-[10px] font-bold text-[#07883F] truncate">
                    {legend.label}
                  </p>
                </div>

                {/* Era tag */}
                <div className="mt-1 pt-1 border-t border-[#E5E7EB]/70 flex items-center justify-between text-[8px] sm:text-[9px] text-[#536273] font-semibold">
                  <span className="truncate">{legend.era}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
