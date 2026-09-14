import fs from 'fs';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import {
  initDatabase,
  getDatabaseStatus,
  generateSecureToken,
  dbGetAllPlayers,
  dbUpsertPlayer,
  dbDeletePlayer,
  dbSetCaptainToken,
  dbGetCaptainByToken,
  dbGetCaptains,
  dbRevokeCaptainTokens,
  dbCreateAdminSession,
  dbValidateAdminSession,
  dbSaveMatchScore,
  dbGetMatchScore,
  dbArchiveMatch,
  dbGetPublicHistory
} from './db.js';

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
    cap1Token: generateSecureToken(),
    cap2Token: generateSecureToken(),
    team1Kit: 'white',
    team2Kit: 'black',
    team1Name: 'Team White',
    team2Name: 'Team Black',
    roomStep: 'toss',
    firstPickCaptain: null,
    matchScore: null,
    tossState: {
      isFlipping: false,
      callerChoice: 'heads',
      coinResult: null,
      winner: null
    },
    draftState: {
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
    },
    finalTeam1: [],
    finalTeam2: []
  };
}

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'match_state.json');

// SAFEGUARD 2 & 3: Load initial state from JSON if available for migration, but database is the single live source of truth.
function loadInitialStateFromBackup() {
  try {
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
      if (!loaded.roomId) loaded.roomId = 'main';
      if (!loaded.cap1Token) loaded.cap1Token = generateSecureToken();
      if (!loaded.cap2Token) loaded.cap2Token = generateSecureToken();
      return loaded;
    }
  } catch (err) {
    console.error('⚠️ Could not load initial state from backup file:', err);
  }
  return createInitialState('main');
}

let roomState = loadInitialStateFromBackup();
if (!roomState.roomId) roomState.roomId = 'main';

// SAFEGUARD 3: Live persistence writes to database. JSON file is NOT modified during live operation.
function broadcastState() {
  io.emit('room_state_updated', roomState);
}

// SAFEGUARD 6 & 7: Resolve Captain Role securely from token without logging secret values
async function resolveCaptainRole(token) {
  if (!token) return null;
  if (token === roomState.cap1Token) return 'cap1';
  if (token === roomState.cap2Token) return 'cap2';
  try {
    const dbCap = await dbGetCaptainByToken(roomState.roomId || 'main', token);
    if (dbCap) {
      return dbCap.captain_number === 1 ? 'cap1' : 'cap2';
    }
  } catch (err) {
    console.error('Error resolving captain role:', err);
  }
  return null;
}

// --- Draft Pick Execution with Strict Constraints ---
function executePlayerPick(player, verifiedRole) {
  if (verifiedRole === 'admin') {
    return { success: false, status: 403, message: 'Admins cannot draft players. Draft Room is in Match Controller & Spectator mode.' };
  }
  if (verifiedRole === 'spectator') {
    return { success: false, status: 403, message: 'Spectators cannot draft players.' };
  }
  if (verifiedRole !== 'cap1' && verifiedRole !== 'cap2') {
    return { success: false, status: 403, message: 'Invalid or missing captain access token. Authorization denied.' };
  }
  if (roomState.roomStep !== 'draft') {
    return { success: false, status: 400, message: 'Draft is not active.' };
  }

  const ds = roomState.draftState;
  if (!ds) {
    return { success: false, status: 400, message: 'Draft state not initialized.' };
  }

  if (ds.isPaused) {
    return { success: false, status: 400, message: 'Draft is currently paused by Match Controller.' };
  }

  const expectedRole = ds.currentTurn === 1 ? 'cap1' : 'cap2';
  if (verifiedRole !== expectedRole) {
    return { success: false, status: 400, message: 'It is Captain ' + ds.currentTurn + "'s turn to pick." };
  }

  const availablePlayer = ds.availablePlayers.find(p => p.id === player.id);
  if (!availablePlayer) {
    return { success: false, status: 400, message: 'Selected player is not available.' };
  }

  const pickedByTurn = ds.currentTurn;

  // Save history for Undo
  ds.draftHistory.push({
    team1: [...ds.team1],
    team2: [...ds.team2],
    availablePlayers: [...ds.availablePlayers],
    currentTurn: ds.currentTurn,
    pickNumber: ds.pickNumber,
    turnStartedAt: ds.turnStartedAt,
    turnEndsAt: ds.turnEndsAt
  });

  const isGK = availablePlayer.position === 'GK';
  const totalMatchGKs = roomState.players.filter(p => p.position === 'GK').length;
  const remainingGKs = ds.availablePlayers.filter(p => p.position === 'GK' && p.id !== availablePlayer.id);

  let autoAssignedGk = null;
  let isGkBalanced = false;
  if (totalMatchGKs === 2 && isGK && remainingGKs.length === 1) {
    autoAssignedGk = remainingGKs[0];
    isGkBalanced = true;
  }

  let newTeam1 = [...ds.team1];
  let newTeam2 = [...ds.team2];
  let newPool = ds.availablePlayers.filter(p => p.id !== availablePlayer.id);

  if (pickedByTurn === 1) {
    newTeam1.push(availablePlayer);
    if (autoAssignedGk) {
      newTeam2.push(autoAssignedGk);
      newPool = newPool.filter(p => p.id !== autoAssignedGk.id);
      ds.gkAlert = {
        pickedPlayer: availablePlayer,
        autoGk: autoAssignedGk,
        pickedBy: roomState.captain1 ? roomState.captain1.name : 'Captain 1',
        receivedBy: roomState.captain2 ? roomState.captain2.name : 'Captain 2'
      };
    }
  } else {
    newTeam2.push(availablePlayer);
    if (autoAssignedGk) {
      newTeam1.push(autoAssignedGk);
      newPool = newPool.filter(p => p.id !== autoAssignedGk.id);
      ds.gkAlert = {
        pickedPlayer: availablePlayer,
        autoGk: autoAssignedGk,
        pickedBy: roomState.captain2 ? roomState.captain2.name : 'Captain 2',
        receivedBy: roomState.captain1 ? roomState.captain1.name : 'Captain 1'
      };
    }
  }

  ds.team1 = newTeam1;
  ds.team2 = newTeam2;
  ds.availablePlayers = newPool;
  ds.pickNumber += 1;

  if (isGkBalanced) {
    ds.currentTurn = pickedByTurn;
  } else {
    ds.currentTurn = pickedByTurn === 1 ? 2 : 1;
  }

  // SAFEGUARD 12: Server-Authoritative Turn Timer (90 seconds)
  const now = Date.now();
  ds.turnStartedAt = now;
  ds.turnEndsAt = now + 90000;
  ds.isPaused = false;
  ds.pausedRemainingMs = 90000;

  if (newPool.length === 0) {
    roomState.finalTeam1 = newTeam1;
    roomState.finalTeam2 = newTeam2;
    roomState.roomStep = 'pitch';
  }

  broadcastState();
  return { success: true, player: availablePlayer, currentTurn: ds.currentTurn, turnEndsAt: ds.turnEndsAt };
}

// --- WebSocket Event Handlers ---
io.on('connection', (socket) => {
  socket.emit('room_state_updated', roomState);

  socket.on('join_room', () => {
    socket.emit('room_state_updated', roomState);
  });

  socket.on('set_public_url', (url) => {
    roomState.publicUrl = url;
    broadcastState();
  });

  // Public Player Registration (Players registering themselves on match portal)
  socket.on('player_register', async (newPlayer) => {
    if (!roomState.players.some(p => p.name.toLowerCase() === newPlayer.name.toLowerCase())) {
      roomState.players.push(newPlayer);
      await dbUpsertPlayer(newPlayer).catch(() => {});
      broadcastState();
    }
  });

  // --- Admin Authenticated Actions ---
  socket.on('admin_bulk_import', async ({ parsedPlayers, adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization failed. Invalid session.');
      return;
    }
    roomState.players = parsedPlayers;
    for (const p of parsedPlayers) {
      await dbUpsertPlayer(p).catch(() => {});
    }
    broadcastState();
  });

  socket.on('admin_load_demo_players', async ({ adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization failed. Invalid session.');
      return;
    }
    const demo = JSON.parse(JSON.stringify(DEMO_PLAYERS));
    roomState.players = demo;
    roomState.captain1 = demo[0]; // Deepak
    roomState.captain2 = demo[1]; // Ayaan
    roomState.cap1Token = generateSecureToken();
    roomState.cap2Token = generateSecureToken();
    await dbSetCaptainToken(roomState.roomId, 1, roomState.captain1.id, roomState.team1Kit, roomState.cap1Token).catch(() => {});
    await dbSetCaptainToken(roomState.roomId, 2, roomState.captain2.id, roomState.team2Kit, roomState.cap2Token).catch(() => {});
    for (const p of demo) {
      await dbUpsertPlayer(p).catch(() => {});
    }
    broadcastState();
  });

  socket.on('admin_clear_roster', async ({ adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization failed. Invalid session.');
      return;
    }
    roomState.players = [];
    roomState.captain1 = null;
    roomState.captain2 = null;
    await dbRevokeCaptainTokens(roomState.roomId).catch(() => {});
    broadcastState();
  });

  socket.on('update_player_position', async ({ playerId, newPosition, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to edit positions.');
      return;
    }
    roomState.players = roomState.players.map(p =>
      p.id === playerId ? { ...p, position: newPosition } : p
    );
    if (roomState.captain1 && roomState.captain1.id === playerId) {
      roomState.captain1.position = newPosition;
    }
    if (roomState.captain2 && roomState.captain2.id === playerId) {
      roomState.captain2.position = newPosition;
    }
    const updated = roomState.players.find(p => p.id === playerId);
    if (updated) await dbUpsertPlayer(updated).catch(() => {});
    broadcastState();
  });

  socket.on('update_player_name', async ({ playerId, newName, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to edit player name.');
      return;
    }
    roomState.players = roomState.players.map(p =>
      p.id === playerId ? { ...p, name: newName } : p
    );
    if (roomState.captain1 && roomState.captain1.id === playerId) {
      roomState.captain1.name = newName;
    }
    if (roomState.captain2 && roomState.captain2.id === playerId) {
      roomState.captain2.name = newName;
    }
    const updated = roomState.players.find(p => p.id === playerId);
    if (updated) await dbUpsertPlayer(updated).catch(() => {});
    broadcastState();
  });

  socket.on('delete_player', async ({ playerId, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to delete players.');
      return;
    }
    roomState.players = roomState.players.filter(p => p.id !== playerId);
    if (roomState.captain1 && roomState.captain1.id === playerId) roomState.captain1 = null;
    if (roomState.captain2 && roomState.captain2.id === playerId) roomState.captain2 = null;
    await dbDeletePlayer(playerId).catch(() => {});
    broadcastState();
  });

  socket.on('set_match_config', async (config) => {
    const { adminToken } = config || {};
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to update match configuration.');
      return;
    }
    if (config.matchTitle !== undefined) roomState.matchTitle = config.matchTitle;
    if (config.captain1 !== undefined) {
      roomState.captain1 = config.captain1;
      roomState.cap1Token = generateSecureToken();
      if (config.captain1) {
        await dbSetCaptainToken(roomState.roomId, 1, config.captain1.id, roomState.team1Kit, roomState.cap1Token).catch(() => {});
      }
    }
    if (config.captain2 !== undefined) {
      roomState.captain2 = config.captain2;
      roomState.cap2Token = generateSecureToken();
      if (config.captain2) {
        await dbSetCaptainToken(roomState.roomId, 2, config.captain2.id, roomState.team2Kit, roomState.cap2Token).catch(() => {});
      }
    }
    if (config.team1Kit !== undefined) roomState.team1Kit = config.team1Kit;
    if (config.team2Kit !== undefined) roomState.team2Kit = config.team2Kit;
    if (config.team1Name !== undefined) roomState.team1Name = config.team1Name;
    if (config.team2Name !== undefined) roomState.team2Name = config.team2Name;
    if (config.publicUrl !== undefined) roomState.publicUrl = config.publicUrl;
    broadcastState();
  });

  socket.on('set_room_step', async ({ step, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    roomState.roomStep = step;
    broadcastState();
  });

  // --- Authoritative Coin Toss (Requires Valid Match-Scoped Captain Token) ---
  socket.on('toss_start_flip', async ({ token, role } = {}) => {
    const verifiedRole = await resolveCaptainRole(token);
    if (!verifiedRole || (verifiedRole !== 'cap1' && verifiedRole !== 'cap2')) {
      socket.emit('error_message', 'Invalid or missing captain token. Only authorized captains can flip the coin.');
      return;
    }

    if (roomState.tossState.winner) {
      socket.emit('error_message', 'The coin toss has already completed.');
      return;
    }
    if (roomState.tossState.isFlipping) {
      return;
    }

    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    const callerChoice = roomState.tossState.callerChoice || 'heads';
    const winner = outcome === callerChoice ? roomState.captain1 : roomState.captain2;

    roomState.tossState.isFlipping = true;
    roomState.tossState.coinResult = null;

    io.emit('toss_flipping_started', {
      callerChoice,
      outcome,
      initiatedBy: verifiedRole
    });

    setTimeout(() => {
      roomState.tossState.isFlipping = false;
      roomState.tossState.coinResult = outcome;
      roomState.tossState.winner = winner;
      roomState.firstPickCaptain = winner;
      if (roomState.draftState) {
        roomState.draftState.currentTurn = (winner && roomState.captain1 && winner.id === roomState.captain1.id) ? 1 : 2;
      }
      broadcastState();
    }, 2400);
  });

  socket.on('toss_set_caller_choice', async (data) => {
    const choice = typeof data === 'string' ? data : data?.choice;
    const token = typeof data === 'object' ? data?.token : null;
    const verifiedRole = await resolveCaptainRole(token);
    if (verifiedRole !== 'cap1') {
      socket.emit('error_message', 'Only Captain 1 with a valid token can call Heads or Tails.');
      return;
    }
    roomState.tossState.callerChoice = choice;
    broadcastState();
  });

  // Start Draft Transition
  socket.on('start_draft', () => {
    if (!roomState.tossState?.winner) {
      console.warn('Cannot start draft without toss winner');
      return;
    }
    const c1 = roomState.captain1;
    const c2 = roomState.captain2;
    if (!c1 || !c2) return;

    const initialTurn = (roomState.firstPickCaptain && roomState.firstPickCaptain.id === c1.id) ? 1 : 2;
    const available = roomState.players.filter(p => p.id !== c1.id && p.id !== c2.id);

    const now = Date.now();
    roomState.draftState = {
      team1: [c1],
      team2: [c2],
      availablePlayers: available,
      currentTurn: initialTurn,
      pickNumber: 1,
      draftHistory: [],
      gkAlert: null,
      turnStartedAt: now,
      turnEndsAt: now + 90000,
      isPaused: false,
      pausedRemainingMs: 90000
    };
    roomState.roomStep = 'draft';
    broadcastState();
  });

  // Draft Pick Player with Cryptographic Captain Token Authorization
  socket.on('draft_pick_player', async ({ player, token, role, pickedByTurn }) => {
    const verifiedRole = await resolveCaptainRole(token);
    if (!verifiedRole) {
      socket.emit('error_message', 'Invalid or missing captain token. Unauthorized pick attempt.');
      return;
    }
    const result = executePlayerPick(player, verifiedRole);
    if (!result.success) {
      socket.emit('error_message', result.message);
    }
  });

  // Admin Draft Controls: Pause / Resume Turn Timer
  socket.on('draft_pause_toggle', async ({ adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    const ds = roomState.draftState;
    if (!ds) return;

    if (!ds.isPaused) {
      ds.isPaused = true;
      ds.pausedRemainingMs = Math.max(0, (ds.turnEndsAt || Date.now()) - Date.now());
    } else {
      ds.isPaused = false;
      const now = Date.now();
      ds.turnStartedAt = now;
      ds.turnEndsAt = now + (ds.pausedRemainingMs || 90000);
    }
    broadcastState();
  });

  // Undo / Unpick action (Protected by Admin token)
  socket.on('draft_undo', async ({ adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to undo picks.');
      return;
    }
    const ds = roomState.draftState;
    if (!ds || ds.draftHistory.length === 0) return;
    const last = ds.draftHistory.pop();
    ds.team1 = last.team1;
    ds.team2 = last.team2;
    ds.availablePlayers = last.availablePlayers;
    ds.currentTurn = last.currentTurn;
    ds.pickNumber = last.pickNumber;
    ds.gkAlert = null;
    const now = Date.now();
    ds.turnStartedAt = now;
    ds.turnEndsAt = now + 90000;
    ds.isPaused = false;
    broadcastState();
  });

  socket.on('dismiss_gk_alert', () => {
    if (roomState.draftState) {
      roomState.draftState.gkAlert = null;
      broadcastState();
    }
  });

  // --- Permanent Player Directory Events ---
  socket.on('directory_add_player', async ({ player, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    if (!roomState.playerDirectory) roomState.playerDirectory = [];
    if (!roomState.playerDirectory.some(p => p.name.toLowerCase() === player.name.toLowerCase())) {
      const newP = {
        id: player.id || ('dir_' + Date.now()),
        name: player.name.trim(),
        position: player.position || 'MID',
        secondaryPosition: player.secondaryPosition || '',
        active: true
      };
      roomState.playerDirectory.push(newP);
      await dbUpsertPlayer(newP).catch(() => {});
      broadcastState();
    }
  });

  socket.on('directory_bulk_add', async ({ playersList, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    if (!roomState.playerDirectory) roomState.playerDirectory = [];
    for (const p of playersList) {
      if (p.name && !roomState.playerDirectory.some(x => x.name.toLowerCase() === p.name.trim().toLowerCase())) {
        const newP = {
          id: 'dir_' + Date.now() + Math.random().toString(36).substring(2, 5),
          name: p.name.trim(),
          position: p.position || 'MID',
          secondaryPosition: p.secondaryPosition || '',
          active: true
        };
        roomState.playerDirectory.push(newP);
        await dbUpsertPlayer(newP).catch(() => {});
      }
    }
    broadcastState();
  });

  socket.on('directory_remove_player', async ({ playerId, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    if (!roomState.playerDirectory) return;
    roomState.playerDirectory = roomState.playerDirectory.filter(p => p.id !== playerId);
    await dbDeletePlayer(playerId).catch(() => {});
    broadcastState();
  });

  socket.on('directory_select_for_match', async ({ selectedPlayerIds, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    if (!roomState.playerDirectory) return;
    const selected = roomState.playerDirectory.filter(p => selectedPlayerIds.includes(p.id));
    roomState.players = selected.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position
    }));
    roomState.captain1 = null;
    roomState.captain2 = null;
    await dbRevokeCaptainTokens(roomState.roomId).catch(() => {});
    broadcastState();
  });

  // --- Match Lifecycle & Archive Events ---
  socket.on('set_match_metadata', async ({ metadata, adminToken }) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    roomState.matchMetadata = { ...roomState.matchMetadata, ...metadata };
    if (metadata.name) roomState.matchTitle = metadata.name;
    broadcastState();
  });

  // SAFEGUARD 13: Final Score Event
  socket.on('save_final_score', async ({ team1Score, team2Score, adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to save score.');
      return;
    }
    const t1 = parseInt(team1Score, 10);
    const t2 = parseInt(team2Score, 10);
    if (isNaN(t1) || isNaN(t2) || t1 < 0 || t2 < 0) {
      socket.emit('error_message', 'Scores must be valid non-negative numbers.');
      return;
    }
    const res = await dbSaveMatchScore(roomState.roomId, t1, t2, roomState.team1Name, roomState.team2Name);
    roomState.matchScore = {
      team1Score: t1,
      team2Score: t2,
      winner: res.winner,
      isDraw: res.isDraw,
      updatedAt: new Date().toISOString()
    };
    broadcastState();
  });

  // SAFEGUARD 6: Invalidate tokens on match archive
  socket.on('archive_current_match', async ({ adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required to archive match.');
      return;
    }
    if (!roomState.matchArchive) roomState.matchArchive = [];
    const archivedMatch = {
      id: 'arch_' + Date.now(),
      matchId: roomState.roomId || ('match_' + Date.now()),
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
      team1Score: roomState.matchScore?.team1Score !== undefined ? roomState.matchScore.team1Score : null,
      team2Score: roomState.matchScore?.team2Score !== undefined ? roomState.matchScore.team2Score : null,
      winner: roomState.matchScore?.winner || null,
      finalTeam1: roomState.finalTeam1.length > 0 ? roomState.finalTeam1 : (roomState.draftState?.team1 || []),
      finalTeam2: roomState.finalTeam2.length > 0 ? roomState.finalTeam2 : (roomState.draftState?.team2 || []),
      coinWinner: roomState.tossState?.winner,
      draftHistory: roomState.draftState?.draftHistory || [],
      archivedAt: new Date().toISOString()
    };
    roomState.matchArchive.unshift(archivedMatch);
    await dbArchiveMatch(archivedMatch).catch(err => console.error('DB archive error:', err));

    // Reset match state for next week while keeping directory and archive intact
    const directory = roomState.playerDirectory || [];
    const archive = roomState.matchArchive || [];
    const pubUrl = roomState.publicUrl;

    roomState = createInitialState('match_' + Date.now());
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

  socket.on('reset_match', async ({ adminToken } = {}) => {
    const isAuth = await dbValidateAdminSession(adminToken);
    if (!isAuth) {
      socket.emit('error_message', 'Admin authorization required.');
      return;
    }
    const prevUrl = roomState.publicUrl;
    roomState = createInitialState('main');
    roomState.publicUrl = prevUrl;
    await dbRevokeCaptainTokens(roomState.roomId).catch(() => {});
    broadcastState();
  });
});

// --- REST API Endpoints ---

// SAFEGUARD 9: Health Check with Explicit Database Status & Type
app.get('/api/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'ok',
    application: 'SquadDraft PRO',
    database: dbStatus.database,
    databaseType: dbStatus.databaseType,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    playersCount: roomState.players ? roomState.players.length : 0,
    roomStep: roomState.roomStep,
    matchTitle: roomState.matchTitle
  });
});

// SAFEGUARD 5: Authoritative Backend Admin Login
app.post('/api/auth/admin-login', async (req, res) => {
  const { pin } = req.body || {};
  const expectedPin = process.env.ADMIN_PIN || '28160';
  if (pin === expectedPin) {
    const token = generateSecureToken();
    await dbCreateAdminSession(token, 24 * 60 * 60 * 1000);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ error: 'Invalid admin credentials' });
});

// Admin Verify Token
app.get('/api/auth/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;
  const isValid = await dbValidateAdminSession(token);
  return res.json({ valid: isValid });
});

// Draft Pick with Token Validation
app.post('/api/draft/pick', async (req, res) => {
  const { token, playerId, player } = req.body || {};
  const verifiedRole = await resolveCaptainRole(token);
  if (!verifiedRole) {
    return res.status(403).json({ error: 'Invalid or missing captain access token. Authorization denied.' });
  }

  const targetPlayer = player || (roomState.draftState?.availablePlayers || []).find(p => p.id === playerId);
  if (!targetPlayer) {
    return res.status(400).json({ error: 'Player not found or not provided in available pool.' });
  }

  const result = executePlayerPick(targetPlayer, verifiedRole);
  if (!result.success) {
    return res.status(result.status || 400).json({ error: result.message });
  }
  return res.json({ success: true, player: result.player, currentTurn: roomState.draftState.currentTurn });
});

// Authoritative Coin Toss with Token Validation
app.post('/api/draft/toss', async (req, res) => {
  const { token } = req.body || {};
  const verifiedRole = await resolveCaptainRole(token);
  if (!verifiedRole || (verifiedRole !== 'cap1' && verifiedRole !== 'cap2')) {
    return res.status(403).json({ error: 'Only verified Captain 1 or Captain 2 with a valid token can initiate the coin toss.' });
  }
  if (roomState.tossState.winner) {
    return res.status(400).json({ error: 'The coin toss has already been completed.' });
  }
  if (roomState.tossState.isFlipping) {
    return res.status(400).json({ error: 'Coin is currently flipping.' });
  }

  const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
  const callerChoice = roomState.tossState.callerChoice || 'heads';
  const winner = outcome === callerChoice ? roomState.captain1 : roomState.captain2;

  roomState.tossState.isFlipping = true;
  roomState.tossState.coinResult = null;

  io.emit('toss_flipping_started', {
    callerChoice,
    outcome,
    initiatedBy: verifiedRole
  });

  setTimeout(() => {
    roomState.tossState.isFlipping = false;
    roomState.tossState.coinResult = outcome;
    roomState.tossState.winner = winner;
    roomState.firstPickCaptain = winner;
    if (roomState.draftState) {
      roomState.draftState.currentTurn = (winner && roomState.captain1 && winner.id === roomState.captain1.id) ? 1 : 2;
    }
    broadcastState();
  }, 2400);

  return res.json({ success: true, message: 'Coin toss started authoritatively on server.' });
});

// Reset Toss (Admin Only)
app.post('/api/draft/reset-toss', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : req.body.adminToken;
  const isAuth = await dbValidateAdminSession(token);
  if (!isAuth) {
    return res.status(403).json({ error: 'Only Admin can reset the coin toss.' });
  }
  if (!req.body.force && roomState.roomStep === 'draft' && roomState.draftState?.draftHistory?.length > 0) {
    return res.status(400).json({ error: 'Cannot reset coin toss while drafting is in progress.' });
  }
  roomState.tossState = {
    isFlipping: false,
    callerChoice: 'heads',
    coinResult: null,
    winner: null
  };
  roomState.firstPickCaptain = null;
  if (req.body.force) {
    roomState.roomStep = 'toss';
  }
  broadcastState();
  return res.json({ success: true, message: 'Coin toss reset successfully.' });
});

// SAFEGUARD 13: Final Score Endpoint (Admin Only, non-negative scores)
app.post('/api/matches/:matchId/score', async (req, res) => {
  const { team1Score, team2Score, adminToken } = req.body || {};
  const isAuth = await dbValidateAdminSession(adminToken);
  if (!isAuth) {
    return res.status(403).json({ error: 'Unauthorized: Admin authentication required to save final score.' });
  }

  const t1 = parseInt(team1Score, 10);
  const t2 = parseInt(team2Score, 10);

  if (isNaN(t1) || isNaN(t2) || t1 < 0 || t2 < 0) {
    return res.status(400).json({ error: 'Scores must be valid non-negative numbers.' });
  }

  const scoreResult = await dbSaveMatchScore(
    req.params.matchId || roomState.roomId,
    t1,
    t2,
    roomState.team1Name || 'Team White',
    roomState.team2Name || 'Team Black'
  );

  roomState.matchScore = {
    team1Score: t1,
    team2Score: t2,
    winner: scoreResult.winner,
    isDraw: scoreResult.isDraw,
    updatedAt: new Date().toISOString()
  };

  broadcastState();
  return res.json({ success: true, matchScore: roomState.matchScore });
});

// SAFEGUARD 8 & 14: Public Read-Only Match History (Sanitized, NO tokens or sessions)
app.get('/api/history', async (req, res) => {
  try {
    const history = await dbGetPublicHistory();
    return res.json(history);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch match history' });
  }
});

app.get('/api/history/:matchId', async (req, res) => {
  try {
    const history = await dbGetPublicHistory();
    const match = history.find(m => m.id === req.params.matchId || m.matchId === req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    return res.json(match);
  } catch (err) {
    return res.status(500).json({ error: 'Could not fetch match details' });
  }
});

// State Endpoint
app.get('/api/state', (req, res) => {
  res.json(roomState);
});

// Serve Frontend Bundle
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Server Initialization
const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDatabase();
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('⚽ SquadDraft PRO Production Real-Time Server running on port ' + PORT);
    startTunnel();
  });
}

startServer();

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
