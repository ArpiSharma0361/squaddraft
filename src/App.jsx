import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PlayerPortal from './components/PlayerPortal';
import AdminDashboard from './components/AdminDashboard';
import TossArena from './components/TossArena';
import DraftRoom from './components/DraftRoom';
import SpectatorBroadcast from './components/SpectatorBroadcast';
import PitchVisualizer from './components/PitchVisualizer';
import MatchSummaryModal from './components/MatchSummaryModal';
import MatchHistoryPublic from './components/MatchHistoryPublic';
import { socket } from './utils/socket';
import { sfx } from './utils/soundEffects';

export default function App() {
  const [activeView, setActiveView] = useState('register');
  const [isAdminLoggedIn, setIsAdminLoggedInState] = useState(() => {
    try {
      return localStorage.getItem('squaddraft_admin_logged_in') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [adminToken, setAdminTokenState] = useState(() => {
    try {
      return localStorage.getItem('squaddraft_admin_token') || null;
    } catch (e) {
      return null;
    }
  });

  const setIsAdminLoggedIn = (val, token = null) => {
    setIsAdminLoggedInState(val);
    try {
      if (val && token) {
        setAdminTokenState(token);
        localStorage.setItem('squaddraft_admin_token', token);
        localStorage.setItem('squaddraft_admin_logged_in', 'true');
      } else if (!val) {
        setAdminTokenState(null);
        localStorage.removeItem('squaddraft_admin_token');
        localStorage.removeItem('squaddraft_admin_logged_in');
      }
    } catch (e) {}
  };

  const [isSoundOn, setIsSoundOn] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const [players, setPlayers] = useState([]);
  const [matchTitle, setMatchTitle] = useState('Sunday Football Turf War');
  const [publicUrl, setPublicUrl] = useState('');
  const [captain1, setCaptain1] = useState(null);
  const [captain2, setCaptain2] = useState(null);
  const [cap1Token, setCap1Token] = useState(null);
  const [cap2Token, setCap2Token] = useState(null);
  const [captainToken, setCaptainToken] = useState(null);
  const [team1Kit, setTeam1Kit] = useState('white');
  const [team2Kit, setTeam2Kit] = useState('black');
  const [team1Name, setTeam1Name] = useState('Team White');
  const [team2Name, setTeam2Name] = useState('Team Black');
  const [firstPickCaptain, setFirstPickCaptain] = useState(null);
  const [matchScore, setMatchScore] = useState(null);

  const [roomStep, setRoomStep] = useState('toss');
  const [finalTeam1, setFinalTeam1] = useState([]);
  const [finalTeam2, setFinalTeam2] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [tossState, setTossState] = useState({
    isFlipping: false,
    callerChoice: 'heads',
    coinResult: null,
    winner: null
  });

  const [draftState, setDraftState] = useState({
    team1: [],
    team2: [],
    availablePlayers: [],
    currentTurn: 1,
    pickNumber: 1,
    draftHistory: [],
    gkAlert: null,
    turnStartedAt: null,
    turnEndsAt: null,
    isPaused: false,
    pausedRemainingMs: 90000
  });

  const [roomRole, setRoomRole] = useState('spectator');
  const effectiveRole = (roomRole === 'cap1' || roomRole === 'cap2')
    ? roomRole
    : (roomRole === 'spectator' ? 'spectator' : (isAdminLoggedIn || roomRole === 'admin' ? 'admin' : 'spectator'));
  const [playerDirectory, setPlayerDirectory] = useState([]);
  const [matchArchive, setMatchArchive] = useState([]);
  const [matchMetadata, setMatchMetadata] = useState({
    name: 'Sunday Turf Football',
    date: new Date().toLocaleDateString('en-GB'),
    time: '07:00 PM',
    venue: 'ABC Football Turf',
    format: '8v8',
    status: 'PLAYERS_SETUP'
  });

  useEffect(() => {
    function parseRoute() {
      const path = (window.location.pathname || '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const viewParam = params.get('view');
      const tokenParam = params.get('token');

      if (tokenParam) {
        setCaptainToken(tokenParam);
        try {
          sessionStorage.setItem('squaddraft_captain_token', tokenParam);
        } catch (e) {}
      } else {
        try {
          const savedToken = sessionStorage.getItem('squaddraft_captain_token');
          if (savedToken) setCaptainToken(savedToken);
        } catch (e) {}
      }

      let r = (roleParam || '').toLowerCase().trim();
      let v = (viewParam || '').toLowerCase().trim();

      // Clean pathname routing
      if (path.includes('/history')) v = 'history';
      else if (path.includes('/captain/1') || path === '/cap1') r = 'cap1';
      else if (path.includes('/captain/2') || path === '/cap2') r = 'cap2';
      else if (path.includes('/spectator')) r = 'spectator';
      else if (path.includes('/admin')) v = 'admin';
      else if (path.includes('/register')) v = 'register';

      // Query parameter support
      if (r.includes('cap1')) r = 'cap1';
      else if (r.includes('cap2')) r = 'cap2';
      else if (r.includes('spectator')) r = 'spectator';
      else if (r.includes('admin')) r = 'admin';

      if (v.includes('history')) v = 'history';
      else if (v.includes('admin')) v = 'admin';
      else if (v.includes('register')) v = 'register';

      if (v === 'history') {
        setActiveView('history');
      } else if (r === 'cap1' || r === 'cap2' || r === 'spectator' || r === 'admin') {
        setRoomRole(r);
        setActiveView('room');
      } else if (v === 'admin') {
        setActiveView('admin');
      } else if (v === 'register') {
        setActiveView('register');
      }
    }

    parseRoute();
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      socket.emit('join_room');
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onStateUpdated(state) {
      if (!state) return;
      if (state.players !== undefined) setPlayers(state.players);
      if (state.playerDirectory !== undefined) setPlayerDirectory(state.playerDirectory);
      if (state.matchArchive !== undefined) setMatchArchive(state.matchArchive);
      if (state.matchMetadata !== undefined) setMatchMetadata(state.matchMetadata);
      if (state.matchTitle !== undefined) setMatchTitle(state.matchTitle);
      if (state.publicUrl !== undefined) setPublicUrl(state.publicUrl);
      if (state.captain1 !== undefined) setCaptain1(state.captain1);
      if (state.captain2 !== undefined) setCaptain2(state.captain2);
      if (state.cap1Token !== undefined) setCap1Token(state.cap1Token);
      if (state.cap2Token !== undefined) setCap2Token(state.cap2Token);
      if (state.matchScore !== undefined) setMatchScore(state.matchScore);
      if (state.team1Kit !== undefined) setTeam1Kit(state.team1Kit);
      if (state.team2Kit !== undefined) setTeam2Kit(state.team2Kit);
      if (state.team1Name !== undefined) setTeam1Name(state.team1Name);
      if (state.team2Name !== undefined) setTeam2Name(state.team2Name);
      if (state.roomStep !== undefined) setRoomStep(state.roomStep);
      if (state.firstPickCaptain !== undefined) setFirstPickCaptain(state.firstPickCaptain);
      if (state.tossState !== undefined) setTossState(state.tossState);
      if (state.draftState !== undefined) setDraftState(state.draftState);
      if (state.finalTeam1 !== undefined) setFinalTeam1(state.finalTeam1);
      if (state.finalTeam2 !== undefined) setFinalTeam2(state.finalTeam2);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_state_updated', onStateUpdated);

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join_room');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_state_updated', onStateUpdated);
    };
  }, []);

  const handleReset = (confirm = true) => {
    if (confirm && !window.confirm('Reset all match data and start clean on all devices?')) {
      return;
    }
    socket.emit('reset_match', { adminToken });
    setActiveView('register');
    sfx.playPick();
  };

  const handleDraftComplete = (t1, t2) => {
    setFinalTeam1(t1);
    setFinalTeam2(t2);
    setRoomStep('pitch');
    setIsExportModalOpen(true);
  };

  const activeCaptainToken = captainToken || (effectiveRole === 'cap1' ? cap1Token : effectiveRole === 'cap2' ? cap2Token : null);

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
    activeView === 'register'
      ? 'bg-[#F8F7F2] text-[#0B2341] light-stadium-theme selection:bg-[#07883F] selection:text-white'
      : 'bg-[#040814] text-slate-100 selection:bg-emerald-400 selection:text-slate-950'
  }`}>
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        isAdminLoggedIn={isAdminLoggedIn}
        setIsAdminLoggedIn={setIsAdminLoggedIn}
        isSoundOn={isSoundOn}
        setIsSoundOn={setIsSoundOn}
        onReset={handleReset}
        roomStep={roomStep}
        isConnected={isConnected}
        myRole={effectiveRole}
        captain1={captain1}
        captain2={captain2}
        team1Kit={team1Kit}
        team2Kit={team2Kit}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'history' && (
          <MatchHistoryPublic
            onGoToMatch={() => setActiveView(isAdminLoggedIn ? 'admin' : 'register')}
          />
        )}

        {activeView === 'register' && (
          <PlayerPortal
            players={players}
            matchTitle={matchTitle}
            onGoToAdmin={() => {
              setActiveView('admin');
              sfx.playPick();
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            players={players}
            captain1={captain1}
            captain2={captain2}
            cap1Token={cap1Token}
            cap2Token={cap2Token}
            team1Kit={team1Kit}
            team2Kit={team2Kit}
            team1Name={team1Name}
            team2Name={team2Name}
            matchTitle={matchTitle}
            publicUrl={publicUrl}
            matchScore={matchScore}
            isAdminLoggedIn={isAdminLoggedIn}
            adminToken={adminToken}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
            playerDirectory={playerDirectory}
            matchArchive={matchArchive}
            roomStep={roomStep}
            draftState={draftState}
            finalTeam1={finalTeam1}
            finalTeam2={finalTeam2}
            tossState={tossState}
            onLaunchRoom={() => {
              socket.emit('set_room_step', { step: 'toss', adminToken });
              setRoomRole('admin');
              setActiveView('room');
              sfx.playWhistle();
            }}
          />
        )}

        {activeView === 'room' && (
          <div className="space-y-6">
            {/* Top Role Identification Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-3xl shadow-sm">
              <div className="flex items-center space-x-2">
                {/* When viewed as Captain 1 */}
                {effectiveRole === 'cap1' && (
                  <div className="flex items-center space-x-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border-2 border-emerald-300 font-black text-xs shadow-sm flex items-center space-x-1.5">
                      <span>👑 You are Captain 1:</span>
                      <strong className="text-emerald-950 font-extrabold">{captain1 ? captain1.name : 'Captain 1'}</strong>
                      <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                        {team1Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}
                      </span>
                    </span>
                  </div>
                )}

                {/* When viewed as Captain 2 */}
                {effectiveRole === 'cap2' && (
                  <div className="flex items-center space-x-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-orange-50 text-orange-900 border-2 border-orange-300 font-black text-xs shadow-sm flex items-center space-x-1.5">
                      <span>👑 You are Captain 2:</span>
                      <strong className="text-orange-950 font-extrabold">{captain2 ? captain2.name : 'Captain 2'}</strong>
                      <span className="text-[10px] bg-orange-200/80 text-orange-900 px-1.5 py-0.5 rounded font-bold">
                        {team2Kit === 'white' ? 'White Kit ⚪' : 'Black Kit ⚫'}
                      </span>
                    </span>
                  </div>
                )}

                {/* When viewed as Spectator */}
                {effectiveRole === 'spectator' && (
                  <div className="flex items-center space-x-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-900 border-2 border-purple-200 font-black text-xs shadow-sm flex items-center space-x-1.5">
                      <span>👀 Live Match Broadcast (Spectator View-Only)</span>
                    </span>
                  </div>
                )}

                {/* When viewed as Master Admin */}
                {effectiveRole === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white border border-slate-800 font-black text-xs shadow-sm flex items-center space-x-1.5">
                      <span>👑 Match Controller (Admin Spectator Mode)</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs font-black text-slate-600 pr-2">
                {roomStep === 'toss' && '🪙 Step 1: Match Coin Toss'}
                {roomStep === 'draft' && '⚽ Step 2: Live Turn-Based Draft'}
                {roomStep === 'pitch' && '🏟️ Step 3: Match Tactical Lineup'}
              </div>
            </div>
            {(!captain1 || !captain2) ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <p className="text-sm text-slate-700 font-bold">
                  Captains have not been designated yet. Please visit Match Setup in the Admin Panel to assign captains!
                </p>
                <button
                  onClick={() => setActiveView('admin')}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Go to Match Setup 🔒
                </button>
              </div>
            ) : (
              <>
                {roomStep === 'toss' && (
                  <TossArena
                    captain1={captain1}
                    captain2={captain2}
                    team1Name={team1Name}
                    team2Name={team2Name}
                    team1Kit={team1Kit}
                    team2Kit={team2Kit}
                    firstPickCaptain={firstPickCaptain}
                    tossState={tossState}
                    myRole={effectiveRole}
                    captainToken={activeCaptainToken}
                    onProceed={() => {
                      socket.emit('start_draft');
                      sfx.playWhistle();
                    }}
                    onBack={() => setActiveView('admin')}
                  />
                )}

                {roomStep === 'draft' && (
                  roomRole === 'spectator' ? (
                    <SpectatorBroadcast
                      allPlayers={players}
                      captain1={captain1}
                      captain2={captain2}
                      team1Kit={team1Kit}
                      team2Kit={team2Kit}
                      team1Name={team1Name}
                      team2Name={team2Name}
                      draftState={draftState}
                      onOpenExportModal={() => setIsExportModalOpen(true)}
                    />
                  ) : (
                    <DraftRoom
                      allPlayers={players}
                      captain1={captain1}
                      captain2={captain2}
                      team1Kit={team1Kit}
                      team2Kit={team2Kit}
                      team1Name={team1Name}
                      team2Name={team2Name}
                      firstPickCaptain={firstPickCaptain || captain1}
                      draftState={draftState}
                      myRole={effectiveRole}
                      captainToken={activeCaptainToken}
                      adminToken={adminToken}
                      onDraftComplete={handleDraftComplete}
                      isSpectator={false}
                    />
                  )
                )}

                {roomStep === 'pitch' && (
                  <PitchVisualizer
                    team1={finalTeam1.length ? finalTeam1 : draftState.team1}
                    team2={finalTeam2.length ? finalTeam2 : draftState.team2}
                    captain1={captain1}
                    captain2={captain2}
                    team1Kit={team1Kit}
                    team2Kit={team2Kit}
                    team1Name={team1Name}
                    team2Name={team2Name}
                    onOpenExportModal={() => setIsExportModalOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>

      <MatchSummaryModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        team1={finalTeam1.length ? finalTeam1 : draftState.team1}
        team2={finalTeam2.length ? finalTeam2 : draftState.team2}
        captain1={captain1}
        captain2={captain2}
        team1Kit={team1Kit}
        team2Kit={team2Kit}
        team1Name={team1Name}
        team2Name={team2Name}
      />

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>SquadDraft PRO • Real-Time Matchmaking for Sports WhatsApp Communities</p>
      </footer>
    </div>
  );
}
