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
    // Only Captain 1 or Captain 2 can initiate the coin toss
    if (!isCaptain || isFlipping || tossWinner) return;

    socket.emit('toss_start_flip', { role: myRole });
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
          <span className="text-[10px] font-black px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg border border-amber-300">
            Admin View
          </span>
        </div>
      )}

      {isSpectator && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 text-purple-900 text-xs font-bold">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Live Spectator View: Captains are tossing the coin for the 1st pick. Draft starts right after!</span>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg border border-purple-200">
            View-Only
          </span>
        </div>
      )}

      {/* Top Banner with Stadium Lights Effect */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-600/10 text-center relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>MATCHDAY 3D TOSS ARENA</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Who Wins The 1st Pick? 🪙
        </h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto mt-2 font-medium">
          Captain <strong className="text-white underline decoration-amber-300">{captain1.name}</strong> vs Captain <strong className="text-white underline decoration-amber-300">{captain2.name}</strong>
        </p>

        {/* 3D STADIUM COIN TOSS Badge (Single Official Mode - Rock Paper Scissors Removed) */}
        <div className="flex items-center justify-center space-x-2 mt-5">
          <div className="px-5 py-2 rounded-xl text-xs font-black bg-amber-400 text-slate-950 shadow-lg ring-2 ring-white">
            🪙 3D Stadium Coin Toss
          </div>
        </div>
      </div>

      {/* Duel Clash Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Team 1 Captain Card */}
        <div className={`p-4 rounded-2xl border-2 transition-all ${
          tossWinner?.id === captain1.id
            ? 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-md border ${
                team1Kit === 'white' ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">TEAM 1 CAPTAIN</div>
                <div className="text-sm font-black text-slate-900">{captain1.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">{team1Name} ({team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})</div>
              </div>
            </div>
            {tossWinner?.id === captain1.id && (
              <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-black rounded-lg shadow-md animate-pulse">
                WINNER 🏆
              </span>
            )}
          </div>
        </div>

        {/* Team 2 Captain Card */}
        <div className={`p-4 rounded-2xl border-2 transition-all ${
          tossWinner?.id === captain2.id
            ? 'bg-orange-50 border-orange-500 ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/10'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-md border ${
                team2Kit === 'white' ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'
              }`}>
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-orange-600 tracking-wider">TEAM 2 CAPTAIN</div>
                <div className="text-sm font-black text-slate-900">{captain2.name}</div>
                <div className="text-[11px] text-slate-500 font-medium">{team2Name} ({team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})</div>
              </div>
            </div>
            {tossWinner?.id === captain2.id && (
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-black rounded-lg shadow-md animate-pulse">
                WINNER 🏆
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3D Toss Interaction Arena */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Captain Calling Selection */}
          <div className="w-full max-w-sm bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center shadow-xs">
            <span className="text-xs text-slate-700 font-bold block mb-2.5">
              {isCaptain1 ? (
                <strong className="text-slate-900 font-black">👑 {captain1.name}, Choose Your Coin Call:</strong>
              ) : (
                <span>Captain <strong>{captain1.name}</strong> ({team1Name}) Calls:</span>
              )}
            </span>

            {isCaptain1 && !isFlipping && !tossWinner ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { socket.emit('toss_set_caller_choice', { choice: 'heads', role: myRole }); sfx.playPick(); }}
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
                  onClick={() => { socket.emit('toss_set_caller_choice', { choice: 'tails', role: myRole }); sfx.playPick(); }}
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
            /* Admin View: WAITING FOR CAPTAINS TO COMPLETE THE COIN TOSS (NO FLIP BUTTON) */
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
            /* Spectator View: Watch Only */
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
            /* Captain View: Authorized Coin Flip Action */
            !tossWinner ? (
              <button
                onClick={handleCoinFlip}
                disabled={isFlipping}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black text-base shadow-xl shadow-amber-400/30 flex items-center space-x-2 transition-all transform active:scale-95 hover:shadow-2xl cursor-pointer"
              >
                <Coins className={`w-6 h-6 ${isFlipping ? 'animate-spin' : ''}`} />
                <span>{isFlipping ? 'Flipping on the Pitch...' : '🪙 Flip 3D Stadium Coin!'}</span>
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
          {/* Skip Toss is completely removed! */}
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
