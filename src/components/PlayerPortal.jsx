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
  ArrowDown,
  X
} from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';
import FootballLegendsHero3D from './FootballLegendsHero3D';

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
  const [showRosterModal, setShowRosterModal] = useState(false);

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
    <div className="w-full space-y-6 sm:space-y-8 py-1 animate-in fade-in duration-300 text-[#0B2341]">
      {/* ============================================================ */}
      {/* SECTION 1: COMPACT FULL-WIDTH CINEMATIC HERO (Phase 3.3.2)   */}
      {/* Height optimized ~420-460px on desktop                       */}
      {/* ============================================================ */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-[#020611] via-[#07172B] to-[#0A2218] border border-[#D7A52A]/35 shadow-xl shadow-black/80 text-white px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
        {/* Stadium Atmosphere & Lighting Glows */}
        <div
          className="absolute top-0 inset-x-0 h-48 pointer-events-none opacity-80"
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(215, 165, 42, 0.22) 0%, rgba(16, 185, 129, 0.12) 50%, transparent 80%)'
          }}
        />
        <div
          className="absolute bottom-0 inset-x-0 h-32 pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(ellipse 90% 40% at 50% 100%, rgba(7, 136, 63, 0.3) 0%, transparent 70%)'
          }}
        />

        {/* Hero Content Grid: Left Story + Center Carousel + Right Vertical Features */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4 items-center">
          {/* LEFT: Hero Copy (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tight leading-[1.05]">
              <span className="text-white">LEGENDS</span> <br />
              <span className="text-[#F5C242]">INSPIRE US.</span>
            </h1>

            <div className="text-xs sm:text-sm text-slate-300 space-y-1.5 font-medium leading-relaxed">
              <p className="font-bold text-white text-sm">
                Football is more than a game, it's a story of dreams.
              </p>
              <p>
                From local pitches to the biggest stadiums, football has given the world unforgettable moments and legendary players.
              </p>
              <p className="text-[#10B981] font-bold">
                Now it's your turn to be part of the story.
              </p>
            </div>

            {/* Cursive Golden Script Accent */}
            <div className="font-serif italic text-amber-300/80 text-xs sm:text-sm tracking-wide pt-0.5">
              More Than a Game
            </div>

            {/* CTA Button: REGISTER FOR MATCH ↓ */}
            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={scrollToRegister}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#07883F] hover:bg-[#13A653] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#07883F]/30 hover:scale-102 active:scale-98 transition-all cursor-pointer border border-[#10B981]/40"
              >
                <span>REGISTER FOR MATCH</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </button>
            </div>
          </div>

          {/* CENTER: Compact Pseudo-3D Legend Carousel (lg:col-span-7) */}
          <div className="lg:col-span-7 w-full">
            <FootballLegendsHero3D onRegisterClick={scrollToRegister} />
          </div>

          {/* RIGHT: Compact Vertical Feature Icons (lg:col-span-1) */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-5 border-l border-white/10 pl-3 py-1 select-none text-center">
            <div className="space-y-0.5 group cursor-default">
              <Trophy className="w-4 h-4 text-[#D7A52A] mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[8px] font-black text-slate-300 tracking-widest uppercase">LEGENDS</div>
            </div>
            <div className="space-y-0.5 group cursor-default">
              <Users className="w-4 h-4 text-emerald-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[8px] font-black text-slate-300 tracking-widest uppercase">PASSION</div>
            </div>
            <div className="space-y-0.5 group cursor-default">
              <Flame className="w-4 h-4 text-amber-400 mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[8px] font-black text-slate-300 tracking-widest uppercase">COMMUNITY</div>
            </div>
            <div className="space-y-0.5 group cursor-default">
              <Sparkles className="w-4 h-4 text-[#FDE047] mx-auto group-hover:scale-110 transition-transform" />
              <div className="text-[8px] font-black text-slate-300 tracking-widest uppercase">FOREVER</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: COMPACT HORIZONTAL REGISTRATION STRIP (Phase 3.3.2) */}
      {/* Height optimized: ~170-210px on desktop                      */}
      {/* ============================================================ */}
      <div className="order-1">
        <div
          id="register-card"
          className="relative rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] p-4 sm:p-5 shadow-sm space-y-3.5 scroll-mt-16"
        >
          {/* Header Row: Title + Roster Count Badge + Modal Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#0B2341] tracking-tight">
                JOIN THIS WEEK'S MATCH
              </h3>
              <p className="text-xs text-[#536273] font-semibold">
                Register now and get drafted into one of the teams.
              </p>
            </div>

            {/* Compact Roster Status & Modal Trigger Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="px-3 py-1 rounded-xl bg-[#FFF8E8] border border-[#D7A52A]/40 text-xs font-black text-[#0B2341] shadow-2xs">
                <span className="text-[#07883F] font-black">{players.length}</span> REGISTERED FOR SUNDAY TURF
              </div>
              <button
                type="button"
                onClick={() => setShowRosterModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#07883F] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>VIEW ROSTER</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Success Feedback Alert */}
          {registeredSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-[#07883F]/50 flex items-center gap-2.5 animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-[#07883F] shrink-0" />
              <div>
                <div className="font-black text-xs text-[#0B2341]">
                  YOU'RE REGISTERED ⚽
                </div>
                <p className="text-[11px] text-[#07883F] font-bold">
                  See you on the pitch{justRegisteredName ? `, ${justRegisteredName}` : ''}.
                </p>
              </div>
            </div>
          )}

          {/* Single-Row Horizontal Form on Desktop */}
          <form onSubmit={handleRegister} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3">
            {/* Field 1: Your Name (Flex-1) */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-black text-[#0B2341] uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your football name..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] focus:border-[#07883F] rounded-xl text-[#0B2341] placeholder-slate-400 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#07883F]/20 transition-all shadow-2xs"
              />
            </div>

            {/* Field 2: Primary Position (Compact 5 buttons) */}
            <div className="flex-none">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-black text-[#0B2341] uppercase tracking-wider">
                  Primary Position
                </label>
                <span className="text-[9px] font-bold text-[#07883F] ml-2">Required</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
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
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-[#07883F] text-white border-emerald-700 font-black shadow-xs scale-102'
                          : 'bg-[#F8F7F2] border-[#E5E7EB] text-[#536273] hover:border-[#07883F] hover:text-[#0B2341]'
                      }`}
                    >
                      <span className="text-xs">{pos.icon}</span>
                      <span className="text-[11px] font-black tracking-wider">{pos.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field 3: Secondary Position (Optional Dropdown) */}
            <div className="w-full lg:w-44 flex-none">
              <label className="block text-[11px] font-black text-[#536273] uppercase tracking-wider mb-1">
                Secondary <span className="text-[9px] text-slate-400 lowercase font-normal">(opt)</span>
              </label>
              <select
                value={secondaryPosition}
                onChange={(e) => setSecondaryPosition(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#0B2341] text-xs font-bold focus:outline-none focus:border-[#07883F] cursor-pointer shadow-2xs"
              >
                <option value="">None</option>
                <option value="GK">🧤 GK</option>
                <option value="DEF">🛡️ DEF</option>
                <option value="MID">👟 MID</option>
                <option value="ST">🎯 ST</option>
                <option value="ANY">⭐ ANY</option>
              </select>
            </div>

            {/* Field 4: Submit Button */}
            <div className="flex-none">
              <button
                type="submit"
                disabled={!name.trim()}
                aria-label="REGISTER NOW"
                className="w-full lg:w-auto px-6 py-2.5 rounded-xl bg-[#07883F] hover:bg-[#13A653] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-[#07883F]/20 transition-all transform active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Register as a Player</span>
                <span>→</span>
              </button>
            </div>
          </form>

          {/* Sub-bar: Community motto + Compact Position Counts */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]/70 text-[11px] text-[#536273]">
            <div className="flex items-center gap-1.5">
              <span>Be part of the game. New friendships. Great football. ⚽</span>
            </div>

            {/* Compact Position Counts */}
            <div className="flex items-center gap-2 font-bold select-none">
              <span className="text-amber-700">GK {posCounts.GK}</span>
              <span className="text-slate-300">•</span>
              <span className="text-blue-700">DEF {posCounts.DEF}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#07883F]">MID {posCounts.MID}</span>
              <span className="text-slate-300">•</span>
              <span className="text-orange-700">ST {posCounts.ST}</span>
              <span className="text-slate-300">•</span>
              <span className="text-purple-700">ANY {posCounts.ANY}</span>
            </div>
          </div>
        </div>
      </div>


      {/* ============================================================ */}
      {/* CONFIRMED ROSTER MODAL DIALOG (Keeps page compact)           */}
      {/* ============================================================ */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            id="confirmed-roster"
            className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2 font-black text-[#0B2341] text-sm sm:text-base">
                <Users className="w-5 h-5 text-[#07883F]" />
                <span>CONFIRMED SQUAD ROSTER ({players.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRosterModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {players.length === 0 ? (
              <p className="text-xs text-[#536273] py-6 text-center font-medium">
                No players registered yet. Be the first to claim your spot!
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
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

            <button
              type="button"
              onClick={() => setShowRosterModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#0B2341] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: FOOTBALL PHILOSOPHY & VALUES (order-2 Compact Footer) */}
      {/* ============================================================ */}
      <div
        id="football-philosophy"
        className="order-2 relative rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-3 overflow-hidden text-center"
      >
        <div className="max-w-2xl mx-auto space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF8E8] border border-[#D7A52A]/40 text-[#07883F] text-[10px] font-black uppercase tracking-widest">
            <Flame className="w-3 h-3 text-[#D7A52A]" />
            <span>PLAY • DRAFT • ENJOY • REPEAT</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#0B2341] tracking-tight">
            Different eras. Different styles. <span className="text-[#07883F]">One beautiful game.</span>
          </h3>
        </div>

        {/* 4 Feature Value Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 text-left relative z-10">
          <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-1">
            <h4 className="text-xs font-black text-[#0B2341] uppercase tracking-wide">
              BUILD FRIENDSHIPS
            </h4>
            <p className="text-[10px] text-[#536273] font-medium leading-normal">
              Every match brings people closer.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-1">
            <h4 className="text-xs font-black text-[#0B2341] uppercase tracking-wide">
              PLAY TOGETHER
            </h4>
            <p className="text-[10px] text-[#536273] font-medium leading-normal">
              Teamwork and enjoyment on the pitch.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-1">
            <h4 className="text-xs font-black text-[#0B2341] uppercase tracking-wide">
              BE PART OF THE GAME
            </h4>
            <p className="text-[10px] text-[#536273] font-medium leading-normal">
              Everyone belongs on matchday.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E7EB] space-y-1">
            <h4 className="text-xs font-black text-[#0B2341] uppercase tracking-wide">
              KEEP THE SPIRIT ALIVE
            </h4>
            <p className="text-[10px] text-[#536273] font-medium leading-normal">
              Honoring legends on local turf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
