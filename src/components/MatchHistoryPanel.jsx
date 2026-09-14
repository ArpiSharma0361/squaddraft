import React from 'react';
import { History, Calendar, MapPin, Trophy, Users, ArrowRight } from 'lucide-react';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function MatchHistoryPanel({ matchArchive = [] }) {
  const handleArchiveCurrent = () => {
    if (confirm('Are you sure you want to archive this match and start fresh for next week?')) {
      socket.emit('archive_current_match');
      sfx.playWhistle();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <History className="w-5 h-5" />
            </span>
            <h3 className="text-base font-black tracking-wide">Weekly Match Archive</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Past completed matches, team squads, and draft histories are preserved here forever.
          </p>
        </div>

        <button
          type="button"
          onClick={handleArchiveCurrent}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm ring-2 ring-purple-400/30"
        >
          <Trophy className="w-4 h-4" />
          <span>Archive Match & Setup Next Week</span>
        </button>
      </div>

      {matchArchive.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-xs space-y-2">
          <History className="w-8 h-8 mx-auto text-slate-300" />
          <div className="text-sm font-black text-slate-700">No Archived Matches Yet</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you complete a draft or match, click "Archive Match & Setup Next Week" above to save it into history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchArchive.map((match) => (
            <div key={match.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{match.name}</h4>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{match.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{match.venue}</span>
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-purple-100 text-purple-800 uppercase">
                  {match.format}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="font-black text-slate-900 flex items-center justify-between mb-1.5">
                    <span>{match.team1Name || 'Team 1'}</span>
                    <span className="text-[10px] text-emerald-600 uppercase font-bold">{match.team1Kit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold mb-2">
                    Cap: {match.captain1?.name || 'N/A'}
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-700">
                    {(match.finalTeam1 || []).map((p, idx) => (
                      <div key={idx} className="truncate">• {p.name} ({p.position})</div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="font-black text-slate-900 flex items-center justify-between mb-1.5">
                    <span>{match.team2Name || 'Team 2'}</span>
                    <span className="text-[10px] text-orange-600 uppercase font-bold">{match.team2Kit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-bold mb-2">
                    Cap: {match.captain2?.name || 'N/A'}
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-700">
                    {(match.finalTeam2 || []).map((p, idx) => (
                      <div key={idx} className="truncate">• {p.name} ({p.position})</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
