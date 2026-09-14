import React, { useState, useEffect } from 'react';
import { History, Calendar, MapPin, Trophy, Users, ArrowLeft, Shield, Sparkles, Award } from 'lucide-react';

export default function MatchHistoryPublic({ onGoToMatch }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMatches(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Could not fetch public match history:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-9 shadow-2xl border-2 border-indigo-500/30 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-black mb-3 shadow-xs">
              <History className="w-3.5 h-3.5" />
              <span>PUBLIC MATCH ARCHIVE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-2.5">
              <span>Turf War Match History</span>
              <span className="text-amber-400">🏆</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
              Official archive of past weekly turf battles, finalized scores, and tournament champion records.
            </p>
          </div>

          <button
            onClick={onGoToMatch}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Live Match Room</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-xs">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading archived match records...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">No Past Matches Recorded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once matches are completed and archived by the Match Controller, official scores and lineups will appear here permanently.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => {
            const hasScore = match.team1Score !== null && match.team2Score !== null;
            return (
              <div
                key={match.id}
                className="bg-white border-2 border-slate-200 hover:border-emerald-400/80 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{match.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 font-semibold mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{match.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{match.venue}</span>
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-800 uppercase tracking-wide border border-slate-200">
                      {match.format}
                    </span>
                  </div>

                  {/* Scoreboard Block */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-inner">
                    <div className="grid grid-cols-5 items-center text-center">
                      {/* Team 1 */}
                      <div className="col-span-2 text-left pl-2">
                        <div className="text-xs font-bold text-slate-400 truncate">
                          {match.captain1 ? `Cap. ${match.captain1.name}` : 'Team 1'}
                        </div>
                        <div className="text-sm font-black text-white truncate mt-0.5">
                          {match.team1Name}
                        </div>
                      </div>

                      {/* Score or VS */}
                      <div className="col-span-1 flex flex-col items-center justify-center">
                        {hasScore ? (
                          <div className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 font-black text-base text-amber-400 tracking-widest shadow-sm">
                            {match.team1Score} - {match.team2Score}
                          </div>
                        ) : (
                          <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
                            VS
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="col-span-2 text-right pr-2">
                        <div className="text-xs font-bold text-slate-400 truncate">
                          {match.captain2 ? `Cap. ${match.captain2.name}` : 'Team 2'}
                        </div>
                        <div className="text-sm font-black text-white truncate mt-0.5">
                          {match.team2Name}
                        </div>
                      </div>
                    </div>

                    {/* Winner Banner */}
                    {hasScore && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 text-center flex items-center justify-center space-x-1.5 text-xs font-black">
                        {match.winner === 'Draw' ? (
                          <span className="text-slate-300">⚖️ Match Ended in a Draw</span>
                        ) : (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Winner: {match.winner}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Squad Lineup Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                      <span className="truncate">{match.team1Name} Squad</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{match.finalTeam1?.length || 0} players</span>
                    </div>
                    <div className="space-y-0.5 text-slate-600 text-[11px]">
                      {(match.finalTeam1 || []).slice(0, 4).map((p, idx) => (
                        <div key={idx} className="truncate">• {p.name} ({p.position})</div>
                      ))}
                      {(match.finalTeam1?.length || 0) > 4 && (
                        <div className="text-slate-400 text-[10px] font-bold">+{(match.finalTeam1.length - 4)} more</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                      <span className="truncate">{match.team2Name} Squad</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{match.finalTeam2?.length || 0} players</span>
                    </div>
                    <div className="space-y-0.5 text-slate-600 text-[11px]">
                      {(match.finalTeam2 || []).slice(0, 4).map((p, idx) => (
                        <div key={idx} className="truncate">• {p.name} ({p.position})</div>
                      ))}
                      {(match.finalTeam2?.length || 0) > 4 && (
                        <div className="text-slate-400 text-[10px] font-bold">+{(match.finalTeam2.length - 4)} more</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
