import React, { useState } from 'react';

// Exact position metadata matching Panel 7 & User Guidelines
export const CARD_POSITION_CONFIG = {
  GK: {
    code: 'GK',
    label: 'GOALKEEPER',
    badgeIcon: '🧤',
    pillBg: 'bg-amber-500 text-slate-950 font-black',
    cardBorder: 'border-amber-400/40 hover:border-amber-400',
    cardBg: 'from-amber-950/20 via-slate-900 to-slate-950',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-amber-500/20',
    accentColor: '#f59e0b',
    symbol: '🧤'
  },
  DEF: {
    code: 'DEF',
    label: 'DEFENDER',
    badgeIcon: '🛡️',
    pillBg: 'bg-blue-600 text-white font-black',
    cardBorder: 'border-blue-500/40 hover:border-blue-400',
    cardBg: 'from-blue-950/20 via-slate-900 to-slate-950',
    glowColor: 'rgba(2, 132, 199, 0.3)',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black shadow-blue-500/20',
    accentColor: '#0284c7',
    symbol: '🛡️'
  },
  MID: {
    code: 'MID',
    label: 'MIDFIELDER',
    badgeIcon: '👟',
    pillBg: 'bg-emerald-600 text-white font-black',
    cardBorder: 'border-emerald-500/40 hover:border-emerald-400',
    cardBg: 'from-emerald-950/20 via-slate-900 to-slate-950',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black shadow-emerald-500/20',
    accentColor: '#10b981',
    symbol: '👟'
  },
  ST: {
    code: 'ST',
    label: 'STRIKER',
    badgeIcon: '🎯',
    pillBg: 'bg-orange-500 text-white font-black',
    cardBorder: 'border-orange-500/40 hover:border-orange-400',
    cardBg: 'from-orange-950/20 via-slate-900 to-slate-950',
    glowColor: 'rgba(249, 115, 22, 0.3)',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black shadow-orange-500/20',
    accentColor: '#f97316',
    symbol: '🎯'
  },
  FWD: {
    code: 'ST',
    label: 'STRIKER',
    badgeIcon: '🎯',
    pillBg: 'bg-orange-500 text-white font-black',
    cardBorder: 'border-orange-500/40 hover:border-orange-400',
    cardBg: 'from-orange-950/20 via-slate-900 to-slate-950',
    glowColor: 'rgba(249, 115, 22, 0.3)',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black shadow-orange-500/20',
    accentColor: '#f97316',
    symbol: '🎯'
  },
  ANY: {
    code: 'ANY',
    label: 'UTILITY',
    badgeIcon: '⭐',
    pillBg: 'bg-purple-600 text-white font-black',
    cardBorder: 'border-purple-500/40 hover:border-purple-400',
    cardBg: 'from-purple-950/20 via-slate-900 to-slate-950',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    buttonBg: 'bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 text-white font-black shadow-purple-500/20',
    accentColor: '#a855f7',
    symbol: '⭐'
  }
};

/**
 * Compact, modern, position-coded player card with zero player photos or fake stats.
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

  const rawPos = (player.position || 'MID').toUpperCase();
  const config = CARD_POSITION_CONFIG[rawPos] || CARD_POSITION_CONFIG.ANY;

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (isSpectator || !isMyTurn || isClicked) return;

    setIsClicked(true);
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
      className={`group relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden bg-gradient-to-b ${config.cardBg} p-3.5 select-none shadow-md ${
        isSpectator
          ? 'border-slate-800 opacity-90'
          : !isMyTurn
          ? 'border-slate-800/80 opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      } ${
        isSelected
          ? 'ring-2 ring-emerald-400 border-emerald-400 shadow-emerald-500/30'
          : isHovered && isMyTurn
          ? `${config.cardBorder}`
          : 'border-slate-800'
      }`}
      style={{
        boxShadow: isHovered && isMyTurn ? `0 8px 24px -4px ${config.glowColor}` : undefined
      }}
    >
      {/* Top Bar: Position Pill & Icon Badge */}
      <div className="flex items-center justify-between w-full mb-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider shadow-sm ${config.pillBg}`}>
          <span>{config.badgeIcon}</span>
          <span>{config.code}</span>
        </div>
        <div
          className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm shadow-inner bg-slate-950/60"
          style={{ borderColor: `${config.accentColor}50` }}
        >
          <span>{config.symbol}</span>
        </div>
      </div>

      {/* Center: Clean Bold Player Name */}
      <div className="my-2">
        <h4 className="font-black text-white text-sm sm:text-base tracking-wide truncate group-hover:text-cyan-200 transition-colors">
          {player.name}
        </h4>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
          {config.label}
        </p>
      </div>

      {/* Bottom: Action Button */}
      <div className="mt-3">
        {isSpectator ? (
          <div className="w-full py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">
            AVAILABLE
          </div>
        ) : isMyTurn ? (
          <button
            type="button"
            onClick={handleCardClick}
            disabled={isClicked}
            className={`w-full py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${config.buttonBg}`}
          >
            <span>DRAFT PLAYER</span>
            <span>➜</span>
          </button>
        ) : (
          <div className="w-full py-1.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center text-[10px] font-black uppercase tracking-wider text-slate-500">
            {currentTurn === 1 ? 'CAPTAIN 1 TURN' : 'CAPTAIN 2 TURN'}
          </div>
        )}
      </div>
    </div>
  );
}
