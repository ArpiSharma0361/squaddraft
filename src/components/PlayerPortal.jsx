import { CARD_POSITION_CONFIG } from './PlayerCard';
import PositionAnimation from './PositionAnimation';
import React, { useState } from 'react';
import { UserPlus, Users, CheckCircle2, Sparkles, ArrowRight, Shield, Star, Trophy } from 'lucide-react';
import { POSITIONS } from '../types';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function PlayerPortal({
  players,
  matchTitle
}) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('MID');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const posCounts = {
    GK: players.filter(p => p.position === 'GK').length,
    DEF: players.filter(p => p.position === 'DEF').length,
    MID: players.filter(p => p.position === 'MID').length,
    FWD: players.filter(p => p.position === 'FWD' || p.position === 'ST').length,
    ANY: players.filter(p => p.position === 'ANY').length,
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (players.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      alert(`"${name.trim()}" is already registered on the match roster.`);
      return;
    }

    const newPlayer = {
      id: 'p_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: name.trim(),
      position: position
    };

    socket.emit('player_register', newPlayer);

    setName('');
    setRegisteredSuccess(true);
    sfx.playTransferPop();

    setTimeout(() => {
      setRegisteredSuccess(false);
    }, 4500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Hero Card - Welcome to Tournament */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-6 sm:p-9 shadow-lg text-center relative overflow-hidden text-white">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -top-8 w-44 h-44 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>MATCHDAY REGISTRATION</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <span>JOIN THE SQUADDRAFT</span>
          <span className="text-amber-300">⚽</span>
        </h1>
        
        <p className="text-sm sm:text-base text-emerald-100 max-w-lg mx-auto mt-2.5 font-medium">
          Register yourself for today's football draft for <strong>{matchTitle || 'Weekly Match'}</strong>!
        </p>

        <div className="mt-4 inline-flex items-center space-x-2 px-4 py-1.5 rounded-2xl bg-black/20 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{players.length} Players Currently on Roster</span>
        </div>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Enter Your Player Details</h2>
              <p className="text-xs text-slate-500 font-medium">Choose your preferred position on the pitch</p>
            </div>
          </div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl shadow-xs">
            <span>🟢 Open Roster</span>
          </div>
        </div>

        {registeredSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 text-sm font-black flex items-center space-x-3 animate-transfer-pop shadow-md shadow-emerald-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-extrabold text-emerald-950">Registration Confirmed! 🎉</p>
              <p className="text-xs text-emerald-700 font-medium">You are officially locked into today's squad draft pool.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Player Name Field */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              Your Name / Football Nickname
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Leo, Arpit, Marcus, CR7..."
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-inner"
            />
          </div>

          {/* Position Selector - 5 Distinct Position Cards */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2.5 uppercase tracking-wider">
              Preferred Playing Position
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.values(POSITIONS).map((pos) => {
                const isSelected = position === pos.code;
                return (
                  <button
                    key={pos.code}
                    type="button"
                    onClick={() => { setPosition(pos.code); sfx.playPick(); }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer transform active:scale-95 ${
                      isSelected
                        ? `${pos.bgLight} ${pos.border} ring-4 ${pos.ring} shadow-md scale-102`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full overflow-hidden mb-1.5 border-2 shadow-xs transition-transform duration-200 ${
                      isSelected ? 'scale-110 ring-2 ring-emerald-400 border-white' : 'border-slate-200'
                    }`}>
                      <img src={CARD_POSITION_CONFIG[pos.code]?.img || '/characters/any.jpg'} alt={pos.label} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-sm font-black ${isSelected ? pos.accentText : 'text-slate-800'}`}>
                      {pos.code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-0.5 text-center">
                      {pos.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>JOIN THE DRAFT 🚀</span>
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </form>
      </div>

      {/* Position Breakdown Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-center shadow-xs">
          <div className="text-xl font-black text-amber-700">🧤 {posCounts.GK}</div>
          <div className="text-[11px] font-bold text-amber-900 mt-0.5">Goalkeepers {posCounts.GK === 2 ? '✅' : ''}</div>
        </div>
        <div className="bg-sky-50/80 border border-sky-200 p-3.5 rounded-2xl text-center shadow-xs">
          <div className="text-xl font-black text-sky-700">🛡️ {posCounts.DEF}</div>
          <div className="text-[11px] font-bold text-sky-900 mt-0.5">Defenders</div>
        </div>
        <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl text-center shadow-xs">
          <div className="text-xl font-black text-emerald-700">🎯 {posCounts.MID}</div>
          <div className="text-[11px] font-bold text-emerald-900 mt-0.5">Midfielders</div>
        </div>
        <div className="bg-orange-50/80 border border-orange-200 p-3.5 rounded-2xl text-center shadow-xs">
          <div className="text-xl font-black text-orange-700">⚡ {posCounts.FWD}</div>
          <div className="text-[11px] font-bold text-orange-900 mt-0.5">Forwards</div>
        </div>
        <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-2xl text-center shadow-xs">
          <div className="text-xl font-black text-purple-700">⭐ {posCounts.ANY}</div>
          <div className="text-[11px] font-bold text-purple-900 mt-0.5">Flexible</div>
        </div>
      </div>

      {/* Confirmed Squad Roster Pool */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700 border border-slate-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Confirmed Squad Roster ({players.length})
              </h3>
              <p className="text-xs text-slate-500 font-medium">Players ready for matchday captain picks</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Live Player Pool
          </span>
        </div>

        {players.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Users className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-sm font-extrabold text-slate-700">No players registered yet.</p>
            <p className="text-xs text-slate-500">Be the first to confirm your spot using the form above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {players.map((p, idx) => {
              const pos = POSITIONS[p.position] || POSITIONS.ANY;
              return (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="text-xs font-black text-slate-400 w-5">{idx + 1}.</span>
                    <span className="font-black text-sm text-slate-900 truncate">{p.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${pos.bgLight} ${pos.border} flex items-center space-x-1`}>
                    <span>{pos.badge}</span>
                    <span>{pos.code}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
