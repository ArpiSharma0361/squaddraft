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
  { code: 'GK', label: 'Goalkeeper', icon: '🧤', color: 'bg-amber-50 border-amber-300 text-amber-800 selected:bg-amber-500' },
  { code: 'DEF', label: 'Defender', icon: '🛡️', color: 'bg-blue-50 border-blue-300 text-blue-800 selected:bg-blue-600' },
  { code: 'MID', label: 'Midfielder', icon: '👟', color: 'bg-emerald-50 border-emerald-300 text-emerald-800 selected:bg-[#07883F]' },
  { code: 'ST', label: 'Striker', icon: '🎯', color: 'bg-orange-50 border-orange-300 text-orange-800 selected:bg-orange-600' },
  { code: 'ANY', label: 'Flexible', icon: '⭐', color: 'bg-purple-50 border-purple-300 text-purple-800 selected:bg-purple-600' }
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
    GK: players.filter((p) => p.position === 'GK').length,
    DEF: players.filter((p) => p.position === 'DEF').length,
    MID: players.filter((p) => p.position === 'MID').length,
    ST: players.filter((p) => p.position === 'ST' || p.position === 'FWD').length,
    ANY: players.filter((p) => p.position === 'ANY').length
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    if (players.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())) {
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
    <div className="w-full space-y-12 sm:space-y-16 py-2 animate-in fade-in duration-300 text-[#0B2341]">
      {/* ============================================================ */}
      {/* SECTION 1: HERO & REGISTRATION + LEGENDS SPLIT / STACKED */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* LEFT COLUMN (Desktop: 40%) / TOP (Mobile): Intro & Registration Form */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8 order-1 lg:order-1">
          {/* Main Headline & Supporting Copy */}
          <div className="space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF8E8] border border-[#D7A52A]/40 text-[#07883F] text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#07883F] animate-ping" />
              <span>MORE THAN A GAME</span>
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.05]">
              <span className="text-[#0B2341]">LEGENDS</span> <br />
              <span className="text-[#07883F]">INSPIRE US.</span>
            </h1>

            <div className="text-sm sm:text-base text-[#536273] space-y-2 font-medium leading-relaxed">
              <p className="font-bold text-[#0B2341]">
                Football is more than a game, it's a story of dreams.
              </p>
              <p className="text-xs sm:text-sm">
                From local pitches to the biggest stadiums, football has given the world unforgettable moments and legendary players.
              </p>
              <p className="text-xs sm:text-sm">
                Their passion, skill and dedication continue to inspire new generations.
              </p>
              <p className="text-[#07883F] font-black text-xs sm:text-sm">
                Now it's your turn to be part of the story.
              </p>
            </div>
          </div>

          {/* Registration Card: JOIN THIS WEEK'S MATCH */}
          <div
            id="register-card"
            className="relative rounded-3xl bg-white border border-[#E5E7EB] p-6 sm:p-7 shadow-md space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#0B2341] tracking-tight">
                  JOIN THIS WEEK'S MATCH
                </h3>
                <p className="text-xs text-[#536273] font-semibold mt-0.5">
                  Register now and get drafted into one of the teams.
                </p>
              </div>
              <span className="p-2.5 rounded-2xl bg-[#FFF8E8] border border-[#D7A52A]/30 text-xl shadow-xs">
                ⚽
              </span>
            </div>

            {/* Success Feedback Alert */}
            {registeredSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-[#07883F]/50 flex items-center gap-3 animate-in fade-in duration-300">
                <CheckCircle2 className="w-6 h-6 text-[#07883F] shrink-0" />
                <div>
                  <div className="font-black text-sm text-[#0B2341] flex items-center gap-1.5">
                    <span>YOU'RE REGISTERED ⚽</span>
                  </div>
                  <p className="text-xs text-[#07883F] font-bold">
                    See you on the pitch{justRegisteredName ? `, ${justRegisteredName}` : ''}.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Field 1: Your Name */}
              <div>
                <label className="block text-xs font-black text-[#0B2341] uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your football name..."
                  className="w-full px-4 py-3.5 bg-white border border-[#E5E7EB] focus:border-[#07883F] rounded-2xl text-[#0B2341] placeholder-slate-400 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#07883F]/20 transition-all shadow-xs"
                />
              </div>

              {/* Field 2: Primary Position */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-[#0B2341] uppercase tracking-wider">
                    Primary Position
                  </label>
                  <span className="text-[10px] font-bold text-[#07883F]">Required</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {POSITION_OPTIONS.map((pos) => {
                    const isSelected = primaryPosition === pos.code;
                    let activeClass = '';
                    if (pos.code === 'GK') activeClass = 'bg-amber-500 text-white border-amber-600 shadow-md';
                    else if (pos.code === 'DEF') activeClass = 'bg-blue-600 text-white border-blue-700 shadow-md';
                    else if (pos.code === 'MID') activeClass = 'bg-[#07883F] text-white border-emerald-700 shadow-md';
                    else if (pos.code === 'ST') activeClass = 'bg-orange-600 text-white border-orange-700 shadow-md';
                    else activeClass = 'bg-purple-600 text-white border-purple-700 shadow-md';

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
                            ? activeClass + ' font-black scale-102'
                            : 'bg-[#F8F7F2] border-[#E5E7EB] text-[#536273] hover:border-[#07883F] hover:text-[#0B2341]'
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
                  <label className="text-xs font-black text-[#536273] uppercase tracking-wider">
                    Secondary Position
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Optional</span>
                </div>
                <select
                  value={secondaryPosition}
                  onChange={(e) => setSecondaryPosition(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-2xl text-[#0B2341] text-xs font-bold focus:outline-none focus:border-[#07883F] cursor-pointer shadow-xs"
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
                className="w-full py-4 rounded-2xl bg-[#07883F] hover:bg-[#13A653] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-md shadow-[#07883F]/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <span>REGISTER NOW</span>
                <span>→</span>
              </button>
            </form>
          </div>

          {/* Real-time Position Breakdown Chips */}
          <div className="grid grid-cols-5 gap-2 text-center select-none">
            <div className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-amber-700 shadow-2xs">
              <div className="text-xs sm:text-sm font-black">🧤 {posCounts.GK}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">GK</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-blue-700 shadow-2xs">
              <div className="text-xs sm:text-sm font-black">🛡️ {posCounts.DEF}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">DEF</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-[#07883F] shadow-2xs">
              <div className="text-xs sm:text-sm font-black">👟 {posCounts.MID}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">MID</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-orange-700 shadow-2xs">
              <div className="text-xs sm:text-sm font-black">🎯 {posCounts.ST}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">ST</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] text-purple-700 shadow-2xs">
              <div className="text-xs sm:text-sm font-black">⭐ {posCounts.ANY}</div>
              <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">ANY</div>
            </div>
          </div>

          {/* Confirmed Matchday Roster Drawer */}
          <div
            id="confirmed-roster"
            className="rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] text-xs">
              <div className="flex items-center gap-2 font-black text-[#0B2341]">
                <Users className="w-4 h-4 text-[#07883F]" />
                <span>CONFIRMED SQUAD ROSTER ({players.length})</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#07883F] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Match Pool
              </span>
            </div>

            {players.length === 0 ? (
              <p className="text-xs text-[#536273] py-3 text-center font-medium">
                No players registered yet. Be the first to claim your spot!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F7F2] border border-[#E5E7EB] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#0B2341] truncate">{idx + 1}. {p.name}</span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white text-[#536273] border border-[#E5E7EB] uppercase">
                      {p.position}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (Desktop: 60%) / BOTTOM (Mobile): FOOTBALL LEGENDS WALL */}
        <div className="lg:col-span-7 order-2 lg:order-2">
          <FootballLegendsWall />
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: FOOTBALL PHILOSOPHY & COMMUNITY MESSAGE */}
      {/* ============================================================ */}
      <div
        id="football-philosophy"
        className="relative rounded-3xl bg-white border border-[#E5E7EB] p-8 sm:p-10 lg:p-12 shadow-sm space-y-8 overflow-hidden text-center"
      >
        {/* Subtle Ambient Daylight Atmosphere */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#FFF8E8] to-transparent pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF8E8] border border-[#D7A52A]/40 text-[#07883F] text-xs font-black uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5 text-[#D7A52A]" />
            <span>PLAY • DRAFT • ENJOY • REPEAT</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-[#0B2341] tracking-tight">
            Different eras. Different styles. <br />
            <span className="text-[#07883F]">One beautiful game.</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#536273] max-w-lg mx-auto font-medium">
            Whether you play weekly on turf or follow champions on global stages, football unites every community.
          </p>
        </div>

        {/* 4 Feature Value Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left relative z-10">
          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-[#07883F]/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-emerald-600 text-base shadow-xs">
              🤝
            </div>
            <h4 className="font-black text-[#0B2341] text-sm uppercase tracking-wide">
              BUILD FRIENDSHIPS
            </h4>
            <p className="text-xs text-[#536273] font-medium">
              On and off the pitch. Football bonds players across every background.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-blue-400/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-blue-600 text-base shadow-xs">
              ⚽
            </div>
            <h4 className="font-black text-[#0B2341] text-sm uppercase tracking-wide">
              PLAY TOGETHER
            </h4>
            <p className="text-xs text-[#536273] font-medium">
              New people, new stories, every match. Balanced rosters made for pure enjoyment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-amber-400/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-amber-600 text-base shadow-xs">
              ⚡
            </div>
            <h4 className="font-black text-[#0B2341] text-sm uppercase tracking-wide">
              BE PART OF THE GAME
            </h4>
            <p className="text-xs text-[#536273] font-medium">
              Register. Get drafted. Play. Experience the excitement of professional-style team drafting.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-purple-400/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-purple-600 text-base shadow-xs">
              ❤️
            </div>
            <h4 className="font-black text-[#0B2341] text-sm uppercase tracking-wide">
              KEEP THE SPIRIT ALIVE
            </h4>
            <p className="text-xs text-[#536273] font-medium">
              Football always connects. Celebrate great plays, respect every opponent, enjoy the turf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
