import React, { useEffect } from 'react';
import { Coins, Sparkles, ArrowRight, ArrowLeft, Trophy, Eye, Zap, Shirt } from 'lucide-react';
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
  const tossMode = tossState?.mode || 'coin';
  const isFlipping = tossState?.isFlipping || false;
  const coinResult = tossState?.coinResult || null;
  const callerChoice = tossState?.callerChoice || 'heads';
  const tossWinner = tossState?.winner || firstPickCaptain;

  const isSpectator = myRole === 'spectator';
  const isCaptain1 = myRole === 'cap1';
  const isCaptain2 = myRole === 'cap2';
  const isAdmin = myRole === 'admin';

  useEffect(() => {
    function onFlippingStarted() {
      sfx.playCoinToss();
    }
    socket.on('toss_flipping_started', onFlippingStarted);
    return () => socket.off('toss_flipping_started', onFlippingStarted);
  }, []);

  const handleCoinFlip = () => {
    if (isFlipping || isSpectator) return;

    socket.emit('toss_start_flip');
    sfx.playCoinToss();

    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';

    setTimeout(() => {
      const winner = outcome === callerChoice ? captain1 : captain2;
      socket.emit('toss_finish_flip', { outcome, winner });

      sfx.playWhistle();
      sfx.playBallKick();
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 2400);
  };

  const handleQuickStartWithoutToss = () => {
    const winner = firstPickCaptain || captain1;
    socket.emit('toss_finish_flip', { outcome: 'heads', winner });
    socket.emit('start_draft');
    sfx.playWhistle();
  };

  const handleRpsPlay = (choice1, choice2) => {
    if (isSpectator) return;

    if (choice1 === choice2) {
      socket.emit('toss_rps_play', {
        cap1Choice: choice1,
        cap2Choice: choice2,
        resultText: "It's a Tie! Throw again.",
        winner: null
      });
      sfx.playBuzzer();
      return;
    }

    const wins = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };

    if (wins[choice1] === choice2) {
      socket.emit('toss_rps_play', {
        cap1Choice: choice1,
        cap2Choice: choice2,
        resultText: `${captain1.name} wins the toss!`,
        winner: captain1
      });
      sfx.playWhistle();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else {
      socket.emit('toss_rps_play', {
        cap1Choice: choice1,
        cap2Choice: choice2,
        resultText: `${captain2.name} wins the toss!`,
        winner: captain2
      });
      sfx.playWhistle();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }
  };

  const rpsIcons = {
    rock: '✊ Rock',
    paper: '✋ Paper',
    scissors: '✌️ Scissors'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Spectator Live Banner */}
      {isSpectator && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 text-purple-900 text-xs font-bold">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>👀 Live Spectator View: Captains are dueling for the 1st pick. Draft starts right after!</span>
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
          Synchronized live for Captain <strong className="text-white underline decoration-amber-300">{captain1.name}</strong> vs Captain <strong className="text-white underline decoration-amber-300">{captain2.name}</strong>!
        </p>

        {/* Mode Switcher */}
        {!isSpectator && (
          <div className="flex items-center justify-center space-x-2 mt-5">
            <button
              onClick={() => { socket.emit('toss_set_mode', 'coin'); sfx.playPick(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all transform active:scale-95 ${
                tossMode === 'coin'
                  ? 'bg-amber-400 text-slate-950 shadow-lg ring-2 ring-white font-black'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              🪙 3D Stadium Coin Toss
            </button>
            <button
              onClick={() => { socket.emit('toss_set_mode', 'rps'); sfx.playPick(); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all transform active:scale-95 ${
                tossMode === 'rps'
                  ? 'bg-amber-400 text-slate-950 shadow-lg ring-2 ring-white font-black'
                  : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'
              }`}
            >
              ✌️ Rock-Paper-Scissors Duel
            </button>
          </div>
        )}
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

      {/* Main 3D Toss Interactive Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Coin Toss Arena */}
        {tossMode === 'coin' && (
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Call Selector */}
            <div className={`p-4 rounded-2xl text-center max-w-md w-full border-2 transition-all ${
              isCaptain1
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-xs text-slate-700 font-bold block mb-2.5">
                {isCaptain1 ? (
                  <strong className="text-slate-900 font-black">👑 {captain1.name}, Choose Your Coin Call:</strong>
                ) : isCaptain2 ? (
                  <span>⏳ Captain <strong>{captain1.name}</strong> ({team1Name}) is calling the coin:</span>
                ) : (
                  <span>Captain <strong>{captain1.name}</strong> ({team1Name}) Calls The Coin:</span>
                )}
              </span>

              {isCaptain1 || isAdmin ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isFlipping}
                    onClick={() => { socket.emit('toss_set_caller_choice', 'heads'); sfx.playPick(); }}
                    className={`py-3 rounded-xl font-black text-xs border transition-all transform active:scale-95 ${
                      callerChoice === 'heads'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    👑 HEADS
                  </button>
                  <button
                    type="button"
                    disabled={isFlipping}
                    onClick={() => { socket.emit('toss_set_caller_choice', 'tails'); sfx.playPick(); }}
                    className={`py-3 rounded-xl font-black text-xs border transition-all transform active:scale-95 ${
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
                className={`w-36 h-36 rounded-full gold-coin-face flex items-center justify-center text-slate-950 font-black text-3xl select-none preserve-3d cursor-pointer ${
                  isFlipping
                    ? (callerChoice === 'heads' ? 'animate-coin-3d-heads' : 'animate-coin-3d-tails')
                    : 'hover:scale-105 transition-transform'
                }`}
                onClick={handleCoinFlip}
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

            {/* Flip Action Button */}
            {!isSpectator ? (
              <button
                onClick={handleCoinFlip}
                disabled={isFlipping}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black text-base shadow-xl shadow-amber-400/30 flex items-center space-x-2 transition-all transform active:scale-95 hover:shadow-2xl"
              >
                <Coins className={`w-6 h-6 ${isFlipping ? 'animate-spin' : ''}`} />
                <span>{isFlipping ? 'Flipping on the Pitch...' : '🪙 Flip 3D Stadium Coin!'}</span>
              </button>
            ) : (
              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
                {isFlipping ? '🪙 Coin is flipping live on the pitch...' : '⏳ Watching Captains Toss the Coin...'}
              </div>
            )}
          </div>
        )}

        {/* Rock Paper Scissors Arena */}
        {tossMode === 'rps' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-3">
                <span className="text-xs font-bold text-emerald-700 block uppercase tracking-wider">
                  {captain1.name} ({team1Name})
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {['rock', 'paper', 'scissors'].map((item) => (
                    <button
                      key={item}
                      disabled={isSpectator}
                      onClick={() => handleRpsPlay(item, tossState?.cap2Rps || 'rock')}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all transform active:scale-95 ${
                        tossState?.cap1Rps === item
                          ? 'bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-300 shadow-md font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rpsIcons[item]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-center space-y-3">
                <span className="text-xs font-bold text-orange-700 block uppercase tracking-wider">
                  {captain2.name} ({team2Name})
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {['rock', 'paper', 'scissors'].map((item) => (
                    <button
                      key={item}
                      disabled={isSpectator}
                      onClick={() => handleRpsPlay(tossState?.cap1Rps || 'rock', item)}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition-all transform active:scale-95 ${
                        tossState?.cap2Rps === item
                          ? 'bg-orange-500 text-white border-orange-400 ring-2 ring-orange-300 shadow-md font-black'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rpsIcons[item]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tossState?.rpsResultText && (
              <p className="text-sm font-bold text-emerald-800 text-center">{tossState.rpsResultText}</p>
            )}
          </div>
        )}

        {/* Winner Announcement Banner */}
        {tossWinner && (
          <div className="mt-8 pt-6 border-t border-slate-200 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-sm">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-xs sm:text-sm font-black">
                Toss Winner: <strong className="text-slate-900 font-extrabold">{tossWinner.name}</strong> has won the <strong>1st Pick</strong> in the Draft Room!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation & Launch Draft Buttons */}
      {!isSpectator ? (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-2 border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Setup</span>
          </button>

          <div className="flex items-center space-x-2">
            {!tossWinner && (
              <button
                onClick={handleQuickStartWithoutToss}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1.5 border border-slate-200 shadow-sm transition-all"
                title="Start Draft directly (Default Captain 1 picks first)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Skip Toss & Start Draft</span>
              </button>
            )}

            <button
              onClick={onProceed}
              disabled={!tossWinner}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-emerald-600/20 flex items-center space-x-2 transition-all transform active:scale-95"
            >
              <span>Enter Live Draft Room 🚀</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-2 text-xs text-slate-500 font-semibold">
          ⚽ Draft room will open automatically as soon as captains start.
        </div>
      )}
    </div>
  );
}
