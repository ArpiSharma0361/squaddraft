import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Check,
  Trash2,
  Plus,
  Sparkles,
  Search,
  Filter,
  Edit2,
  AlertCircle,
  X,
  Archive,
  RotateCcw,
  Shield
} from 'lucide-react';
import { POSITIONS } from '../types';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function PlayerDirectoryPanel({
  playerDirectory = [],
  currentMatchPlayers = [],
  adminToken = null,
  roomStep = 'setup'
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(currentMatchPlayers.map(p => p.id)));
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE'); // 'ACTIVE' | 'INACTIVE' | 'ALL'
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPos, setNewPlayerPos] = useState('MID');
  const [newPlayerSecPos, setNewPlayerSecPos] = useState('');

  // Edit player modal state
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPos, setEditPos] = useState('MID');
  const [editSecPos, setEditSecPos] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Deactivate confirmation modal state
  const [deactivatingPlayer, setDeactivatingPlayer] = useState(null);
  const [actionError, setActionError] = useState(null);

  const activeCount = playerDirectory.filter(p => p.active !== false).length;
  const inactiveCount = playerDirectory.filter(p => p.active === false).length;

  const filteredDirectory = playerDirectory.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPos = posFilter === 'ALL' || p.position === posFilter;
    const isActive = p.active !== false;
    const matchesStatus =
      statusFilter === 'ALL' ? true :
      statusFilter === 'ACTIVE' ? isActive :
      !isActive;
    return matchesSearch && matchesPos && matchesStatus;
  });

  const toggleSelect = (player) => {
    if (player.active === false) return; // Inactive players cannot be selected for matches
    const next = new Set(selectedIds);
    if (next.has(player.id)) {
      next.delete(player.id);
    } else {
      next.add(player.id);
    }
    setSelectedIds(next);
    sfx.playPick();
  };

  const selectAll = () => {
    // Only select active players
    const activePlayers = playerDirectory.filter(p => p.active !== false);
    const next = new Set(activePlayers.map(p => p.id));
    setSelectedIds(next);
    sfx.playPick();
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    sfx.playBuzzer();
  };

  const applySelectedToMatch = () => {
    socket.emit('directory_select_for_match', {
      selectedPlayerIds: Array.from(selectedIds),
      adminToken
    });
    sfx.playWhistle();
  };

  const handleAddNewPlayer = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    socket.emit('directory_add_player', {
      player: {
        id: 'dir_' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: newPlayerName.trim(),
        position: newPlayerPos,
        secondaryPosition: newPlayerSecPos || undefined,
        active: true
      },
      adminToken
    });
    setNewPlayerName('');
    setNewPlayerSecPos('');
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
          position: pos,
          active: true
        });
      }
    });

    if (parsed.length > 0) {
      socket.emit('directory_bulk_add', {
        playersList: parsed,
        adminToken
      });
      setBulkInput('');
      setShowBulkModal(false);
      sfx.playWhistle();
    }
  };

  const startEdit = (e, player) => {
    e.stopPropagation();
    setEditingPlayer(player);
    setEditName(player.name);
    setEditPos(player.position);
    setEditSecPos(player.secondaryPosition || '');
    setEditActive(player.active !== false);
    setActionError(null);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (!editingPlayer || !editName.trim()) return;
    socket.emit('directory_edit_player', {
      playerId: editingPlayer.id,
      name: editName.trim(),
      position: editPos,
      secondaryPosition: editSecPos,
      active: editActive,
      adminToken
    });
    setEditingPlayer(null);
    sfx.playPick();
  };

  const startDeactivate = (e, player) => {
    e.stopPropagation();
    // Safeguard check: If player is currently participating in active draft or match
    const inCurrentSquad = currentMatchPlayers.some(p => p.id === player.id);
    const isLiveMatch = roomStep !== 'setup' && roomStep !== 'complete';
    if (inCurrentSquad && isLiveMatch) {
      setActionError(`Cannot remove "${player.name}" because they are currently participating in a live match or draft. Please complete or reset the match first.`);
      sfx.playBuzzer();
      return;
    }
    setDeactivatingPlayer(player);
    setActionError(null);
  };

  const confirmDeactivate = () => {
    if (!deactivatingPlayer) return;
    socket.emit('directory_deactivate_player', {
      playerId: deactivatingPlayer.id,
      adminToken
    });
    // Remove from selected list if present
    if (selectedIds.has(deactivatingPlayer.id)) {
      const next = new Set(selectedIds);
      next.delete(deactivatingPlayer.id);
      setSelectedIds(next);
    }
    setDeactivatingPlayer(null);
    sfx.playBuzzer();
  };

  const handleReactivate = (e, player) => {
    e.stopPropagation();
    socket.emit('directory_edit_player', {
      playerId: player.id,
      name: player.name,
      position: player.position,
      secondaryPosition: player.secondaryPosition,
      active: true,
      adminToken
    });
    sfx.playPick();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h3 className="text-base font-black tracking-wide">Permanent Player Directory</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Master database of club players ({playerDirectory.length} total | {activeCount} active). Select active players to populate this week's matchday squad.
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

      {/* Action Error Warning Banner */}
      {actionError && (
        <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="p-1 rounded-lg hover:bg-rose-100 text-rose-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
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

        {/* Position Filters */}
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

        {/* Active / Inactive / All Status Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Archived ({inactiveCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({playerDirectory.length})
          </button>
        </div>

        {/* Selection Shortcuts */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <button
            type="button"
            onClick={selectAll}
            className="text-emerald-700 hover:underline cursor-pointer"
          >
            Select All Active
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

      {/* Directory Grid with Individual Edit & Deactivate Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
        {filteredDirectory.map((player) => {
          const isSelected = selectedIds.has(player.id);
          const pos = POSITIONS[player.position] || POSITIONS.ANY;
          const isActive = player.active !== false;

          return (
            <div
              key={player.id}
              onClick={() => toggleSelect(player)}
              className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-between shadow-xs group ${
                !isActive
                  ? 'bg-slate-50/70 border-slate-200 opacity-60'
                  : isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-400/20 cursor-pointer'
                  : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!isActive}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 pointer-events-none"
                />
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`text-xs font-black truncate ${!isActive ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {player.name}
                    </span>
                    {!isActive && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 uppercase">
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <span>{player.position}</span>
                    {player.secondaryPosition && (
                      <span className="text-slate-400">/ {player.secondaryPosition}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Position badge + Edit + Deactivate/Reactivate */}
              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${pos.badgeColor}`}>
                  {player.position}
                </span>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={(e) => startEdit(e, player)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={`Edit ${player.name}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Deactivate or Reactivate Button */}
                {isActive ? (
                  <button
                    type="button"
                    onClick={(e) => startDeactivate(e, player)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title={`Deactivate / Archive ${player.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleReactivate(e, player)}
                    className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title={`Reactivate ${player.name}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredDirectory.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-medium">
            No players found in this view. Use "+ Add to Directory" below or "+ Bulk Add 16 Players" above.
          </div>
        )}
      </div>

      {/* Add Single Player to Directory Form */}
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
        <select
          value={newPlayerSecPos}
          onChange={(e) => setNewPlayerSecPos(e.target.value)}
          className="w-full sm:w-28 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="">Sec: None</option>
          {['GK', 'DEF', 'MID', 'ST', 'ANY'].map(p => (
            <option key={p} value={p}>Sec: {p}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!newPlayerName.trim()}
          className="w-full sm:w-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
        >
          + Save Player
        </button>
      </form>

      {/* ============================================================ */}
      {/* EDIT PLAYER MODAL                                            */}
      {/* ============================================================ */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Edit2 className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900">Edit Player Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlayer(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Player Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Primary Position</label>
                  <select
                    value={editPos}
                    onChange={(e) => setEditPos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {['GK', 'DEF', 'MID', 'ST', 'ANY'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Secondary Position</label>
                  <select
                    value={editSecPos}
                    onChange={(e) => setEditSecPos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None</option>
                    {['GK', 'DEF', 'MID', 'ST', 'ANY'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Status</label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="playerStatus"
                      checked={editActive === true}
                      onChange={() => setEditActive(true)}
                      className="accent-emerald-600"
                    />
                    <span>Active (Available for weekly matches)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 cursor-pointer">
                    <input
                      type="radio"
                      name="playerStatus"
                      checked={editActive === false}
                      onChange={() => setEditActive(false)}
                      className="accent-slate-600"
                    />
                    <span>Archived / Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlayer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DEACTIVATE / ARCHIVE CONFIRMATION DIALOG                     */}
      {/* ============================================================ */}
      {deactivatingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
                <Shield className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900">Archive Player?</h3>
                <p className="text-xs text-slate-500 font-medium">Safe deactivation confirmation</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed font-medium">
              <p className="font-bold text-slate-900">
                Remove <span className="text-emerald-700 font-black">{deactivatingPlayer.name}</span> from the active Player Directory?
              </p>
              <p className="text-slate-600">
                This player will no longer appear in future weekly match selections.
              </p>
              <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Historical match information will be preserved.</span>
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingPlayer(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-sm cursor-pointer"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
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

            <p className="text-xs text-slate-500">
              Paste list with one player per line. You can optionally include positions like (DEF), - ST, : GK.
            </p>

            <textarea
              rows={8}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="1. Deepak (MID)&#10;2. Ayaan (ST)&#10;3. Arjun (DEF)&#10;4. Rohan (GK)..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500 font-medium"
            />

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkInput.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer"
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
