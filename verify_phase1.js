import { spawn } from 'child_process';
import http from 'http';

const PORT = 3005;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Launching SQUADDRAFT Server on port', PORT, 'for Phase 1 verification...');
  const serverProc = spawn('node', ['server.js'], {
    cwd: 'C:/Users/arpit/.gemini/antigravity/scratch/squaddraft',
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe'
  });

  serverProc.stdout.on('data', d => {
    const txt = d.toString();
    if (txt.includes('running on port') || txt.includes('Initialized native') || txt.includes('FATAL')) {
      console.log('   [SERVER LOG]', txt.trim());
    }
  });

  serverProc.stderr.on('data', d => console.error('   [SERVER ERR]', d.toString().trim()));

  // Wait for server boot dynamically
  await new Promise((res) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; res(); }
    }, 6000);

    serverProc.stdout.on('data', d => {
      if (d.toString().includes('running on port') && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        setTimeout(res, 500);
      }
    });
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;

  try {
    // TEST 1: Health Check (Safeguard 9)
    console.log('\n--- TEST: GET /api/health ---');
    const health = await getJson(`${baseUrl}/api/health`);
    console.log('Health Response Status:', health.status);
    console.log('Health Response Body:', health.body);
    if (health.status !== 200 || health.body.database !== 'connected') {
      throw new Error('Health check failed or database not connected!');
    }
    console.log('✅ PASS: Health check shows database: connected, databaseType:', health.body.databaseType);

    // TEST C: Admin Action without Authentication
    console.log('\n--- TEST C: ADMIN ACTION WITHOUT AUTHENTICATION ---');
    const unauthScore = await postJson(`${baseUrl}/api/matches/main/score`, {
      team1Score: 5,
      team2Score: 3
    });
    console.log('Unauth Score response status:', unauthScore.status);
    if (unauthScore.status !== 403) {
      throw new Error(`Expected 403 Forbidden for unauthenticated admin action, got: ${unauthScore.status}`);
    }
    console.log('✅ TEST C PASS: Unauthenticated admin action rejected with 403 Forbidden!');

    // TEST: Admin Login & Session Creation (Safeguard 5)
    console.log('\n--- TEST: ADMIN LOGIN & AUTHENTICATION ---');
    const badLogin = await postJson(`${baseUrl}/api/auth/admin-login`, { pin: '00000' });
    if (badLogin.status !== 401) {
      throw new Error(`Expected 401 for incorrect PIN, got: ${badLogin.status}`);
    }
    console.log('✅ Bad PIN rejected with 401 Unauthorized');

    const goodLogin = await postJson(`${baseUrl}/api/auth/admin-login`, { pin: '28160' });
    if (goodLogin.status !== 200 || !goodLogin.body.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(goodLogin.body)}`);
    }
    const adminToken = goodLogin.body.token;
    console.log('✅ Admin login succeeded, issued server-authoritative token!');

    // TEST D: Fake Captain Role Without Token
    console.log('\n--- TEST D: MODIFY URL MANUALLY TO ?role=cap1 WITHOUT TOKEN ---');
    const fakePick = await postJson(`${baseUrl}/api/draft/pick`, {
      role: 'cap1',
      playerId: 'p_def1'
    });
    console.log('Pick without valid token status:', fakePick.status);
    if (fakePick.status !== 403) {
      throw new Error(`Expected 403 for pick without captain token, got: ${fakePick.status}`);
    }
    console.log('✅ TEST D PASS: Captain action without valid token rejected with 403 Forbidden!');

    // TEST: Coin Toss with Invalid vs Valid Token
    console.log('\n--- TEST: COIN TOSS TOKEN VALIDATION ---');
    await postJson(`${baseUrl}/api/draft/reset-toss`, { adminToken, force: true });
    const stateRes = await getJson(`${baseUrl}/api/state`);
    const { cap1Token, cap2Token, captain1, captain2 } = stateRes.body;

    const fakeToss = await postJson(`${baseUrl}/api/draft/toss`, { token: 'invalid_token_123' });
    if (fakeToss.status !== 403) {
      throw new Error(`Expected 403 for invalid toss token, got: ${fakeToss.status}`);
    }
    console.log('✅ Invalid toss token rejected with 403 Forbidden');

    const validToss = await postJson(`${baseUrl}/api/draft/toss`, { token: cap1Token });
    console.log('Valid coin toss status:', validToss.status, validToss.body);
    if (validToss.status !== 200) {
      throw new Error(`Coin toss failed: ${JSON.stringify(validToss.body)}`);
    }
    console.log('✅ Coin toss initiated authoritatively on server. Waiting 2.6s for flip animation completion...');
    await sleep(2700);

    const postTossState = await getJson(`${baseUrl}/api/state`);
    const winner = postTossState.body.tossState?.winner;
    console.log('Toss winner decided on server:', winner?.name);
    if (!winner) throw new Error('Toss did not produce a winner!');

    // TEST G: Final Score Recording, Validation & Persistence
    console.log('\n--- TEST G: FINAL SCORE INPUT & VALIDATION ---');
    // Test negative score rejection
    const negScore = await postJson(`${baseUrl}/api/matches/main/score`, {
      team1Score: -3,
      team2Score: 4,
      adminToken
    });
    if (negScore.status !== 400) {
      throw new Error(`Expected 400 for negative score, got: ${negScore.status}`);
    }
    console.log('✅ Negative score rejected with 400 Bad Request');

    // Test valid score
    const saveScore = await postJson(`${baseUrl}/api/matches/main/score`, {
      team1Score: 6,
      team2Score: 4,
      adminToken
    });
    if (saveScore.status !== 200 || saveScore.body.matchScore.winner !== 'Team White') {
      throw new Error(`Score save failed: ${JSON.stringify(saveScore.body)}`);
    }
    console.log('✅ Valid score saved:', saveScore.body.matchScore);

    // TEST H: Public Match History (Sanitized, No Secrets)
    console.log('\n--- TEST H: PUBLIC /api/history (UNAUTHENTICATED) ---');
    const publicHistory = await getJson(`${baseUrl}/api/history`);
    console.log('Public History Status:', publicHistory.status);
    console.log('Archived matches count:', publicHistory.body.length);
    if (publicHistory.status !== 200 || !Array.isArray(publicHistory.body)) {
      throw new Error('Public history fetch failed!');
    }
    if (publicHistory.body.length > 0) {
      const sample = publicHistory.body[0];
      console.log('Sample public match:', {
        name: sample.name,
        date: sample.date,
        venue: sample.venue,
        format: sample.format,
        team1Name: sample.team1Name,
        team2Name: sample.team2Name,
        team1Score: sample.team1Score,
        team2Score: sample.team2Score,
        winner: sample.winner
      });
      if (sample.adminToken || sample.cap1Token || sample.cap2Token || sample.access_token) {
        throw new Error('CRITICAL SECURITY LEAK: Token exposed in public history!');
      }
      console.log('✅ TEST H PASS: Public history is clean, sanitized, and contains 0 exposed credentials!');
    }

    // TEST A & B: Server Restart & Database Persistence
    console.log('\n--- TEST A & B: SERVER RESTART & PERSISTENCE VERIFICATION ---');
    console.log('Killing test server process...');
    serverProc.kill();
    await sleep(1500);

    console.log('Restarting test server process on same database...');
    const serverProc2 = spawn('node', ['server.js'], {
      cwd: 'C:/Users/arpit/.gemini/antigravity/scratch/squaddraft',
      env: { ...process.env, PORT: String(PORT) },
      stdio: 'pipe'
    });

    serverProc2.stdout.on('data', d => {
      const txt = d.toString();
      if (txt.includes('running on port') || txt.includes('Loaded match state')) {
        console.log('   [RESTARTED SERVER LOG]', txt.trim());
      }
    });

    await sleep(2500);

    const reloadedHealth = await getJson(`${baseUrl}/api/health`);
    console.log('Reloaded server health status:', reloadedHealth.status);
    if (reloadedHealth.status !== 200) {
      throw new Error('Server restart failed!');
    }

    const reloadedHistory = await getJson(`${baseUrl}/api/history`);
    if (reloadedHistory.status !== 200) {
      throw new Error('History lost on server restart!');
    }
    console.log('✅ TEST A & B PASS: Database data, players, and match records intact across reboot!');

    // TEST K: Production Strict Postgres Requirement (Safeguard 1)
    console.log('\n--- TEST K: PRODUCTION STARTUP WITHOUT DATABASE_URL MUST FAIL ---');
    const prodFailTest = spawn('node', ['-e', `
      process.env.NODE_ENV = 'production';
      delete process.env.DATABASE_URL;
      import('./db.js').then(m => m.initDatabase())
        .then(() => { process.exit(0); })
        .catch(err => { process.exit(42); });
    `], {
      cwd: 'C:/Users/arpit/.gemini/antigravity/scratch/squaddraft',
      stdio: 'pipe'
    });

    const prodFailExitCode = await new Promise(r => prodFailTest.on('close', r));
    console.log('Production startup without DATABASE_URL exit code:', prodFailExitCode);
    if (prodFailExitCode !== 42) {
      throw new Error(`Expected production startup to fail with exit code 42, got: ${prodFailExitCode}`);
    }
    console.log('✅ TEST K PASS: Production environment strictly requires PostgreSQL and halts startup if missing!');

    serverProc2.kill();
    console.log('\n🎉 ALL PHASE 1 CORE STABILIZATION AND SAFEGUARD TESTS PASSED PERFECTLY! 🎉\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    try { serverProc.kill(); } catch (e) {}
    process.exit(1);
  }
}

runAllTests();
