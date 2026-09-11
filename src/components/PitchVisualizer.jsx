import React, { useState } from 'react';
import { Shirt, Share2, Sparkles, Layers, Eye, Shield, Compass, Award } from 'lucide-react';
import { POSITIONS } from '../types';
import { sfx } from '../utils/soundEffects';

export default function PitchVisualizer({
  team1,
  team2,
  captain1,
  captain2,
  team1Kit,
  team2Kit,
  team1Name,
  team2Name,
  onOpenExportModal
}) {
  const [pitchView, setPitchView] = useState('both'); // 'both' | 'team1' | 'team2'
  const [is3DMode, setIs3DMode] = useState(false);

  const categorizeSquad = (team) => {
    const gk = team.filter(p => p.position === 'GK');
    const def = team.filter(p => p.position === 'DEF');
    const mid = team.filter(p => p.position === 'MID' || p.position === 'ANY');
    const fwd = team.filter(p => p.position === 'FWD');
    return { gk, def, mid, fwd };
  };

  const t1 = categorizeSquad(team1);
  const t2 = categorizeSquad(team2);

  const toggle3D = () => {
    setIs3DMode(!is3DMode);
    sfx.playBallKick();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Matchday Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-600/10 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>TACTICAL MATCHDAY FORMATION BOARD</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Official Stadium Lineup</span>
            <span>⚽</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">
            Visual formation board for <strong className="text-white underline decoration-amber-300">{team1Name}</strong> vs <strong className="text-white underline decoration-amber-300">{team2Name}</strong>.
          </p>
        </div>

        {/* Tactical Controls & Share */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggle3D}
            className={`px-4 py-2.5 rounded-xl border text-xs font-black flex items-center space-x-1.5 transition-all transform active:scale-95 shadow-md ${
              is3DMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/30'
                : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{is3DMode ? '🏟️ 3D Isometric' : '📐 2D Tactical'}</span>
          </button>

          <button
            onClick={() => { onOpenExportModal(); sfx.playPick(); }}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all transform active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Lineup Poster</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => { setPitchView('both'); sfx.playPick(); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            pitchView === 'both'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          🏟️ Full Pitch (Both Teams)
        </button>
        <button
          onClick={() => { setPitchView('team1'); sfx.playPick(); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            pitchView === 'team1'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {team1Kit === 'white' ? '⚪' : '⚫'} {team1Name} Tactics
        </button>
        <button
          onClick={() => { setPitchView('team2'); sfx.playPick(); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            pitchView === 'team2'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {team2Kit === 'white' ? '⚪' : '⚫'} {team2Name} Tactics
        </button>
      </div>

      {/* Tactical Stadium Pitch Board */}
      <div className="bg-white border-2 border-slate-200 p-4 sm:p-6 rounded-3xl shadow-xl overflow-hidden">
        <div className={`relative w-full rounded-2xl overflow-hidden border-2 border-emerald-600/30 pitch-pattern min-h-[640px] flex flex-col justify-between p-6 transition-all duration-500 shadow-inner ${
          is3DMode ? 'pitch-perspective-3d' : ''
        }`}>
          
          {/* Halfway Line & Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-1 bg-white/40 shadow-sm" />
            <div className="absolute w-44 h-44 rounded-full border-2 border-white/40 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/70 shadow-glow" />
            </div>
          </div>

          {/* Top Penalty Box & Goal Net */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 border-b-2 border-x-2 border-white/40 rounded-b-2xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-14 border-b-2 border-x-2 border-white/40 pointer-events-none bg-white/5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-emerald-950/70 border-b-2 border-x-2 border-white/60 pointer-events-none rounded-b" />

          {/* Bottom Penalty Box & Goal Net */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 border-t-2 border-x-2 border-white/40 rounded-t-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-14 border-t-2 border-x-2 border-white/40 pointer-events-none bg-white/5" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-emerald-950/70 border-t-2 border-x-2 border-white/60 pointer-events-none rounded-t" />

          {/* Corner Arcs */}
          <div className="absolute top-0 left-0 w-10 h-10 border-b-2 border-r-2 border-white/40 rounded-br-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-10 h-10 border-b-2 border-l-2 border-white/40 rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-t-2 border-r-2 border-white/40 rounded-tr-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-t-2 border-l-2 border-white/40 rounded-tl-full pointer-events-none" />

          {/* TEAM 1 (TOP HALF) */}
          {(pitchView === 'both' || pitchView === 'team1') && (
            <div className="space-y-6 z-10">
              <div className="text-center">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xl border ${
                  team1Kit === 'white'
                    ? 'bg-white text-slate-900 border-white ring-2 ring-emerald-400'
                    : 'bg-slate-950 text-white border-slate-700 ring-2 ring-emerald-400'
                }`}>
                  {team1Name} ({team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})
                </span>
              </div>

              {/* GK Line */}
              <div className="flex justify-center items-center gap-4">
                {t1.gk.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team1Kit} isCaptain={captain1 && p.id === captain1.id} />
                ))}
              </div>

              {/* DEF Line */}
              <div className="flex justify-around items-center gap-2 max-w-xl mx-auto">
                {t1.def.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team1Kit} isCaptain={captain1 && p.id === captain1.id} />
                ))}
              </div>

              {/* MID Line */}
              <div className="flex justify-around items-center gap-2 max-w-2xl mx-auto">
                {t1.mid.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team1Kit} isCaptain={captain1 && p.id === captain1.id} />
                ))}
              </div>

              {/* FWD Line */}
              <div className="flex justify-around items-center gap-2 max-w-lg mx-auto">
                {t1.fwd.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team1Kit} isCaptain={captain1 && p.id === captain1.id} />
                ))}
              </div>
            </div>
          )}

          {pitchView !== 'both' && <div className="h-12" />}

          {/* TEAM 2 (BOTTOM HALF) */}
          {(pitchView === 'both' || pitchView === 'team2') && (
            <div className="space-y-6 z-10 mt-8">
              {/* FWD Line */}
              <div className="flex justify-around items-center gap-2 max-w-lg mx-auto">
                {t2.fwd.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team2Kit} isCaptain={captain2 && p.id === captain2.id} />
                ))}
              </div>

              {/* MID Line */}
              <div className="flex justify-around items-center gap-2 max-w-2xl mx-auto">
                {t2.mid.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team2Kit} isCaptain={captain2 && p.id === captain2.id} />
                ))}
              </div>

              {/* DEF Line */}
              <div className="flex justify-around items-center gap-2 max-w-xl mx-auto">
                {t2.def.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team2Kit} isCaptain={captain2 && p.id === captain2.id} />
                ))}
              </div>

              {/* GK Line */}
              <div className="flex justify-center items-center gap-4">
                {t2.gk.map((p) => (
                  <PlayerPin key={p.id} player={p} kitColor={team2Kit} isCaptain={captain2 && p.id === captain2.id} />
                ))}
              </div>

              <div className="text-center pt-2">
                <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-xl border ${
                  team2Kit === 'white'
                    ? 'bg-white text-slate-900 border-white ring-2 ring-orange-400'
                    : 'bg-slate-950 text-white border-slate-700 ring-2 ring-orange-400'
                }`}>
                  {team2Name} ({team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function PlayerPin({ player, kitColor, isCaptain }) {
  const isWhite = kitColor === 'white';
  const pos = POSITIONS[player.position] || POSITIONS.ANY;

  return (
    <div className="flex flex-col items-center group cursor-pointer transform hover:scale-110 transition-all">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-xl border-2 relative transition-all ${
        isWhite
          ? 'bg-white text-slate-900 border-slate-200 ring-2 ring-white/60 shadow-md'
          : 'bg-slate-950 text-white border-slate-700 ring-2 ring-black/40 shadow-md'
      }`}>
        <Shirt className="w-6 h-6" />
        {isCaptain && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-md border border-amber-600">
            C
          </span>
        )}
      </div>

      <div className="bg-slate-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-center mt-1 shadow-xl max-w-[100px]">
        <div className="text-[11px] font-black text-white truncate">{player.name}</div>
        <div className="text-[9px] text-amber-300 font-bold">{pos.badge} {pos.code}</div>
      </div>
    </div>
  );
}

