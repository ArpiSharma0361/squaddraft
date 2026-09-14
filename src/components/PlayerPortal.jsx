import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Trophy,
  Flame,
  Heart,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';
import FootballLegendsWall from './FootballLegendsWall';

const POSITION_OPTIONS = [
  { code: 'GK', label: 'Goalkeeper', icon: '🧤', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
  { code: 'DEF', label: 'Defender', icon: '🛡️', color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
  { code: 'MID', label: 'Midfielder', icon: '👟', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' },
  { code: 'ST', label: 'Striker', icon: '🎯', color: 'border-orange-500/40 text-orange-300 bg-orange-500/10' },
  { code: 'ANY', label: 'Flexible', icon: '⭐', color: 'border-purple-500/40 text-purple-300 bg-purple-500/10' }
];

export default function PlayerPortal({
  players = [],
  matchTitle = 'Sunday Turf War',
  onGoToAdmin
}) {
  const [name, setName] = useState('');
  const [primaryPosition, setPrimaryPosition] = useState('MID');
  const [secondaryPosition, setSecondaryPosition] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [justRegisteredName, setJustRegisteredName] = useState('');

  const posCounts = {
    GK: players.filter(p => p.position === 'GK').length,
    DEF: players.filter(p => p.position === 'DEF').length,
    MID: players.filter(p => p.position === 'MID').length,
    ST: players.filter(p => p.position === 'ST' || p.position === 'FWD').length,
    ANY: players.filter(p => p.position === 'ANY').length
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    if (players.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      alert(`"${cleanName}" is already registered on the match roster.`);
      return;
    }

    const newPlayer = {
      id: 'p_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: cleanName,
      position: primaryPosition,
      secondaryPosition: secondaryPosition || undefined
    };

    socket.emit('player_register', newPlayer);

    setJustRegisteredName(cleanName);
    setName('');
    setRegisteredSuccess(true);
    sfx.playWhistle();

    setTimeout(() => {
      setRegisteredSuccess(false);
    }, 6000);
  };

  return (
    <div className="w-full space-y-12 sm:space-y-16 py-4 animate-in fade-in duration-500">
      {/* ============================================================ */}
      {/* SECTION 1: HERO & REGISTRATION + LEGENDS SPLIT / STACKED */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN (Desktop) / TOP (Mobile): Intro & Registration Form */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8 order-1 lg:order-1">
          {/* Main Headline & Supporting Copy */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>MATCHDAY REGISTRATION LIVE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white tracking-tight leading-[1.05]">
              LEGENDS <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                INSPIRE US.
              </span>
            </h1>

            <div className="text-sm sm:text-base text-slate-300 space-y-2.5 font-medium leading-relaxed">
              <p>
                Football is more than a game, it's a story of dreams.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                From local pitches to the biggest stadiums, football has given the world unforgettable moments and legendary players.
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Their passion, skill and dedication continue to inspire new generations.
              </p>
              <p className="text-emerald-300 font-bold text-xs sm:text-sm">
                Now it's your turn to be part of the story.
              </p>
            </div>
          </div>

          {/* Registration Card: JOIN THIS WEEK'S MATCH */}
          <div id="register-card" className="relative rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  JOIN THIS WEEK'S MATCH
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Register now and get drafted into one of the teams.
                </p>
              </div>
              <span className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xl">
                ⚽
              </span>
            </div>

            {/* Success Feedback Alert */}
            {registeredSuccess && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-400/50 flex items-center gap-3 animate-in fade-in duration-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-black text-sm text-white flex items-center gap-1.5">
                    <span>YOU'RE REGISTERED ⚽</span>
                  </div>
                  <p className="text-xs text-emerald-300 font-medium">
                    See you on the pitch{justRegisteredName ? `, ${justRegisteredName}` : ''}! You are added to the live draft pool.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Field 1: Your Name */}
              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your football name..."
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-700/80 focus:border-emerald-400 rounded-2xl text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all shadow-inner"
                />
              </div>

              {/* Field 2: Primary Position */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    Primary Position
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400">Required</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {POSITION_OPTIONS.map((pos) => {
                    const isSelected = primaryPosition === pos.code;
                    return (
                      <button
                        key={pos.code}
                        type="button"
                        onClick={() => {
                          setPrimaryPosition(pos.code);
                          sfx.playPick();
                        }}
                        className={`py-3 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-lg shadow-emerald-500/20 scale-102'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <span className="text-base sm:text-lg">{pos.icon}</span>
                        <span className="text-xs font-black tracking-wider">{pos.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Secondary Position (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                    Secondary Position
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Optional</span>
                </div>
                <select
                  value={secondaryPosition}
                  onChange={(e) => setSecondaryPosition(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-slate-300 text-xs font-bold focus:outline-none focus:border-slate-600 cursor-pointer"
                >
                  <option value="">No secondary position</option>
                  <option value="GK">🧤 Goalkeeper (GK)</option>
                  <option value="DEF">🛡️ Defender (DEF)</option>
                  <option value="MID">👟 Midfielder (MID)</option>
                  <option value="ST">🎯 Striker / Forward (ST)</option>
                  <option value="ANY">⭐ Flexible / Utility (ANY)</option>
                </select>
              </div>

              {/* Action Button: REGISTER NOW → */}
              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>REGISTER NOW</span>
                <span>→</span>
              </button>
            </form>
          </div>

          {/* Real-time Position Breakdown Chips */}
          <div className="grid grid-cols-5 gap-2 text-center select-none">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <div className="text-xs sm:text-sm font-black">🧤 {posCounts.GK}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5">GK</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <div className="text-xs sm:text-sm font-black">🛡️ {posCounts.DEF}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5">DEF</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <div className="text-xs sm:text-sm font-black">👟 {posCounts.MID}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5">MID</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <div className="text-xs sm:text-sm font-black">🎯 {posCounts.ST}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5">ST</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <div className="text-xs sm:text-sm font-black">⭐ {posCounts.ANY}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5">ANY</div>
            </div>
          </div>

          {/* Confirmed Matchday Roster Drawer */}
          <div id="confirmed-roster" className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-black text-white">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>CONFIRMED SQUAD ROSTER ({players.length})</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-600/30">
                Match Pool
              </span>
            </div>

            {players.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No players registered yet. Be the first to claim your spot!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-200 truncate">{idx + 1}. {p.name}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                      {p.position}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (Desktop) / BOTTOM (Mobile): FOOTBALL LEGENDS WALL */}
        <div className="lg:col-span-7 order-2 lg:order-2">
          <FootballLegendsWall />
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: FOOTBALL PHILOSOPHY & COMMUNITY MESSAGE */}
      {/* ============================================================ */}
      <div id="football-philosophy" className="relative rounded-3xl bg-gradient-to-r from-slate-950 via-[#0c1429] to-slate-950 border border-slate-800 p-8 sm:p-10 lg:p-12 shadow-2xl space-y-8 overflow-hidden text-center">
        {/* Subtle Green/Gold Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-amber-400 text-xs font-black uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>PLAY • DRAFT • ENJOY • REPEAT</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Different eras. Different styles. <br />
            <span className="text-emerald-400">One beautiful game.</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Whether you play weekly on turf or follow champions on global stages, football unites every community.
          </p>
        </div>

        {/* 4 Feature Value Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2 hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-base">
              🤝
            </div>
            <h4 className="font-black text-white text-sm uppercase tracking-wide">
              BUILD FRIENDSHIPS
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              On and off the pitch. Football bonds players across every background.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2 hover:border-cyan-500/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base">
              ⚽
            </div>
            <h4 className="font-black text-white text-sm uppercase tracking-wide">
              PLAY TOGETHER
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              New people, new stories, every match. Balanced rosters made for pure enjoyment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2 hover:border-amber-500/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base">
              ⚡
            </div>
            <h4 className="font-black text-white text-sm uppercase tracking-wide">
              BE PART OF THE GAME
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Register. Get drafted. Play. Experience the excitement of professional-style team drafting.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 space-y-2 hover:border-purple-500/40 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-base">
              ❤️
            </div>
            <h4 className="font-black text-white text-sm uppercase tracking-wide">
              KEEP THE SPIRIT ALIVE
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Football always connects. Celebrate great plays, respect every opponent, enjoy the turf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
