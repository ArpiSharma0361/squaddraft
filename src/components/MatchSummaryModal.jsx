import React, { useState, useRef } from 'react';
import { Share2, Download, Copy, Check, Sparkles, X, Trophy, Shirt, Clock, MapPin } from 'lucide-react';
import html2canvas from 'html2canvas';
import { sfx } from '../utils/soundEffects';

export default function MatchSummaryModal({
  isOpen,
  onClose,
  team1,
  team2,
  captain1,
  captain2,
  team1Kit,
  team2Kit,
  team1Name,
  team2Name
}) {
  const posterRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Generate WhatsApp Message formatted text
  const generateWhatsAppMessage = () => {
    let msg = `⚽ *MATCHDAY SQUAD ROSTER* ⚽\n`;
    msg += `🏟️ *Weekly Match Lineups*\n\n`;

    msg += `⚪ *${team1Name.toUpperCase()}* (${team1Kit === 'white' ? 'White Jersey ⚪' : 'Black Jersey ⚫'})\n`;
    msg += `👑 Captain: *${captain1?.name || 'Captain 1'}*\n`;
    msg += `👥 Squad (${team1.length} players):\n`;
    team1.forEach((p, i) => {
      msg += `  ${i + 1}. ${p.name} [${p.position}]\n`;
    });

    msg += `\n🆚 *VERSUS* 🆚\n\n`;

    msg += `⚫ *${team2Name.toUpperCase()}* (${team2Kit === 'white' ? 'White Jersey ⚪' : 'Black Jersey ⚫'})\n`;
    msg += `👑 Captain: *${captain2?.name || 'Captain 2'}*\n`;
    msg += `👥 Squad (${team2.length} players):\n`;
    team2.forEach((p, i) => {
      msg += `  ${i + 1}. ${p.name} [${p.position}]\n`;
    });

    msg += `\n🏟️ *Bring your A-Game! Let's play fair and have fun!* 🔥`;
    return msg;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text.replace(/\\n/g, '\n'));
    setCopied(true);
    sfx.playPick();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    setIsDownloading(true);
    sfx.playPick();

    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `SquadDraft_${team1Name}_vs_${team2Name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      sfx.playCheer();
    } catch (err) {
      console.error('Failed to export poster image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                <span>Export & Share Match Squads</span>
                <span className="text-emerald-600">✨</span>
              </h3>
              <p className="text-xs text-slate-500">1-Click WhatsApp text copy or download matchday lineup card.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* The Exportable Poster Card */}
        <div
          ref={posterRef}
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 rounded-2xl border-2 border-emerald-500/50 shadow-xl space-y-5 relative overflow-hidden text-white"
        >
          {/* Subtle Stadium Floodlight Glows */}
          <div className="absolute -top-12 left-1/4 w-60 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-1/4 w-60 h-40 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Poster Header */}
          <div className="text-center space-y-1 relative z-10">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[10px] font-black uppercase tracking-widest shadow-sm">
              ⚽ OFFICIAL MATCHDAY SQUADS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {team1Name.toUpperCase()} <span className="text-amber-400 text-lg sm:text-xl font-extrabold">VS</span> {team2Name.toUpperCase()}
            </h2>
            <p className="text-xs text-slate-300 font-medium">Match Squad Lineup Card</p>
          </div>

          {/* Teams Side-by-Side Lineup */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {/* Team 1 Box */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-3.5 space-y-2.5 backdrop-blur-sm shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <div>
                  <div className="text-xs font-black text-white truncate">{team1Name}</div>
                  <div className="text-[10px] text-slate-300">
                    Cap: <strong>{captain1?.name || 'Captain 1'}</strong> • {team1Kit === 'white' ? 'White ⚪' : 'Black ⚫'}
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  {team1.length}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {team1.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-slate-100 py-0.5">
                    <span className="truncate font-semibold">{i + 1}. {p.name} {captain1 && p.id === captain1.id ? '👑' : ''}</span>
                    <span className="text-[10px] text-emerald-300 font-mono font-black">{p.position}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team 2 Box */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-3.5 space-y-2.5 backdrop-blur-sm shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <div>
                  <div className="text-xs font-black text-white truncate">{team2Name}</div>
                  <div className="text-[10px] text-slate-300">
                    Cap: <strong>{captain2?.name || 'Captain 2'}</strong> • {team2Kit === 'white' ? 'White ⚪' : 'Black ⚫'}
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-200 border border-orange-400/30">
                  {team2.length}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {team2.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-slate-100 py-0.5">
                    <span className="truncate font-semibold">{i + 1}. {p.name} {captain2 && p.id === captain2.id ? '👑' : ''}</span>
                    <span className="text-[10px] text-orange-300 font-mono font-black">{p.position}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="text-center pt-2 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            Drafted with SquadDraft PRO ⚽
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* WhatsApp Text Copy */}
          <button
            onClick={handleCopyWhatsApp}
            className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '✅ Copied for WhatsApp!' : '📋 Copy WhatsApp Text'}</span>
          </button>

          {/* Download Card Image */}
          <button
            onClick={handleDownloadPoster}
            disabled={isDownloading}
            className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm border border-slate-700 shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Generating Image...' : '🖼️ Download Matchday Poster'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

