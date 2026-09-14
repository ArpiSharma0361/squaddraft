import React from 'react';
import { Volume2, VolumeX, RotateCcw, Lock, Flame, Eye, History, Trophy, Sparkles, Menu, X } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

export default function Navbar({
  activeView,
  setActiveView,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  isSoundOn,
  setIsSoundOn,
  onReset,
  roomStep,
  isConnected,
  myRole,
  captain1,
  captain2,
  team1Kit,
  team2Kit
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleAudio = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    sfx.toggleSound(nextState);
    if (nextState) sfx.playPick();
  };

  const isSpectator = myRole === 'spectator';
  const isLight = activeView === 'register';

  const navigateTo = (view, elementId = null) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    sfx.playPick();
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] text-[#0B2341] shadow-xs'
          : 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: SQUADDRAFT ARENA Brand Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
          onClick={() => navigateTo(isAdminLoggedIn ? 'admin' : 'register')}
        >
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform ${
              isLight
                ? 'bg-gradient-to-tr from-[#07883F] to-[#13A653] text-white ring-2 ring-emerald-500/20'
                : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 text-slate-950 ring-2 ring-emerald-400/40'
            }`}
          >
            <span className="text-xl">⚽</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`font-black text-lg sm:text-xl tracking-tight ${isLight ? 'text-[#0B2341]' : 'text-white'}`}>
                SQUADDRAFT <span className="text-[#07883F]">ARENA</span>
              </span>
              <span
                className={`text-[9px] sm:text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${
                  isLight
                    ? 'bg-[#FFF8E8] text-[#D7A52A] border border-[#D7A52A]/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                PRO
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-semibold hidden md:inline ${isLight ? 'text-[#536273]' : 'text-slate-400'}`}>
                Football Legends & Live Turf Draft
              </span>
              <div className="flex items-center space-x-1 text-[10px] font-bold">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#07883F] animate-pulse' : 'bg-rose-500'}`} />
                <span className={isConnected ? (isLight ? 'text-[#07883F] font-black' : 'text-emerald-400 font-bold') : 'text-rose-500'}>
                  {isConnected ? (isSpectator ? 'LIVE BROADCAST' : (activeView === 'register' ? 'REGISTRATION OPEN' : 'LIVE SYNC')) : 'CONNECTING...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Core Nav Items (Home, Register, Players, About, History) */}
        <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold">
          <button
            onClick={() => navigateTo('register')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              isLight
                ? activeView === 'register'
                  ? 'text-[#07883F] bg-emerald-50/80 font-black'
                  : 'text-[#536273] hover:text-[#0B2341] hover:bg-slate-50'
                : activeView === 'register'
                ? 'text-emerald-400 bg-emerald-500/10 font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('register', 'register-card')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              isLight
                ? activeView === 'register'
                  ? 'text-[#07883F] border-b-2 border-[#07883F] font-black'
                  : 'text-[#536273] hover:text-[#0B2341] hover:bg-slate-50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => navigateTo('register', 'confirmed-roster')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              isLight
                ? 'text-[#536273] hover:text-[#0B2341] hover:bg-slate-50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Players
          </button>
          <button
            onClick={() => navigateTo('register', 'football-philosophy')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              isLight
                ? 'text-[#536273] hover:text-[#0B2341] hover:bg-slate-50'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => navigateTo('history')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
              isLight
                ? activeView === 'history'
                  ? 'text-purple-700 bg-purple-50 font-black'
                  : 'text-[#536273] hover:text-[#0B2341] hover:bg-slate-50'
                : activeView === 'history'
                ? 'text-purple-400 bg-purple-500/10 font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </nav>

        {/* Right Section: Role Context, CTA & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Admin Navigation Badges (When Admin Logged In) */}
          {isAdminLoggedIn ? (
            <div
              className={`hidden sm:flex items-center space-x-1 p-1 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-[#E5E7EB]' : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <button
                onClick={() => navigateTo('admin')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-[#07883F] text-white shadow-xs'
                    : isLight
                    ? 'text-[#536273] hover:text-[#0B2341]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => navigateTo('room')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeView === 'room'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : isLight
                    ? 'text-[#536273] hover:text-[#0B2341]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Draft Room</span>
              </button>
            </div>
          ) : (
            /* Role Status Badge for Captains / Spectators when in Draft Room */
            activeView === 'room' && (
              <div className="hidden sm:flex items-center">
                {myRole === 'cap1' && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                    👑 Cap 1: {captain1 ? captain1.name : 'Cap 1'}
                  </span>
                )}
                {myRole === 'cap2' && (
                  <span className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-black">
                    👑 Cap 2: {captain2 ? captain2.name : 'Cap 2'}
                  </span>
                )}
                {myRole === 'spectator' && (
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-black flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Spectator Broadcast</span>
                  </span>
                )}
              </div>
            )
          )}

          {/* Primary CTA: JOIN THE GAME (Green Pill Button) */}
          <button
            onClick={() => navigateTo('register', 'register-card')}
            className="px-4 sm:px-5 py-2 rounded-full bg-[#07883F] hover:bg-[#13A653] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>JOIN THE GAME</span>
            <span className="text-sm">⚽</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 border ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-[#E5E7EB] text-[#0B2341]'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isSoundOn ? 'Mute Stadium Audio' : 'Enable Stadium Audio'}
          >
            {isSoundOn ? (
              <Volume2 className={`w-4 h-4 ${isLight ? 'text-[#07883F]' : 'text-emerald-400'}`} />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Admin Reset Match button */}
          {isAdminLoggedIn && (
            <button
              onClick={() => onReset(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all shadow-xs cursor-pointer shrink-0"
              title="Admin Match Reset (PIN Authorized)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-xl border lg:hidden cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-50 border-[#E5E7EB] text-[#0B2341]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 ${
            isLight
              ? 'bg-white/98 border-[#E5E7EB] text-[#0B2341]'
              : 'bg-slate-950/95 border-slate-800 text-white'
          }`}
        >
          <button
            onClick={() => navigateTo('register')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold ${
              isLight ? 'text-[#0B2341] hover:bg-slate-50' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('register', 'register-card')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold ${
              isLight ? 'text-[#07883F] hover:bg-slate-50' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => navigateTo('register', 'confirmed-roster')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold ${
              isLight ? 'text-[#0B2341] hover:bg-slate-50' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            Players
          </button>
          <button
            onClick={() => navigateTo('register', 'football-philosophy')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold ${
              isLight ? 'text-[#0B2341] hover:bg-slate-50' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => navigateTo('history')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
              isLight ? 'text-purple-700 hover:bg-slate-50' : 'text-purple-300 hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Match History</span>
          </button>

          {isAdminLoggedIn && (
            <div className={`pt-2 border-t space-y-1 ${isLight ? 'border-[#E5E7EB]' : 'border-slate-800'}`}>
              <button
                onClick={() => navigateTo('admin')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  isLight ? 'text-[#07883F] hover:bg-slate-50' : 'text-emerald-400 hover:bg-slate-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Admin Stadium Control</span>
              </button>
              <button
                onClick={() => navigateTo('room')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  isLight ? 'text-amber-600 hover:bg-slate-50' : 'text-amber-400 hover:bg-slate-900'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>Draft Room</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
