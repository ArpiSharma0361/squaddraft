import React, { useState, useEffect, useMemo } from 'react';
import {
  Tv,
  Clock,
  Shirt,
  Search,
  Users,
  Trophy,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Flame,
  Volume2,
  Radio
} from 'lucide-react';
import { ArenaCanvas } from './arena/ArenaCanvas';

export default function SpectatorBroadcast({
  allPlayers = [],
  captain1,
  captain2,
  team1Kit = 'white',
  team2Kit = 'black',
  team1Name = 'Team White',
  team2Name = 'Team Black',
  draftState,
  onOpenExportModal
}) {
  const team1 = draftState?.team1 || (captain1 ? [captain1] : []);
  const team2 = draftState?.team2 || (captain2 ? [captain2] : []);
  const availablePlayers = draftState?.availablePlayers || [];
  const currentTurn = draftState?.currentTurn || 1;
  const pickNumber = draftState?.pickNumber || 1;
  const draftHistory = draftState?.draftHistory || [];
  const isPaused = draftState?.isPaused || false;

  const [posFilter, setPosFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Server-Synchronized Countdown Timer
  const calculateServerTimeLeft = () => {
    if (!draftState) return 90;
    if (draftState.isPaused) {
      return Math.max(0, Math.ceil((draftState.pausedRemainingMs || 90000) / 1000));
    }
    if (!draftState.turnEndsAt) return 90;
    return Math.max(0, Math.ceil((draftState.turnEndsAt - Date.now()) / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(calculateServerTimeLeft);

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(calculateServerTimeLeft());
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 500);
    return () => clearInterval(interval);
  }, [draftState?.turnEndsAt, draftState?.isPaused, draftState?.pausedRemainingMs]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isDraftComplete = availablePlayers.length === 0 && (team1.length > 1 || team2.length > 1);
  const activeCaptain = currentTurn === 1 ? captain1 : captain2;
  const activeTeamName = currentTurn === 1 ? team1Name : team2Name;

  // Latest pick from draftHistory
  const latestPick = useMemo(() => {
    if (draftHistory.length === 0) return null;
    const lastState = draftHistory[draftHistory.length - 1];
    // Find player that was in lastState.availablePlayers but not in current availablePlayers
    const picked = lastState.availablePlayers.find(
      p => !availablePlayers.some(ap => ap.id === p.id)
    );
    if (!picked) return null;
    return {
      player: picked,
      teamNumber: lastState.currentTurn,
      by: lastState.currentTurn === 1 ? (captain1?.name || 'Captain 1') : (captain2?.name || 'Captain 2')
    };
  }, [draftHistory, availablePlayers, captain1, captain2]);

  // Position Counts
  const filteredPlayers = useMemo(() => {
    return availablePlayers.filter((p) => {
      const matchesPos = posFilter === 'ALL' || p.position === posFilter || (posFilter === 'ST' && p.position === 'FWD');
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPos && matchesSearch;
    });
  }, [availablePlayers, posFilter, searchQuery]);

  const activeStage = isDraftComplete ? 'finalTeams' : 'draft';

  const roomStateMock = {
    captain1,
    captain2,
    team1Name,
    team2Name,
    team1Kit,
    team2Kit,
    draftState,
    finalTeam1: isDraftComplete ? team1 : [],
    finalTeam2: isDraftComplete ? team2 : [],
    players: allPlayers,
    roomId: 'main'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* TOP BROADCAST BAR (Panel 4 Design) */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl flex items-center justify-between shadow-xl text-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 uppercase">
              SQUADDRAFT PRO
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white" />
            LIVE
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>SPECTATOR MODE (READ ONLY)</span>
          </div>
        </div>
      </div>

      {/* CENTER ARENA STADIUM & SQUAD PANELS */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Team 1 Squad Panel (Left - Blue/Cyan Theme) */}
          <div className="lg:col-span-3 bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{team1Name}</h3>
                    <p className="text-[11px] font-bold text-cyan-300">{captain1?.name || 'Captain 1'}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-600/40">
                  {team1.length} / {Math.ceil((allPlayers.length || 16) / 2)}
                </span>
              </div>

              {/* Roster List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {team1.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/20 text-xs">
                    <span className="font-bold text-slate-200 truncate max-w-[120px]">{p.name}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/40">
                      {p.position}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {currentTurn === 1 && !isDraftComplete && (
              <div className="mt-3 py-1.5 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-center text-xs font-black uppercase tracking-wider animate-pulse">
                ⚡ CURRENT TURN
              </div>
            )}
          </div>

          {/* Center 3D Arena Stadium */}
          <div className="lg:col-span-6 w-full">
            <ArenaCanvas
              roomState={roomStateMock}
              activeStage={activeStage}
              currentTurn={currentTurn}
              timerSeconds={timeLeft}
              role="spectator"
            />
          </div>

          {/* Team 2 Squad Panel (Right - Purple/Violet Theme) */}
          <div className="lg:col-span-3 bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-slate-950 border border-purple-500/30 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-purple-500/20 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500 shadow-md shadow-purple-500/50" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{team2Name}</h3>
                    <p className="text-[11px] font-bold text-purple-300">{captain2?.name || 'Captain 2'}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-600/40">
                  {team2.length} / {Math.ceil((allPlayers.length || 16) / 2)}
                </span>
              </div>

              {/* Roster List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {team2.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900/90 border border-purple-500/20 text-xs">
                    <span className="font-bold text-slate-200 truncate max-w-[120px]">{p.name}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/40">
                      {p.position}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {currentTurn === 2 && !isDraftComplete && (
              <div className="mt-3 py-1.5 px-3 rounded-xl bg-purple-500/20 border border-purple-400/50 text-purple-300 text-center text-xs font-black uppercase tracking-wider animate-pulse">
                ⚡ CURRENT TURN
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM BROADCAST TICKER (Panel 4 Design) */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Current Turn */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CURRENT TURN:</span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-black tracking-wider ${
              currentTurn === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            }`}>
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentTurn === 1 ? '#22d3ee' : '#c084fc' }} />
              <span>{activeCaptain?.name?.toUpperCase() || 'CAPTAIN'}</span>
            </div>
          </div>

          {/* Round & Pick */}
          <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            ROUND {Math.ceil(pickNumber / 2)} | PICK {pickNumber} OF {(allPlayers.length || 16) - 2}
          </div>

          {/* Latest Pick */}
          {latestPick && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">LATEST PICK:</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold">
                <span>⭐</span>
                <span>{latestPick.player.name} ({latestPick.player.position})</span>
                <span className="text-slate-400 text-[10px]">➜</span>
                <span className={latestPick.teamNumber === 1 ? 'text-cyan-300 font-black' : 'text-purple-300 font-black'}>
                  {latestPick.by}
                </span>
              </div>
            </div>
          )}

          {/* Timer Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono font-black">
            <Clock className={`w-3.5 h-3.5 ${timeLeft < 15 ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
            <span className={timeLeft < 15 ? 'text-red-400 animate-pulse' : 'text-white'}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* AVAILABLE PLAYERS POOL (READ ONLY) */}
      {!isDraftComplete && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                Available Players Pool ({availablePlayers.length})
              </h3>
            </div>

            {/* Position Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['ALL', 'GK', 'DEF', 'MID', 'ST'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosFilter(pos)}
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    posFilter === pos
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[160px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Grid of Players (Read-Only) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {player.position}
                  </span>
                  <span className="text-xs">
                    {player.position === 'GK' ? '🧤' : player.position === 'DEF' ? '🛡️' : player.position === 'MID' ? '👟' : '🎯'}
                  </span>
                </div>
                <div className="font-black text-white text-xs truncate">
                  {player.name}
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center py-1 bg-slate-950/60 rounded-lg">
                  WAITING TO BE DRAFTED
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
