import React from 'react';

export function ArenaFallback({
  roomState,
  currentTurn = 1,
  activeStage = 'draft',
  onCoinFlip,
  tossState,
  isTossFlipping = false,
  tossWinner = null,
  role = 'spectator',
  canFlipToss = false
}) {
  const cap1Name = roomState?.captain1?.name || 'Captain 1';
  const cap2Name = roomState?.captain2?.name || 'Captain 2';
  const team1Name = roomState?.team1Name || 'Team White';
  const team2Name = roomState?.team2Name || 'Team Black';
  const team1Kit = roomState?.team1Kit || 'white';
  const team2Kit = roomState?.team2Kit || 'black';

  const team1Squad = roomState?.finalTeam1?.length > 0
    ? roomState.finalTeam1
    : (roomState?.draftState?.team1 || (roomState?.captain1 ? [roomState.captain1] : []));
  const team2Squad = roomState?.finalTeam2?.length > 0
    ? roomState.finalTeam2
    : (roomState?.draftState?.team2 || (roomState?.captain2 ? [roomState.captain2] : []));

  const isCap1Turn = currentTurn === 1;

  // Position color helper
  const getPosBadgeColor = (pos) => {
    switch (pos?.toUpperCase()) {
      case 'GK': return 'bg-amber-500 text-black border-amber-300';
      case 'DEF': return 'bg-blue-600 text-white border-blue-400';
      case 'MID': return 'bg-emerald-600 text-white border-emerald-400';
      case 'ST':
      case 'FWD': return 'bg-orange-500 text-white border-orange-300';
      default: return 'bg-purple-600 text-white border-purple-400';
    }
  };

  return (
    <div className="relative w-full h-[420px] md:h-[540px] rounded-2xl overflow-hidden bg-[#06101e] border border-blue-900/50 shadow-2xl flex flex-col justify-between p-3 md:p-5 select-none">
      {/* 2D Tactical Stadium Badge */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-bold text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        TACTICAL STADIUM ARENA
      </div>

      {/* Floodlight Corner Glows */}
      <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

      {/* Dynamic Turn Side Glow Background */}
      <div
        className={`absolute inset-y-0 left-0 w-1/2 transition-opacity duration-700 pointer-events-none ${
          isCap1Turn ? 'opacity-100' : 'opacity-20'
        } bg-gradient-to-r from-cyan-500/15 via-blue-500/5 to-transparent`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-1/2 transition-opacity duration-700 pointer-events-none ${
          !isCap1Turn ? 'opacity-100' : 'opacity-20'
        } bg-gradient-to-l from-purple-500/15 via-violet-500/5 to-transparent`}
      />

      {/* THE PITCH (Realistic Striped Turf with Lines) */}
      <div className="relative w-full flex-1 rounded-xl overflow-hidden border-2 border-white/20 shadow-inner flex my-2">
        {/* Alternating lawnmower stripes */}
        <div className="absolute inset-0 flex">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full ${i % 2 === 0 ? 'bg-[#155e2d]' : 'bg-[#1a7036]'}`}
            />
          ))}
        </div>

        {/* Pitch Lines */}
        <div className="absolute inset-3 border border-white/40 pointer-events-none">
          {/* Halfway line */}
          <div className="absolute inset-y-0 left-1/2 w-0 border-r border-white/40" />

          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full border border-white/40 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60" />
          </div>

          {/* Left Goal Box & Penalty Box */}
          <div className="absolute top-1/4 left-0 w-12 md:w-20 h-1/2 border-r border-y border-white/40" />
          <div className="absolute top-1/3 left-0 w-5 md:w-8 h-1/3 border-r border-y border-white/30" />
          {/* Left Penalty Arc */}
          <div className="absolute top-1/2 left-12 md:left-20 -translate-y-1/2 w-8 h-14 border-r border-white/30 rounded-r-full" />

          {/* Right Goal Box & Penalty Box */}
          <div className="absolute top-1/4 right-0 w-12 md:w-20 h-1/2 border-l border-y border-white/40" />
          <div className="absolute top-1/3 right-0 w-5 md:w-8 h-1/3 border-l border-y border-white/30" />
          {/* Right Penalty Arc */}
          <div className="absolute top-1/2 right-12 md:right-20 -translate-y-1/2 w-8 h-14 border-l border-white/30 rounded-l-full" />
        </div>

        {/* Turf Center Logo Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-20">
          <span className="text-3xl md:text-5xl">⚽</span>
          <div className="text-[10px] md:text-xs font-black tracking-widest text-white uppercase mt-1">
            SQUADDRAFT PRO
          </div>
        </div>

        {/* Tactical Squad Formations on Pitch */}
        {/* Team 1 Half (Left) */}
        <div className="relative w-1/2 h-full p-4 flex flex-wrap content-center justify-around gap-2 z-10">
          {team1Squad.map((player, idx) => (
            <div
              key={player.id || idx}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-white shadow-lg animate-fadeIn"
            >
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getPosBadgeColor(player.position)}`}>
                {player.position}
              </span>
              <span className="text-xs font-bold truncate max-w-[70px] md:max-w-[100px]">
                {player.name}
              </span>
            </div>
          ))}
        </div>

        {/* Team 2 Half (Right) */}
        <div className="relative w-1/2 h-full p-4 flex flex-wrap content-center justify-around gap-2 z-10">
          {team2Squad.map((player, idx) => (
            <div
              key={player.id || idx}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-purple-500/40 text-white shadow-lg animate-fadeIn"
            >
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getPosBadgeColor(player.position)}`}>
                {player.position}
              </span>
              <span className="text-xs font-bold truncate max-w-[70px] md:max-w-[100px]">
                {player.name}
              </span>
            </div>
          ))}
        </div>

        {/* COIN TOSS CENTER OVERLAY (When Toss is Active) */}
        {activeStage === 'toss' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 text-center">
            {/* 3D Golden Coin Simulation */}
            <div className="relative mb-4">
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-amber-300 shadow-2xl shadow-yellow-500/40 flex items-center justify-center ${
                  isTossFlipping ? 'animate-[spin_0.35s_linear_infinite]' : 'transition-transform duration-500 hover:scale-105'
                }`}
              >
                <div className="w-20 h-20 md:w-26 md:h-26 rounded-full border-2 border-dashed border-amber-800/40 flex flex-col items-center justify-center text-amber-950 font-black">
                  <span className="text-2xl md:text-3xl">⚽</span>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold">SQUADDRAFT</span>
                </div>
              </div>
            </div>

            {/* Toss Outcome / Status */}
            {isTossFlipping ? (
              <div className="animate-pulse">
                <span className="px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-black tracking-wider uppercase">
                  TOSSING COIN IN AIR...
                </span>
              </div>
            ) : tossWinner ? (
              <div className="flex flex-col items-center animate-bounce mt-1">
                <div className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-black text-base md:text-lg shadow-xl border border-cyan-300">
                  🏆 {tossWinner.name?.toUpperCase()} WINS THE TOSS!
                </div>
                <div className="text-xs font-bold text-cyan-200 mt-1 uppercase tracking-wider">
                  FIRST PICK: {tossWinner.name}
                </div>
              </div>
            ) : canFlipToss ? (
              <button
                onClick={onCoinFlip}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm md:text-base tracking-wider uppercase shadow-xl transition-all hover:scale-105 cursor-pointer active:scale-95"
              >
                🪙 FLIP THE COIN NOW
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                Waiting for Captain to flip coin...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Stadium Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 border border-blue-900/40 backdrop-blur-md z-10 text-xs">
        {/* Team 1 Indicator */}
        <div className={`flex items-center gap-2 ${isCap1Turn ? 'text-cyan-400 font-black' : 'text-slate-400 font-semibold'}`}>
          <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
          <span className="truncate max-w-[120px]">{team1Name} ({cap1Name})</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-cyan-600/40 text-[10px]">
            {team1Squad.length} Players
          </span>
        </div>

        {/* Center Current Turn Badge */}
        {activeStage === 'draft' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/40 text-white font-bold">
            <span className="animate-pulse text-amber-400">⚡</span>
            <span>{isCap1Turn ? `${cap1Name}'s Turn` : `${cap2Name}'s Turn`}</span>
          </div>
        )}

        {/* Team 2 Indicator */}
        <div className={`flex items-center gap-2 ${!isCap1Turn ? 'text-purple-400 font-black' : 'text-slate-400 font-semibold'}`}>
          <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-600/40 text-[10px]">
            {team2Squad.length} Players
          </span>
          <span className="truncate max-w-[120px]">{team2Name} ({cap2Name})</span>
          <span className="w-3 h-3 rounded-full bg-purple-500 shadow-md shadow-purple-400/50" />
        </div>
      </div>
    </div>
  );
}
