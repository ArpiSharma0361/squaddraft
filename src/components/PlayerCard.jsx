import React, { useState } from 'react';
import { normalizePosition } from './PositionAnimation';

// Exact position metadata matching Image 2
export const CARD_POSITION_CONFIG = {
  GK: {
    code: 'GK',
    label: 'GOALKEEPER',
    badgeIcon: '🧤',
    pillBg: 'bg-amber-400 text-slate-950 font-black',
    border: 'border-amber-300 hover:border-amber-400',
    headerBg: 'from-amber-100/90 via-amber-50/40 to-white',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    buttonBg: 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black shadow-amber-400/20',
    img: '/characters/gk.jpg',
    crestColor: '#D97706',
    crestSymbol: '🧤'
  },
  DEF: {
    code: 'DEF',
    label: 'DEFENDER',
    badgeIcon: '🛡️',
    pillBg: 'bg-sky-500 text-white font-black',
    border: 'border-sky-300 hover:border-sky-400',
    headerBg: 'from-sky-100/90 via-sky-50/40 to-white',
    glowColor: 'rgba(2, 132, 199, 0.25)',
    buttonBg: 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white font-black shadow-sky-500/20',
    img: '/characters/def.jpg',
    crestColor: '#0284C7',
    crestSymbol: '🛡️'
  },
  MID: {
    code: 'MID',
    label: 'MIDFIELDER',
    badgeIcon: '⚽',
    pillBg: 'bg-emerald-500 text-white font-black',
    border: 'border-emerald-300 hover:border-emerald-400',
    headerBg: 'from-emerald-100/90 via-emerald-50/40 to-white',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    buttonBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black shadow-emerald-500/20',
    img: '/characters/mid.jpg',
    crestColor: '#059669',
    crestSymbol: '⚽'
  },
  ST: {
    code: 'ST',
    label: 'STRIKER',
    badgeIcon: '⚡',
    pillBg: 'bg-orange-500 text-white font-black',
    border: 'border-orange-300 hover:border-orange-400',
    headerBg: 'from-orange-100/90 via-orange-50/40 to-white',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black shadow-orange-500/20',
    img: '/characters/st.jpg',
    crestColor: '#EA580C',
    crestSymbol: '⚡'
  },
  ANY: {
    code: 'ANY',
    label: 'UTILITY',
    badgeIcon: '⭐',
    pillBg: 'bg-purple-500 text-white font-black',
    border: 'border-purple-300 hover:border-purple-400',
    headerBg: 'from-purple-100/90 via-purple-50/40 to-white',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    buttonBg: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black shadow-purple-500/20',
    img: '/characters/any.jpg',
    crestColor: '#7C3AED',
    crestSymbol: '⭐'
  }
};

/**
 * 3D Position-Themed Player Card (Exact replica of Image 2)
 */
export default function PlayerCard({
  player,
  isMyTurn = false,
  currentTurn = 1,
  isSpectator = false,
  onSelect,
  isRecentlyPicked = false
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const posKey = normalizePosition(player.position);
  const config = CARD_POSITION_CONFIG[posKey] || CARD_POSITION_CONFIG.ANY;

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (isSpectator || !isMyTurn || isClicked) return;
    
    setIsClicked(true);
    // Instant backend draft event
    if (onSelect) {
      onSelect(player);
    }
  };

  const isSelected = isClicked || isRecentlyPicked;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      className={`group relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden bg-white select-none ${
        isSpectator
          ? 'border-slate-200 shadow-xs'
          : !isMyTurn
          ? 'border-slate-200/90 opacity-75 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      } ${
        isSelected
          ? 'ring-4 ring-emerald-500 border-emerald-500 shadow-2xl scale-102'
          : isHovered && isMyTurn
          ? `${config.border} shadow-lg`
          : 'border-slate-200'
      }`}
      style={{
        boxShadow: isHovered && isMyTurn ? `0 14px 28px -6px ${config.glowColor}` : undefined
      }}
    >
      {/* Upper Artwork Area with Soft Position Gradient */}
      <div className={`relative p-3 pb-0 bg-gradient-to-b ${config.headerBg} flex flex-col justify-between`}>
        {/* Card Header: Position Pill + Metallic Shield Crest */}
        <div className="flex items-center justify-between z-10 w-full mb-1">
          {/* Left: Position Pill */}
          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xs ${config.pillBg}`}>
            <span className="text-xs">{config.badgeIcon}</span>
            <span>{config.code}</span>
          </div>

          {/* Right: 3D Shield Crest Emblem */}
          <div
            className="w-7 h-7 rounded-lg border shadow-xs flex items-center justify-center text-xs font-black bg-white/90 backdrop-blur-xs transition-transform duration-200 group-hover:scale-110"
            style={{ borderColor: `${config.crestColor}40`, color: config.crestColor }}
          >
            <span>{config.crestSymbol}</span>
          </div>
        </div>

        {/* 3D Character Avatar Bust */}
        <div className="relative w-full h-36 sm:h-40 flex items-center justify-center overflow-hidden">
          <img
            src={config.img}
            alt={player.name}
            className="w-full h-full object-cover rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Failsafe fallback
              e.target.style.display = 'none';
            }}
          />
          {/* Bottom Fade Gradient into Card Body */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Card Body: Player Name & Button */}
      <div className="p-3 sm:p-3.5 pt-2 flex flex-col justify-between flex-1 space-y-2 bg-white">
        {/* Player Name */}
        <div className="text-center">
          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight truncate uppercase leading-tight group-hover:text-slate-950">
            {player.name}
          </h4>
        </div>

        {/* Action Button */}
        <div>
          {isSpectator ? (
            <div className="w-full py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-black tracking-wider text-center border border-slate-200 uppercase">
              AVAILABLE
            </div>
          ) : isMyTurn ? (
            <button
              type="button"
              disabled={isSelected}
              onClick={handleCardClick}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wide shadow-sm transition-all duration-200 flex items-center justify-center space-x-1.5 transform active:scale-97 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                  : config.buttonBg
              }`}
            >
              <span>{isSelected ? '✓ SELECTED' : 'SELECT PLAYER'}</span>
            </button>
          ) : (
            <div className="w-full py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold tracking-wider text-center flex items-center justify-center space-x-1 border border-slate-200">
              <span>⏳ TURN {currentTurn}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
