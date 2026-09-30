import io from 'file:///C:/Users/arpit/.gemini/antigravity/scratch/squaddraft/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://localhost:3000';

function waitForState(socket, pred, timeout = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('State timeout waiting for condition')), timeout);
    const handler = (s) => {
      if (pred(s)) {
        clearTimeout(timer);
        socket.off('room_state_updated', handler);
        resolve(s);
      }
    };
    socket.on('room_state_updated', handler);
  });
}

function catchError(socket, triggerFn, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Expected error_message was not emitted')), timeout);
    const handler = (msg) => {
      clearTimeout(timer);
      socket.off('error_message', handler);
      resolve(msg);
    };
    socket.on('error_message', handler);
    triggerFn();
  });
}

async function runGkSuite() {
  console.log('🧤 ========================================================');
  console.log('🧤 RUNNING SQUADDRAFT GOALKEEPER AUTO-BALANCE TEST SUITE');
  console.log('🧤 ========================================================\n');

  // Authenticate Admin
  const authRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '28160' })
  });
  const { token: adminToken } = await authRes.json();
  if (!adminToken) throw new Error('Admin authentication failed');

  // Connect 4 isolated sessions
  const sessionAdmin = io(BASE_URL);
  const sessionCap1 = io(BASE_URL);
  const sessionCap2 = io(BASE_URL);
  const sessionSpec = io(BASE_URL);

  await Promise.all([
    new Promise(res => sessionAdmin.once('connect', res)),
    new Promise(res => sessionCap1.once('connect', res)),
    new Promise(res => sessionCap2.once('connect', res)),
    new Promise(res => sessionSpec.once('connect', res)),
  ]);

  let passedTests = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(message);
    }
    console.log(`   ✅ PASS: ${message}`);
    passedTests++;
  }

  // Helper to reset and configure match
  async function setupFreshMatch(firstPickCaptainRole = 1) {
    sessionAdmin.emit('reset_match', { adminToken });
    await waitForState(sessionAdmin, s => s.roomStep === 'setup' || !s.captain1);

    sessionAdmin.emit('admin_load_demo_players', { adminToken });
    let s = await waitForState(sessionAdmin, s => s.players && s.players.length >= 8);
    const all = s.players;
    const nonGk1 = all.find(p => p.position !== 'GK');
    const nonGk2 = all.filter(p => p.position !== 'GK' && p.id !== nonGk1.id)[0];

    sessionAdmin.emit('set_match_config', {
      adminToken,
      format: '8v8',
      pitchName: 'Turf Derby',
      captain1: nonGk1,
      captain2: nonGk2,
      team1Name: 'Team White',
      team2Name: 'Team Black',
      players: all
    });
    s = await waitForState(sessionAdmin, s => s.captain1 && s.captain2);
    const cap1Token = s.cap1Token;
    const cap2Token = s.cap2Token;

    sessionAdmin.emit('set_room_step', { step: 'toss', adminToken });
    await waitForState(sessionAdmin, s => s.roomStep === 'toss');

    // Win toss for desired first-pick captain
    const targetWinnerId = firstPickCaptainRole === 1 ? nonGk1.id : nonGk2.id;
    let tossWinner = null;
    while (!tossWinner || tossWinner.id !== targetWinnerId) {
      sessionCap1.emit('toss_call_and_flip', { choice: 'heads', token: cap1Token });
      s = await waitForState(sessionAdmin, s => s.tossState?.winner, 4000);
      tossWinner = s.tossState.winner;
      if (tossWinner.id !== targetWinnerId) {
        sessionAdmin.emit('toss_reset_admin', { adminToken });
        await waitForState(sessionAdmin, s => !s.tossState?.winner);
      }
    }

    sessionAdmin.emit('start_draft');
    s = await waitForState(sessionAdmin, s => s.roomStep === 'draft');
    return { state: s, cap1Token, cap2Token, nonGk1, nonGk2 };
  }

  // ----------------------------------------------------
  // SCENARIO 1: Captain 1 Picks GK First
  // ----------------------------------------------------
  console.log('--- SCENARIO 1: Captain 1 Picks GK First ---');
  let { state, cap1Token, cap2Token } = await setupFreshMatch(1);
  assert(state.draftState.currentTurn === 1, 'Initial turn is Captain 1');

  const gks = state.draftState.availablePlayers.filter(p => p.position === 'GK');
  assert(gks.length === 2, `Available GKs at start of draft is exactly 2 (found: ${gks.length})`);
  const gk1 = gks[0];
  const gk2 = gks[1];

  const specGkPromise = new Promise(resolve => sessionSpec.once('gk_balance_event', resolve));

  // Cap 1 selects GK1
  sessionCap1.emit('draft_pick_player', { player: gk1, token: cap1Token });
  state = await waitForState(sessionAdmin, s => s.draftState.team1.some(p => p.id === gk1.id));
  const specGkAlertReceived = await specGkPromise;

  assert(state.draftState.team1.some(p => p.id === gk1.id), `Team 1 contains drafted GK ${gk1.name}`);
  assert(state.draftState.team2.some(p => p.id === gk2.id), `Team 2 automatically received remaining GK ${gk2.name}`);
  assert(!state.draftState.availablePlayers.some(p => p.position === 'GK'), 'Both GKs removed from available pool');
  assert(state.draftState.currentTurn === 1, 'currentTurn remains Captain 1 (retained turn)');
  assert(state.draftState.gkAlert !== null, 'gkAlert is populated in draftState');
  assert(state.draftState.gkAlert.retainingCaptain !== undefined, `gkAlert identifies retaining captain: ${state.draftState.gkAlert.retainingCaptain}`);
  assert(specGkAlertReceived !== null, 'Spectator received live gk_balance_event over WebSocket');

  // Cap 1 now selects DEF -> Turn transitions to Cap 2
  const def1 = state.draftState.availablePlayers.find(p => p.position !== 'GK');
  sessionCap1.emit('draft_pick_player', { player: def1, token: cap1Token });
  state = await waitForState(sessionAdmin, s => s.draftState.currentTurn === 2);
  assert(state.draftState.currentTurn === 2, 'After Cap 1 normal pick, currentTurn transitions to Captain 2');

  // Cap 2 selects MID -> Turn transitions to Cap 1
  const mid1 = state.draftState.availablePlayers.find(p => p.position !== 'GK');
  sessionCap2.emit('draft_pick_player', { player: mid1, token: cap2Token });
  state = await waitForState(sessionAdmin, s => s.draftState.currentTurn === 1);
  assert(state.draftState.currentTurn === 1, 'After Cap 2 normal pick, currentTurn transitions to Captain 1');

  // ----------------------------------------------------
  // SCENARIO 2: Captain 2 Picks GK First (Reverse Case)
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 2: Captain 2 Picks GK First (Reverse Case) ---');
  const setup2 = await setupFreshMatch(2);
  state = setup2.state;
  cap1Token = setup2.cap1Token;
  cap2Token = setup2.cap2Token;
  assert(state.draftState.currentTurn === 2, 'Initial turn is Captain 2');

  const gks2 = state.draftState.availablePlayers.filter(p => p.position === 'GK');
  assert(gks2.length === 2, 'Available GKs at start of draft is exactly 2');
  const selGk = gks2[0];
  const autoGk = gks2[1];

  sessionCap2.emit('draft_pick_player', { player: selGk, token: cap2Token });
  state = await waitForState(sessionAdmin, s => s.draftState.team2.some(p => p.id === selGk.id));

  assert(state.draftState.team2.some(p => p.id === selGk.id), `Team 2 contains drafted GK ${selGk.name}`);
  assert(state.draftState.team1.some(p => p.id === autoGk.id), `Team 1 automatically received remaining GK ${autoGk.name}`);
  assert(state.draftState.currentTurn === 2, 'currentTurn remains Captain 2 (retained turn)');

  // Cap 2 now selects DEF -> Turn transitions to Cap 1
  const nextPlayer = state.draftState.availablePlayers.find(p => p.position !== 'GK');
  sessionCap2.emit('draft_pick_player', { player: nextPlayer, token: cap2Token });
  state = await waitForState(sessionAdmin, s => s.draftState.currentTurn === 1);
  assert(state.draftState.currentTurn === 1, 'After Cap 2 normal pick, currentTurn transitions to Captain 1');

  // ----------------------------------------------------
  // SCENARIO 3: Reconnection / Refresh Consistency
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 3: Reconnection & Refresh Consistency ---');
  // Connect a 5th fresh client (simulating page reload after GK balance)
  const sessionFresh = io(BASE_URL);
  const freshState = await waitForState(sessionFresh, s => s.roomStep === 'draft');
  assert(freshState.draftState.team1.some(p => p.position === 'GK'), 'Fresh client sees Team 1 has exactly 1 GK');
  assert(freshState.draftState.team2.some(p => p.position === 'GK'), 'Fresh client sees Team 2 has exactly 1 GK');
  assert(!freshState.draftState.availablePlayers.some(p => p.position === 'GK'), 'Fresh client sees 0 GKs in available pool');
  assert(freshState.draftState.currentTurn === state.draftState.currentTurn, 'Fresh client receives identical currentTurn');
  sessionFresh.disconnect();

  // ----------------------------------------------------
  // SCENARIO 4: Undo Last Pick Atomicity
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 4: Undo Last Pick Atomicity ---');
  // First undo the non-GK pick
  sessionAdmin.emit('undo_last_pick', { adminToken });
  state = await waitForState(sessionAdmin, s => s.draftState.currentTurn === 2);

  // Now undo the GK balance event pick
  sessionAdmin.emit('undo_last_pick', { adminToken });
  state = await waitForState(sessionAdmin, s => s.draftState.availablePlayers.filter(p => p.position === 'GK').length === 2);

  const restoredGks = state.draftState.availablePlayers.filter(p => p.position === 'GK');
  assert(restoredGks.length === 2, `Undo restored both GKs to available pool (count: ${restoredGks.length})`);
  assert(!state.draftState.team1.some(p => p.position === 'GK'), 'Team 1 no longer has a GK');
  assert(!state.draftState.team2.some(p => p.position === 'GK'), 'Team 2 no longer has a GK');
  assert(state.draftState.currentTurn === 2, 'currentTurn restored to pre-GK-pick state (Captain 2)');
  assert(state.draftState.gkAlert === null, 'gkAlert is cleared upon undo');

  // ----------------------------------------------------
  // SCENARIO 5: Security & Anti-Manipulation
  // ----------------------------------------------------
  console.log('\n--- SCENARIO 5: Security & Server Authority ---');
  // Spectator tries to draft a GK -> Rejected
  const specErr = await catchError(sessionSpec, () => {
    sessionSpec.emit('draft_pick_player', { player: restoredGks[0], token: null });
  });
  assert(specErr.includes('Invalid') || specErr.includes('Unauthorized'), `Spectator draft attempt rejected: ${specErr}`);

  // Inactive captain (Cap 1) tries to draft when it is Cap 2 turn -> Rejected
  const outOfTurnErr = await catchError(sessionCap1, () => {
    sessionCap1.emit('draft_pick_player', { player: restoredGks[0], token: cap1Token });
  });
  assert(outOfTurnErr.includes("Captain 2's turn"), `Out-of-turn draft attempt rejected: ${outOfTurnErr}`);

  // Disconnect sockets
  sessionAdmin.disconnect();
  sessionCap1.disconnect();
  sessionCap2.disconnect();
  sessionSpec.disconnect();

  console.log(`\n========================================================`);
  console.log(`🎉 ALL GK AUTO-BALANCE TESTS PASSED: ${passedTests} / ${passedTests}`);
  console.log(`========================================================`);
  process.exit(0);
}

runGkSuite().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
