import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  Shirt,
  Pause,
  Play,
  Undo2,
  Eye,
  Sparkles,
  Trophy,
  Shield,
  Zap,
  Layers,
  Flame,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';
import PlayerCard from './PlayerCard';
import { ArenaCanvas } from './arena/ArenaCanvas';
import { ArenaErrorBoundary } from './arena/ArenaErrorBoundary';

export default function DraftRoom({
  allPlayers = [],
  captain1,
  captain2,
  team1Kit = 'white',
  team2Kit = 'black',
  team1Name = 'Team White',
  team2Name = 'Team Black',
  firstPickCaptain,
  draftState,
  myRole = 'spectator',
  captainToken,
  adminToken,
  onDraftComplete,
  isSpectator = false
}) {
  const team1 = draftState?.team1 || (captain1 ? [captain1] : []);
  const team2 = draftState?.team2 || (captain2 ? [captain2] : []);
  const availablePlayers = draftState?.availablePlayers || [];
  const currentTurn = draftState?.currentTurn || 1;
  const pickNumber = draftState?.pickNumber || 1;
  const gkAlert = draftState?.gkAlert || null;
  const isPaused = draftState?.isPaused || false;
  const canUndo = draftState?.draftHistory?.length > 0;

  const [posFilter, setPosFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastConfirmedPick, setLastConfirmedPick] = useState(null);
  const [recentlyPickedAlert, setRecentlyPickedAlert] = useState(null);

  // Server-Authoritative Timer
  const [timeLeft, setTimeLeft] = useState(90);

  useEffect(() => {
    const updateTimer = () => {
      if (isPaused) {
        setTimeLeft(Math.max(0, Math.floor((draftState?.pausedRemainingMs || 90000) / 1000)));
        return;
      }
      if (draftState?.turnEndsAt) {
        const remaining = Math.max(0, Math.floor((draftState.turnEndsAt - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(90);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [draftState?.turnEndsAt, isPaused, draftState?.pausedRemainingMs]);

  // Listen for socket confirmation of picks to trigger 3D celebrations
  useEffect(() => {
    function onPlayerPicked(data) {
      if (data?.player) {
        setLastConfirmedPick({
          player: data.player,
          teamNumber: data.pickedByTurn || currentTurn
        });
        setRecentlyPickedAlert({
          player: data.player,
          by: (data.pickedByTurn || currentTurn) === 1 ? (captain1?.name || 'Captain 1') : (captain2?.name || 'Captain 2')
        });
        setTimeout(() => setRecentlyPickedAlert(null), 3500);
      }
    }
    socket.on('player_picked', onPlayerPicked);
    return () => socket.off('player_picked', onPlayerPicked);
  }, [currentTurn, captain1, captain2]);

  // Grand celebration when draft finishes
  const isDraftComplete = availablePlayers.length === 0 && (team1.length > 1 || team2.length > 1);
  useEffect(() => {
    if (isDraftComplete) {
      sfx.playCheer();
      try {
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isDraftComplete]);

  const isAdmin = myRole === 'admin';
  const isCap1Viewer = myRole === 'cap1';
  const isCap2Viewer = myRole === 'cap2';
  const isCaptain = isCap1Viewer || isCap2Viewer;

  const isMyTurn = !isAdmin && !isSpectator && (
    (currentTurn === 1 && isCap1Viewer) ||
    (currentTurn === 2 && isCap2Viewer)
  );

  const handleSelectPlayer = (player) => {
    if (isSpectator || isAdmin || !isMyTurn || isPaused) return;

    socket.emit('pick_player', {
      playerId: player.id,
      player,
      token: captainToken,
      role: myRole
    });
    sfx.playPick();
  };

  const handleUndo = () => {
    if (!isAdmin || !canUndo) return;
    socket.emit('undo_last_pick', { adminToken });
  };

  // Filtered Players
  const filteredPlayers = useMemo(() => {
    return availablePlayers.filter((p) => {
      const matchPos = posFilter === 'ALL' || p.position === posFilter || (posFilter === 'ST' && p.position === 'FWD');
      const matchQuery = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPos && matchQuery;
    });
  }, [availablePlayers, posFilter, searchQuery]);

  // Position breakdown helper
  const getPositionCounts = (squad) => ({
    GK: squad.filter(p => p.position === 'GK').length,
    DEF: squad.filter(p => p.position === 'DEF').length,
    MID: squad.filter(p => p.position === 'MID' || p.position === 'ANY').length,
    ST: squad.filter(p => p.position === 'ST' || p.position === 'FWD').length
  });

  const t1Counts = getPositionCounts(team1);
  const t2Counts = getPositionCounts(team2);

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
      {/* Top Admin Control Bar */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">👑</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                Stadium Control Center (Admin Mode)
              </div>
              <div className="text-[11px] text-slate-400">
                Captains make picks exclusively. You control timing, undo, and finalization.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => socket.emit('draft_pause_toggle', { adminToken })}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              {!isPaused ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{!isPaused ? 'Pause Draft' : 'Resume Draft'}</span>
            </button>
            {canUndo && (
              <button
                onClick={handleUndo}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center space-x-1 border border-slate-700 cursor-pointer transition-all"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Last Pick</span>
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm('Admin: Finalize draft now and view tactical lineup?')) {
                  onDraftComplete(team1, team2);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all cursor-pointer shadow-md"
            >
              End Draft
            </button>
          </div>
        </div>
      )}

      {/* GK Balancing Notification Alert */}
      {gkAlert && (
        <div className="bg-amber-500/15 border border-amber-400/40 p-3.5 rounded-2xl flex items-center justify-between text-amber-300 text-xs shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧤</span>
            <div>
              <span className="font-black uppercase tracking-wider">Goalkeeper Auto-Balanced!</span>
              <span className="text-amber-200 ml-1.5">
                {gkAlert.pickedBy} drafted {gkAlert.pickedPlayer?.name} (GK). {gkAlert.receivedBy} automatically received {gkAlert.autoGk?.name} (GK) for balance!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recently Picked Celebration Banner */}
      {recentlyPickedAlert && (
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-purple-950 border border-cyan-400/40 p-3 rounded-2xl flex items-center justify-between shadow-xl animate-fadeIn text-white text-xs">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>✓ PICK CONFIRMED:</span>
            <span className="text-cyan-300 font-black">{recentlyPickedAlert.player.name}</span>
            <span className="text-slate-400">({recentlyPickedAlert.player.position}) drafted by</span>
            <span className="text-purple-300 font-black">{recentlyPickedAlert.by}</span>
          </div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-black uppercase">
            Live Update
          </span>
        </div>
      )}

      {/* MAIN ARENA CENTERPIECE: STADIUM + PITCH (Panel 1 Layout) */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Top Arena Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase">
              SQUADDRAFT PRO ARENA
            </span>
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
              LIVE
            </span>
          </div>

          {/* Center Turn Banner */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                ROUND {Math.ceil(pickNumber / 2)} | PICK {pickNumber} OF {(allPlayers.length || 16) - 2}
              </span>
              <span className={`text-sm sm:text-base font-black tracking-wider uppercase ${
                currentTurn === 1 ? 'text-cyan-400' : 'text-purple-400'
              }`}>
                {currentTurn === 1 ? `${captain1?.name || 'Captain 1'}'s Turn` : `${captain2?.name || 'Captain 2'}'s Turn`}
              </span>
            </div>
          </div>

          {/* Server Synchronized Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-inner">
            <Clock className={`w-4 h-4 ${timeLeft < 15 ? 'text-red-400 animate-bounce' : 'text-emerald-400'}`} />
            <span className={`text-sm sm:text-base font-black tracking-wider font-mono ${
              timeLeft < 15 ? 'text-red-400 animate-pulse' : 'text-white'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* 3-Column Arena Arena Floor: Team 1 (Left) | 3D Arena Pitch (Center) | Team 2 (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Left HUD: Team 1 / Captain 1 (Blue / Cyan Theme) */}
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

              {/* Position Counts Pill Grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-3 text-center text-[10px] font-black">
                <div className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GK: {t1Counts.GK}
                </div>
                <div className="p-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DEF: {t1Counts.DEF}
                </div>
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  MID: {t1Counts.MID}
                </div>
                <div className="p-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  ST: {t1Counts.ST}
                </div>
              </div>

              {/* Drafted Roster List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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

          {/* Center 3D Arena Stadium Component */}
          <div className="lg:col-span-6 w-full">
            <ArenaErrorBoundary
              roomState={roomStateMock}
              activeStage={activeStage}
              currentTurn={currentTurn}
              role={myRole}
            >
              <ArenaCanvas
                roomState={roomStateMock}
                activeStage={activeStage}
                currentTurn={currentTurn}
                timerSeconds={timeLeft}
                lastConfirmedPick={lastConfirmedPick}
                role={myRole}
              />
            </ArenaErrorBoundary>
          </div>

          {/* Right HUD: Team 2 / Captain 2 (Purple / Violet Theme) */}
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

              {/* Position Counts Pill Grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-3 text-center text-[10px] font-black">
                <div className="p-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GK: {t2Counts.GK}
                </div>
                <div className="p-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  DEF: {t2Counts.DEF}
                </div>
                <div className="p-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  MID: {t2Counts.MID}
                </div>
                <div className="p-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  ST: {t2Counts.ST}
                </div>
              </div>

              {/* Drafted Roster List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
      </div>

      {/* BOTTOM SECTION: AVAILABLE PLAYERS & DRAFT CARDS (Panel 1 & Panel 7 Design) */}
      {!isDraftComplete && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          {/* Header with Position Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                Available Players ({availablePlayers.length})
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
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
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
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Player Cards Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-bold">
              No players found matching current filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isMyTurn={isMyTurn}
                  currentTurn={currentTurn}
                  isSpectator={isSpectator || isAdmin}
                  onSelect={handleSelectPlayer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DRAFT COMPLETE BANNER */}
      {isDraftComplete && (
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 border border-cyan-400/40 p-6 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs uppercase tracking-widest">
            🏆 DRAFT COMPLETED
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
            SQUADS FINALIZED IN ARENA
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Both teams have been fully drafted. View the tactical lineup formations on the pitch.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onDraftComplete(team1, team2)}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              PROCEED TO MATCH SUMMARY & SCORE ➜
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
