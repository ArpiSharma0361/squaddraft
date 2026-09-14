import fs from 'fs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const DEMO_PLAYERS = [
  { id: 'p_cap1', name: 'Deepak', position: 'MID' },
  { id: 'p_cap2', name: 'Ayaan', position: 'MID' },
  { id: 'p_gk1', name: 'Rahul', position: 'GK' },
  { id: 'p_gk2', name: 'Sameer', position: 'GK' },
  { id: 'p_def1', name: 'Rohan', position: 'DEF' },
  { id: 'p_def2', name: 'Kunal', position: 'DEF' },
  { id: 'p_def3', name: 'Vikram', position: 'DEF' },
  { id: 'p_def4', name: 'Tariq', position: 'DEF' },
  { id: 'p_mid1', name: 'Arpit', position: 'MID' },
  { id: 'p_mid2', name: 'Kabir', position: 'MID' },
  { id: 'p_mid3', name: 'Fahad', position: 'MID' },
  { id: 'p_mid4', name: 'Adil', position: 'MID' },
  { id: 'p_fwd1', name: 'Zayan', position: 'FWD' },
  { id: 'p_fwd2', name: 'Imran', position: 'FWD' },
  { id: 'p_fwd3', name: 'Zaid', position: 'FWD' },
  { id: 'p_fwd4', name: 'Rizwan', position: 'FWD' }
];

function createInitialState(roomId = 'main') {
  return {
    roomId,
    publicUrl: '',
    players: [],
    matchTitle: 'Sunday Turf Derby 8v8',
    captain1: null,
    captain2: null,
    team1Kit: 'white',
    team2Kit: 'black',
    team1Name: 'Team White',
    team2Name: 'Team Black',
    roomStep: 'toss',
    firstPickCaptain: null,
    tossState: {
      mode: 'coin',
      isFlipping: false,
      callerChoice: 'heads',
      coinResult: null,
      cap1Rps: null,
      cap2Rps: null,
      rpsResultText: '',
      winner: null
    },
    draftState: {
      team1: [],
      team2: [],
      availablePlayers: [],
      currentTurn: 1,
      pickNumber: 1,
      draftHistory: [],
      gkAlert: null
    },
    finalTeam1: [],
    finalTeam2: []
  };
}

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'match_state.json');

function loadStateFromFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const loaded = JSON.parse(raw);
            if (!loaded.playerDirectory || loaded.playerDirectory.length === 0) {
        loaded.playerDirectory = (loaded.players && loaded.players.length > 0)
          ? JSON.parse(JSON.stringify(loaded.players))
          : [];
      }
      if (!loaded.matchArchive) {
        loaded.matchArchive = [];
      }
      if (!loaded.matchMetadata) {
        loaded.matchMetadata = {
          name: loaded.matchTitle || 'Sunday Turf Football',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: '07:00 PM',
          venue: 'ABC Football Turf',
          format: '8v8',
          status: 'PLAYERS_SETUP'
        };
      }
      console.log('📦 Loaded match state from disk: ' + (loaded.players?.length || 0) + ' active players, ' + (loaded.playerDirectory?.length || 0) + ' directory players.');
      return loaded;
    }
  } catch (err) {
    console.error('⚠️ Could not load saved state, using default:', err);
  }
  return createInitialState('main');
}

function saveStateToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(roomState, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ Could not persist match state:', err);
  }
}

let roomState = loadStateFromFile();

function broadcastState() {
  saveStateToFile();
  io.emit('room_state_updated', roomState);
}


io.on('connection', (socket) => {
  socket.emit('room_state_updated', roomState);

  socket.on('join_room', () => {
    socket.emit('room_state_updated', roomState);
  });

  socket.on('set_public_url', (url) => {
    roomState.publicUrl = url;
    broadcastState();
  });

  socket.on('player_register', (newPlayer) => {
    if (!roomState.players.some(p => p.name.toLowerCase() === newPlayer.name.toLowerCase())) {
      roomState.players.push(newPlayer);
      broadcastState();
    }
  });

  socket.on('admin_bulk_import', (parsedPlayers) => {
    roomState.players = parsedPlayers;
    broadcastState();
  });

  socket.on('admin_load_demo_players', () => {
    const demo = JSON.parse(JSON.stringify(DEMO_PLAYERS));
    roomState.players = demo;
    roomState.captain1 = demo[0]; // Deepak
    roomState.captain2 = demo[1]; // Ayaan
    broadcastState();
  });

  socket.on('admin_clear_roster', () => {
    roomState.players = [];
    roomState.captain1 = null;
    roomState.captain2 = null;
    broadcastState();
  });

  socket.on('update_player_position', ({ playerId, newPosition }) => {
    roomState.players = roomState.players.map(p =>
      p.id === playerId ? { ...p, position: newPosition } : p
    );
    if (roomState.captain1 && roomState.captain1.id === playerId) {
      roomState.captain1.position = newPosition;
    }
    if (roomState.captain2 && roomState.captain2.id === playerId) {
      roomState.captain2.position = newPosition;
    }
    broadcastState();
  });

  socket.on('update_player_name', ({ playerId, newName }) => {
    roomState.players = roomState.players.map(p =>
      p.id === playerId ? { ...p, name: newName } : p
    );
    if (roomState.captain1 && roomState.captain1.id === playerId) {
      roomState.captain1.name = newName;
    }
    if (roomState.captain2 && roomState.captain2.id === playerId) {
      roomState.captain2.name = newName;
    }
    broadcastState();
  });

  socket.on('delete_player', (playerId) => {
    roomState.players = roomState.players.filter(p => p.id !== playerId);
    if (roomState.captain1 && roomState.captain1.id === playerId) roomState.captain1 = null;
    if (roomState.captain2 && roomState.captain2.id === playerId) roomState.captain2 = null;
    broadcastState();
  });

  socket.on('set_match_config', (config) => {
    if (config.matchTitle !== undefined) roomState.matchTitle = config.matchTitle;
    if (config.captain1 !== undefined) roomState.captain1 = config.captain1;
    if (config.captain2 !== undefined) roomState.captain2 = config.captain2;
    if (config.team1Kit !== undefined) roomState.team1Kit = config.team1Kit;
    if (config.team2Kit !== undefined) roomState.team2Kit = config.team2Kit;
    if (config.team1Name !== undefined) roomState.team1Name = config.team1Name;
    if (config.team2Name !== undefined) roomState.team2Name = config.team2Name;
    if (config.publicUrl !== undefined) roomState.publicUrl = config.publicUrl;
    broadcastState();
  });

  socket.on('set_room_step', (step) => {
    roomState.roomStep = step;
    broadcastState();
  });

  socket.on('toss_start_flip', () => {
    roomState.tossState.isFlipping = true;
    roomState.tossState.coinResult = null;
    io.emit('toss_flipping_started', { callerChoice: roomState.tossState.callerChoice });
  });

  socket.on('toss_set_caller_choice', (choice) => {
    roomState.tossState.callerChoice = choice;
    broadcastState();
  });

  socket.on('toss_set_mode', (mode) => {
    roomState.tossState.mode = mode;
    broadcastState();
  });

  socket.on('toss_finish_flip', ({ outcome, winner }) => {
    roomState.tossState.isFlipping = false;
    roomState.tossState.coinResult = outcome;
    roomState.tossState.winner = winner;
    roomState.firstPickCaptain = winner;
    broadcastState();
  });

  socket.on('toss_rps_play', ({ cap1Choice, cap2Choice, resultText, winner }) => {
    roomState.tossState.cap1Rps = cap1Choice;
    roomState.tossState.cap2Rps = cap2Choice;
    roomState.tossState.rpsResultText = resultText;
    if (winner) {
      roomState.tossState.winner = winner;
      roomState.firstPickCaptain = winner;
    }
    broadcastState();
  });

  socket.on('start_draft', () => {
    const c1 = roomState.captain1;
    const c2 = roomState.captain2;
    const initialTurn = (roomState.firstPickCaptain && roomState.firstPickCaptain.id === c1.id) ? 1 : 2;
    const available = roomState.players.filter(p => p.id !== c1.id && p.id !== c2.id);

    roomState.draftState = {
      team1: [c1],
      team2: [c2],
      availablePlayers: available,
      currentTurn: initialTurn,
      pickNumber: 1,
      draftHistory: [],
      gkAlert: null
    };
    roomState.roomStep = 'draft';
    broadcastState();
  });

  // Draft Pick Player with Smart GK Balancing & Turn Retention for Toss Winner
  socket.on('draft_pick_player', ({ player, pickedByTurn }) => {
    const ds = roomState.draftState;
    if (!ds.availablePlayers.some(p => p.id === player.id)) return;

    // Save history for Undo/Unpick
    ds.draftHistory.push({
      team1: [...ds.team1],
      team2: [...ds.team2],
      availablePlayers: [...ds.availablePlayers],
      currentTurn: ds.currentTurn,
      pickNumber: ds.pickNumber
    });

    const isGK = player.position === 'GK';
    const totalMatchGKs = roomState.players.filter(p => p.position === 'GK').length;
    const remainingGKs = ds.availablePlayers.filter(p => p.position === 'GK' && p.id !== player.id);

    let autoAssignedGk = null;
    let isGkBalanced = false;
    if (totalMatchGKs === 2 && isGK && remainingGKs.length === 1) {
      autoAssignedGk = remainingGKs[0];
      isGkBalanced = true;
    }

    let newTeam1 = [...ds.team1];
    let newTeam2 = [...ds.team2];
    let newPool = ds.availablePlayers.filter(p => p.id !== player.id);

    if (pickedByTurn === 1) {
      newTeam1.push(player);
      if (autoAssignedGk) {
        newTeam2.push(autoAssignedGk);
        newPool = newPool.filter(p => p.id !== autoAssignedGk.id);
        ds.gkAlert = {
          pickedPlayer: player,
          autoGk: autoAssignedGk,
          pickedBy: roomState.captain1.name,
          receivedBy: roomState.captain2.name
        };
      }
    } else {
      newTeam2.push(player);
      if (autoAssignedGk) {
        newTeam1.push(autoAssignedGk);
        newPool = newPool.filter(p => p.id !== autoAssignedGk.id);
        ds.gkAlert = {
          pickedPlayer: player,
          autoGk: autoAssignedGk,
          pickedBy: roomState.captain2.name,
          receivedBy: roomState.captain1.name
        };
      }
    }

    ds.team1 = newTeam1;
    ds.team2 = newTeam2;
    ds.availablePlayers = newPool;
    ds.pickNumber += 1;

    // Special Rule: If 2 GKs were in pool and toss winner picked GK #1 (auto-sending GK #2 to opponent),
    // the turn REMAINS with the toss winner so they can now make their first squad pick!
    if (isGkBalanced) {
      ds.currentTurn = pickedByTurn;
    } else {
      ds.currentTurn = pickedByTurn === 1 ? 2 : 1;
    }

    if (newPool.length === 0) {
      roomState.finalTeam1 = newTeam1;
      roomState.finalTeam2 = newTeam2;
      roomState.roomStep = 'pitch';
    }

    broadcastState();
  });

  // Undo / Unpick action (usable by both captains and admin)
  socket.on('draft_undo', () => {
    const ds = roomState.draftState;
    if (ds.draftHistory.length === 0) return;
    const last = ds.draftHistory.pop();
    ds.team1 = last.team1;
    ds.team2 = last.team2;
    ds.availablePlayers = last.availablePlayers;
    ds.currentTurn = last.currentTurn;
    ds.pickNumber = last.pickNumber;
    ds.gkAlert = null;
    broadcastState();
  });

  socket.on('dismiss_gk_alert', () => {
    if (roomState.draftState) {
      roomState.draftState.gkAlert = null;
      broadcastState();
    }
  });

  
  // --- Permanent Player Directory Events ---
  socket.on('directory_add_player', (player) => {
    if (!roomState.playerDirectory) roomState.playerDirectory = [];
    if (!roomState.playerDirectory.some(p => p.name.toLowerCase() === player.name.toLowerCase())) {
      roomState.playerDirectory.push({
        id: player.id || ('dir_' + Date.now()),
        name: player.name.trim(),
        position: player.position || 'MID',
        secondaryPosition: player.secondaryPosition || '',
        active: true
      });
      broadcastState();
    }
  });

  socket.on('directory_bulk_add', (playersList) => {
    if (!roomState.playerDirectory) roomState.playerDirectory = [];
    playersList.forEach(p => {
      if (p.name && !roomState.playerDirectory.some(x => x.name.toLowerCase() === p.name.trim().toLowerCase())) {
        roomState.playerDirectory.push({
          id: 'dir_' + Date.now() + Math.random().toString(36).substring(2, 5),
          name: p.name.trim(),
          position: p.position || 'MID',
          secondaryPosition: p.secondaryPosition || '',
          active: true
        });
      }
    });
    broadcastState();
  });

  socket.on('directory_remove_player', (playerId) => {
    if (!roomState.playerDirectory) return;
    roomState.playerDirectory = roomState.playerDirectory.filter(p => p.id !== playerId);
    broadcastState();
  });

  socket.on('directory_select_for_match', (selectedPlayerIds) => {
    if (!roomState.playerDirectory) return;
    const selected = roomState.playerDirectory.filter(p => selectedPlayerIds.includes(p.id));
    roomState.players = selected.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position
    }));
    roomState.captain1 = null;
    roomState.captain2 = null;
    broadcastState();
  });

  // --- Match Lifecycle & Archive Events ---
  socket.on('set_match_metadata', (metadata) => {
    roomState.matchMetadata = { ...roomState.matchMetadata, ...metadata };
    if (metadata.name) roomState.matchTitle = metadata.name;
    broadcastState();
  });

  socket.on('archive_current_match', () => {
    if (!roomState.matchArchive) roomState.matchArchive = [];
    const archivedMatch = {
      id: 'arch_' + Date.now(),
      name: roomState.matchMetadata?.name || roomState.matchTitle || 'Sunday Match',
      date: roomState.matchMetadata?.date || new Date().toLocaleDateString('en-GB'),
      venue: roomState.matchMetadata?.venue || 'Football Turf',
      format: roomState.matchMetadata?.format || '8v8',
      captain1: roomState.captain1,
      captain2: roomState.captain2,
      team1Name: roomState.team1Name,
      team2Name: roomState.team2Name,
      team1Kit: roomState.team1Kit,
      team2Kit: roomState.team2Kit,
      finalTeam1: roomState.finalTeam1.length > 0 ? roomState.finalTeam1 : (roomState.draftState?.team1 || []),
      finalTeam2: roomState.finalTeam2.length > 0 ? roomState.finalTeam2 : (roomState.draftState?.team2 || []),
      coinWinner: roomState.tossState?.winner,
      draftHistory: roomState.draftState?.draftHistory || [],
      archivedAt: new Date().toISOString()
    };
    roomState.matchArchive.unshift(archivedMatch);

    // Reset match state for next week while keeping directory and archive intact
    const directory = roomState.playerDirectory || [];
    const archive = roomState.matchArchive || [];
    const pubUrl = roomState.publicUrl;

    roomState = createInitialState('main');
    roomState.playerDirectory = directory;
    roomState.matchArchive = archive;
    roomState.publicUrl = pubUrl;
    roomState.matchMetadata = {
      name: 'Sunday Turf Match',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: '07:00 PM',
      venue: 'ABC Football Turf',
      format: '8v8',
      status: 'PLAYERS_SETUP'
    };
    broadcastState();
  });

  socket.on('reset_match', () => {
    const prevUrl = roomState.publicUrl;
    roomState = createInitialState('main');
    roomState.publicUrl = prevUrl;
    broadcastState();
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    application: 'SquadDraft PRO',
    backend: 'OK',
    database: 'OK',
    realtime: 'OK',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    playersCount: roomState.players ? roomState.players.length : 0,
    roomStep: roomState.roomStep,
    matchTitle: roomState.matchTitle
  });
});

app.get('/api/state', (req, res) => {
  res.json(roomState);
});

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('? SquadDraft PRO Real-Time Server running on port ' + PORT);
  startTunnel();
});

let tunnelProcess = null;

function startTunnel() {
  const cloudUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || (process.env.RENDER ? ('https://' + (process.env.RENDER_SERVICE_NAME || 'squaddraft') + '.onrender.com') : null);
  if (cloudUrl) {
    roomState.publicUrl = cloudUrl.replace(/\/+$/, '');
    try { fs.writeFileSync(path.join(__dirname, 'public_tunnel_url.txt'), roomState.publicUrl, 'utf8'); } catch(e){}
    console.log('\n======================================================');
    console.log('🚀 RUNNING IN CLOUD PRODUCTION ENVIRONMENT:');
    console.log(roomState.publicUrl);
    console.log('======================================================\n');
    broadcastState();
    return;
  }


  if (tunnelProcess) {
    try { tunnelProcess.kill(); } catch (e) {}
  }

  console.log('🔄 Initializing high-reliability tunnel connection...');
  try {
    // OpenSSH with localhost.run: fast, reliable, no Cloudflare timeout issues
    tunnelProcess = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3',
      '-R', '80:127.0.0.1:' + PORT,
      'nokey@localhost.run'
    ], { shell: true });

    const handleData = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.lhr\.life/);
      if (match && match[0] !== roomState.publicUrl) {
        roomState.publicUrl = match[0];
        try { fs.writeFileSync(path.join(__dirname, 'public_tunnel_url.txt'), roomState.publicUrl, 'utf8'); } catch(e){}
        console.log('\n======================================================');
        console.log('🚀 PUBLIC SHAREABLE WHATSAPP LINK IS ACTIVE:');
        console.log(roomState.publicUrl);
        console.log('======================================================\n');
        broadcastState();
      }
    };

    tunnelProcess.stdout?.on('data', handleData);
    tunnelProcess.stderr?.on('data', handleData);

    tunnelProcess.on('close', (code) => {
      console.log(`⚠️ Tunnel process closed (code ${code}). Auto-reconnecting in 3s...`);
      setTimeout(() => {
        startTunnel();
      }, 3000);
    });

    tunnelProcess.on('error', (err) => {
      console.error('⚠️ Tunnel process error:', err);
    });
  } catch (err) {
    console.error('Tunnel spawn error:', err);
    setTimeout(startTunnel, 5000);
  }
}
