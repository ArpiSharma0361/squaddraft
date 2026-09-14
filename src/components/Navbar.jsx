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
    <header className="border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: SQUADDRAFT ARENA Brand Logo */}
        <div
          className="flex items-center space-x-3 cursor-pointer group select-none shrink-0"
          onClick={() => navigateTo(isAdminLoggedIn ? 'admin' : 'register')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform ring-2 ring-emerald-400/40">
            <span className="text-xl">⚽</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                SQUADDRAFT <span className="text-emerald-400">ARENA</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                PRO
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                Football Legends & Live Turf Draft
              </span>
              <div className="flex items-center space-x-1 text-[10px] font-bold">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                  {isConnected ? (isSpectator ? 'LIVE BROADCAST' : (activeView === 'register' ? 'REGISTRATION OPEN' : 'LIVE SYNC')) : 'CONNECTING...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Core Nav Items (Home, Register, Players, About) */}
        <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold text-slate-300">
          <button
            onClick={() => navigateTo('register')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeView === 'register' ? 'text-emerald-400 bg-emerald-500/10 font-black' : 'hover:text-white hover:bg-slate-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('register', 'register-card')}
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          >
            Register
          </button>
          <button
            onClick={() => navigateTo('register', 'confirmed-roster')}
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          >
            Players
          </button>
          <button
            onClick={() => navigateTo('register', 'football-philosophy')}
            className="px-3 py-2 rounded-xl hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => navigateTo('history')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
              activeView === 'history' ? 'text-purple-400 bg-purple-500/10 font-black' : 'hover:text-white hover:bg-slate-900'
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
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => navigateTo('admin')}
                className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeView === 'admin'
                    ? 'bg-emerald-600 text-white shadow-md'
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
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
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

          {/* Primary CTA: JOIN THE GAME */}
          <button
            onClick={() => navigateTo('register', 'register-card')}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>JOIN THE GAME</span>
            <span className="text-sm">⚽</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer shrink-0"
            title={isSoundOn ? 'Mute Stadium Audio' : 'Enable Stadium Audio'}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Admin Reset Match button */}
          {isAdminLoggedIn && (
            <button
              onClick={() => onReset(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-black transition-all shadow-xs cursor-pointer shrink-0"
              title="Admin Match Reset (PIN Authorized)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Reset</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white lg:hidden cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => navigateTo('register')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            Home
          </button>
          <button
            onClick={() => navigateTo('register', 'register-card')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            Register
          </button>
          <button
            onClick={() => navigateTo('register', 'confirmed-roster')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            Players
          </button>
          <button
            onClick={() => navigateTo('register', 'football-philosophy')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            About
          </button>
          <button
            onClick={() => navigateTo('history')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-purple-300 hover:bg-slate-900 flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span>Match History</span>
          </button>

          {isAdminLoggedIn && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <button
                onClick={() => navigateTo('admin')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-400 hover:bg-slate-900 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Admin Stadium Control</span>
              </button>
              <button
                onClick={() => navigateTo('room')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-amber-400 hover:bg-slate-900 flex items-center gap-2"
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
