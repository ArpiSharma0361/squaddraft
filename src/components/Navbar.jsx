import React from 'react';
import { Volume2, VolumeX, RotateCcw, Lock, UserPlus, Flame, Eye, History } from 'lucide-react';
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
  const toggleAudio = () => {
    const nextState = !isSoundOn;
    setIsSoundOn(nextState);
    sfx.toggleSound(nextState);
    if (nextState) sfx.playPick();
  };

  const isSpectator = myRole === 'spectator';

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Status */}
        <div
          className="flex items-center space-x-3 cursor-pointer group select-none"
          onClick={() => {
            if (isAdminLoggedIn) {
              setActiveView('admin');
            } else if (activeView === 'register') {
              setActiveView('register');
            } else {
              setActiveView('room');
            }
            sfx.playPick();
          }}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform ring-2 ring-emerald-400/30">
            <span className="text-xl">⚽</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xl tracking-tight text-slate-900">
                SQUAD<span className="text-emerald-600">DRAFT</span>
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/60 px-2 py-0.5 rounded-full shadow-xs">
                TURF PRO
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">Matchmaking & Live Ground Draft</p>
              <div className="flex items-center space-x-1 text-[10px] font-bold">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className={isConnected ? 'text-emerald-700 font-extrabold' : 'text-rose-600'}>
                  {isConnected ? (isSpectator ? '🔴 LIVE BROADCAST' : (activeView === 'register' ? '🟢 REGISTRATION OPEN' : 'LIVE SYNC')) : 'CONNECTING...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Visible for Authenticated Admin) */}
        {isAdminLoggedIn ? (
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => { setActiveView('register'); sfx.playPick(); }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all ${
                activeView === 'register'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Players</span>
            </button>

            <button
              onClick={() => { setActiveView('admin'); sfx.playPick(); }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all ${
                activeView === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin 🔒</span>
            </button>

            <button
              onClick={() => { setActiveView('room'); sfx.playPick(); }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all ${
                activeView === 'room'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Draft Room</span>
            </button>

            <button
              onClick={() => { setActiveView('history'); sfx.playPick(); }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 transition-all ${
                activeView === 'history'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        ) : (
          /* Context Badges for Non-Admin Views */
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveView('history'); sfx.playPick(); }}
              className={`px-3 py-1.5 text-xs font-black rounded-xl flex items-center space-x-1.5 border transition-all ${
                activeView === 'history'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Match History</span>
            </button>

            {activeView === 'register' && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-slate-700">Player Registration Portal</span>
              </div>
            )}
            {activeView === 'admin' && (
              <div className="hidden sm:flex items-center space-x-2 bg-amber-50 px-4 py-1.5 rounded-2xl border border-amber-200 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-black text-amber-800">Stadium Control Login</span>
              </div>
            )}
            {activeView === 'room' && (
              <>
                {myRole === 'cap1' && (
                  <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 px-4 py-1.5 rounded-2xl border border-emerald-200 shadow-xs">
                    <span className="text-xs font-black text-emerald-900">👑 Captain 1 ({captain1 ? captain1.name : 'Captain 1'}) • {team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}</span>
                  </div>
                )}
                {myRole === 'cap2' && (
                  <div className="hidden sm:flex items-center space-x-2 bg-orange-50 px-4 py-1.5 rounded-2xl border border-orange-200 shadow-xs">
                    <span className="text-xs font-black text-orange-900">👑 Captain 2 ({captain2 ? captain2.name : 'Captain 2'}) • {team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}</span>
                  </div>
                )}
                {myRole === 'spectator' && (
                  <div className="hidden sm:flex items-center space-x-2 bg-purple-50 px-4 py-1.5 rounded-2xl border border-purple-200 shadow-xs">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-black text-purple-900">Live Match Broadcast (Watch-Only)</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Audio & Admin-Only Reset Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={toggleAudio}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all shadow-xs cursor-pointer"
            title={isSoundOn ? 'Mute Stadium Audio' : 'Enable Stadium Audio'}
          >
            {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Reset button is strictly rendered for authenticated Admin only */}
          {isAdminLoggedIn && (
            <button
              onClick={() => onReset(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all shadow-xs cursor-pointer"
              title="Admin Match Reset (PIN Authorized)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Reset Match</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
