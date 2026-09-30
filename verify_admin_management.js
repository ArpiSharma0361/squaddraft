import { io } from 'socket.io-client';
import http from 'http';

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };
    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function connectSocket() {
  return new Promise((resolve, reject) => {
    const socket = io(BASE_URL, { reconnection: false, timeout: 5000 });
    socket.on('connect', () => {
      socket.emit('join_room');
    });
    socket.once('room_state_updated', (state) => {
      resolve({ socket, state });
    });
    socket.on('connect_error', reject);
  });
}

async function runTests() {
  console.log('⚽ ========================================================');
  console.log('⚽ RUNNING SQUADDRAFT PRO ADMIN & DIRECTORY AUDIT SUITE');
  console.log('⚽ ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Admin Authentication & Session Lifecycle
  // -------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Admin Authentication & Session Lifecycle ---');
  
  // 1.1 Valid PIN login
  const loginRes = await makeRequest('POST', '/api/auth/admin-login', { pin: '28160' });
  assert(loginRes.status === 200 && loginRes.data.success && loginRes.data.token, 'Admin PIN login succeeds and returns session token');
  const validToken = loginRes.data?.token;

  // 1.2 Invalid PIN login
  const badLogin = await makeRequest('POST', '/api/auth/admin-login', { pin: '99999' });
  assert(badLogin.status === 401 && badLogin.data.error, 'Invalid PIN is rejected with 401 Unauthorized');

  // 1.3 Validate active session
  const verifyRes = await makeRequest('GET', `/api/auth/verify?token=${validToken}`);
  assert(verifyRes.data.valid === true, 'GET /api/auth/verify returns valid: true for active admin session');

  // 1.4 Validate fake / expired session
  const fakeVerify = await makeRequest('GET', `/api/auth/verify?token=fake_token_12345`);
  assert(fakeVerify.data.valid === false, 'GET /api/auth/verify returns valid: false for forged/invalid token');

  // 1.5 Admin Logout endpoint
  const logoutRes = await makeRequest('POST', '/api/auth/logout', { token: validToken });
  assert(logoutRes.status === 200 && logoutRes.data.success, 'POST /api/auth/logout successfully invalidates session');

  const afterLogoutVerify = await makeRequest('GET', `/api/auth/verify?token=${validToken}`);
  assert(afterLogoutVerify.data.valid === false, 'Session is immediately invalid after logout');

  // Obtain fresh admin token for subsequent tests
  const freshLogin = await makeRequest('POST', '/api/auth/admin-login', { pin: '28160' });
  const adminToken = freshLogin.data.token;

  // -------------------------------------------------------------------------
  // TEST GROUP 2: Socket Directory Permissions & Unauthorized Protection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Unauthorized Admin Access Protection ---');
  const { socket: clientSocket, state: initialState } = await connectSocket();
  assert(Array.isArray(initialState.playerDirectory), 'Initial state includes playerDirectory array');

  // 2.1 Attempt directory_edit_player without admin token
  const unauthEditRes = await new Promise(resolve => {
    clientSocket.emit('directory_edit_player', { id: 'some_id', name: 'Hacker' });
    clientSocket.once('error_message', (err) => resolve({ error: err }));
    setTimeout(() => resolve({ timeout: true }), 1000);
  });
  assert(unauthEditRes.error && unauthEditRes.error.toLowerCase().includes('admin'), 'directory_edit_player rejects unauthenticated socket');

  // 2.2 Attempt directory_deactivate_player without admin token
  const unauthDeactRes = await new Promise(resolve => {
    clientSocket.emit('directory_deactivate_player', { id: 'some_id' });
    clientSocket.once('error_message', (err) => resolve({ error: err }));
    setTimeout(() => resolve({ timeout: true }), 1000);
  });
  assert(unauthDeactRes.error && unauthDeactRes.error.toLowerCase().includes('admin'), 'directory_deactivate_player rejects unauthenticated socket');

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Player Directory Individual Edit & Safe Deactivation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Directory Individual Edit & Deactivation ---');

  // First add a test player to directory
  const testPlayerId = 'test_player_' + Date.now();
  await new Promise(resolve => {
    clientSocket.emit('directory_add_player', {
      player: { id: testPlayerId, name: 'Original Player', position: 'MID', secondaryPosition: 'DEF' },
      adminToken
    });
    clientSocket.once('room_state_updated', resolve);
  });

  // 3.1 Edit player in directory
  const editSyncState = await new Promise(resolve => {
    clientSocket.emit('directory_edit_player', {
      id: testPlayerId,
      name: 'Edited Master Player',
      position: 'ST',
      secondaryPosition: 'GK',
      active: true,
      adminToken
    });
    clientSocket.once('room_state_updated', resolve);
  });

  const editedInDir = editSyncState.playerDirectory.find(p => p.id === testPlayerId);
  assert(
    editedInDir &&
    editedInDir.name === 'Edited Master Player' &&
    editedInDir.position === 'ST' &&
    editedInDir.secondaryPosition === 'GK',
    'directory_edit_player successfully updates player name, primary position, and secondary position'
  );

  // 3.2 Safe deactivation of player
  const deactSyncState = await new Promise(resolve => {
    clientSocket.emit('directory_deactivate_player', {
      id: testPlayerId,
      adminToken
    });
    clientSocket.once('room_state_updated', resolve);
  });

  const deactInDir = deactSyncState.playerDirectory.find(p => p.id === testPlayerId);
  assert(
    deactInDir && (deactInDir.active === 0 || deactInDir.active === false),
    'directory_deactivate_player safely sets active=0/false without deleting player record'
  );

  // -------------------------------------------------------------------------
  // TEST GROUP 4: Active Match Protection Safeguards
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Active-Match Safeguards (Safe Removal) ---');

  // Create another player and add to current active match squad
  const activeMatchPlayerId = 'active_match_player_' + Date.now();
  await new Promise(resolve => {
    clientSocket.emit('directory_add_player', {
      player: { id: activeMatchPlayerId, name: 'Live Match Participant', position: 'DEF' },
      adminToken
    });
    clientSocket.once('room_state_updated', resolve);
  });

  // Select this player for current match squad
  await new Promise(resolve => {
    clientSocket.emit('directory_select_for_match', {
      selectedPlayerIds: [activeMatchPlayerId],
      adminToken
    });
    clientSocket.once('room_state_updated', resolve);
  });

  // Put room into live draft step
  await new Promise(resolve => {
    clientSocket.emit('set_room_step', { step: 'draft', adminToken });
    clientSocket.once('room_state_updated', resolve);
  });

  // Attempt to deactivate player while active in live draft
  const liveDeactError = await new Promise(resolve => {
    clientSocket.emit('directory_deactivate_player', {
      id: activeMatchPlayerId,
      adminToken
    });
    clientSocket.once('error_message', (err) => resolve(err));
    setTimeout(() => resolve(null), 1500);
  });

  assert(
    liveDeactError && liveDeactError.includes('participating in an active match or live draft'),
    'Safeguard blocks deactivating player while participating in an active draft'
  );

  // Reset room step back to setup
  await new Promise(resolve => {
    clientSocket.emit('set_room_step', { step: 'setup', adminToken });
    clientSocket.once('room_state_updated', resolve);
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 5: Player Count Distinction (Permanent Directory vs Current Match)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Player Count Distinction & Sync ---');

  // Clear matchday roster (does NOT affect permanent directory)
  const rosterClearedState = await new Promise(resolve => {
    clientSocket.emit('admin_clear_roster', { adminToken });
    clientSocket.once('room_state_updated', resolve);
  });

  assert(rosterClearedState.players.length === 0, 'Current matchday squad is 0 after clear roster');
  assert(rosterClearedState.playerDirectory.length > 0, 'Permanent player directory is preserved and not emptied by clear roster');

  // Clean up test player
  await new Promise(resolve => {
    clientSocket.emit('directory_remove_player', { id: testPlayerId, adminToken });
    clientSocket.emit('directory_remove_player', { id: activeMatchPlayerId, adminToken });
    setTimeout(resolve, 500);
  });

  clientSocket.disconnect();

  console.log('\n========================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
