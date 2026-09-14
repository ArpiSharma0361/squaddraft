import React, { useState } from 'react';
import { Users, UserPlus, Check, Trash2, Plus, Sparkles, Search, Filter } from 'lucide-react';
import { POSITIONS } from '../types';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function PlayerDirectoryPanel({ playerDirectory = [], currentMatchPlayers = [] }) {
  const [selectedIds, setSelectedIds] = useState(new Set(currentMatchPlayers.map(p => p.id)));
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('MID');

  const filteredDirectory = playerDirectory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPos = posFilter === 'ALL' || p.position === posFilter;
    return matchesSearch && matchesPos;
  });

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
    sfx.playPick();
  };

  const selectAll = () => {
    const next = new Set(playerDirectory.map(p => p.id));
    setSelectedIds(next);
    sfx.playPick();
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    sfx.playBuzzer();
  };

  const applySelectedToMatch = () => {
    socket.emit('directory_select_for_match', Array.from(selectedIds));
    sfx.playWhistle();
  };

  const handleAddNewPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    socket.emit('directory_add_player', {
      id: 'dir_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: newPlayerName.trim(),
      position: newPlayerPos
    });
    setNewPlayerName('');
    sfx.playPick();
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split('\n');
    const parsed = [];

    lines.forEach(line => {
      let cleaned = line.replace(/^\d+[\.\-\)]\s*/, '').trim();
      if (!cleaned) return;

      let pos = 'MID';
      const posMatch = cleaned.match(/\((GK|DEF|MID|ST|FWD|ANY)\)/i) || cleaned.match(/[-:]\s*(GK|DEF|MID|ST|FWD|ANY)/i);
      if (posMatch) {
        let pStr = posMatch[1].toUpperCase();
        if (pStr === 'FWD') pStr = 'ST';
        pos = pStr;
        cleaned = cleaned.replace(posMatch[0], '').trim();
      }

      if (cleaned) {
        parsed.push({
          name: cleaned,
          position: pos
        });
      }
    });

    if (parsed.length > 0) {
      socket.emit('directory_bulk_add', parsed);
      setBulkInput('');
      setShowBulkModal(false);
      sfx.playWhistle();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h3 className="text-base font-black tracking-wide">Permanent Player Directory</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Master player roster saved permanently. Check players to add to this week's match squad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Bulk Add 16 Players</span>
          </button>

          <button
            type="button"
            onClick={applySelectedToMatch}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm ring-2 ring-emerald-400/30"
          >
            <Check className="w-4 h-4" />
            <span>Update Match Squad ({selectedIds.size} Selected)</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search directory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'GK', 'DEF', 'MID', 'ST', 'ANY'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setPosFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                posFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold">
          <button
            type="button"
            onClick={selectAll}
            className="text-emerald-700 hover:underline cursor-pointer"
          >
            Select All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-slate-500 hover:underline cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredDirectory.map((player) => {
          const isSelected = selectedIds.has(player.id);
          const pos = POSITIONS[player.position] || POSITIONS.ANY;

          return (
            <div
              key={player.id}
              onClick={() => toggleSelect(player.id)}
              className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-400/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 pointer-events-none"
                />
                <div className="truncate">
                  <div className="text-xs font-black text-slate-900 truncate">{player.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{player.position}</div>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${pos.badgeColor}`}>
                {player.position}
              </span>
            </div>
          );
        })}

        {filteredDirectory.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
            No players found in directory. Use "+ Bulk Add 16 Players" above to add your squad.
          </div>
        )}
      </div>

      <form onSubmit={handleAddNewPlayer} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-black text-slate-700 whitespace-nowrap">Add to Directory:</span>
        <input
          type="text"
          placeholder="Player Full Name"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          className="w-full sm:flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
        />
        <select
          value={newPlayerPos}
          onChange={(e) => setNewPlayerPos(e.target.value)}
          className="w-full sm:w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          {['GK', 'DEF', 'MID', 'ST', 'ANY'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!newPlayerName.trim()}
          className="w-full sm:w-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
        >
          + Save Player
        </button>
      </form>

      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Bulk Add 16 Players</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">1-Click</span>
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Paste your player roster. You can use WhatsApp format, numbered lists, or <code>Name - Position</code>:
            </p>

            <textarea
              rows={8}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={`1. Arjun (MID)\n2. Rahul (DEF)\n3. Sai (GK)\n4. Rohit (ST)\n5. Vishal (DEF)\n6. Kiran (MID)\n7. Aditya (ST)\n8. Deepak (MID)...\n16. Shiv (ANY)`}
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkInput.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Save All to Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
