import React, { useState } from 'react';
import { FOOTBALL_LEGENDS } from '../data/footballLegends';
import { Trophy, Sparkles, Image as ImageIcon, Award, Shield, Flame, Heart } from 'lucide-react';

const POSITION_BADGES = {
  GK: { label: 'GK', bg: 'bg-amber-100 text-amber-800 border-amber-300/90' },
  DEF: { label: 'DEF', bg: 'bg-blue-100 text-blue-800 border-blue-300/90' },
  MID: { label: 'MID', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300/90' },
  ST: { label: 'ST', bg: 'bg-orange-100 text-orange-800 border-orange-300/90' }
};

/**
 * Premium Light / Warm Football Legends Gallery Wall
 * Editorial football card presentation with real player photograph focus,
 * clean light fallback placeholders, warm cream surfaces, and daylight stadium aesthetic.
 */
export default function FootballLegendsWall() {
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="relative rounded-3xl bg-white border border-[#E5E7EB] shadow-md p-4 sm:p-6 lg:p-7 overflow-hidden text-[#0B2341]">
      {/* Subtle Warm Amber / Daylight Top Accent Glow */}
      <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#FFF8E8] via-[#FFFDF8] to-transparent pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-[#E5E7EB] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8E8] border border-[#D7A52A]/40 text-[#D7A52A] text-xs font-black uppercase tracking-wider mb-2.5">
            <span className="text-sm">👑</span>
            <span className="text-[#0B2341] font-bold">MUSEUM HALL OF FAME</span>
          </div>
          <h2 aria-label="FOOTBALL LEGENDS" className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2">
            <span className="text-[#0B2341]">FOOTBALL</span> <span className="text-[#07883F]">LEGENDS</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#536273] font-semibold mt-1">
            Different eras. Same passion.
          </p>
        </div>
        <div className="text-xs font-extrabold text-[#D7A52A] bg-[#FFF8E8] px-3.5 py-1.5 rounded-xl border border-[#D7A52A]/30 self-start sm:self-auto shadow-xs">
          {FOOTBALL_LEGENDS.length} LEGENDS
        </div>
      </div>

      {/* Editorial Cards Grid: 2 cols on mobile, 3 on tablet, 4-5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 relative z-10">
        {FOOTBALL_LEGENDS.map((legend) => {
          const hasImageFailed = !!imageErrors[legend.id];
          const posStyle = POSITION_BADGES[legend.position] || POSITION_BADGES.MID;

          return (
            <div
              key={legend.id}
              className="group relative rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#13A653] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg cursor-pointer select-none flex flex-col justify-between"
            >
              {/* Card Photo Area (~65% height, 4:5 aspect ratio) */}
              <div className="relative w-full aspect-[4/5] bg-[#F8F7F2] overflow-hidden flex items-center justify-center border-b border-[#E5E7EB]/80">
                {!hasImageFailed ? (
                  <img
                    src={legend.image}
                    alt={`${legend.name} football legend`}
                    loading="lazy"
                    decoding="async"
                    onError={() => handleImageError(legend.id)}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-103"
                  />
                ) : (
                  /* Clean Light Fallback Placeholder (Error tolerance if photograph not yet placed) */
                  <div className="w-full h-full p-3 flex flex-col justify-between items-center text-center bg-gradient-to-b from-[#FFF8E8] via-[#F8F7F2] to-[#FFFFFF]">
                    <div className="w-full flex items-center justify-between text-[11px]">
                      <span className="text-base">{legend.flag}</span>
                      <span className="text-[9px] font-bold text-[#536273] px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB]">
                        {legend.era}
                      </span>
                    </div>

                    <div className="my-auto space-y-1">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto shadow-xs text-[#D7A52A]">
                        <ImageIcon className="w-4 h-4 text-[#536273]" />
                      </div>
                      <div className="text-[9px] font-black text-[#536273] tracking-widest uppercase">
                        PLAYER IMAGE
                      </div>
                      <div className="text-[9px] font-bold text-[#07883F] uppercase tracking-wider">
                        COMING SOON
                      </div>
                      <div className="text-xs font-black text-[#0B2341] tracking-wide pt-0.5">
                        {legend.shortName}
                      </div>
                    </div>

                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${posStyle.bg}`}>
                      {posStyle.label} • {legend.nationality}
                    </div>
                  </div>
                )}

                {/* Subtle Flag Badge on top left of real photo */}
                {!hasImageFailed && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E7EB] shadow-xs text-xs">
                    <span>{legend.flag}</span>
                    <span className="text-[9px] font-bold text-[#0B2341]">{legend.position}</span>
                  </div>
                )}
              </div>

              {/* Card Metadata Bottom Bar */}
              <div className="p-3 bg-white flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-black border uppercase tracking-wider ${posStyle.bg}`}>
                      {posStyle.label}
                    </span>
                    <span className="text-xs">{legend.flag}</span>
                  </div>

                  {/* Player Name */}
                  <h3 className="font-black text-xs sm:text-sm text-[#0B2341] tracking-tight truncate group-hover:text-[#07883F] transition-colors mt-1">
                    {legend.shortName}
                  </h3>

                  {/* Descriptive Label (No fabricated quote marks) */}
                  <p className="text-[11px] font-bold text-[#07883F] truncate">
                    {legend.label}
                  </p>
                </div>

                {/* Era tag */}
                <div className="mt-2 pt-1.5 border-t border-[#E5E7EB]/70 flex items-center justify-between text-[10px] text-[#536273] font-semibold">
                  <span>{legend.era}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom of Legends Section: FOOTBALL UNITES US */}
      <div className="relative z-10 mt-8 pt-6 border-t border-[#E5E7EB] text-center space-y-4">
        <div>
          <h4 className="text-sm font-black text-[#0B2341] tracking-wider uppercase">
            FOOTBALL UNITES US
          </h4>
          <p className="text-xs text-[#536273] font-medium mt-0.5">
            Different eras. Different styles. One beautiful game.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-center">
          <div className="p-2.5 rounded-xl bg-[#FFF8E8] border border-[#E5E7EB]">
            <div className="text-xs font-black text-[#0B2341] uppercase">PLAY</div>
            <div className="text-[10px] text-[#536273] font-medium">Together</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFF8E8] border border-[#E5E7EB]">
            <div className="text-xs font-black text-[#0B2341] uppercase">DRAFT</div>
            <div className="text-[10px] text-[#536273] font-medium">Your Team</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FFF8E8] border border-[#E5E7EB]">
            <div className="text-xs font-black text-[#0B2341] uppercase">ENJOY</div>
            <div className="text-[10px] text-[#536273] font-medium">The Game</div>
          </div>
        </div>

        {/* Final Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF8E8] border border-[#D7A52A]/30 text-xs font-black text-[#07883F] uppercase tracking-widest shadow-xs">
          <span>PLAY • DRAFT • ENJOY • REPEAT</span>
        </div>
      </div>
    </div>
  );
}
