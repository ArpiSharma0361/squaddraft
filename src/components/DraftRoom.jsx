import PickCelebrationOverlay from './PickCelebrationOverlay';
import PlayerCard from './PlayerCard';
import React, { useState, useEffect } from 'react';
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
import { POSITIONS } from '../types';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function DraftRoom({
  allPlayers,
  captain1,
  captain2,
  team1Kit,
  team2Kit,
  team1Name,
  team2Name,
  firstPickCaptain,
  draftState,
  myRole,
  onDraftComplete,
  isSpectator
}) {
  const team1 = draftState?.team1 || [captain1];
  const team2 = draftState?.team2 || [captain2];
  const availablePlayers = draftState?.availablePlayers || [];
  const currentTurn = draftState?.currentTurn || 1;
  const pickNumber = draftState?.pickNumber || 1;
  const gkAlert = draftState?.gkAlert || null;
  const draftHistory = draftState?.draftHistory || [];

  const [posFilter, setPosFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyPicked, setRecentlyPicked] = useState(null);
  const [activePitchTab, setActivePitchTab] = useState('mySquad'); // 'mySquad' | 'oppSquad' | 'both'

  // 90-Second Timer
  const [timeLeft, setTimeLeft] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const totalMatchGKs = allPlayers.filter(p => p.position === 'GK').length;
  const availableGKs = availablePlayers.filter(p => p.position === 'GK').length;
  const isGkSelectionPhase = totalMatchGKs === 2 && availableGKs === 2;

  useEffect(() => {
    let timer;
    if (isTimerRunning && availablePlayers.length > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            sfx.playBuzzer();
            return 90;
          }
          if (prev <= 10) {
            sfx.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, availablePlayers.length]);

  useEffect(() => {
    setTimeLeft(90);
  }, [currentTurn, pickNumber]);

  // Grand Celebration when draft completes
  useEffect(() => {
    if (availablePlayers.length === 0 && (team1.length > 1 || team2.length > 1)) {
      sfx.playCheer();
      
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#059669', '#f59e0b', '#0284c7'] });
      fire(0.2, { spread: 60, colors: ['#10b981', '#38bdf8', '#ea580c'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#34d399', '#fbbf24'] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ffffff', '#059669'] });
      fire(0.1, { spread: 120, startVelocity: 45, colors: ['#f59e0b', '#38bdf8'] });
    }
  }, [availablePlayers.length]);

  const isAdmin = myRole === 'admin';
  const isCap1Viewer = myRole === 'cap1';
  const isCap2Viewer = myRole === 'cap2';

  // Admin NEVER acts as Captain 1 or Captain 2 and NEVER receives a draft turn
  const isMyTurn = !isAdmin && !isSpectator && (
    (currentTurn === 1 && isCap1Viewer) ||
    (currentTurn === 2 && isCap2Viewer)
  );

  const handleSelectPlayer = (player) => {
    if (isAdmin) {
      alert('Admin is in Spectator / Match Controller mode. Only Captains can draft players.');
      return;
    }
    if (isSpectator) return;
    if (!availablePlayers.some(p => p.id === player.id)) return;

    if (!isMyTurn) {
      alert(`It is currently Captain ${currentTurn}'s turn to pick!`);
      return;
    }

    setRecentlyPicked({
      player,
      team: currentTurn === 1 ? team1Name : team2Name,
      kit: currentTurn === 1 ? team1Kit : team2Kit,
      captain: currentTurn === 1 ? captain1.name : captain2.name
    });

    sfx.playPick();
    socket.emit('draft_pick_player', { player, token: captainToken, role: myRole, pickedByTurn: currentTurn });

    setTimeout(() => {
      setRecentlyPicked(null);
    }, 1500);
  };

  const handleUndo = () => {
    if (draftHistory.length === 0) return;
    if (isSpectator && !isAdmin) return;
    if (isAdmin) {
      if (!window.confirm('Admin Confirmation: Undo the last player pick?')) {
        return;
      }
    }
    socket.emit('draft_undo', { adminToken });
    sfx.playBuzzer();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredPlayers = availablePlayers.filter((p) => {
    const matchesPos = posFilter === 'ALL' || p.position === posFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const isDraftComplete = availablePlayers.length === 0 && (team1.length > 1 || team2.length > 1);
  const activeCaptain = currentTurn === 1 ? captain1 : captain2;
  const activeTeamName = currentTurn === 1 ? team1Name : team2Name;
  const activeKit = currentTurn === 1 ? team1Kit : team2Kit;

  const canUndo = draftHistory.length > 0 && (!isSpectator || isAdmin);

  // Count positions available
  const posCounts = {
    ALL: availablePlayers.length,
    GK: availablePlayers.filter(p => p.position === 'GK').length,
    DEF: availablePlayers.filter(p => p.position === 'DEF').length,
    MID: availablePlayers.filter(p => p.position === 'MID').length,
    FWD: availablePlayers.filter(p => p.position === 'FWD').length,
    ANY: availablePlayers.filter(p => p.position === 'ANY').length,
  };

  // Helper for mini squad formation
  const mySquadList = isCap2Viewer ? team2 : team1;
  const oppSquadList = isCap2Viewer ? team1 : team2;

  const categorizeSquad = (team) => {
    return {
      gk: team.filter(p => p.position === 'GK'),
      def: team.filter(p => p.position === 'DEF'),
      mid: team.filter(p => p.position === 'MID' || p.position === 'ANY'),
      fwd: team.filter(p => p.position === 'FWD')
    };
  };

  const mySquadCat = categorizeSquad(mySquadList);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Step Progress Ribbon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex items-center justify-between overflow-x-auto text-xs font-bold text-slate-500">
        <div className="flex items-center space-x-2 text-emerald-700 min-w-max px-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">✓</span>
          <span>1. Match Setup & Toss</span>
        </div>
        <span className="text-slate-300">➔</span>
        <div className="flex items-center space-x-2 text-emerald-800 font-black min-w-max px-2 bg-emerald-50 py-1 rounded-xl border border-emerald-200 shadow-sm">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black">2</span>
          <span>2. Live Ground Draft</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />
        </div>
        <span className="text-slate-300">➔</span>
        <div className={`flex items-center space-x-2 min-w-max px-2 ${isDraftComplete ? 'text-emerald-700 font-black' : 'text-slate-400'}`}>
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-black">3</span>
          <span>3. Tactical Pitch Lineup</span>
        </div>
        <span className="text-slate-300">➔</span>
        <div className="flex items-center space-x-2 min-w-max px-2 text-slate-400">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-black">4</span>
          <span>4. Kickoff & WhatsApp Share</span>
        </div>
      </div>

      {/* Admin Match Management Bar */}
      {isAdmin && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">👑</span>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                Admin Match Controller (Spectator Mode)
              </div>
              <div className="text-[11px] text-slate-300">
                Captains make picks exclusively. You can pause/resume draft, undo picks, or end draft.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => socket.emit('draft_pause_toggle', { adminToken })}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer"
            >
              {!isDraftPaused ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{!isDraftPaused ? 'Pause Draft' : 'Resume Draft'}</span>
            </button>
            {canUndo && (
              <button
                onClick={handleUndo}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center space-x-1 border border-slate-700 transition-all cursor-pointer"
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
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
            >
              End Draft
            </button>
          </div>
        </div>
      )}

      {/* Role Identity & Stadium Bar */}
      <div className={`p-4 rounded-2xl border-2 flex items-center justify-between shadow-sm transition-all ${
        isCap1Viewer
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300'
          : isCap2Viewer
          ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-white border-orange-300'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shadow-md border ${
            isCap1Viewer
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : isCap2Viewer
              ? 'bg-orange-500 text-white border-orange-400 shadow-orange-500/20'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <span>{isCap1Viewer ? 'CAPTAIN 1 DRAFT ROOM' : isCap2Viewer ? 'CAPTAIN 2 DRAFT ROOM' : 'DRAFT HEADQUARTERS'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 flex items-center space-x-2">
              <span>{isCap1Viewer ? `👑 Captain ${captain1?.name || 'Captain 1'}` : isCap2Viewer ? `👑 Captain ${captain2?.name || 'Captain 2'}` : 'Live Draft Control'}</span>
              <span className="text-xs font-semibold text-slate-600">
                ({isCap1Viewer ? `${team1Name} • ${team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}` : isCap2Viewer ? `${team2Name} • ${team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}` : 'Match in progress'})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
          <span className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 shadow-sm">
            PICK #{pickNumber}
          </span>
          <span className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 shadow-sm">
            {availablePlayers.length} IN POOL
          </span>
        </div>
      </div>

      {/* GK Phase Info Banner */}
      {isGkSelectionPhase && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center text-2xl shadow-md">
              🧤
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center space-x-2">
                <span>STAGE 1: GOALKEEPER FIRST PICK</span>
                <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded text-[9px] font-black shadow">TOSS ADVANTAGE</span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                <strong>{activeCaptain.name}</strong> picks a Goalkeeper. The 2nd GK automatically joins <strong>{currentTurn === 1 ? captain2.name : captain1.name}</strong>, and <strong>{activeCaptain.name} keeps the turn!</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Massive Turn & 90s Countdown Stadium Bar */}
      <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all duration-300 shadow-xl relative overflow-hidden ${
        isDraftComplete
          ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-500 shadow-emerald-500/20'
          : currentTurn === 1
          ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white border-emerald-400 shadow-emerald-700/20'
          : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white border-orange-400 shadow-orange-700/20'
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-2 transition-transform transform hover:scale-105 ${
              activeKit === 'white'
                ? 'bg-white text-slate-900 border-white ring-4 ring-white/30'
                : 'bg-slate-900 text-white border-slate-700 ring-4 ring-black/20'
            }`}>
              <Shirt className="w-9 h-9" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full bg-white/20 text-white border border-white/30 shadow">
                  {isDraftComplete ? '🏆 SQUADS COMPLETED' : `ROUND PICK #${pickNumber} • ${currentTurn === 1 ? team1Name : team2Name}`}
                </span>
                {isMyTurn && !isDraftComplete && (
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow animate-pulse">
                    ⚡ YOUR TURN TO SIGN A PLAYER
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-3xl font-black text-white mt-1 tracking-tight flex items-center space-x-2">
                {isDraftComplete ? (
                  <span className="text-white flex items-center space-x-2">
                    <span>All Squads Finalized! Match Ready ⚽</span>
                  </span>
                ) : (
                  <>
                    {isCap1Viewer && currentTurn === 1 && (
                      <span className="text-white">👑 {captain1.name}, you are on the clock! Choose your squad signing:</span>
                    )}
                    {isCap1Viewer && currentTurn === 2 && (
                      <span className="text-emerald-100">⏳ Waiting for Captain {captain2.name} ({team2Name}) to make his pick...</span>
                    )}

                    {isCap2Viewer && currentTurn === 2 && (
                      <span className="text-white">👑 {captain2.name}, your turn to pick! Choose your squad signing:</span>
                    )}
                    {isCap2Viewer && currentTurn === 1 && (
                      <span className="text-orange-100">⏳ Waiting for Captain {captain1.name} ({team1Name}) to make his pick...</span>
                    )}

                    {(isSpectator || myRole === 'admin') && (
                      <>
                        <span className="text-amber-300 font-black">
                          {activeCaptain.name}
                        </span>
                        <span className="text-white text-lg sm:text-2xl font-bold">'s Turn to Pick ({activeTeamName})</span>
                      </>
                    )}
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* 90s Glowing Timer & Unpick */}
          {!isDraftComplete && (
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2.5 px-5 py-3 rounded-2xl border-2 font-mono font-black text-base shadow-xl transition-all ${
                timeLeft <= 10
                  ? 'bg-rose-500 text-white border-white animate-pulse ring-4 ring-rose-300'
                  : 'bg-white/20 text-white border-white/30 backdrop-blur-sm'
              }`}>
                <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-white animate-bounce' : 'text-amber-300'}`} />
                <span className="tracking-wider">{formatTime(timeLeft)}</span>
                {myRole === 'admin' && (
                  <button
                    onClick={() => socket.emit('draft_pause_toggle', { adminToken })}
                    className="ml-1 text-white hover:text-amber-300 transition-colors"
                    title={!isDraftPaused ? 'Pause Timer' : 'Resume Timer'}
                  >
                    {!isDraftPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {canUndo && (
                <button
                  onClick={handleUndo}
                  className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-black flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
                  title="Unpick last chosen player"
                >
                  <Undo2 className="w-4 h-4 text-amber-300" />
                  <span>↩️ Undo</span>
                </button>
              )}
            </div>
          )}

          {isDraftComplete && (
            <button
              onClick={() => onDraftComplete(team1, team2)}
              className="px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 flex items-center space-x-2 transition-all transform active:scale-95 animate-bounce"
            >
              <span>View Match Tactical Lineup 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Pitch Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Team 1 Roster */}
        <div className={`lg:col-span-3 bg-white border-2 rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-all ${
          isCap1Viewer
            ? 'border-emerald-500 ring-4 ring-emerald-500/15 shadow-emerald-500/10'
            : currentTurn === 1
            ? 'border-emerald-400 ring-2 ring-emerald-400/20'
            : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-black text-slate-900 text-base truncate">
                    {isCap1Viewer ? `🌟 Your Squad (${team1Name})` : isCap2Viewer ? `⚔️ Opposition: ${team1Name}` : team1Name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cap: <strong className="text-slate-700">{captain1.name}</strong> • {team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                {team1.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {team1.map((p, idx) => {
                const pos = POSITIONS[p.position] || POSITIONS.ANY;
                const isCap = p.id === captain1.id;
                const isLatestPick = idx === team1.length - 1 && !isCap;

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-black text-xs flex items-center justify-center border border-emerald-200">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 flex items-center space-x-1">
                          <span className="truncate">{p.name}</span>
                          {isCap && <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-sm">(C)</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${pos.bgLight}`}>
                        {pos.badge} {pos.code}
                      </span>
                      {isLatestPick && canUndo && currentTurn === 2 && (
                        <button
                          onClick={handleUndo}
                          className="text-[10px] text-amber-700 hover:text-amber-900 px-1.5 py-0.5 bg-amber-100 rounded-lg border border-amber-200 font-bold"
                          title="Unpick this player"
                        >
                          ↩️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3.5 mt-3.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-bold">
            <span>Squad Count:</span>
            <span className="text-emerald-700 font-black">{team1.length} players signed</span>
          </div>
        </div>

        {/* Center Column: Available Draft Pool (Trading Cards) */}
        <div className="lg:col-span-6 bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                    Available Player Pool ({availablePlayers.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">Pick the best talent to complete your tactical lineup</p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search talent name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-48 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Position Filter Tabs (Matching Image 2) */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider hidden sm:inline-block pr-1">
                Position Filters:
              </span>
              {[
                { id: 'ALL', icon: '?', label: 'ALL', count: posCounts.ALL, activeStyle: 'bg-slate-900 text-white ring-2 ring-slate-500 shadow-md', idleStyle: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { id: 'GK', icon: '??', label: 'GK', count: posCounts.GK, activeStyle: 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30 ring-2 ring-amber-500', idleStyle: 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100' },
                { id: 'DEF', icon: '???', label: 'DEF', count: posCounts.DEF, activeStyle: 'bg-sky-500 text-white font-black shadow-md shadow-sky-500/30 ring-2 ring-sky-600', idleStyle: 'bg-sky-50 border border-sky-200 text-sky-900 hover:bg-sky-100' },
                { id: 'MID', icon: '?', label: 'MID', count: posCounts.MID, activeStyle: 'bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/30 ring-2 ring-emerald-600', idleStyle: 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100' },
                { id: 'FWD', icon: '?', label: 'ST', count: posCounts.FWD, activeStyle: 'bg-orange-500 text-white font-black shadow-md shadow-orange-500/30 ring-2 ring-orange-600', idleStyle: 'bg-orange-50 border border-orange-200 text-orange-900 hover:bg-orange-100' },
                { id: 'ANY', icon: '?', label: 'ANY', count: posCounts.ANY, activeStyle: 'bg-purple-500 text-white font-black shadow-md shadow-purple-500/30 ring-2 ring-purple-600', idleStyle: 'bg-purple-50 border border-purple-200 text-purple-900 hover:bg-purple-100' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setPosFilter(tab.id); sfx.playPick(); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap transform active:scale-95 flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                    posFilter === tab.id ? tab.activeStyle : tab.idleStyle
                  }`}
                >
                  <span className="text-xs">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    posFilter === tab.id ? 'bg-black/20 text-current' : 'bg-black/5 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Trading Cards Grid */}
            {availablePlayers.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
                  <Trophy className="w-10 h-10 text-amber-500 animate-trophy-glow" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Squads Complete & Ready for Kickoff! 🏆</h3>
                <p className="text-xs text-slate-500">All players signed. Check out the match tactical pitch lineup below!</p>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-xs font-semibold">No available players match this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isMyTurn={isMyTurn}
                    currentTurn={currentTurn}
                    isSpectator={isSpectator}
                    onSelect={handleSelectPlayer}
                    isRecentlyPicked={recentlyPicked?.player?.id === player.id}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{isSpectator || isAdmin ? (isAdmin ? '👑 Admin Match Controller (Spectating live draft)' : '👀 Spectator live broadcast') : isMyTurn ? '⚡ Click any player card to sign them to your squad' : '⏳ Waiting for other captain to pick'}</span>
            <span className="text-amber-600 font-black">⏱️ 90s Turn Limit</span>
          </div>
        </div>

        {/* Right Column: Team 2 Roster */}
        <div className={`lg:col-span-3 bg-white border-2 rounded-3xl p-5 flex flex-col justify-between shadow-lg transition-all ${
          isCap2Viewer
            ? 'border-orange-500 ring-4 ring-orange-500/15 shadow-orange-500/10'
            : currentTurn === 2
            ? 'border-orange-400 ring-2 ring-orange-400/20'
            : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <h3 className="font-black text-slate-900 text-base truncate">
                    {isCap2Viewer ? `🌟 Your Squad (${team2Name})` : isCap1Viewer ? `⚔️ Opposition: ${team2Name}` : team2Name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cap: <strong className="text-slate-700">{captain2.name}</strong> • {team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                {team2.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {team2.map((p, idx) => {
                const pos = POSITIONS[p.position] || POSITIONS.ANY;
                const isCap = p.id === captain2.id;
                const isLatestPick = idx === team2.length - 1 && !isCap;

                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between group hover:border-orange-300 hover:bg-orange-50/50 transition-all"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-mono font-black text-xs flex items-center justify-center border border-orange-200">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 flex items-center space-x-1">
                          <span className="truncate">{p.name}</span>
                          {isCap && <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-sm">(C)</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${pos.bgLight}`}>
                        {pos.badge} {pos.code}
                      </span>
                      {isLatestPick && canUndo && currentTurn === 1 && (
                        <button
                          onClick={handleUndo}
                          className="text-[10px] text-amber-700 hover:text-amber-900 px-1.5 py-0.5 bg-amber-100 rounded-lg border border-amber-200 font-bold"
                          title="Unpick this player"
                        >
                          ↩️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3.5 mt-3.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between font-bold">
            <span>Squad Count:</span>
            <span className="text-orange-700 font-black">{team2.length} players signed</span>
          </div>
        </div>
      </div>

      {/* Live "MY SQUAD" Tactical Formation Board */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <span>👑 Live Tactical Formation Turf</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black border border-emerald-200">
                  REAL-TIME FORMATION
                </span>
              </h3>
              <p className="text-xs text-slate-500">Watch your squad lineup build dynamically on the pitch as you draft</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <button
              onClick={() => setActivePitchTab('mySquad')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activePitchTab === 'mySquad'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              👑 {isCap2Viewer ? team2Name : team1Name} ({isCap2Viewer ? team2.length : team1.length})
            </button>
            <button
              onClick={() => setActivePitchTab('oppSquad')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activePitchTab === 'oppSquad'
                  ? 'bg-slate-800 text-white shadow-sm font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚔️ {isCap2Viewer ? team1Name : team2Name} ({isCap2Viewer ? team1.length : team2.length})
            </button>
          </div>
        </div>

        {/* Tactical Pitch Surface */}
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-600/30 pitch-pattern min-h-[360px] p-6 flex flex-col justify-between shadow-inner">
          {/* Pitch markings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-white/30" />
            <div className="absolute w-36 h-36 rounded-full border border-white/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/50" />
            </div>
          </div>

          {/* GK Line */}
          <div className="z-10 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">GOALKEEPER</div>
            <div className="flex justify-center items-center gap-3">
              {(activePitchTab === 'mySquad' ? mySquadCat.gk : categorizeSquad(oppSquadList).gk).map(p => (
                <MiniPitchPlayer key={p.id} player={p} kitColor={activePitchTab === 'mySquad' ? (isCap2Viewer ? team2Kit : team1Kit) : (isCap2Viewer ? team1Kit : team2Kit)} />
              ))}
              {(activePitchTab === 'mySquad' ? mySquadCat.gk : categorizeSquad(oppSquadList).gk).length === 0 && (
                <div className="w-10 h-10 rounded-xl border border-dashed border-white/30 flex items-center justify-center text-xs text-white/40">🧤</div>
              )}
            </div>
          </div>

          {/* DEF Line */}
          <div className="z-10 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">DEFENSE</div>
            <div className="flex justify-center items-center gap-3 flex-wrap max-w-xl mx-auto">
              {(activePitchTab === 'mySquad' ? mySquadCat.def : categorizeSquad(oppSquadList).def).map(p => (
                <MiniPitchPlayer key={p.id} player={p} kitColor={activePitchTab === 'mySquad' ? (isCap2Viewer ? team2Kit : team1Kit) : (isCap2Viewer ? team1Kit : team2Kit)} />
              ))}
              {(activePitchTab === 'mySquad' ? mySquadCat.def : categorizeSquad(oppSquadList).def).length === 0 && (
                <div className="w-10 h-10 rounded-xl border border-dashed border-white/30 flex items-center justify-center text-xs text-white/40">🛡️</div>
              )}
            </div>
          </div>

          {/* MID Line */}
          <div className="z-10 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">MIDFIELD</div>
            <div className="flex justify-center items-center gap-3 flex-wrap max-w-xl mx-auto">
              {(activePitchTab === 'mySquad' ? mySquadCat.mid : categorizeSquad(oppSquadList).mid).map(p => (
                <MiniPitchPlayer key={p.id} player={p} kitColor={activePitchTab === 'mySquad' ? (isCap2Viewer ? team2Kit : team1Kit) : (isCap2Viewer ? team1Kit : team2Kit)} />
              ))}
              {(activePitchTab === 'mySquad' ? mySquadCat.mid : categorizeSquad(oppSquadList).mid).length === 0 && (
                <div className="w-10 h-10 rounded-xl border border-dashed border-white/30 flex items-center justify-center text-xs text-white/40">🎯</div>
              )}
            </div>
          </div>

          {/* FWD Line */}
          <div className="z-10 text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 mb-1">ATTACK</div>
            <div className="flex justify-center items-center gap-3 flex-wrap max-w-xl mx-auto">
              {(activePitchTab === 'mySquad' ? mySquadCat.fwd : categorizeSquad(oppSquadList).fwd).map(p => (
                <MiniPitchPlayer key={p.id} player={p} kitColor={activePitchTab === 'mySquad' ? (isCap2Viewer ? team2Kit : team1Kit) : (isCap2Viewer ? team1Kit : team2Kit)} />
              ))}
              {(activePitchTab === 'mySquad' ? mySquadCat.fwd : categorizeSquad(oppSquadList).fwd).length === 0 && (
                <div className="w-10 h-10 rounded-xl border border-dashed border-white/30 flex items-center justify-center text-xs text-white/40">⚡</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* High-Impact 3D Pick Celebration Overlay */}
      <PickCelebrationOverlay recentlyPicked={recentlyPicked} />

      {/* GK Balancing Trigger Alert Modal */}
      {gkAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-400 rounded-3xl max-w-md w-full p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl shadow-md animate-bounce">
              🧤
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Goalkeepers Assigned!</h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                <strong className="text-slate-900">{gkAlert.pickedBy}</strong> drafted <strong className="text-emerald-700">{gkAlert.pickedPlayer.name}</strong> (GK).<br />
                <strong className="text-emerald-700">{gkAlert.autoGk.name}</strong> (GK) joined <strong className="text-slate-900">{gkAlert.receivedBy}</strong>.<br /><br />
                <span className="text-emerald-700 font-black">
                  ✨ Toss winner {gkAlert.pickedBy} keeps the turn and picks the next field player!
                </span>
              </p>
            </div>
            {!isSpectator ? (
              <button
                onClick={() => socket.emit('dismiss_gk_alert')}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/20"
              >
                Continue Match Draft ⚽
              </button>
            ) : (
              <div className="text-xs text-emerald-700 font-semibold pt-1">
                Draft continues automatically...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniPitchPlayer({ player, kitColor }) {
  const isWhite = kitColor === 'white';
  const pos = POSITIONS[player.position] || POSITIONS.ANY;

  return (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md border ${
        isWhite ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
      }`}>
        <Shirt className="w-4 h-4" />
      </div>
      <div className="bg-slate-950/80 px-2 py-0.5 rounded-md mt-1 shadow-sm max-w-[80px]">
        <div className="text-[9px] font-black text-white truncate">{player.name}</div>
      </div>
    </div>
  );
}

