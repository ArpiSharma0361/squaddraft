import React, { useState } from 'react';
import { Crown, Shield, ArrowRight, ArrowLeft, Shirt, CheckCircle2, Sparkles } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

export default function CaptainAndKitSetup({
  players,
  captain1,
  setCaptain1,
  captain2,
  setCaptain2,
  team1Kit,
  setTeam1Kit,
  team2Kit,
  setTeam2Kit,
  team1Name,
  setTeam1Name,
  team2Name,
  setTeam2Name,
  onProceed,
  onBack
}) {
  const handleSelectTeam1Kit = (color) => {
    setTeam1Kit(color);
    setTeam2Kit(color === 'white' ? 'black' : 'white');
    sfx.playPick();
  };

  const handleSelectTeam2Kit = (color) => {
    setTeam2Kit(color);
    setTeam1Kit(color === 'white' ? 'black' : 'white');
    sfx.playPick();
  };

  const isValid = captain1 && captain2 && captain1.id !== captain2.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2: Leadership & Team Colors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Select Captains & Jersey Kits
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto mt-1">
          Pick two captains from the roster. Choose jersey colors (White ⚪ or Black ⚫). Choosing one automatically assigns the opposite to the other captain!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Captain 1 Card */}
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-bl-xl shadow-md">
            Captain 1
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Crown className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Captain 1 Setup</h2>
                <p className="text-xs text-slate-400">Designate the first team leader</p>
              </div>
            </div>

            {/* Captain 1 Player Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose Captain 1</label>
              <select
                value={captain1 ? captain1.id : ''}
                onChange={(e) => {
                  const selected = players.find(p => p.id === e.target.value);
                  setCaptain1(selected || null);
                  sfx.playPick();
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Captain 1 --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={captain2 && captain2.id === p.id}>
                    {p.name} ({p.position}) {'★'.repeat(p.rating || 4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Team 1 Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Team 1 Name</label>
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="e.g. Team White / Apex Strikers"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
              />
            </div>

            {/* Kit Selection for Captain 1 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                <Shirt className="w-4 h-4 text-emerald-400" />
                <span>Jersey Color (White ⚪ / Black ⚫)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectTeam1Kit('white')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold text-sm transition-all ${
                    team1Kit === 'white'
                      ? 'bg-slate-100 text-slate-950 border-white ring-2 ring-emerald-400 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm" />
                  <span>White Kit ⚪</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTeam1Kit('black')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold text-sm transition-all ${
                    team1Kit === 'black'
                      ? 'bg-slate-950 text-white border-slate-600 ring-2 ring-emerald-400 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-black border border-slate-600 shadow-sm" />
                  <span>Black Kit ⚫</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Captain 2 Card */}
        <div className="bg-slate-900 border-2 border-blue-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
          <div className="absolute top-0 right-0 px-3 py-1 bg-blue-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-bl-xl shadow-md">
            Captain 2
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Crown className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Captain 2 Setup</h2>
                <p className="text-xs text-slate-400">Designate the rival team leader</p>
              </div>
            </div>

            {/* Captain 2 Player Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Choose Captain 2</label>
              <select
                value={captain2 ? captain2.id : ''}
                onChange={(e) => {
                  const selected = players.find(p => p.id === e.target.value);
                  setCaptain2(selected || null);
                  sfx.playPick();
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Select Captain 2 --</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={captain1 && captain1.id === p.id}>
                    {p.name} ({p.position}) {'★'.repeat(p.rating || 4)}
                  </option>
                ))}
              </select>
            </div>

            {/* Team 2 Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Team 2 Name</label>
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="e.g. Team Black / Night Wolves"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm"
              />
            </div>

            {/* Kit Selection for Captain 2 */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1.5">
                <Shirt className="w-4 h-4 text-blue-400" />
                <span>Jersey Color (White ⚪ / Black ⚫)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectTeam2Kit('white')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold text-sm transition-all ${
                    team2Kit === 'white'
                      ? 'bg-slate-100 text-slate-950 border-white ring-2 ring-blue-400 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm" />
                  <span>White Kit ⚪</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTeam2Kit('black')}
                  className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold text-sm transition-all ${
                    team2Kit === 'black'
                      ? 'bg-slate-950 text-white border-slate-600 ring-2 ring-blue-400 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-black border border-slate-600 shadow-sm" />
                  <span>Black Kit ⚫</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Roster</span>
        </button>

        <button
          onClick={onProceed}
          disabled={!isValid}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all transform active:scale-95"
        >
          <span>Next: The Coin Toss 🪙</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
