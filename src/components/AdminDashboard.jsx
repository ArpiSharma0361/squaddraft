import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  History,
  FolderKanban,
  Award
} from 'lucide-react';
import { POSITIONS } from '../types';
import { parseWhatsAppList } from '../utils/whatsappParser';
import { socket } from '../utils/socket';
import { sfx } from '../utils/soundEffects';
import PlayerDirectoryPanel from './PlayerDirectoryPanel';
import MatchHistoryPanel from './MatchHistoryPanel';

export default function AdminDashboard({
  players,
  captain1,
  captain2,
  cap1Token,
  cap2Token,
  team1Kit,
  team2Kit,
  team1Name,
  team2Name,
  matchTitle,
  publicUrl,
  matchScore,
  isAdminLoggedIn,
  adminToken,
  setIsAdminLoggedIn,
  playerDirectory = [],
  matchArchive = [],
  onLaunchRoom
}) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappText, setWhatsappText] = useState('');
  const [copiedLinkType, setCopiedLinkType] = useState(null);
  const [customPublicUrl, setCustomPublicUrl] = useState(publicUrl || '');
  const [adminTab, setAdminTab] = useState('match'); // 'match' | 'directory' | 'archive'

  const [manualName, setManualName] = useState('');
  const [manualPos, setManualPos] = useState('MID');

  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // Final Score State
  const [t1Score, setT1Score] = useState(matchScore?.team1Score ?? 0);
  const [t2Score, setT2Score] = useState(matchScore?.team2Score ?? 0);
  const [scoreSaving, setScoreSaving] = useState(false);
  const [scoreSavedSuccess, setScoreSavedSuccess] = useState(false);
  const [scoreError, setScoreError] = useState('');

  useEffect(() => {
    if (matchScore) {
      setT1Score(matchScore.team1Score ?? 0);
      setT2Score(matchScore.team2Score ?? 0);
    }
  }, [matchScore]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setIsAdminLoggedIn(true, data.token);
        setPinError(false);
        sfx.playPick();
      } else {
        setPinError(true);
        sfx.playBuzzer();
      }
    } catch (err) {
      setPinError(true);
      sfx.playBuzzer();
    }
  };

  const handleSelectTeam1Kit = (color) => {
    socket.emit('set_match_config', {
      team1Kit: color,
      team2Kit: color === 'white' ? 'black' : 'white',
      adminToken
    });
    sfx.playPick();
  };

  const handleSelectTeam2Kit = (color) => {
    socket.emit('set_match_config', {
      team2Kit: color,
      team1Kit: color === 'white' ? 'black' : 'white',
      adminToken
    });
    sfx.playPick();
  };

  const handleWhatsAppImport = () => {
    const parsed = parseWhatsAppList(whatsappText);
    if (parsed.length > 0) {
      socket.emit('admin_bulk_import', { parsedPlayers: parsed, adminToken });
      setShowWhatsAppModal(false);
      setWhatsappText('');
      sfx.playWhistle();
    }
  };

  const handleLoadDemoPlayers = () => {
    socket.emit('admin_load_demo_players', { adminToken });
    sfx.playTransferPop();
  };

  const handleClearRoster = () => {
    if (window.confirm('Clear all players from the matchday roster to start a fresh registration?')) {
      socket.emit('admin_clear_roster', { adminToken });
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
    socket.emit('update_player_position', { playerId, newPosition: newPos, adminToken });
    sfx.playPick();
  };

  const handleStartEditName = (p) => {
    setEditingPlayerId(p.id);
    setEditingPlayerName(p.name);
  };

  const handleSaveEditName = (playerId) => {
    if (!editingPlayerName.trim()) return;
    socket.emit('update_player_name', { playerId, newName: editingPlayerName.trim(), adminToken });
    setEditingPlayerId(null);
    sfx.playPick();
  };

  const handleDeletePlayer = (id) => {
    socket.emit('delete_player', { playerId: id, adminToken });
    sfx.playBuzzer();
  };

  const handleSaveScore = async (e) => {
    e.preventDefault();
    const score1 = parseInt(t1Score, 10);
    const score2 = parseInt(t2Score, 10);

    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      setScoreError('Scores must be non-negative whole numbers (0, 1, 2, ...).');
      sfx.playBuzzer();
      return;
    }

    setScoreError('');
    setScoreSaving(true);

    try {
      const res = await fetch('/api/matches/main/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team1Score: score1, team2Score: score2, adminToken })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setScoreSavedSuccess(true);
        sfx.playCheer();
        setTimeout(() => setScoreSavedSuccess(false), 3500);
      } else {
        setScoreError(data.error || 'Failed to save score');
        sfx.playBuzzer();
      }
    } catch (err) {
      setScoreError('Network error saving match score');
      sfx.playBuzzer();
    } finally {
      setScoreSaving(false);
    }
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
      text = `⚽ *MATCH REGISTRATION - ${matchTitle.toUpperCase()}* ⚽\nHey everyone! Please confirm your spot for this week's football match by registering here:\n👉 ${link}`;
    } else if (type === 'cap1') {
      const link = `${baseUrl}/?role=cap1&token=${cap1Token || ''}`;
      text = `👑 *CAPTAIN 1 DRAFT ROOM ACCESS* 👑\nHey ${captain1 ? captain1.name : 'Captain 1'}, you are Captain 1 (${team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})!\nClick here to enter your Draft Room, call the toss, and pick your team:\n👉 ${link}`;
    } else if (type === 'cap2') {
      const link = `${baseUrl}/?role=cap2&token=${cap2Token || ''}`;
      text = `👑 *CAPTAIN 2 DRAFT ROOM ACCESS* 👑\nHey ${captain2 ? captain2.name : 'Captain 2'}, you are Captain 2 (${team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'})!\nClick here to enter your Draft Room:\n👉 ${link}`;
    } else if (type === 'spectator') {
      const link = `${baseUrl}/?role=spectator`;
      text = `👀 *WATCH LIVE MATCH DRAFT* ⚽\nThe captains are drafting teams live! Watch the coin toss and squad picks here:\n👉 ${link}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedLinkType(type);
    sfx.playPick();
    setTimeout(() => setCopiedLinkType(null), 3000);
  };

  const isConfigValid = captain1 && captain2 && captain1.id !== captain2 && players.length >= 4;

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 animate-in fade-in duration-300">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Stadium Control Center</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Enter your Admin PIN to access tournament management</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                placeholder="Enter Admin PIN"
                className="w-full text-center tracking-widest text-2xl px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white shadow-inner font-bold"
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-500 mt-2">Incorrect PIN. Backend authorization failed.</p>
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
            Configure match settings, designate weekly captains, enter final scores, and manage permanent archives.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemoPlayers}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition-all transform active:scale-95 cursor-pointer"
            title="Load 16 Sample Players for Testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-950" />
            <span>Load 16 Demo Players</span>
          </button>

          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm transition-all transform active:scale-95 cursor-pointer"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Import WhatsApp List</span>
          </button>

          <button
            onClick={handleClearRoster}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all cursor-pointer"
            title="Clear Matchday Roster"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Roster</span>
          </button>
        </div>
      </div>

      {/* Admin Subsystem Navigation Tabs */}
      <div className="flex items-center space-x-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 shadow-inner">
        <button
          onClick={() => { setAdminTab('match'); sfx.playPick(); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            adminTab === 'match'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span>Match Setup & Live Scoring</span>
        </button>

        <button
          onClick={() => { setAdminTab('directory'); sfx.playPick(); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            adminTab === 'directory'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4 text-indigo-600" />
          <span>Permanent Player Directory ({playerDirectory.length})</span>
        </button>

        <button
          onClick={() => { setAdminTab('archive'); sfx.playPick(); }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            adminTab === 'archive'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-purple-600" />
          <span>Weekly Match Archive ({matchArchive.length})</span>
        </button>
      </div>

      {/* TAB 2: Player Directory Panel */}
      {adminTab === 'directory' && (
        <PlayerDirectoryPanel playerDirectory={playerDirectory} currentMatchPlayers={players} />
      )}

      {/* TAB 3: Match Archive Panel */}
      {adminTab === 'archive' && (
        <MatchHistoryPanel matchArchive={matchArchive} />
      )}

      {/* TAB 1: Match Setup, Captains & Live Final Score */}
      {adminTab === 'match' && (
        <div className="space-y-6">
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
              onChange={(e) => socket.emit('set_match_config', { matchTitle: e.target.value, adminToken })}
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
                    socket.emit('set_match_config', { captain1: sel || null, adminToken });
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
                  Jersey Kit Color
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTeam1Kit('white')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                      team1Kit === 'white'
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-sm ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>⚪ White Kit</span>
                    {team1Kit === 'white' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTeam1Kit('black')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                      team1Kit === 'black'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>⚫ Black Kit</span>
                    {team1Kit === 'black' && <Check className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Captain 1 Draft Token:</span>
                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                  {cap1Token ? cap1Token.substring(0, 10) + '...' : 'Generated on assign'}
                </span>
              </div>
            </div>

            {/* Team 2 Card (Orange / Black Kit) */}
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
                    socket.emit('set_match_config', { captain2: sel || null, adminToken });
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
                  Jersey Kit Color
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTeam2Kit('white')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                      team2Kit === 'white'
                        ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-sm ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>⚪ White Kit</span>
                    {team2Kit === 'white' && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTeam2Kit('black')}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center space-x-2 font-black text-xs transition-all cursor-pointer ${
                      team2Kit === 'black'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/30'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span>⚫ Black Kit</span>
                    {team2Kit === 'black' && <Check className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Captain 2 Draft Token:</span>
                <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">
                  {cap2Token ? cap2Token.substring(0, 10) + '...' : 'Generated on assign'}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Secure Sharing Hub */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Share2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
                Secure WhatsApp Group Sharing Hub
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleCopyLink('cap1')}
                disabled={!captain1}
                className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 text-left space-y-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950">👑 Share Captain 1 Link</span>
                  {copiedLinkType === 'cap1' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Includes secure token for {captain1 ? captain1.name : 'Captain 1'}
                </p>
              </button>

              <button
                onClick={() => handleCopyLink('cap2')}
                disabled={!captain2}
                className="p-4 rounded-2xl bg-orange-50 hover:bg-orange-100/70 border border-orange-200 text-left space-y-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-950">👑 Share Captain 2 Link</span>
                  {copiedLinkType === 'cap2' ? <Check className="w-4 h-4 text-orange-600" /> : <Copy className="w-4 h-4 text-orange-600" />}
                </div>
                <p className="text-[11px] text-orange-800 font-medium">
                  Includes secure token for {captain2 ? captain2.name : 'Captain 2'}
                </p>
              </button>

              <button
                onClick={() => handleCopyLink('spectator')}
                className="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-left space-y-1.5 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-950">👀 Share Spectator Link</span>
                  {copiedLinkType === 'spectator' ? <Check className="w-4 h-4 text-purple-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-[11px] text-purple-800 font-medium">
                  Public read-only broadcast stream for football group
                </p>
              </button>
            </div>
          </div>

          {/* TASK 4: Final Match Score Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-amber-300">
                  Official Match Final Result (Admin Only)
                </h3>
              </div>
              {matchScore && (
                <span className="text-[11px] text-slate-400 font-semibold">
                  Last updated: {new Date(matchScore.updatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveScore} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team 1 Score */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {team1Name} ({captain1 ? captain1.name : 'Cap 1'}) Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={t1Score}
                    onChange={(e) => setT1Score(e.target.value)}
                    className="w-full text-center text-3xl font-black p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Team 2 Score */}
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {team2Name} ({captain2 ? captain2.name : 'Cap 2'}) Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={t2Score}
                    onChange={(e) => setT2Score(e.target.value)}
                    className="w-full text-center text-3xl font-black p-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {scoreError && (
                <p className="text-xs font-bold text-rose-400">{scoreError}</p>
              )}

              {scoreSavedSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold text-center">
                  ✅ Final score saved and synchronized to database and public history!
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs font-bold text-slate-300">
                  Calculated Outcome:{' '}
                  <span className="text-amber-400 font-extrabold">
                    {parseInt(t1Score, 10) > parseInt(t2Score, 10)
                      ? `${team1Name} Wins`
                      : parseInt(t2Score, 10) > parseInt(t1Score, 10)
                      ? `${team2Name} Wins`
                      : 'Draw / Tied'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={scoreSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition-all transform active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>{scoreSaving ? 'Saving...' : 'SAVE FINAL RESULT'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Launch Room Button Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
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
      )}

      {/* WhatsApp Import Modal */}
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
