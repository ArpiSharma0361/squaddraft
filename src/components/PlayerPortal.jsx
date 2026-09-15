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
  ChevronDown,
  ArrowDown
} from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';
import FootballLegendsHero3D from './FootballLegendsHero3D';
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

  const scrollToRegister = () => {
    const el = document.getElementById('register-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full space-y-10 sm:space-y-14 py-2 animate-in fade-in duration-300 text-[#0B2341]">
      {/* ============================================================ */}
      {/* SECTION 1: FULL-WIDTH CINEMATIC FOOTBALL HERO (Phase 3.3.1)  */}
      {/* ============================================================ */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#020611] via-[#07172B] to-[#0A2218] border border-[#D7A52A]/35 shadow-2xl shadow-black/80 text-white p-5 sm:p-7 lg:p-9">
        {/* Stadium Atmosphere & Lighting Glows */}
        <div
          className="absolute top-0 inset-x-0 h-64 pointer-events-none opacity-80"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(215, 165, 42, 0.22) 0%, rgba(16, 185, 129, 0.12) 50%, transparent 80%)'
          }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-44 pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(ellipse 90% 40% at 50% 100%, rgba(7, 136, 63, 0.3) 0%, transparent 70%)'
          }}
        />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#D7A52A]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#07883F]/15 blur-3xl pointer-events-none" />

        {/* Hero Content Grid */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          {/* LEFT: Hero Copy & Quick Action (lg:col-span-4) */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-5 text-left">
            <div className="space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D7A52A]/50 text-[#FDE047] text-xs font-black uppercase tracking-wider shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                <span>MORE THAN A GAME</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight leading-[1.05]">
                <span className="text-white">LEGENDS</span> <br />
                <span className="text-[#D7A52A]">INSPIRE US.</span>
              </h1>

              <div className="text-sm sm:text-base text-slate-300 space-y-2 font-medium leading-relaxed">
                <p className="font-bold text-white text-base">
                  Football is more than a game, it's a story of dreams.
                </p>
                <p className="text-xs sm:text-sm">
                  From local pitches to the biggest stadiums, football has given the world unforgettable moments and legendary players.
                </p>
                <p className="text-xs sm:text-sm">
                  Their passion, skill and dedication continue to inspire new generations.
                </p>
                <p className="text-[#10B981] font-black text-xs sm:text-sm">
                  Now it's your turn to be part of the story.
                </p>
              </div>
            </div>

            {/* CTA Button: REGISTER FOR MATCH ↓ */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={scrollToRegister}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#07883F] hover:bg-[#13A653] text-white font-black text-sm shadow-xl shadow-[#07883F]/35 hover:scale-102 active:scale-98 transition-all cursor-pointer uppercase tracking-wider border border-[#10B981]/50"
              >
                <span>REGISTER FOR MATCH</span>
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </button>
              <span className="text-xs font-bold text-slate-300">
                {players.length} registered for Sunday Turf
              </span>
            </div>
          </div>

          {/* CENTER: Large Pseudo-3D Legend Carousel (lg:col-span-8 xl:col-span-7) */}
          <div className="lg:col-span-8 xl:col-span-7 w-full">
            <FootballLegendsHero3D onRegisterClick={scrollToRegister} />
          </div>

          {/* RIGHT: Compact Vertical Feature Labels (xl:col-span-1) */}
          <div className="hidden xl:flex xl:col-span-1 flex-col items-center justify-center gap-7 border-l border-white/10 pl-4 py-2 select-none">
            <div className="space-y-1 text-center group cursor-default">
              <Trophy className="w-4 h-4 text-[#D7A52A] mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[9px] font-black text-slate-300 tracking-widest uppercase">LEGENDS</div>
            </div>
            <div className="space-y-1 text-center group cursor-default">
              <Flame className="w-4 h-4 text-orange-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[9px] font-black text-slate-300 tracking-widest uppercase">PASSION</div>
            </div>
            <div className="space-y-1 text-center group cursor-default">
              <Users className="w-4 h-4 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[9px] font-black text-slate-300 tracking-widest uppercase">COMMUNITY</div>
            </div>
            <div className="space-y-1 text-center group cursor-default">
              <Sparkles className="w-4 h-4 text-[#FDE047] mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[9px] font-black text-slate-300 tracking-widest uppercase">FOREVER</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: LIGHT / WARM REGISTRATION (Directly Below Hero)   */}
      {/* ============================================================ */}
      <div className="order-1 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Main Registration Card: JOIN THIS WEEK'S MATCH (Desktop: 7 cols) */}
          <div
            id="register-card"
            className="lg:col-span-7 relative rounded-3xl bg-white border border-[#E5E7EB] p-6 sm:p-8 shadow-md space-y-6 scroll-mt-16"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0B2341] tracking-tight">
                  JOIN THIS WEEK'S MATCH
                </h3>
                <p className="text-xs sm:text-sm text-[#536273] font-semibold mt-0.5">
                  Register now and get drafted into one of the teams.
                </p>
              </div>
              <span className="p-3 rounded-2xl bg-[#FFF8E8] border border-[#D7A52A]/30 text-2xl shadow-xs">
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

              {/* Action Button: REGISTER NOW */}
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

          {/* Right Column: Position Breakdown & Confirmed Roster (Desktop: 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Real-time Position Breakdown Chips */}
            <div className="grid grid-cols-5 gap-2 text-center select-none">
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-amber-700 shadow-2xs">
                <div className="text-sm font-black">🧤 {posCounts.GK}</div>
                <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">GK</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-blue-700 shadow-2xs">
                <div className="text-sm font-black">🛡️ {posCounts.DEF}</div>
                <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">DEF</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-[#07883F] shadow-2xs">
                <div className="text-sm font-black">👟 {posCounts.MID}</div>
                <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">MID</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-orange-700 shadow-2xs">
                <div className="text-sm font-black">🎯 {posCounts.ST}</div>
                <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">ST</div>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#E5E7EB] text-purple-700 shadow-2xs">
                <div className="text-sm font-black">⭐ {posCounts.ANY}</div>
                <div className="text-[9px] font-bold uppercase mt-0.5 text-[#536273]">ANY</div>
              </div>
            </div>

            {/* Confirmed Matchday Roster Drawer */}
            <div
              id="confirmed-roster"
              className="rounded-3xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] text-xs">
                <div className="flex items-center gap-2 font-black text-[#0B2341]">
                  <Users className="w-4 h-4 text-[#07883F]" />
                  <span>CONFIRMED SQUAD ROSTER ({players.length})</span>
                </div>
                <span className="text-[10px] font-extrabold text-[#07883F] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Match Pool
                </span>
              </div>

              {players.length === 0 ? (
                <p className="text-xs text-[#536273] py-4 text-center font-medium">
                  No players registered yet. Be the first to claim your spot!
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {players.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="px-3 py-2 rounded-xl bg-[#F8F7F2] border border-[#E5E7EB] flex items-center justify-between text-xs"
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
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: 17-PLAYER FOOTBALL LEGENDS GALLERY (order-2)      */}
      {/* ============================================================ */}
      <div className="order-2">
        <FootballLegendsWall />
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: FOOTBALL PHILOSOPHY & COMMUNITY MESSAGE           */}
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
            <h4 className="text-sm font-black text-[#0B2341] uppercase tracking-wide">
              BUILD FRIENDSHIPS
            </h4>
            <p className="text-xs text-[#536273] font-medium leading-relaxed">
              Every match brings people closer. Compete hard, high-five after, and stay connected.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-[#07883F]/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-emerald-600 text-base shadow-xs">
              ⚡
            </div>
            <h4 className="text-sm font-black text-[#0B2341] uppercase tracking-wide">
              PLAY TOGETHER
            </h4>
            <p className="text-xs text-[#536273] font-medium leading-relaxed">
              Win or lose, the joy is in the 90 minutes of running, passing, and teamwork.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-[#07883F]/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-emerald-600 text-base shadow-xs">
              🏟️
            </div>
            <h4 className="text-sm font-black text-[#0B2341] uppercase tracking-wide">
              BE PART OF THE GAME
            </h4>
            <p className="text-xs text-[#536273] font-medium leading-relaxed">
              From captains picking their squad to the final whistle, everyone belongs here.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-2 hover:border-[#07883F]/50 transition-colors shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-emerald-600 text-base shadow-xs">
              ⭐
            </div>
            <h4 className="text-sm font-black text-[#0B2341] uppercase tracking-wide">
              KEEP THE SPIRIT ALIVE
            </h4>
            <p className="text-xs text-[#536273] font-medium leading-relaxed">
              Honoring legends while creating our own weekly memories on the turf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
