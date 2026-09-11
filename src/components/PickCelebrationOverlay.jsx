import React from 'react';
import { normalizePosition } from './PositionAnimation';
import { CARD_POSITION_CONFIG } from './PlayerCard';

/**
 * PickCelebrationOverlay
 * Recreates the "Selected Player Animation" showcase from Image 2.
 * Displays the 3D illuminated stadium character card on pick.
 */
export default function PickCelebrationOverlay({ recentlyPicked }) {
  if (!recentlyPicked || !recentlyPicked.player) return null;

  const { player, team, captain } = recentlyPicked;
  const posKey = normalizePosition(player.position);
  const config = CARD_POSITION_CONFIG[posKey] || CARD_POSITION_CONFIG.ANY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200" />

      {/* Selected Player Animation Card (From Image 2) */}
      <div
        className="relative z-10 bg-slate-900 border-2 rounded-3xl overflow-hidden shadow-2xl max-w-xs sm:max-w-sm w-full text-center transform animate-transfer-pop"
        style={{
          borderColor: config.crestColor,
          boxShadow: `0 25px 50px -12px ${config.glowColor}`
        }}
      >
        {/* Full Cinematic 3D Character Stadium Image */}
        <div className="relative w-full h-64 sm:h-72 overflow-hidden">
          <img
            src="/characters/selected_celebration.jpg"
            alt="Selected Player 3D Animation"
            className="w-full h-full object-cover"
          />

          {/* Top Tag */}
          <div className="absolute top-3 inset-x-0 flex justify-center">
            <div className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg">
              <span>{config.badgeIcon}</span>
              <span>{config.label} DRAFTED</span>
            </div>
          </div>

          {/* Bottom Overlay Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent flex flex-col justify-end p-3 pb-2">
            <div className="inline-flex items-center justify-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black mx-auto shadow-sm">
              <span>{config.badgeIcon}</span>
              <span>{config.code}</span>
            </div>
          </div>
        </div>

        {/* Card Body: Player & Team Confirmation */}
        <div className="p-4 pt-2 space-y-2 bg-slate-950 text-white">
          <div>
            <h3 className="text-2xl font-black tracking-tight uppercase text-white">
              {player.name}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5">
              Signed to <strong className="text-emerald-400 uppercase">{team}</strong> {captain ? `• Cap: ${captain}` : ''}
            </p>
          </div>

          {/* Solid Selected Button (Matching Image 2) */}
          <div className="pt-1">
            <div className="w-full py-2.5 rounded-xl bg-emerald-600 border border-emerald-500 text-white font-black text-xs sm:text-sm tracking-wider flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/30">
              <span className="text-base">✓</span>
              <span>SELECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
