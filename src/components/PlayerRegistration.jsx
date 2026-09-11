import React, { useState } from 'react';
import { Users, UserPlus, Sparkles, Clipboard, Trash2, Edit3, Check, AlertCircle, Star, ArrowRight } from 'lucide-react';
import { POSITIONS, PRESET_ROSTERS } from '../types';
import { parseWhatsAppList } from '../utils/whatsappParser';
import { sfx } from '../utils/soundEffects';

export default function PlayerRegistration({ players, setPlayers, onProceed }) {
  const [nameInput, setNameInput] = useState('');
  const [positionInput, setPositionInput] = useState('MID');
  const [ratingInput, setRatingInput] = useState(4);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPos, setEditPos] = useState('MID');
  const [editRating, setEditRating] = useState(4);

  const posCounts = {
    GK: players.filter(p => p.position === 'GK').length,
    DEF: players.filter(p => p.position === 'DEF').length,
    MID: players.filter(p => p.position === 'MID').length,
    FWD: players.filter(p => p.position === 'FWD').length,
    ANY: players.filter(p => p.position === 'ANY').length,
  };

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const newPlayer = {
      id: 'p_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: nameInput.trim(),
      position: positionInput,
      rating: ratingInput
    };

    setPlayers([...players, newPlayer]);
    setNameInput('');
    sfx.playPick();
  };

  const handleDeletePlayer = (id) => {
    setPlayers(players.filter(p => p.id !== id));
    sfx.playBuzzer();
  };

  const handleStartEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPos(p.position);
    setEditRating(p.rating || 4);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    setPlayers(players.map(p => p.id === editingId ? { ...p, name: editName.trim(), position: editPos, rating: editRating } : p));
    setEditingId(null);
    sfx.playPick();
  };

  const handleWhatsAppImport = () => {
    const parsed = parseWhatsAppList(whatsappText);
    if (parsed.length > 0) {
      setPlayers(parsed);
      setShowWhatsAppModal(false);
      setWhatsappText('');
      sfx.playWhistle();
    }
  };

  const handleLoadPreset = (presetKey) => {
    const preset = PRESET_ROSTERS[presetKey];
    if (preset) {
      setPlayers(preset.players.map(p => ({ ...p, id: 'p_' + Math.random().toString(36).substring(2, 8) })));
      sfx.playPick();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire player list?')) {
      setPlayers([]);
      sfx.playBuzzer();
    }
  };

  const isEvenCount = players.length >= 4 && players.length % 2 === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Quick Presets */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 1: Match Squad Assembly</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Register Players & Match Roster
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Add players manually, or instantly paste the message from your WhatsApp football group!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Import Button */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
            >
              <Clipboard className="w-4 h-4" />
              <span>⚡ Paste WhatsApp List</span>
            </button>

            {/* Quick Demo Presets */}
            <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500 pl-2 font-medium">Presets:</span>
              <button
                onClick={() => handleLoadPreset('16_football')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-all font-semibold"
              >
                16 (8v8)
              </button>
              <button
                onClick={() => handleLoadPreset('14_turf')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-all font-semibold"
              >
                14 (7v7)
              </button>
              <button
                onClick={() => handleLoadPreset('10_futsal')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-all font-semibold"
              >
                10 (5v5)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Position Breakdown Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl text-center">
          <div className="text-2xl font-black text-white">{players.length}</div>
          <div className="text-xs font-semibold text-slate-400 mt-0.5">Total Players</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-xl text-center">
          <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
            🧤 {posCounts.GK}
          </div>
          <div className="text-xs font-semibold text-amber-300 mt-0.5">
            Goalkeepers {posCounts.GK === 2 ? '✅ (Balanced)' : (posCounts.GK > 0 ? `(${posCounts.GK})` : '')}
          </div>
        </div>
        <div className="bg-blue-950/20 border border-blue-500/30 p-3.5 rounded-xl text-center">
          <div className="text-2xl font-black text-blue-400 flex items-center justify-center gap-1">
            🛡️ {posCounts.DEF}
          </div>
          <div className="text-xs font-semibold text-blue-300 mt-0.5">Defenders</div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl text-center">
          <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
            ⚙️ {posCounts.MID}
          </div>
          <div className="text-xs font-semibold text-emerald-300 mt-0.5">Midfielders</div>
        </div>
        <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl text-center">
          <div className="text-2xl font-black text-rose-400 flex items-center justify-center gap-1">
            ⚡ {posCounts.FWD}
          </div>
          <div className="text-xs font-semibold text-rose-300 mt-0.5">Attackers</div>
        </div>
        <div className="bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-xl text-center">
          <div className="text-2xl font-black text-purple-400 flex items-center justify-center gap-1">
            🔄 {posCounts.ANY}
          </div>
          <div className="text-xs font-semibold text-purple-300 mt-0.5">Flexible / Any</div>
        </div>
      </div>

      {/* GK Balancing Reminder Alert */}
      {posCounts.GK === 2 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl flex items-center space-x-2.5 text-xs sm:text-sm shadow-sm">
          <span className="text-base">🧤</span>
          <span>
            <strong>Smart GK Balancing Active:</strong> Exactly 2 Goalkeepers detected! During drafting, when Captain 1 picks one GK, the second GK will automatically be assigned to Captain 2.
          </span>
        </div>
      )}

      {/* Main Form & Players Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add Player Manually */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-fit">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2 mb-4">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span>Add Single Player</span>
          </h2>

          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Player Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Leo, Arpit, John..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Position</label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(POSITIONS).map((pos) => (
                  <button
                    key={pos.code}
                    type="button"
                    onClick={() => setPositionInput(pos.code)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border flex flex-col items-center justify-center transition-all ${
                      positionInput === pos.code
                        ? `${pos.color} border-current ring-1 ring-current shadow-md`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{pos.badge}</span>
                    <span className="mt-0.5">{pos.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Skill Level / Star Rating: <span className="text-amber-400">{ratingInput} ⭐</span>
              </label>
              <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingInput(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                  >
                    <Star className={`w-5 h-5 ${star <= ratingInput ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              + Add to Roster
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Registered Squad Roster */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">
                  Registered Players ({players.length})
                </h2>
              </div>

              {players.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-all"
                >
                  Clear All
                </button>
              )}
            </div>

            {players.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-700 stroke-[1.5]" />
                <p className="text-sm font-medium">No players registered yet.</p>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Add players using the form on the left, or paste your WhatsApp group roster using the green button above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {players.map((p, idx) => {
                  const posConfig = POSITIONS[p.position] || POSITIONS.ANY;
                  const isEditing = editingId === p.id;

                  if (isEditing) {
                    return (
                      <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-emerald-500/50 space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-semibold"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={editPos}
                            onChange={(e) => setEditPos(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1"
                          >
                            {Object.values(POSITIONS).map(pos => (
                              <option key={pos.code} value={pos.code}>{pos.badge} {pos.code}</option>
                            ))}
                          </select>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      className="group p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <span className="text-xs font-bold text-slate-600 w-5 text-right">{idx + 1}.</span>
                        <div className="truncate">
                          <div className="font-bold text-sm text-slate-100 truncate">{p.name}</div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${posConfig.color}`}>
                              {posConfig.badge} {posConfig.code}
                            </span>
                            <span className="text-[11px] text-amber-400 font-medium">
                              {'★'.repeat(p.rating || 4)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Player"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Action / Proceed Bar */}
          <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center space-x-1.5">
              {!isEvenCount ? (
                <span className="text-amber-400 flex items-center space-x-1 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  <span>Recommend an even number of players (e.g. 10, 14, 16) for equal teams.</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center space-x-1 font-medium">
                  <Check className="w-4 h-4" />
                  <span>Ready! {players.length} players will form 2 balanced teams of {players.length / 2}.</span>
                </span>
              )}
            </div>

            <button
              onClick={onProceed}
              disabled={players.length < 4}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <span>Next: Pick Captains & Kits</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Quick Paste Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Paste WhatsApp Roster Text</h3>
                  <p className="text-xs text-slate-400">Our AI-powered regex parser extracts names and positions instantly.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paste chat message here:
              </label>
              <textarea
                rows={8}
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                placeholder={`TURF SUNDAY SQUAD:
1. Arpit (GK)
2. Sam - Defender
3. John (CB)
4. Tanya GK
5. Marcus CM
6. Rahul (Striker)
7. Alex
8. David (MID)`}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setWhatsappText('1. Hugo (GK)\n2. Thibaut (GK)\n3. Virgil (DEF)\n4. Ruben (DEF)\n5. Alphonso (DEF)\n6. Trent (DEF)\n7. Luka (MID)\n8. Kevin (MID)\n9. Jude (MID)\n10. Declan (MID)\n11. Rodri (MID)\n12. Pedri (MID)\n13. Erling (FWD)\n14. Kylian (FWD)\n15. Vinicius (FWD)\n16. Bukayo (FWD)')}
                className="text-xs text-slate-400 hover:text-emerald-400 underline font-medium"
              >
                Fill with Sample 16 Players
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppImport}
                  disabled={!whatsappText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md transition-all"
                >
                  Import Players
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
