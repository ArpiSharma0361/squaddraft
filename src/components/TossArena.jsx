import React, { useEffect, useState, useRef } from 'react';
import { Coins, Sparkles, ArrowRight, ArrowLeft, Trophy, Eye, Shirt } from 'lucide-react';
import confetti from 'canvas-confetti';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';
import { ArenaCanvas } from './arena/ArenaCanvas';

export default function TossArena({
  captain1,
  captain2,
  team1Name = 'Team White',
  team2Name = 'Team Black',
  team1Kit = 'white',
  team2Kit = 'black',
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

  const [tossFlipEvent, setTossFlipEvent] = useState(null);
  const prevWinnerRef = useRef(null);

  // Listen for socket authoritative toss flip start
  useEffect(() => {
    function onFlippingStarted(data) {
      sfx.playCoinToss();
      setTossFlipEvent(data || { outcome: 'heads' });
    }
    socket.on('toss_flipping_started', onFlippingStarted);
    return () => socket.off('toss_flipping_started', onFlippingStarted);
  }, []);

  // Celebration on winner reveal
  useEffect(() => {
    if (tossWinner && !prevWinnerRef.current) {
      prevWinnerRef.current = tossWinner;
      sfx.playWhistle();
      sfx.playBallKick();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [tossWinner]);

  const handleCoinFlip = () => {
    if (!isCaptain || isFlipping || tossWinner) return;
    socket.emit('toss_start_flip', { token: captainToken, role: myRole });
    sfx.playCoinToss();
  };

  const roomStateMock = {
    captain1,
    captain2,
    team1Name,
    team2Name,
    team1Kit,
    team2Kit,
    tossState,
    roomId: 'main'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Role Notice Banner */}
      {isAdmin && (
        <div className="bg-slate-900 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between shadow-lg text-white">
          <div className="flex items-center space-x-2.5 text-xs font-bold text-amber-200">
            <span className="text-base">👑</span>
            <span>Admin Stadium Control Center: Watching Captains Toss the Match Coin.</span>
          </div>
          <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2.5 py-1 rounded-full font-black uppercase">
            Watch Only
          </span>
        </div>
      )}

      {isSpectator && (
        <div className="bg-slate-900 border border-purple-500/40 p-4 rounded-2xl flex items-center justify-between shadow-lg text-white">
          <div className="flex items-center space-x-2.5 text-xs font-bold text-purple-200">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Spectator Broadcast: Watching the Live 3D Coin Toss at Center Pitch.</span>
          </div>
          <span className="text-[10px] bg-purple-500/20 border border-purple-400/40 text-purple-300 px-2.5 py-1 rounded-full font-black uppercase">
            Live Stream
          </span>
        </div>
      )}

      {isCaptain && (
        <div className="bg-slate-900 border border-cyan-500/40 p-4 rounded-2xl flex items-center justify-between shadow-lg text-white">
          <div className="flex items-center space-x-2.5 text-xs font-bold text-cyan-200">
            <span className="text-base">👑</span>
            <span>
              You are {isCaptain1 ? `Captain 1 (${captain1?.name})` : `Captain 2 (${captain2?.name})`}. Authorized to flip the coin!
            </span>
          </div>
          <span className="text-[10px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 px-2.5 py-1 rounded-full font-black uppercase">
            Authorized Captain
          </span>
        </div>
      )}

      {/* Main Duel Clash Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
        <div className="grid grid-cols-3 items-center text-center pb-5 border-b border-slate-800">
          {/* Captain 1 (Blue / Cyan Theme) */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
              <span className="text-2xl sm:text-3xl font-black">👑</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">Captain 1</span>
              <h3 className="font-black text-white text-sm sm:text-base">{captain1?.name || 'Captain 1'}</h3>
              <span className="text-[11px] text-slate-400 font-semibold">{team1Name}</span>
            </div>
          </div>

          {/* VS Center Marker */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-lg tracking-widest">
              VS
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-2">
              Coin Toss Duel
            </span>
          </div>

          {/* Captain 2 (Purple / Violet Theme) */}
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-purple-950/60 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-500/20">
              <span className="text-2xl sm:text-3xl font-black">👑</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">Captain 2</span>
              <h3 className="font-black text-white text-sm sm:text-base">{captain2?.name || 'Captain 2'}</h3>
              <span className="text-[11px] text-slate-400 font-semibold">{team2Name}</span>
            </div>
          </div>
        </div>

        {/* Caller Choice (Captain 1 Calls Heads or Tails) */}
        <div className="py-4 flex flex-col items-center justify-center">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
            {captain1?.name}'s Call (Captain 1)
          </label>
          {isCaptain1 && !tossWinner && !isFlipping ? (
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => {
                  socket.emit('toss_set_caller_choice', { choice: 'heads', token: captainToken, role: myRole });
                  sfx.playPick();
                }}
                className={`py-2.5 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                  callerChoice === 'heads'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                ⚽ HEADS
              </button>
              <button
                type="button"
                onClick={() => {
                  socket.emit('toss_set_caller_choice', { choice: 'tails', token: captainToken, role: myRole });
                  sfx.playPick();
                }}
                className={`py-2.5 rounded-xl font-black text-xs border transition-all cursor-pointer ${
                  callerChoice === 'tails'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                🏆 TAILS
              </button>
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-black text-xs">
              {captain1?.name} has called: <span className="text-amber-400 uppercase font-black">{callerChoice}</span>
            </div>
          )}
        </div>

        {/* 3D ARENA CINEMATIC COIN TOSS CANVAS */}
        <div className="my-4">
          <ArenaCanvas
            roomState={roomStateMock}
            activeStage="toss"
            tossFlipEvent={tossFlipEvent}
            onCoinFlip={handleCoinFlip}
            role={myRole}
            canFlipToss={isCaptain && !tossWinner && !isFlipping}
          />
        </div>

        {/* Status & Action Buttons Below Arena */}
        <div className="pt-4 flex flex-col items-center justify-center space-y-4">
          {tossWinner ? (
            <div className="w-full max-w-md bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 border border-cyan-500/50 p-5 rounded-2xl text-center space-y-2 shadow-2xl">
              <div className="text-xs font-black uppercase tracking-widest text-cyan-400">
                ★ TOSS RESULT CONFIRMED ★
              </div>
              <div className="text-lg sm:text-xl font-black text-white">
                🏆 {tossWinner?.name?.toUpperCase()} WINS THE TOSS!
              </div>
              <div className="text-xs font-bold text-slate-300">
                FIRST PICK: <span className="text-cyan-300 font-black">{tossWinner?.name}</span> ({tossWinner?.id === captain1?.id ? team1Name : team2Name})
              </div>
              <p className="text-[11px] text-slate-400">
                Outcome authoritatively verified by server. Ready to launch draft.
              </p>
            </div>
          ) : isFlipping ? (
            <div className="px-6 py-3 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-sm uppercase tracking-wider animate-pulse">
              🪙 Coin is in the air at center pitch...
            </div>
          ) : isCaptain ? (
            <button
              onClick={handleCoinFlip}
              disabled={isFlipping}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-400/20 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Coins className="w-5 h-5 text-slate-950" />
              <span>FLIP THE COIN NOW</span>
            </button>
          ) : (
            <div className="px-5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold">
              Waiting for Captain to flip the coin...
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full pt-4 border-t border-slate-800">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Setup</span>
              </button>
            )}

            {tossWinner && (
              <button
                onClick={onProceed}
                className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm flex items-center space-x-2 shadow-lg shadow-cyan-500/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <span>ENTER LIVE DRAFT ARENA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
