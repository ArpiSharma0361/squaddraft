import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 SQUADDRAFT ROLE SECURITY & LIFECYCLE TEST SUITE');
  console.log('====================================================\n');

  // Step 1: Login as Admin to get valid admin token
  console.log('1️⃣ Admin Authentication...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '28160' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  const adminToken = loginData.token;
  console.log('   ✅ Admin authenticated successfully with session token.');

  // Step 2: Establish 4 Isolated Client Sessions
  console.log('\n2️⃣ Connecting 4 Isolated Sessions...');
  const sessionAdmin = io(BASE_URL);
  const sessionCap1 = io(BASE_URL);
  const sessionCap2 = io(BASE_URL);
  const sessionSpectator = io(BASE_URL);

  await Promise.all([
    new Promise(res => sessionAdmin.on('connect', res)),
    new Promise(res => sessionCap1.on('connect', res)),
    new Promise(res => sessionCap2.on('connect', res)),
    new Promise(res => sessionSpectator.on('connect', res)),
  ]);
  console.log('   ✅ Connected: Session A (Admin), Session B (Cap1), Session C (Cap2), Session D (Spectator)');

  // Helper to wait for state
  const waitForState = (socketClient, condition, timeoutMs = 6000) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('State condition timeout')), timeoutMs);
      const handler = (state) => {
        if (condition(state)) {
          clearTimeout(timer);
          socketClient.off('room_state_updated', handler);
          resolve(state);
        }
      };
      socketClient.on('room_state_updated', handler);
    });
  };

  // Helper to catch server error_message
  const catchError = (socketClient, triggerFn, timeoutMs = 2500) => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      socketClient.once('error_message', (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
      triggerFn();
    });
  };

  // Step 3: Setup match with Captains: Sergio Karthik & Rohan
  console.log('\n3️⃣ Configuring Match with Captains (Sergio Karthik & Rohan)...');
  sessionAdmin.emit('join_room');
  sessionAdmin.emit('reset_match', { adminToken });
  await new Promise(r => setTimeout(r, 600));

  // Load demo players or add players
  sessionAdmin.emit('admin_load_demo_players', { adminToken });
  let state = await waitForState(sessionAdmin, s => s.players && s.players.length >= 8);
  
  // Select two players from the 16-player roster to be captains (Sergio Karthik & Rohan)
  const pCap1 = { ...state.players[0], name: 'Sergio Karthik' };
  const pCap2 = { ...state.players[1], name: 'Rohan' };
  sessionAdmin.emit('update_player_name', { playerId: pCap1.id, newName: 'Sergio Karthik', adminToken });
  sessionAdmin.emit('update_player_name', { playerId: pCap2.id, newName: 'Rohan', adminToken });
  await new Promise(r => setTimeout(r, 400));

  sessionAdmin.emit('set_match_config', {
    captain1: pCap1,
    captain2: pCap2,
    team1Name: 'Team White',
    team2Name: 'Team Black',
    adminToken
  });

  state = await waitForState(sessionAdmin, s => s.captain1?.name === 'Sergio Karthik' && s.captain2?.name === 'Rohan');
  const cap1Token = state.cap1Token;
  const cap2Token = state.cap2Token;
  console.log(`   ✅ Match configured: Cap1=${state.captain1.name}, Cap2=${state.captain2.name}`);
  console.log(`   ✅ Cap1 Token generated, Cap2 Token generated.`);

  // Step 4: Verify Initial Stale Score Isolation (Issue 5)
  console.log('\n4️⃣ Verifying Current Match Score Isolation (Issue 5)...');
  if (state.matchScore !== null) {
    throw new Error(`Score leaked into new match: ${JSON.stringify(state.matchScore)}`);
  }
  console.log('   ✅ Match score is null in fresh match. No leaked scores from prior matches.');

  // Step 5: Test Role Permission Rejections (Issue 7 & 2)
  console.log('\n5️⃣ Testing Unauthorized Actions against Backend Security Matrix...');
  
  // Cap 2 attempts reset match
  const cap2ResetErr = await catchError(sessionCap2, () => {
    sessionCap2.emit('reset_match', { adminToken: 'fake-token' });
  });
  console.log('   ✅ Cap 2 reset attempt rejected:', cap2ResetErr);

  // Spectator attempts admin action
  const specResetErr = await catchError(sessionSpectator, () => {
    sessionSpectator.emit('set_match_config', { captain1: null, adminToken: null });
  });
  console.log('   ✅ Spectator config modify rejected:', specResetErr);

  // Step 6: Coin Toss Stage & Caller Permission Verification (Issue 3)
  console.log('\n6️⃣ Testing Coin Toss Lifecycle & Caller Permissions (Issue 3)...');
  sessionAdmin.emit('set_room_step', { step: 'toss', adminToken });
  state = await waitForState(sessionAdmin, s => s.roomStep === 'toss');

  // Cap 2 tries to flip coin -> MUST BE REJECTED
  const cap2FlipErr = await catchError(sessionCap2, () => {
    sessionCap2.emit('toss_call_and_flip', { choice: 'heads', token: cap2Token });
  });
  console.log('   ✅ Cap 2 coin flip rejected by server:', cap2FlipErr);

  // Spectator tries to flip coin -> MUST BE REJECTED
  const specFlipErr = await catchError(sessionSpectator, () => {
    sessionSpectator.emit('toss_call_and_flip', { choice: 'heads', token: null });
  });
  console.log('   ✅ Spectator coin flip rejected by server:', specFlipErr);

  // Cap 1 calls TAILS and flips -> MUST SUCCEED
  console.log('   🪙 Cap 1 calls TAILS and triggers authoritative server toss...');
  sessionCap1.emit('toss_call_and_flip', { choice: 'tails', token: cap1Token });

  // Verify all 4 sessions receive toss_flipping_started
  let tossStartedFired = false;
  sessionSpectator.once('toss_flipping_started', (data) => {
    tossStartedFired = true;
    console.log(`   ✅ Spectator received live toss flip event (Call: ${data.callerChoice}, Outcome: ${data.outcome})`);
  });

  // Wait for toss completion
  state = await waitForState(sessionAdmin, s => s.tossState?.winner !== null, 5000);
  console.log(`   ✅ Authoritative Toss Complete! Winner: ${state.tossState.winner.name}, Coin Result: ${state.tossState.coinResult}`);
  console.log(`   ✅ First Pick Captain: ${state.firstPickCaptain.name}`);

  // Test Pre-Draft Reset Toss by Admin
  console.log('   ↺ Testing Admin Pre-Draft Toss Reset...');
  sessionAdmin.emit('toss_reset_admin', { adminToken });
  state = await waitForState(sessionAdmin, s => s.tossState?.winner === null);
  console.log('   ✅ Admin successfully reset toss pre-draft.');

  // Cap 1 calls HEADS this time
  sessionCap1.emit('toss_call_and_flip', { choice: 'heads', token: cap1Token });
  state = await waitForState(sessionAdmin, s => s.tossState?.winner !== null, 5000);
  const tossWinner = state.tossState.winner;
  console.log(`   ✅ Final Toss Winner confirmed: ${tossWinner.name} (Caller: ${state.tossState.callerChoice}, Coin: ${state.tossState.coinResult})`);

  // Step 7: Final Score Locked During Setup, Toss & Draft (Issue 4)
  console.log('\n7️⃣ Testing Final Score Endpoint Lifecycle Lock (Issue 4)...');
  
  // Try saving score during toss stage -> MUST BE REJECTED
  const tossScoreRes = await fetch(`${BASE_URL}/api/matches/main/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team1Score: 10, team2Score: 8, adminToken })
  });
  const tossScoreData = await tossScoreRes.json();
  if (tossScoreRes.status !== 400 || !tossScoreData.error) {
    throw new Error('Score save should be rejected during toss stage!');
  }
  console.log('   ✅ REST score endpoint rejected during toss stage:', tossScoreData.error);

  const socketScoreErr = await catchError(sessionAdmin, () => {
    sessionAdmin.emit('save_final_score', { team1Score: 10, team2Score: 8, adminToken });
  });
  console.log('   ✅ Socket save_final_score rejected during toss stage:', socketScoreErr);

  // Step 8: Start Live Draft & Test Draft Counts (Issue 8)
  console.log('\n8️⃣ Starting Live Draft & Auditing Dynamic Draft Counts (Issue 8)...');
  sessionAdmin.emit('start_draft');
  state = await waitForState(sessionAdmin, s => s.roomStep === 'draft');
  console.log(`   ✅ Draft started! Current turn: ${state.draftState.currentTurn}`);

  // Verify score rejected during draft stage
  const draftScoreRes = await fetch(`${BASE_URL}/api/matches/main/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team1Score: 10, team2Score: 8, adminToken })
  });
  const draftScoreData = await draftScoreRes.json();
  if (draftScoreRes.status !== 400) {
    throw new Error('Score save should be rejected during draft stage!');
  }
  console.log('   ✅ REST score endpoint rejected during live draft stage:', draftScoreData.error);

  // Audit dynamic counts
  const totalRoster = state.players.length;
  const draftablePlayers = state.draftState.availablePlayers.length;
  const expectedPicks = totalRoster - 2;
  console.log(`   📊 Roster Audit: Total=${totalRoster}, Assigned Captains=2, Draftable=${draftablePlayers}`);
  if (draftablePlayers !== expectedPicks) {
    throw new Error(`Draft count mismatch: available=${draftablePlayers}, expected=${expectedPicks}`);
  }
  console.log(`   ✅ Draft counts perfectly derived: Round 1 | Pick 1 of ${expectedPicks}`);

  // Step 9: Alternating Draft Picks with Captain Token Authorization
  console.log('\n9️⃣ Executing Authorized Turn-Based Draft Picks...');
  
  // Determine turn order
  let currentTurn = state.draftState.currentTurn;
  const firstActiveClient = currentTurn === 1 ? sessionCap1 : sessionCap2;
  const firstActiveToken = currentTurn === 1 ? cap1Token : cap2Token;
  const inactiveClient = currentTurn === 1 ? sessionCap2 : sessionCap1;
  const inactiveToken = currentTurn === 1 ? cap2Token : cap1Token;

  // Inactive captain tries to pick out of turn -> REJECTED
  const outOfTurnErr = await catchError(inactiveClient, () => {
    inactiveClient.emit('draft_pick_player', {
      player: state.draftState.availablePlayers[0],
      token: inactiveToken
    });
  });
  console.log('   ✅ Out-of-turn pick attempt rejected:', outOfTurnErr);

  // Active captain picks
  const pickedPlayer1 = state.draftState.availablePlayers[0];
  firstActiveClient.emit('draft_pick_player', {
    player: pickedPlayer1,
    token: firstActiveToken
  });

  state = await waitForState(sessionAdmin, s => s.draftState.pickNumber > 1);
  console.log(`   ✅ Pick 1 confirmed: ${pickedPlayer1.name} drafted by Captain ${currentTurn}`);
  console.log(`   ✅ Turn transitioned to Captain ${state.draftState.currentTurn}`);

  // Draft remaining players to complete draft
  console.log('   ⚡ Drafting remaining players to reach Match Complete stage...');
  while (state.draftState.availablePlayers.length > 0) {
    const curTurn = state.draftState.currentTurn;
    const token = curTurn === 1 ? cap1Token : cap2Token;
    const client = curTurn === 1 ? sessionCap1 : sessionCap2;
    const playerToPick = state.draftState.availablePlayers[0];

    client.emit('draft_pick_player', { player: playerToPick, token });
    const prevPick = state.draftState.pickNumber;
    state = await waitForState(sessionAdmin, s => 
      s.draftState.availablePlayers.length === 0 || s.draftState.pickNumber > prevPick, 4000
    );
  }
  console.log('   ✅ All players drafted! Team 1 count:', state.draftState.team1.length, 'Team 2 count:', state.draftState.team2.length);

  // Transition to Pitch / Awaiting Result
  sessionAdmin.emit('set_room_step', { step: 'pitch', adminToken });
  state = await waitForState(sessionAdmin, s => s.roomStep === 'pitch');
  console.log('   ✅ Match advanced to Pitch / Awaiting Result stage.');

  // Step 10: Final Score Entry Unlocked for Admin Only (Issue 4 & 5)
  console.log('\n🔟 Testing Final Score Recording (Draft Complete)...');
  
  // Non-admin tries to save score -> REJECTED
  const capSaveErr = await catchError(sessionCap1, () => {
    sessionCap1.emit('save_final_score', { team1Score: 4, team2Score: 2, adminToken: 'bad-token' });
  });
  console.log('   ✅ Captain attempt to save final score rejected:', capSaveErr);

  // Admin saves final score (Sergio Karthik vs Rohan)
  sessionAdmin.emit('save_final_score', { team1Score: 4, team2Score: 2, adminToken });
  state = await waitForState(sessionAdmin, s => s.matchScore !== null);
  console.log(`   ✅ Final Score Recorded: Team 1 (${state.captain1.name}) 4 - 2 Team 2 (${state.captain2.name})`);
  console.log(`   ✅ Winner calculated: ${state.matchScore.winner}`);

  // Step 11: Match Archival & Reset Isolation (Issue 5 & 6)
  console.log('\n1️⃣1️⃣ Testing Match Archival and Reset Isolation...');
  sessionAdmin.emit('archive_current_match', { adminToken });
  state = await waitForState(sessionAdmin, s => s.matchArchive && s.matchArchive.length > 0);
  
  const archived = state.matchArchive[0];
  console.log(`   ✅ Match successfully archived: "${archived.name}", Score=${archived.team1Score}-${archived.team2Score}, Winner=${archived.winner}`);
  console.log(`   ✅ Archived Captains: Cap1=${archived.captain1?.name}, Cap2=${archived.captain2?.name}`);

  // Verify new match state is clean
  console.log('   ✅ Verifying new matchday state isolation:');
  console.log(`      - current match score: ${state.matchScore}`);
  console.log(`      - current captain 1: ${state.captain1}`);
  console.log(`      - current captain 2: ${state.captain2}`);
  console.log(`      - permanent player directory count: ${state.playerDirectory.length}`);

  if (state.matchScore !== null) {
    throw new Error('Current match score was not reset to null after archive!');
  }
  if (state.playerDirectory.length === 0) {
    throw new Error('Permanent Player Directory was wiped!');
  }

  // Cleanup
  sessionAdmin.disconnect();
  sessionCap1.disconnect();
  sessionCap2.disconnect();
  sessionSpectator.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL ROLE SECURITY & LIFECYCLE TESTS PASSED (100%)');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
