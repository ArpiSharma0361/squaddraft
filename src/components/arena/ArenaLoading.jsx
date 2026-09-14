import React from 'react';

export function ArenaLoading({ message = 'Preparing Stadium Atmosphere...' }) {
  return (
    <div className="relative w-full h-[420px] md:h-[540px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a0f1d] via-[#0d162b] to-[#080c18] border border-blue-900/40 flex flex-col items-center justify-center text-white shadow-2xl p-6">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Stadium Floodlight Icon & Spinning Ball */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="text-2xl animate-bounce">⚽</span>
          </div>
        </div>
        <div className="absolute -inset-2 rounded-full border border-cyan-400/20 blur-sm animate-ping" />
      </div>

      {/* Title & Brand */}
      <div className="text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-700/40 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Squaddraft Arena 3D
        </div>
        <h3 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-blue-300">
          STADIUM BROADCAST
        </h3>
        <p className="text-sm text-blue-300/70 font-medium mt-1">
          {message}
        </p>
      </div>

      {/* Progress line */}
      <div className="w-48 md:w-64 h-1.5 bg-slate-800/80 rounded-full overflow-hidden mt-6 border border-blue-900/50">
        <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
