import React, { useEffect, useRef } from 'react';
import { Coins, Sparkles, ArrowRight, ArrowLeft, Trophy, Eye, Shirt } from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function TossArena({
  captain1,
  captain2,
  team1Name,
  team2Name,
  team1Kit,
  team2Kit,
  firstPickCaptain,
  tossState,
  myRole,
  captainToken,
  onProceed,
  onBack
}) {
  const isFlipping = tossState?.isFlipping || false;
  const coinResult = tossState?.coinResult || null;
  const callerChoice = tossState?.callerChoice || 'heads';
  const tossWinner = tossState?.winner || firstPickCaptain;

  const isCaptain1 = myRole === 'cap1';
  const isCaptain2 = myRole === 'cap2';
  const isAdmin = myRole === 'admin';
  const isSpectator = myRole === 'spectator';
  const isCaptain = isCaptain1 || isCaptain2;

  const prevWinnerRef = useRef(null);

  useEffect(() => {
    function onFlippingStarted() {
      sfx.playCoinToss();
    }
    socket.on('toss_flipping_started', onFlippingStarted);
    return () => socket.off('toss_flipping_started', onFlippingStarted);
  }, []);

  useEffect(() => {
    if (tossWinner && !prevWinnerRef.current) {
      prevWinnerRef.current = tossWinner;
      sfx.playWhistle();
      sfx.playBallKick();
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 }
      });
    }
  }, [tossWinner]);

  const handleCoinFlip = () => {
    if (!isCaptain || isFlipping || tossWinner) return;

    socket.emit('toss_start_flip', { token: captainToken, role: myRole });
    sfx.playCoinToss();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Role Notice Banner */}
      {isAdmin && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 text-amber-950 text-xs font-bold">
            <span className="text-base">👑</span>
            <span>Admin Match Controller (Spectator Mode): Watching Captains Toss the Coin.</span>
          </div>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black uppercase">
            Watch Only
          </span>
        </div>
      )}

      {isSpectator && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 text-purple-950 text-xs font-bold">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Spectator Mode: Live Coin Toss broadcast on the pitch.</span>
          </div>
          <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-black uppercase">
            Read Only
          </span>
        </div>
      )}

      {isCaptain && (
        <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 text-emerald-950 text-xs font-bold">
            <span className="text-base">👑</span>
            <span>
              You are {isCaptain1 ? `Captain 1 (${captain1.name})` : `Captain 2 (${captain2.name})`}. Authorized to flip the match coin!
            </span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black uppercase">
            Active Captain
          </span>
        </div>
      )}

      {/* Main Pitch Stadium Toss Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Pitch Green Background Accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Duel Clash Header */}
        <div className="grid grid-cols-3 items-center text-center pb-8 border-b border-slate-100 relative z-10">
          {/* Captain 1 Badge */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-700 shadow-md">
              <span className="text-2xl sm:text-3xl font-black">👑</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Captain 1</span>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">{captain1.name}</h3>
              <span className="text-[11px] text-slate-500 font-semibold">{team1Name} ({team1Kit === 'white' ? 'White ⚪' : 'Black ⚫'})</span>
            </div>
          </div>

          {/* VS & Badge */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-lg tracking-widest">
              VS
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-2">
              Coin Toss Duel
            </span>
          </div>

          {/* Captain 2 Badge */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 border-2 border-orange-400 flex items-center justify-center text-orange-700 shadow-md">
              <span className="text-2xl sm:text-3xl font-black">👑</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 block">Captain 2</span>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">{captain2.name}</h3>
              <span className="text-[11px] text-slate-500 font-semibold">{team2Name} ({team2Kit === 'white' ? 'White ⚪' : 'Black ⚫'})</span>
            </div>
          </div>
        </div>

        {/* Center Pitch: 3D Animated Coin */}
        <div className="py-10 flex flex-col items-center justify-center space-y-6 relative z-10">
          {/* Captain 1 Caller Selector */}
          <div className="text-center space-y-2 max-w-xs w-full">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              {captain1.name}'s Call (Captain 1)
            </label>
            {isCaptain1 && !tossWinner && !isFlipping ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { socket.emit('toss_set_caller_choice', { choice: 'heads', token: captainToken, role: myRole }); sfx.playPick(); }}
                  className={`py-3 rounded-xl font-black text-xs border transition-all transform active:scale-95 cursor-pointer ${
                    callerChoice === 'heads'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  👑 HEADS
                </button>
                <button
                  type="button"
                  onClick={() => { socket.emit('toss_set_caller_choice', { choice: 'tails', token: captainToken, role: myRole }); sfx.playPick(); }}
                  className={`py-3 rounded-xl font-black text-xs border transition-all transform active:scale-95 cursor-pointer ${
                    callerChoice === 'tails'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  ⚡ TAILS
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-black text-xs shadow-sm">
                {captain1.name} has called: <span className="text-emerald-700 uppercase font-black">{callerChoice}</span>
              </div>
            )}
          </div>

          {/* 3D Realistic Coin Cylinder Graphic */}
          <div className="relative w-44 h-44 flex items-center justify-center perspective-1000 py-4">
            {/* Ground Shadow on Turf */}
            <div className={`absolute bottom-2 w-32 h-6 bg-slate-400/40 rounded-full blur-md transition-all duration-500 ${
              isFlipping ? 'scale-50 opacity-20' : 'scale-100 opacity-80'
            }`} />

            <div
              className={`w-36 h-36 rounded-full gold-coin-face flex items-center justify-center text-slate-950 font-black text-3xl select-none preserve-3d ${
                isFlipping
                  ? (callerChoice === 'heads' ? 'animate-coin-3d-heads' : 'animate-coin-3d-tails')
                  : isCaptain && !tossWinner
                  ? 'hover:scale-105 transition-transform cursor-pointer'
                  : 'cursor-default'
              }`}
              onClick={isCaptain && !tossWinner && !isFlipping ? handleCoinFlip : undefined}
            >
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-amber-900/40 flex flex-col items-center justify-center">
                <span className="text-3xl filter drop-shadow">
                  {coinResult ? (coinResult === 'heads' ? '👑' : '⚡') : (callerChoice === 'heads' ? '👑' : '⚡')}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 mt-1">
                  {coinResult ? coinResult.toUpperCase() : 'FLIP COIN'}
                </span>
              </div>
            </div>
          </div>

          {/* Role-Specific Action and Status Section */}
          {isAdmin ? (
            <div className="w-full max-w-md bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl text-center space-y-1.5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                STATUS
              </div>
              <div className="text-sm sm:text-base font-black text-amber-950">
                {isFlipping
                  ? '🪙 COIN IS FLIPPING LIVE ON THE PITCH...'
                  : tossWinner
                  ? '✅ COIN TOSS COMPLETED'
                  : 'WAITING FOR CAPTAINS TO COMPLETE THE COIN TOSS'}
              </div>
              <p className="text-xs text-amber-800 font-medium">
                {tossWinner
                  ? 'Result synchronized across all devices. Proceed to Live Draft Room below.'
                  : 'Captains are authorized to flip the coin. Admin is in Watch-Only mode.'}
              </p>
            </div>
          ) : isSpectator ? (
            <div className="w-full max-w-md bg-slate-100 border border-slate-200 p-5 rounded-2xl text-center space-y-1.5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                STATUS
              </div>
              <div className="text-sm font-black text-slate-800">
                {isFlipping
                  ? '🪙 Coin is flipping live on the pitch...'
                  : tossWinner
                  ? '✅ Coin Toss Completed'
                  : '⏳ Waiting for Captains to complete the coin toss...'}
              </div>
            </div>
          ) : (
            !tossWinner ? (
              <button
                onClick={handleCoinFlip}
                disabled={isFlipping}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black text-base shadow-xl shadow-amber-400/30 flex items-center space-x-2 transition-all transform active:scale-95 hover:shadow-2xl cursor-pointer"
              >
                <Coins className={`w-6 h-6 ${isFlipping ? 'animate-spin' : ''}`} />
                <span>{isFlipping ? 'Flipping on the Pitch...' : '🪙 Flip Match Coin!'}</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-300 shadow-sm">
                ✅ Toss Completed: {tossWinner.name} won the first pick!
              </div>
            )
          )}
        </div>

        {/* Winner Announcement Banner */}
        {tossWinner && (
          <div className="mt-8 pt-6 border-t border-slate-200 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="inline-flex flex-col items-center space-y-1.5 px-7 py-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />
                <span className="text-base sm:text-lg font-black tracking-tight text-emerald-950">
                  {tossWinner.name.toUpperCase()} WINS THE TOSS!
                </span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-700 uppercase tracking-wide">
                {tossWinner.id === captain1.id ? team1Name : team2Name} GETS THE FIRST PICK
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation & Launch Draft Buttons */}
      <div className="flex items-center justify-between pt-4">
        {isAdmin ? (
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-2 border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Setup</span>
          </button>
        ) : <div />}

        <div className="flex items-center space-x-2">
          <button
            onClick={onProceed}
            disabled={!tossWinner}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-emerald-600/20 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Enter Live Draft Room 🚀</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
