import React, { useState } from 'react';
import {
  Lock,
  Crown,
  Clipboard,
  Trash2,
  Check,
  ShieldCheck,
  Share2,
  Copy,
  MessageCircle,
  ArrowRight,
  Globe,
  Sparkles,
  Trophy,
  Users,
  Zap,
  Play,
  RotateCcw
} from 'lucide-react';
import { POSITIONS, DEFAULT_ADMIN_PIN } from '../types';
import { parseWhatsAppList } from '../utils/whatsappParser';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';

export default function AdminDashboard({
  players,
  captain1,
  captain2,
  team1Kit,
  team2Kit,
  team1Name,
  team2Name,
  matchTitle,
  publicUrl,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  onLaunchRoom
}) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [copiedLinkType, setCopiedLinkType] = useState(null);
  const [customPublicUrl, setCustomPublicUrl] = useState(publicUrl || '');
  const [adminTab, setAdminTab] = useState('match');

  const [manualName, setManualName] = useState('');
  const [manualPos, setManualPos] = useState('MID');

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pinInput === DEFAULT_ADMIN_PIN) {
      setIsAdminLoggedIn(true);
      setPinError(false);
      sfx.playPick();
    } else {
      setPinError(true);
      sfx.playBuzzer();
    }
  };

  const handleSelectTeam1Kit = (color) => {
    socket.emit('set_match_config', {
      team1Kit: color,
      team2Kit: color === 'white' ? 'black' : 'white'
    });
    sfx.playPick();
  };

  const handleSelectTeam2Kit = (color) => {
    socket.emit('set_match_config', {
      team2Kit: color,
      team1Kit: color === 'white' ? 'black' : 'white'
    });
    sfx.playPick();
  };

  const handleWhatsAppImport = () => {
    const parsed = parseWhatsAppList(whatsappText);
    if (parsed.length > 0) {
      socket.emit('admin_bulk_import', parsed);
      setShowWhatsAppModal(false);
      setWhatsappText('');
      sfx.playWhistle();
    }
  };

  const handleLoadDemoPlayers = () => {
    socket.emit('admin_load_demo_players');
    sfx.playTransferPop();
  };

  const handleClearRoster = () => {
    if (window.confirm('Clear all players from the matchday roster to start a fresh registration?')) {
      socket.emit('admin_clear_roster');
      sfx.playBuzzer();
    }
  };

  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    socket.emit('player_register', {
      id: 'p_' + Date.now() + Math.random().toString(36).substring(2, 5),
      name: manualName.trim(),
      position: manualPos
    });

    setManualName('');
    sfx.playPick();
  };

  const handleChangePlayerPosition = (playerId, newPos) => {
    socket.emit('update_player_position', { playerId, newPosition: newPos });
    sfx.playPick();
  };

  const handleStartEditName = (p) => {
    setEditingPlayerId(p.id);
    setEditingPlayerName(p.name);
  };

  const handleSaveEditName = (playerId) => {
    if (!editingPlayerName.trim()) return;
    socket.emit('update_player_name', { playerId, newName: editingPlayerName.trim() });
    setEditingPlayerId(null);
    sfx.playPick();
  };

  const handleDeletePlayer = (id) => {
    socket.emit('delete_player', id);
    sfx.playBuzzer();
  };

  const getActiveBaseUrl = () => {
    if (publicUrl && publicUrl.startsWith('http')) return publicUrl;
    if (customPublicUrl && customPublicUrl.startsWith('http')) return customPublicUrl;
    if (typeof window !== 'undefined') {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return window.location.origin;
      }
    }
    return publicUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  };

  const handleCopyLink = (type) => {
    const baseUrl = getActiveBaseUrl();
    let text = '';

    if (type === 'register') {
      const link = `${baseUrl}/?view=register`;
      text = `⚽ *MATCH REGISTRATION - ${matchTitle.toUpperCase()}* ⚽
Hey everyone! Please confirm your spot for this week's football match by registering here:
👉 ${link}`;
    } else if (type === 'cap1') {
      const link = `${baseUrl}/?role=cap1`;
      text = `👑 *CAPTAIN 1 DRAFT ROOM ACCESS* 👑
Hey ${captain1 ? captain1.name : 'Captain 1'}, you are Captain 1 (${team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})!
Click here to enter your Draft Room, call the toss, and pick your team:
👉 ${link}`;
    } else if (type === 'cap2') {
      const link = `${baseUrl}/?role=cap2`;
      text = `👑 *CAPTAIN 2 DRAFT ROOM ACCESS* 👑
Hey ${captain2 ? captain2.name : 'Captain 2'}, you are Captain 2 (${team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})!
Click here to enter your Draft Room:
👉 ${link}`;
    } else if (type === 'spectator') {
      const link = `${baseUrl}/?role=spectator`;
      text = `👀 *WATCH LIVE MATCH DRAFT* ⚽
The captains are drafting teams live! Watch the coin toss and squad picks here:
👉 ${link}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedLinkType(type);
    sfx.playPick();
    setTimeout(() => setCopiedLinkType(null), 3000);
  };

  const isConfigValid = captain1 && captain2 && captain1.id !== captain2 && players.length >= 4;

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Stadium Control Center</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Enter your 5-digit Admin PIN to access tournament management</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                placeholder="Enter 5-digit PIN"
                className="w-full text-center tracking-widest text-2xl px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner font-bold"
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-500 mt-2">Incorrect PIN. Please try again.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition-all transform active:scale-98 cursor-pointer"
            >
              Unlock Control Center 🔓
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stadium Control Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 shadow-lg text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>STADIUM CONTROL CENTER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Match Management Hub</span>
            <span className="text-emerald-400">🏟️</span>
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Configure match settings, designate weekly captains, and launch live ground drafts.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemoPlayers}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all transform active:scale-95 cursor-pointer"
            title="Load 16 Sample Players for Testing"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Load Demo (16)</span>
          </button>

          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all transform active:scale-95 cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>📋 Paste WhatsApp</span>
          </button>

          <button
            onClick={handleClearRoster}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 font-black text-xs transition-all cursor-pointer"
            title="Clear all registered players"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Roster</span>
          </button>
        </div>
      </div>

      {/* Live Match Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Match Status</span>
          <div className="text-base font-black text-emerald-600 flex items-center space-x-1.5 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE SYNC</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Players</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            👥 {players.length} Registered
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Captains</span>
          <div className="text-sm font-black text-slate-800 mt-0.5 truncate">
            👑 {captain1 ? captain1.name : '—'} vs {captain2 ? captain2.name : '—'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Draft Readiness</span>
          <div className={`text-sm font-black mt-0.5 ${isConfigValid ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isConfigValid ? '✅ READY TO LAUNCH' : '⚠️ Setup Pending'}
          </div>
        </div>
      </div>

      {/* Match Title Input */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
          Match Title / Event Name
        </label>
        <input
          type="text"
          value={matchTitle}
          onChange={(e) => socket.emit('set_match_config', { matchTitle: e.target.value })}
          placeholder="e.g. Sunday Turf Derby 8v8"
          className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
        />
      </div>

      {/* Captains & Kit Setup Cards Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team 1 Card (Emerald / White Kit) */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-emerald-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black shadow-xs">
              👑
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Team 1 & Captain 1</h2>
              <p className="text-xs text-slate-500 font-medium">Designate first squad leader</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Captain 1
            </label>
            <select
              value={captain1 ? captain1.id : ''}
              onChange={(e) => {
                const sel = players.find(p => p.id === e.target.value);
                socket.emit('set_match_config', { captain1: sel || null });
                sfx.playPick();
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Choose Captain 1 from Roster --</option>
              {players.map(p => (
                <option key={p.id} value={p.id} disabled={captain2 && captain2.id === p.id}>
                  {p.name} ({p.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              Team 1 Name
            </label>
            <input
              type="text"
              value={team1Name}
              onChange={(e) => socket.emit('set_match_config', { team1Name: e.target.value })}
              placeholder="e.g. Team White"
              className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">
              Jersey Kit (White ⚪ / Black ⚫)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTeam1Kit('white')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                  team1Kit === 'white'
                    ? 'bg-slate-100 text-slate-900 border-emerald-500 ring-2 ring-emerald-400/30 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                <span>White ⚪</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTeam1Kit('black')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                  team1Kit === 'black'
                    ? 'bg-slate-900 text-white border-slate-700 ring-2 ring-emerald-400/30 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700" />
                <span>Black ⚫</span>
              </button>
            </div>
          </div>
        </div>

        {/* Team 2 Card (Orange/Purple / Black Kit) */}
        <div className="bg-white border-2 border-orange-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-orange-100">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-800 font-black shadow-xs">
              👑
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Team 2 & Captain 2</h2>
              <p className="text-xs text-slate-500 font-medium">Designate second squad leader</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              Select Captain 2
            </label>
            <select
              value={captain2 ? captain2.id : ''}
              onChange={(e) => {
                const sel = players.find(p => p.id === e.target.value);
                socket.emit('set_match_config', { captain2: sel || null });
                sfx.playPick();
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="">-- Choose Captain 2 from Roster --</option>
              {players.map(p => (
                <option key={p.id} value={p.id} disabled={captain1 && captain1.id === p.id}>
                  {p.name} ({p.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
              Team 2 Name
            </label>
            <input
              type="text"
              value={team2Name}
              onChange={(e) => socket.emit('set_match_config', { team2Name: e.target.value })}
              placeholder="e.g. Team Black"
              className="w-full px-3.5 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-2 uppercase tracking-wider">
              Jersey Kit (White ⚪ / Black ⚫)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectTeam2Kit('white')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                  team2Kit === 'white'
                    ? 'bg-slate-100 text-slate-900 border-orange-500 ring-2 ring-orange-400/30 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300" />
                <span>White ⚪</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTeam2Kit('black')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                  team2Kit === 'black'
                    ? 'bg-slate-900 text-white border-slate-700 ring-2 ring-orange-400/30 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700" />
                <span>Black ⚫</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 WhatsApp Live Share Hub */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <span>WhatsApp Live Share Hub</span>
                <span>📱</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">1-Click formatted WhatsApp invite links with active Cloudflare domain</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-slate-700 font-mono font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {getActiveBaseUrl()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Player Registration Link */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col justify-between space-y-2.5">
            <div>
              <div className="text-xs font-black text-slate-900">📋 Group Registration</div>
              <p className="text-[11px] text-slate-500 mt-1">Send to WhatsApp group for players to register.</p>
            </div>
            <button
              onClick={() => handleCopyLink('register')}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-black flex items-center justify-center space-x-1.5 transition-all border border-slate-300 shadow-xs cursor-pointer"
            >
              {copiedLinkType === 'register' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLinkType === 'register' ? 'Copied!' : 'Copy Group Link'}</span>
            </button>
          </div>

          {/* Captain 1 Link */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-2xl flex flex-col justify-between space-y-2.5">
            <div>
              <div className="text-xs font-black text-emerald-900">👑 Captain 1 Access</div>
              <p className="text-[11px] text-emerald-700 mt-1">
                For <strong>{captain1 ? captain1.name : 'Captain 1'}</strong> to enter room & toss.
              </p>
            </div>
            <button
              disabled={!captain1}
              onClick={() => handleCopyLink('cap1')}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              {copiedLinkType === 'cap1' ? <Check className="w-3.5 h-3.5 text-white" /> : <MessageCircle className="w-3.5 h-3.5" />}
              <span>{copiedLinkType === 'cap1' ? 'Copied!' : 'Copy Cap 1 Invite'}</span>
            </button>
          </div>

          {/* Captain 2 Link */}
          <div className="bg-orange-50/70 border border-orange-200 p-3.5 rounded-2xl flex flex-col justify-between space-y-2.5">
            <div>
              <div className="text-xs font-black text-orange-900">👑 Captain 2 Access</div>
              <p className="text-[11px] text-orange-700 mt-1">
                For <strong>{captain2 ? captain2.name : 'Captain 2'}</strong> to enter room & draft.
              </p>
            </div>
            <button
              disabled={!captain2}
              onClick={() => handleCopyLink('cap2')}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              {copiedLinkType === 'cap2' ? <Check className="w-3.5 h-3.5 text-white" /> : <MessageCircle className="w-3.5 h-3.5" />}
              <span>{copiedLinkType === 'cap2' ? 'Copied!' : 'Copy Cap 2 Invite'}</span>
            </button>
          </div>

          {/* Spectator Link */}
          <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-2xl flex flex-col justify-between space-y-2.5">
            <div>
              <div className="text-xs font-black text-purple-900">👀 Spectator Link</div>
              <p className="text-[11px] text-purple-700 mt-1">Send to group to let others watch live.</p>
            </div>
            <button
              onClick={() => handleCopyLink('spectator')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              {copiedLinkType === 'spectator' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLinkType === 'spectator' ? 'Copied!' : 'Copy Watch Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roster Management Board */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base">
              Manage Registered Squad ({players.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">Click name or position dropdown to edit instantly</p>
          </div>

          <form onSubmit={handleAddManual} className="flex items-center gap-2">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Add player name..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <select
              value={manualPos}
              onChange={(e) => setManualPos(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-2 py-1.5 font-bold"
            >
              {Object.values(POSITIONS).map(pos => (
                <option key={pos.code} value={pos.code}>{pos.badge} {pos.code}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!manualName.trim()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              + Add
            </button>
          </form>
        </div>

        {players.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No players currently in roster. Use the "⚡ Load Demo" button, WhatsApp paste, or add players manually.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
            {players.map((p, idx) => {
              const pos = POSITIONS[p.position] || POSITIONS.ANY;
              const isCap1 = captain1 && captain1.id === p.id;
              const isCap2 = captain2 && captain2.id === p.id;
              const isEditing = editingPlayerId === p.id;

              return (
                <div
                  key={p.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs hover:border-slate-300"
                >
                  <div className="flex items-center space-x-2 truncate flex-1 mr-2">
                    <span className="text-xs font-black text-slate-400 w-4">{idx + 1}.</span>
                    
                    {isEditing ? (
                      <div className="flex items-center space-x-1 flex-1">
                        <input
                          type="text"
                          value={editingPlayerName}
                          onChange={(e) => setEditingPlayerName(e.target.value)}
                          className="px-2 py-0.5 bg-white border border-emerald-500 rounded text-xs text-slate-900 w-full font-bold"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditName(p.id)}
                          className="p-1 bg-emerald-600 text-white rounded font-bold"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 truncate">
                        <span
                          onClick={() => handleStartEditName(p)}
                          className="font-black text-xs text-slate-800 truncate cursor-pointer hover:text-emerald-600"
                          title="Click to edit name"
                        >
                          {p.name}
                        </span>
                        {isCap1 && <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded font-black">👑 (C1)</span>}
                        {isCap2 && <span className="text-[10px] text-orange-700 bg-orange-100 px-1 rounded font-black">👑 (C2)</span>}
                      </div>
                    )}
                  </div>

                  {/* Position Dropdown Editor */}
                  <div className="flex items-center space-x-1.5">
                    <select
                      value={p.position}
                      onChange={(e) => handleChangePlayerPosition(p.id, e.target.value)}
                      className="bg-white border border-slate-200 text-[10px] font-black text-slate-700 rounded-lg px-1.5 py-0.5 cursor-pointer hover:border-emerald-500"
                      title="Change Player Position"
                    >
                      {Object.values(POSITIONS).map(posOpt => (
                        <option key={posOpt.code} value={posOpt.code}>
                          {posOpt.badge} {posOpt.code}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleDeletePlayer(p.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Remove Player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Launch Room Button Card */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            {!isConfigValid ? (
              <span className="text-amber-700 font-bold">
                ⚠️ Select both Captain 1 & Captain 2 and ensure at least 4 players to launch live draft room.
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">
                ✅ Setup complete! Ready to enter Live Stadium Draft Room.
              </span>
            )}
          </div>

          <button
            onClick={onLaunchRoom}
            disabled={!isConfigValid}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>🏟️ Launch Live Draft Room</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <span>Paste WhatsApp Group Roster</span>
                <span>📋</span>
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <textarea
              rows={8}
              value={whatsappText}
              onChange={(e) => setWhatsappText(e.target.value)}
              placeholder="Paste message from WhatsApp football group (e.g. 1. Arpit - DEF, 2. Leo - FWD)..."
              className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500 font-medium"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleWhatsAppImport}
                disabled={!whatsappText.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer"
              >
                Import Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
