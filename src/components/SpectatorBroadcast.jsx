import PositionAnimation from './PositionAnimation';
import React, { useState } from 'react';
import {
  Tv,
  Radio,
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
  Volume2
} from 'lucide-react';
import { POSITIONS } from '../types';

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

  const [posFilter, setPosFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pitchTab, setPitchTab] = useState('dual'); // 'dual' | 'team1' | 'team2'

  // Server-Synchronized Turn Timer
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
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [draftState?.turnEndsAt, draftState?.isPaused, draftState?.pausedRemainingMs]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeCaptain = currentTurn === 1 ? captain1 : captain2;
  const activeTeamName = currentTurn === 1 ? team1Name : team2Name;
  const activeKit = currentTurn === 1 ? team1Kit : team2Kit;
  const isDraftComplete = availablePlayers.length === 0 && (team1.length > 1 || team2.length > 1);

  // Position Counts
  const posCounts = {
    ALL: availablePlayers.length,
    GK: availablePlayers.filter(p => p.position === 'GK').length,
    DEF: availablePlayers.filter(p => p.position === 'DEF').length,
    MID: availablePlayers.filter(p => p.position === 'MID').length,
    FWD: availablePlayers.filter(p => p.position === 'FWD').length,
    ANY: availablePlayers.filter(p => p.position === 'ANY').length,
  };

  const filteredPlayers = availablePlayers.filter((p) => {
    const matchesPos = posFilter === 'ALL' || p.position === posFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const categorizeSquad = (team) => {
    return {
      gk: team.filter(p => p.position === 'GK'),
      def: team.filter(p => p.position === 'DEF'),
      mid: team.filter(p => p.position === 'MID' || p.position === 'ANY'),
      fwd: team.filter(p => p.position === 'FWD')
    };
  };

  const t1Cat = categorizeSquad(team1);
  const t2Cat = categorizeSquad(team2);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* TV Broadcast HUD Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 rounded-3xl shadow-2xl border-2 border-indigo-500/40 relative overflow-hidden">
        {/* Subtle Broadcast Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Radio className="w-3 h-3 text-rose-400" />
                  <span>LIVE BROADCAST</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">SPECTATOR STREAM</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Matchday Live Draft Broadcast ⚽
              </h1>
            </div>
          </div>

          {/* Broadcast Status Pill */}
          <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-md">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              {isDraftComplete ? '🏆 Draft Completed' : `Round Pick #${pickNumber} • ${availablePlayers.length} Available`}
            </span>
          </div>
        </div>
      </div>

      {/* Head-to-Head Live Scoreboard */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Team 1 Scoreboard Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-md border ${
                team1Kit === 'white' ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <Shirt className="w-6 h-6" />
              </div>
              <div className="truncate">
                <div className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">TEAM 1</div>
                <div className="text-sm font-black text-slate-900 truncate">{team1Name}</div>
                <div className="text-xs text-slate-500">Cap: <strong>{captain1?.name || 'Captain 1'}</strong></div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-800 font-mono">{team1.length}</span>
              <div className="text-[10px] text-emerald-700 font-bold uppercase">SIGNED</div>
            </div>
          </div>

          {/* Center VS Clash & Live Turn Banner */}
          <div className="text-center space-y-2">
            <div className="inline-block px-4 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-xs font-black uppercase tracking-widest shadow-sm">
              VERSUS
            </div>

            {isDraftComplete ? (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 font-black text-xs shadow-sm">
                🎉 Both squads are locked and ready for kickoff!
              </div>
            ) : (
              <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-md">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center space-x-1.5">
                  <span>CURRENT ON THE CLOCK</span>
                  <span>•</span>
                  <span className="font-mono text-white flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{formatTime(timeLeft)}</span>
                    {draftState?.isPaused && <span className="text-rose-400 text-[9px] font-bold ml-1">(PAUSED)</span>}
                  </span>
                </div>
                <div className="text-sm font-black text-white mt-0.5">
                  👑 {activeCaptain?.name || `Captain ${currentTurn}`} ({activeTeamName})
                </div>
              </div>
            )}
          </div>

          {/* Team 2 Scoreboard Card */}
          <div className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-300 flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-md border ${
                team2Kit === 'white' ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <Shirt className="w-6 h-6" />
              </div>
              <div className="truncate">
                <div className="text-[10px] font-black uppercase text-orange-700 tracking-wider">TEAM 2</div>
                <div className="text-sm font-black text-slate-900 truncate">{team2Name}</div>
                <div className="text-xs text-slate-500">Cap: <strong>{captain2?.name || 'Captain 2'}</strong></div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-orange-800 font-mono">{team2.length}</span>
              <div className="text-[10px] text-orange-700 font-bold uppercase">SIGNED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Broadcast Grid: Dual Squad Formations & Available Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Team 1 Roster Feed */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h3 className="font-black text-slate-900 text-base truncate">{team1Name} Squad</h3>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              {team1.length} Players
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {team1.map((p, idx) => {
              const pos = POSITIONS[p.position] || POSITIONS.ANY;
              const isCap = captain1 && p.id === captain1.id;

              return (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-black text-xs flex items-center justify-center border border-emerald-200">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-black text-slate-900 flex items-center space-x-1">
                        <span className="truncate">{p.name}</span>
                        {isCap && <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 rounded shadow-sm">(C)</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${pos.bgLight}`}>
                    {pos.badge} {pos.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center 4 Cols: Real-Time Draft Activity & Available Pool */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-slate-600" />
              <h3 className="font-black text-slate-900 text-base">Available Pool ({availablePlayers.length})</h3>
            </div>
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-28"
              />
            </div>
          </div>

          {/* Position Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {['ALL', 'GK', 'DEF', 'MID', 'FWD', 'ANY'].map((tab) => (
              <button
                key={tab}
                onClick={() => setPosFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                  posFilter === tab
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'ALL' : tab}
              </button>
            ))}
          </div>

          {/* Available Roster (View-Only) */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {availablePlayers.length === 0 ? '🏆 All players drafted!' : 'No players found'}
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const pos = POSITIONS[player.position] || POSITIONS.ANY;

                return (
                  <div
                    key={player.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 p-0.5">
                        <PositionAnimation position={player.position} size="sm" interactive={false} />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black text-slate-900 truncate">{player.name}</div>
                        <div className="text-[10px] text-slate-400">{pos.label}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${pos.bgLight}`}>
                      {pos.badge} {pos.code}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 4 Cols: Team 2 Roster Feed */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <h3 className="font-black text-slate-900 text-base truncate">{team2Name} Squad</h3>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-orange-100 text-orange-800 border border-orange-200">
              {team2.length} Players
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {team2.map((p, idx) => {
              const pos = POSITIONS[p.position] || POSITIONS.ANY;
              const isCap = captain2 && p.id === captain2.id;

              return (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-orange-50/50 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-mono font-black text-xs flex items-center justify-center border border-orange-200">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-black text-slate-900 flex items-center space-x-1">
                        <span className="truncate">{p.name}</span>
                        {isCap && <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 rounded shadow-sm">(C)</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${pos.bgLight}`}>
                    {pos.badge} {pos.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dual Tactical Formation Turf Graphic */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Stadium Tactical Pitch Live Formation
              </h3>
              <p className="text-xs text-slate-500">Dual tactical view showing both teams in matchday formation</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-black border border-slate-200">
            🏟️ Official Turf Board
          </span>
        </div>

        {/* Pitch Graphic */}
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-600/30 pitch-pattern min-h-[440px] p-6 flex flex-col justify-between shadow-inner">
          {/* Halfway line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-0.5 bg-white/30" />
            <div className="absolute w-36 h-36 rounded-full border border-white/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white/50" />
            </div>
          </div>

          {/* TEAM 1 (Top Half) */}
          <div className="z-10 space-y-3">
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider shadow">
                {team1Name} ({team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})
              </span>
            </div>

            <div className="flex justify-around items-center gap-2 flex-wrap">
              {team1.map((p) => (
                <SpectatorPlayerPin key={p.id} player={p} kitColor={team1Kit} isCaptain={captain1 && p.id === captain1.id} />
              ))}
            </div>
          </div>

          <div className="h-6" />

          {/* TEAM 2 (Bottom Half) */}
          <div className="z-10 space-y-3">
            <div className="flex justify-around items-center gap-2 flex-wrap">
              {team2.map((p) => (
                <SpectatorPlayerPin key={p.id} player={p} kitColor={team2Kit} isCaptain={captain2 && p.id === captain2.id} />
              ))}
            </div>

            <div className="text-center pt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider shadow">
                {team2Name} ({team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpectatorPlayerPin({ player, kitColor, isCaptain }) {
  const isWhite = kitColor === 'white';
  const pos = POSITIONS[player.position] || POSITIONS.ANY;

  return (
    <div className="flex flex-col items-center group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-md border relative transition-all ${
        isWhite ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-950 text-white border-slate-700'
      }`}>
        <Shirt className="w-4 h-4" />
        {isCaptain && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center shadow">
            C
          </span>
        )}
      </div>

      <div className="bg-slate-950/85 px-2 py-0.5 rounded-md mt-1 shadow max-w-[85px] text-center">
        <div className="text-[9px] font-black text-white truncate">{player.name}</div>
        <div className="text-[8px] text-amber-300 font-bold">{pos.code}</div>
      </div>
    </div>
  );
}
