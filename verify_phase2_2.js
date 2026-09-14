import { spawn } from 'child_process';
import path from 'path';

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;
const ROOT = path.resolve('C:/Users/arpit/.gemini/antigravity/scratch/squaddraft');

console.log('🚀 RUNNING PHASE 2.2 END-TO-END LIVE DRAFT SYNCHRONIZATION TEST SUITE...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let serverProcess = null;

async function startServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'development',
      APP_URL: BASE_URL
    };
    serverProcess = spawn('node', ['server.js'], { cwd: ROOT, env });

    serverProcess.stdout.on('data', (d) => {
      const txt = d.toString();
      if (txt.includes('Server running on port') || txt.includes('Production Real-Time Server')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      const errTxt = d.toString();
      if (!errTxt.includes('DeprecationWarning')) {
        console.error('Server err:', errTxt);
      }
    });

    serverProcess.on('error', reject);
    setTimeout(resolve, 3000);
  });
}

async function runTests() {
  try {
    const { io } = await import('file:///C:/Users/arpit/.gemini/antigravity/scratch/squaddraft/node_modules/socket.io-client/build/esm/index.js');

    await startServer();
    console.log(`Server started on port ${PORT}`);

    // Fetch initial state
    const stateRes = await fetch(`${BASE_URL}/api/state`).then(r => r.json());
    const { cap1Token, cap2Token, captain1, captain2 } = stateRes;
    assert(!!cap1Token && !!cap2Token, 'Server generated captain 1 and captain 2 tokens');

    // Admin login to get adminToken
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '28160' })
    }).then(r => r.json());
    const adminToken = adminLoginRes.token;
    assert(!!adminToken, 'Admin logged in with server-authoritative token');

    // Reset toss
    await fetch(`${BASE_URL}/api/draft/reset-toss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminToken, force: true })
    });

    // Conduct authoritative coin toss
    const tossRes = await fetch(`${BASE_URL}/api/draft/toss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cap1Token })
    }).then(r => r.json());
    assert(tossRes.success, 'Coin toss initiated authoritatively');
    console.log('Waiting 2.6s for coin toss animation to settle...');
    await sleep(2600);

    // Create 3 Socket.IO client connections (Captain 1, Captain 2, Spectator)
    const socketCap1 = io(BASE_URL);
    const socketCap2 = io(BASE_URL);
    const socketSpec = io(BASE_URL);

    await Promise.all([
      new Promise(res => socketCap1.on('connect', res)),
      new Promise(res => socketCap2.on('connect', res)),
      new Promise(res => socketSpec.on('connect', res))
    ]);
    assert(true, 'Captain 1, Captain 2, and Spectator sockets connected simultaneously');

    let stateCap1 = null;
    let stateCap2 = null;
    let stateSpec = null;

    socketCap1.on('room_state_updated', s => { stateCap1 = s; });
    socketCap2.on('room_state_updated', s => { stateCap2 = s; });
    socketSpec.on('room_state_updated', s => { stateSpec = s; });

    let playerPickedEvents = [];
    socketSpec.on('player_picked', p => { playerPickedEvents.push(p); });

    let cap1Errors = [];
    socketCap1.on('error_message', err => { cap1Errors.push(err); });

    let cap2Errors = [];
    socketCap2.on('error_message', err => { cap2Errors.push(err); });

    // Start draft
    socketCap1.emit('start_draft');
    await sleep(300);

    assert(stateCap1?.roomStep === 'draft', 'Room step transitioned to draft');
    const initialTurn = stateCap1?.draftState?.currentTurn;
    assert(initialTurn === 1 || initialTurn === 2, `Initial currentTurn is Captain ${initialTurn}`);
    const initialTurnEndsAt = stateCap1?.draftState?.turnEndsAt;
    assert(initialTurnEndsAt > Date.now(), 'Server-authoritative timer initialized with future turnEndsAt');

    // Helper functions to get active socket / token according to server authoritative turn
    const getActiveContext = (turn) => {
      const isC1 = turn === 1;
      return {
        activeSocket: isC1 ? socketCap1 : socketCap2,
        activeToken: isC1 ? cap1Token : cap2Token,
        activeRole: isC1 ? 'cap1' : 'cap2',
        wrongSocket: isC1 ? socketCap2 : socketCap1,
        wrongToken: isC1 ? cap2Token : cap1Token,
        wrongRole: isC1 ? 'cap2' : 'cap1',
        wrongErrors: isC1 ? cap2Errors : cap1Errors
      };
    };

    // TEST 1: NEGATIVE SECURITY TESTS
    console.log('\n--- NEGATIVE SECURITY TESTS ---');

    const ctx1 = getActiveContext(initialTurn);
    const pool = stateCap1.draftState.availablePlayers;
    const testPlayer1 = pool[0];

    // 1a: Wrong-turn Captain pick attempt
    ctx1.wrongSocket.emit('draft_pick_player', {
      player: testPlayer1,
      token: ctx1.wrongToken,
      role: ctx1.wrongRole,
      pickedByTurn: initialTurn === 1 ? 2 : 1
    });
    await sleep(200);
    assert(ctx1.wrongErrors.length > 0 && ctx1.wrongErrors[ctx1.wrongErrors.length - 1].includes("turn"), 'Wrong-turn Captain pick rejected by server');

    // 1b: Spectator / invalid token pick
    socketSpec.emit('draft_pick_player', {
      player: testPlayer1,
      token: 'fake_token_xyz',
      role: 'spectator',
      pickedByTurn: initialTurn
    });
    await sleep(200);
    const initialSquadLen = initialTurn === 1 ? stateCap1.draftState.team1.length : stateCap1.draftState.team2.length;
    assert(initialSquadLen === 1, 'Team squad unchanged after unauthorized spectator pick attempt');

    // TEST 2: ACTIVE CAPTAIN VALID PICK VIA draft_pick_player
    console.log('\n--- TEST 2: ACTIVE CAPTAIN VALID PICK & REALTIME MULTI-CLIENT SYNC ---');
    // Pick a non-GK player to verify normal turn alternation
    const pick1Player = stateCap1.draftState.availablePlayers.find(p => p.position !== 'GK') || stateCap1.draftState.availablePlayers[0];
    const prevTurnEndsAt = stateCap1.draftState.turnEndsAt;
    playerPickedEvents = [];

    ctx1.activeSocket.emit('draft_pick_player', {
      player: pick1Player,
      token: ctx1.activeToken,
      role: ctx1.activeRole,
      pickedByTurn: initialTurn
    });
    await sleep(300);

    const pick1Team = initialTurn === 1 ? stateCap1.draftState.team1 : stateCap1.draftState.team2;
    const expectedNextTurn = initialTurn === 1 ? 2 : 1;

    // Verify on all 3 clients
    assert(pick1Team.some(p => p.id === pick1Player.id), `Player 1 added to Team ${initialTurn} on Captain 1 client`);
    assert(stateCap2.draftState.team1.some(p => p.id === pick1Player.id) || stateCap2.draftState.team2.some(p => p.id === pick1Player.id), 'Player 1 added to team on Captain 2 client');
    assert(stateSpec.draftState.team1.some(p => p.id === pick1Player.id) || stateSpec.draftState.team2.some(p => p.id === pick1Player.id), 'Player 1 added to team on Spectator client');

    assert(!stateCap1.draftState.availablePlayers.some(p => p.id === pick1Player.id), 'Player 1 removed from available pool on Captain 1 client');
    assert(!stateCap2.draftState.availablePlayers.some(p => p.id === pick1Player.id), 'Player 1 removed from available pool on Captain 2 client');
    assert(!stateSpec.draftState.availablePlayers.some(p => p.id === pick1Player.id), 'Player 1 removed from available pool on Spectator client');

    assert(stateCap1.draftState.currentTurn === expectedNextTurn, `Turn transitioned to Captain ${expectedNextTurn} on Captain 1 client`);
    assert(stateCap2.draftState.currentTurn === expectedNextTurn, `Turn transitioned to Captain ${expectedNextTurn} on Captain 2 client`);
    assert(stateSpec.draftState.currentTurn === expectedNextTurn, `Turn transitioned to Captain ${expectedNextTurn} on Spectator client`);

    assert(stateCap1.draftState.turnEndsAt > prevTurnEndsAt || stateCap1.draftState.turnStartedAt >= Date.now() - 1000, 'Server renewed turn timer timestamps for next captain');
    assert(playerPickedEvents.length > 0 && playerPickedEvents[0].player.id === pick1Player.id, 'Server broadcast player_picked event for 3D stadium celebration');

    // TEST 3: NEXT CAPTAIN VALID PICK VIA pick_player ALIAS
    console.log('\n--- TEST 3: NEXT CAPTAIN VALID PICK & COMPATIBILITY ALIAS ---');
    const ctx2 = getActiveContext(expectedNextTurn);
    const pick2Player = stateCap1.draftState.availablePlayers.find(p => p.position !== 'GK') || stateCap1.draftState.availablePlayers[0];

    ctx2.activeSocket.emit('pick_player', {
      playerId: pick2Player.id,
      player: pick2Player,
      token: ctx2.activeToken,
      role: ctx2.activeRole,
      pickedByTurn: expectedNextTurn
    });
    await sleep(300);

    const pick2Team = expectedNextTurn === 1 ? stateCap1.draftState.team1 : stateCap1.draftState.team2;
    assert(pick2Team.some(p => p.id === pick2Player.id), `Player 2 added to Team ${expectedNextTurn} on Captain 1 client`);
    assert(!stateCap1.draftState.availablePlayers.some(p => p.id === pick2Player.id), 'Player 2 removed from available pool on Captain 1 client');
    assert(stateCap1.draftState.currentTurn === initialTurn, `Turn transitioned back to Captain ${initialTurn} on Captain 1 client`);

    // TEST 4: RUN 4 MORE ALTERNATING PICKS (TOTAL 6 PICKS)
    console.log('\n--- TEST 4: MULTIPLE ALTERNATING PICKS STRESS TEST (6 PICKS TOTAL) ---');
    for (let i = 3; i <= 6; i++) {
      const currentTurn = stateCap1.draftState.currentTurn;
      const ctx = getActiveContext(currentTurn);
      const nextPlayer = stateCap1.draftState.availablePlayers.find(p => p.position !== 'GK') || stateCap1.draftState.availablePlayers[0];

      ctx.activeSocket.emit('draft_pick_player', {
        player: nextPlayer,
        token: ctx.activeToken,
        role: ctx.activeRole,
        pickedByTurn: currentTurn
      });
      await sleep(250);

      const targetTeam = currentTurn === 1 ? stateCap1.draftState.team1 : stateCap1.draftState.team2;
      assert(targetTeam.some(p => p.id === nextPlayer.id), `Pick ${i} (${ctx.activeRole}): player added to team successfully`);
    }

    assert(stateCap1.draftState.pickNumber === 7, 'Draft pickNumber accurately incremented to 7 after 6 picks');

    // TEST 5: RECONNECT / REFRESH TEST
    console.log('\n--- TEST 5: RECONNECT / REFRESH PERSISTENCE TEST ---');
    const freshSocket = io(BASE_URL);
    const freshState = await new Promise(res => freshSocket.on('room_state_updated', res));
    freshSocket.disconnect();

    assert(freshState.draftState.pickNumber === 7, 'Reconnected client receives matching pickNumber');
    assert(freshState.draftState.team1.length === stateCap1.draftState.team1.length, 'Reconnected client receives matching Team 1');
    assert(freshState.draftState.team2.length === stateCap1.draftState.team2.length, 'Reconnected client receives matching Team 2');
    assert(freshState.draftState.availablePlayers.length === stateCap1.draftState.availablePlayers.length, 'Reconnected client receives matching available pool');
    assert(freshState.draftState.currentTurn === stateCap1.draftState.currentTurn, 'Reconnected client receives matching currentTurn');
    assert(freshState.draftState.turnEndsAt === stateCap1.draftState.turnEndsAt, 'Reconnected client receives matching turn timer');

    // Clean up
    socketCap1.disconnect();
    socketCap2.disconnect();
    socketSpec.disconnect();

    console.log(`\n==================================================`);
    console.log(`TOTAL PASS: ${passCount} | FAIL: ${failCount}`);
    console.log(`==================================================\n`);

    if (failCount > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL PHASE 2.2 DRAFT SYNCHRONIZATION TESTS PASSED PERFECTLY!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  }
}

runTests();
