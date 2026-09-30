import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';

function waitForState(socketClient, condition, timeoutMs = 8000) {
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
}

async function getAdminToken() {
  const authRes = await fetch(`${BASE_URL}/api/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '28160' })
  });
  const { token } = await authRes.json();
  if (!token) throw new Error('Admin authentication failed');
  return token;
}

async function runAudit() {
  console.log('🏟️ ========================================================');
  console.log('🏟️ COMPREHENSIVE FIXTURE IDENTITY & TOSS AUDIT');
  console.log('🏟️ ========================================================\n');

  let adminToken = await getAdminToken();
  let admin = io(BASE_URL);
  let cap1 = io(BASE_URL);
  let cap2 = io(BASE_URL);
  let spec = io(BASE_URL);

  await Promise.all([
    new Promise(r => admin.once('connect', r)),
    new Promise(r => cap1.once('connect', r)),
    new Promise(r => cap2.once('connect', r)),
    new Promise(r => spec.once('connect', r)),
  ]);

  let passed = 0;
  function assert(cond, msg) {
    if (!cond) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`   ✅ PASS: ${msg}`);
    passed++;
  }

  const kabir = { id: 'p_kabir_fx', name: 'Kabir', position: 'MID' };
  const imran = { id: 'p_imran_fx', name: 'Imran', position: 'DEF' };
  const ayaan = { id: 'p_ayaan_fx', name: 'Ayaan', position: 'FWD' };

  // 1. Unique ID generated for new fixture
  console.log('--- TEST 1: Unique ID generated for new fixture ---');
  admin.emit('reset_match', { adminToken });
  let state = await waitForState(admin, s => s.roomStep === 'setup' || !s.captain1);
  const matchAId = state.currentMatchId;
  assert(Boolean(matchAId), `Match A currentMatchId generated: ${matchAId}`);
  assert(matchAId.startsWith('match_'), `Match A currentMatchId starts with "match_"`);
  assert(state.tossState.matchId === matchAId, `Match A clean tossState has matchId: ${state.tossState.matchId}`);

  // 2. Configure captains and perform toss
  console.log('\n--- TEST 2: Authoritative Toss bound to Match A ID ---');
  admin.emit('set_match_config', {
    adminToken,
    captain1: kabir,
    captain2: imran
  });
  state = await waitForState(admin, s => s.captain1?.name === 'Kabir' && s.captain2?.name === 'Imran');
  assert(state.currentMatchId === matchAId, 'currentMatchId remains stable across captain assignment');

  admin.emit('set_room_step', { step: 'toss', adminToken });
  await waitForState(admin, s => s.roomStep === 'toss');

  cap1.emit('toss_call_and_flip', { choice: 'heads', token: state.cap1Token });
  state = await waitForState(admin, s => s.tossState?.winner !== null);
  const winnerA = state.tossState.winner.name;
  assert(state.tossState.winner !== null, `Match A Toss Complete! Winner: ${winnerA}`);
  assert(state.tossState.matchId === matchAId, `Toss metadata matchId === matchAId`);
  assert(state.tossState.captain1Id === kabir.id, `Toss metadata captain1Id === kabir.id`);
  assert(state.tossState.captain2Id === imran.id, `Toss metadata captain2Id === imran.id`);

  // 3. Archive Match A & verify fixture ID preservation
  console.log('\n--- TEST 3: Archive preserves original fixture ID ---');
  admin.emit('set_room_step', { step: 'pitch', adminToken });
  await waitForState(admin, s => s.roomStep === 'pitch');

  admin.emit('archive_current_match', { adminToken });
  state = await waitForState(admin, s => s.matchArchive && s.matchArchive.length > 0 && s.currentMatchId !== matchAId);
  const archived = state.matchArchive[0];
  assert(archived.matchId === matchAId, `Archived record references original matchId: ${archived.matchId}`);
  assert(archived.currentMatchId === matchAId, `Archived record references original currentMatchId: ${archived.currentMatchId}`);

  // 4. Match B has completely distinct fixture ID
  console.log('\n--- TEST 4: New match gets new fixture ID ---');
  const matchBId = state.currentMatchId;
  assert(Boolean(matchBId), `Match B currentMatchId generated: ${matchBId}`);
  assert(matchBId !== matchAId, `Match B ID (${matchBId}) !== Match A ID (${matchAId})`);

  // 5. Same captains across consecutive fixtures cannot inherit toss
  console.log('\n--- TEST 5: Same captains across consecutive fixtures cannot inherit toss ---');
  admin.emit('set_match_config', {
    adminToken,
    captain1: kabir,
    captain2: imran
  });
  state = await waitForState(admin, s => s.captain1?.name === 'Kabir' && s.captain2?.name === 'Imran');
  assert(state.tossState.winner === null, 'Match B tossState.winner is strictly NULL');
  assert(state.firstPickCaptain === null, 'Match B firstPickCaptain is strictly NULL');
  assert(state.tossState.coinResult === null, 'Match B coinResult is NULL');
  assert(state.tossState.matchId === matchBId, `Match B clean toss bound to matchBId: ${state.tossState.matchId}`);

  // 6. Complete toss for Match B
  console.log('\n--- TEST 6: Complete authoritative toss for Match B ---');
  admin.emit('set_room_step', { step: 'toss', adminToken });
  await waitForState(admin, s => s.roomStep === 'toss');

  cap1.emit('toss_call_and_flip', { choice: 'tails', token: state.cap1Token });
  state = await waitForState(admin, s => s.tossState?.winner !== null);
  const winnerB = state.tossState.winner.name;
  assert(state.tossState.winner !== null, `Match B Toss Complete! Winner: ${winnerB}`);
  assert(state.tossState.matchId === matchBId, `Match B toss bound to matchBId`);

  // 7. Captain change clears toss
  console.log('\n--- TEST 7: Captain change clears toss ---');
  admin.emit('set_match_config', {
    adminToken,
    captain1: kabir,
    captain2: ayaan // Swap Imran -> Ayaan
  });
  state = await waitForState(admin, s => s.captain2?.name === 'Ayaan');
  assert(state.tossState.winner === null, 'Toss cleared immediately upon captain change');
  assert(state.firstPickCaptain === null, 'firstPickCaptain cleared immediately');
  assert(state.tossState.coinResult === null, 'coinResult cleared immediately');

  // 8. Re-assign Imran and toss again
  admin.emit('set_match_config', {
    adminToken,
    captain1: kabir,
    captain2: imran
  });
  state = await waitForState(admin, s => s.captain2?.name === 'Imran');
  cap1.emit('toss_call_and_flip', { choice: 'heads', token: state.cap1Token });
  state = await waitForState(admin, s => s.tossState?.winner !== null);
  assert(state.tossState.winner !== null, `Toss completed again for Kabir vs Imran`);

  // 9. Spectator receives exact same metadata
  console.log('\n--- TEST 9: Spectator receives synchronized verified toss ---');
  spec.emit('join_room');
  const specState = await waitForState(spec, s => s.currentMatchId === matchBId);
  assert(specState.tossState.winner.id === state.tossState.winner.id, 'Spectator sees identical toss winner');
  assert(specState.tossState.matchId === matchBId, 'Spectator sees identical matchId in tossState');
  assert(specState.firstPickCaptain.id === state.firstPickCaptain.id, 'Spectator sees identical firstPickCaptain');

  admin.disconnect();
  cap1.disconnect();
  cap2.disconnect();
  spec.disconnect();

  console.log('\n========================================================');
  console.log(`🎉 ALL FIXTURE IDENTITY & TOSS TESTS PASSED: ${passed} / ${passed}`);
  console.log('========================================================\n');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
