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

async function runStaleTossAudit() {
  console.log('🪙 ========================================================');
  console.log('🪙 SQUADDRAFT CRITICAL STALE TOSS STATE AUDIT SUITE');
  console.log('🪙 ========================================================\n');

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

  sessionAdmin.on('error_message', e => console.error('Admin Error:', e));
  sessionCap1.on('error_message', e => console.error('Cap1 Error:', e));
  sessionCap2.on('error_message', e => console.error('Cap2 Error:', e));
  sessionSpec.on('error_message', e => console.error('Spec Error:', e));

  let passedTests = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      throw new Error(message);
    }
    console.log(`   ✅ PASS: ${message}`);
    passedTests++;
  }

  // ----------------------------------------------------
  // TEST 1 — FRESH CAPTAINS (Kabir + Imran)
  // ----------------------------------------------------
  console.log('--- TEST 1: Fresh Captains Assignment (Kabir + Imran) ---');
  // Reset match to clean slate
  sessionAdmin.emit('reset_match', { adminToken });
  await waitForState(sessionAdmin, s => s.roomStep === 'setup' || !s.captain1);

  sessionAdmin.emit('admin_load_demo_players', { adminToken });
  let state = await waitForState(sessionAdmin, s => s.players && s.players.length >= 8);

  const kabir = { id: 'p_kabir_toss', name: 'Kabir', position: 'MID' };
  const imran = { id: 'p_imran_toss', name: 'Imran', position: 'DEF' };

  sessionAdmin.emit('set_match_config', {
    adminToken,
    format: '8v8',
    pitchName: 'Turf Derby',
    captain1: kabir,
    captain2: imran,
    team1Name: 'Team White',
    team2Name: 'Team Black',
    players: state.players
  });

  state = await waitForState(sessionAdmin, s => s.captain1?.name === 'Kabir' && s.captain2?.name === 'Imran');
  assert(state.captain1.name === 'Kabir', 'Captain 1 is Kabir');
  assert(state.captain2.name === 'Imran', 'Captain 2 is Imran');
  assert(state.tossState.winner === null, 'tossState.winner is strictly NULL');
  assert(state.firstPickCaptain === null, 'firstPickCaptain is strictly NULL');
  assert(state.tossState.coinResult === null, 'tossState.coinResult is NULL');
  assert(state.tossState.isFlipping === false, 'tossState.isFlipping is false');

  // Verify Spectator also sees blank toss
  const specState1 = await waitForState(sessionSpec, s => s.captain1?.name === 'Kabir');
  assert(specState1.tossState.winner === null, 'Spectator sees tossState.winner === null');
  assert(specState1.firstPickCaptain === null, 'Spectator sees firstPickCaptain === null');

  // ----------------------------------------------------
  // TEST 2 — CAPTAIN 1 CALL & AUTHORITATIVE SERVER FLIP
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Captain 1 Calls Toss (Kabir vs Imran) ---');
  sessionAdmin.emit('set_room_step', { step: 'toss', adminToken });
  await waitForState(sessionAdmin, s => s.roomStep === 'toss');

  const cap1Token = state.cap1Token;
  sessionCap1.emit('toss_call_and_flip', { choice: 'heads', token: cap1Token });
  state = await waitForState(sessionAdmin, s => s.tossState?.winner !== null, 5000);

  const winner = state.tossState.winner;
  assert(winner !== null, `Toss completed with winner: ${winner.name}`);
  assert(winner.name === 'Kabir' || winner.name === 'Imran', `Winner MUST be Kabir or Imran (Actual: ${winner.name})`);
  assert(winner.name !== 'Ayaan' && winner.name !== 'Deepak', 'Winner is NEVER Ayaan or Deepak');
  assert(state.firstPickCaptain.name === winner.name, `firstPickCaptain matches toss winner: ${winner.name}`);
  assert(state.tossState.captain1Id === kabir.id, 'tossState metadata contains captain1Id');
  assert(state.tossState.captain2Id === imran.id, 'tossState metadata contains captain2Id');

  // ----------------------------------------------------
  // TEST 3 — CHANGE CAPTAINS BEFORE DRAFT CLEARS TOSS
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Changing Captains Before Draft Clears Toss Immediately ---');
  // Complete toss between Deepak & Ayaan first
  const deepak = { id: 'p_deepak_toss', name: 'Deepak', position: 'FWD' };
  const ayaan = { id: 'p_ayaan_toss', name: 'Ayaan', position: 'MID' };

  sessionAdmin.emit('set_match_config', {
    adminToken,
    captain1: deepak,
    captain2: ayaan
  });
  state = await waitForState(sessionAdmin, s => s.captain1?.name === 'Deepak');
  assert(state.tossState.winner === null, 'Assigning Deepak & Ayaan cleared old toss result');

  // Do toss for Deepak vs Ayaan
  sessionCap1.emit('toss_call_and_flip', { choice: 'heads', token: state.cap1Token });
  state = await waitForState(sessionAdmin, s => s.tossState?.winner !== null, 5000);
  assert(state.tossState.winner.name === 'Deepak' || state.tossState.winner.name === 'Ayaan', 'Toss completed for Deepak vs Ayaan');

  // NOW: Change captains before draft to Kabir & Imran
  console.log('   ↺ Reassigning captains to Kabir & Imran...');
  sessionAdmin.emit('set_match_config', {
    adminToken,
    captain1: kabir,
    captain2: imran
  });
  state = await waitForState(sessionAdmin, s => s.captain1?.name === 'Kabir' && s.captain2?.name === 'Imran');

  assert(state.tossState.winner === null, 'CRITICAL: tossState.winner cleared immediately upon captain change');
  assert(state.firstPickCaptain === null, 'CRITICAL: firstPickCaptain cleared immediately upon captain change');
  assert(state.tossState.coinResult === null, 'tossState.coinResult cleared');

  // ----------------------------------------------------
  // TEST 4 — REFRESH ALL CLIENTS AFTER CAPTAIN CHANGE
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Refresh All Four Clients After Captain Change ---');
  const freshAdmin = io(BASE_URL);
  const freshCap1 = io(BASE_URL);
  const freshCap2 = io(BASE_URL);
  const freshSpec = io(BASE_URL);

  const [sAdmin, sCap1, sCap2, sSpec] = await Promise.all([
    waitForState(freshAdmin, s => s.captain1?.name === 'Kabir'),
    waitForState(freshCap1, s => s.captain1?.name === 'Kabir'),
    waitForState(freshCap2, s => s.captain1?.name === 'Kabir'),
    waitForState(freshSpec, s => s.captain1?.name === 'Kabir')
  ]);

  assert(sAdmin.tossState.winner === null, 'Fresh Admin sees NO toss winner');
  assert(sCap1.tossState.winner === null, 'Fresh Captain 1 sees NO toss winner');
  assert(sCap2.tossState.winner === null, 'Fresh Captain 2 sees NO toss winner');
  assert(sSpec.tossState.winner === null, 'Fresh Spectator sees NO toss winner');
  assert(sAdmin.firstPickCaptain === null, 'Fresh Admin sees firstPickCaptain === null');
  assert(sSpec.firstPickCaptain === null, 'Fresh Spectator sees firstPickCaptain === null');

  freshAdmin.disconnect();
  freshCap1.disconnect();
  freshCap2.disconnect();
  freshSpec.disconnect();

  // ----------------------------------------------------
  // TEST 5 — ACTIVE DRAFT SAFETY (Cannot change captains during draft)
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Active Draft Safety (Blocked Captain Changes) ---');
  // Perform toss for Kabir vs Imran
  sessionCap1.emit('toss_call_and_flip', { choice: 'tails', token: state.cap1Token });
  state = await waitForState(sessionAdmin, s => s.tossState?.winner !== null, 5000);
  assert(state.tossState.winner !== null, `Kabir/Imran toss completed: winner is ${state.tossState.winner.name}`);

  // Start live draft
  sessionAdmin.emit('start_draft');
  state = await waitForState(sessionAdmin, s => s.roomStep === 'draft');
  assert(state.roomStep === 'draft', 'Live draft has started');

  // Attempt to reassign captains while live draft is active -> MUST BE REJECTED
  const changeErr = await catchError(sessionAdmin, () => {
    sessionAdmin.emit('set_match_config', {
      adminToken,
      captain1: deepak,
      captain2: ayaan
    });
  });
  assert(changeErr.includes('Cannot change captains while a live draft or match is in progress'), `Active draft change blocked: ${changeErr}`);
  assert(state.captain1.name === 'Kabir', 'Captain 1 remains Kabir in active draft');
  assert(state.captain2.name === 'Imran', 'Captain 2 remains Imran in active draft');

  // ----------------------------------------------------
  // TEST 6 — ARCHIVE & NEW MATCH ISOLATION
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Archive & New Match Toss Isolation ---');
  // Draft remaining players to complete
  console.log('   Drafting players... available:', state.draftState.availablePlayers.length);
  while (state.draftState.availablePlayers.length > 0) {
    const curTurn = state.draftState.currentTurn;
    const token = curTurn === 1 ? state.cap1Token : state.cap2Token;
    const client = curTurn === 1 ? sessionCap1 : sessionCap2;
    const playerToPick = state.draftState.availablePlayers[0];
    const prevPick = state.draftState.pickNumber;
    console.log(`   Pick ${prevPick}: Captain ${curTurn} picking ${playerToPick.name}...`);
    client.emit('draft_pick_player', { player: playerToPick, token });
    state = await waitForState(sessionAdmin, s => s.draftState.availablePlayers.length === 0 || s.draftState.pickNumber > prevPick, 4000);
  }
  console.log('   Draft finished. Room step:', state.roomStep);

  // Save final score and archive match
  sessionAdmin.emit('save_final_score', { team1Score: 5, team2Score: 3, adminToken });
  await waitForState(sessionAdmin, s => s.matchScore !== null);

  sessionAdmin.emit('archive_current_match', { adminToken });
  state = await waitForState(sessionAdmin, s => s.roomStep === 'setup' || !s.captain1);

  assert(state.captain1 === null, 'New matchday has captain1 === null');
  assert(state.captain2 === null, 'New matchday has captain2 === null');
  assert(state.tossState.winner === null, 'New matchday tossState.winner is null');
  assert(state.firstPickCaptain === null, 'New matchday firstPickCaptain is null');

  // Assign fresh captains (Kabir and Imran) for new matchday
  sessionAdmin.emit('set_match_config', {
    adminToken,
    captain1: kabir,
    captain2: imran
  });
  state = await waitForState(sessionAdmin, s => s.captain1?.name === 'Kabir' && s.captain2?.name === 'Imran');
  assert(state.tossState.winner === null, 'Fresh matchday with Kabir and Imran has NO toss winner');
  assert(state.firstPickCaptain === null, 'Fresh matchday with Kabir and Imran has NO first pick captain');

  // Disconnect sockets
  sessionAdmin.disconnect();
  sessionCap1.disconnect();
  sessionCap2.disconnect();
  sessionSpec.disconnect();

  console.log(`\n========================================================`);
  console.log(`🎉 ALL STALE TOSS AUDIT TESTS PASSED: ${passedTests} / ${passedTests}`);
  console.log(`========================================================`);
  process.exit(0);
}

runStaleTossAudit().catch(err => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
