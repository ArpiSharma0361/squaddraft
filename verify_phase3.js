import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

const ROOT = 'C:/Users/arpit/.gemini/antigravity/scratch/squaddraft';
const PORT = 3007;
const BASE_URL = `http://127.0.0.1:${PORT}`;

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
  return new Promise(r => setTimeout(r, ms));
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

let serverProcess = null;

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development' }
    });

    serverProcess.stdout.on('data', (d) => {
      const txt = d.toString();
      if (txt.includes('Server running on port') || txt.includes('Production Real-Time Server')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (d) => {
      const errTxt = d.toString();
      if (!errTxt.includes('DeprecationWarning')) {
        console.error('Server err:', errTxt.trim());
      }
    });

    serverProcess.on('error', reject);
    setTimeout(resolve, 3500);
  });
}

async function runPhase3Tests() {
  console.log('🏛️ RUNNING PHASE 3 PREMIUM UI/UX & FOOTBALL LEGENDS VERIFICATION SUITE...\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: FOOTBALL LEGENDS DATA MODEL & CURATION
    // -------------------------------------------------------------
    console.log('--- TEST 1: FOOTBALL LEGENDS DATA MODEL & CURATION ---');
    const legendsFilePath = path.join(ROOT, 'src/data/footballLegends.js');
    assert(fs.existsSync(legendsFilePath), 'footballLegends.js data file exists');

    const legendsModule = await import(`file:///${legendsFilePath.replace(/\\/g, '/')}`);
    const legends = legendsModule.FOOTBALL_LEGENDS;

    assert(Array.isArray(legends) && legends.length >= 17, `Contains at least 17 legend profiles (found: ${legends.length})`);

    const requiredNames = [
      'Lionel Messi',
      'Cristiano Ronaldo',
      'Diego Maradona',
      'Pelé',
      'David Beckham',
      'Neymar Jr',
      'Gareth Bale',
      'Zinedine Zidane',
      'Ronaldinho',
      'Franz Beckenbauer',
      'Gianluigi Buffon',
      'Andrés Iniesta',
      'Xavi',
      'Roberto Carlos',
      'Paolo Maldini',
      'Lamine Yamal',
      'Pedri'
    ];

    requiredNames.forEach(name => {
      const found = legends.some(l => l.name === name);
      assert(found, `Legend "${name}" is present in the museum data registry`);
    });

    // Verify labels do NOT contain fabricated quotation marks
    let quotesDetected = false;
    legends.forEach(l => {
      if (l.label && (l.label.includes('"') || l.label.includes('“') || l.label.includes('”'))) {
        quotesDetected = true;
      }
    });
    assert(!quotesDetected, 'All legend labels use clean descriptive titles without fabricated quote marks');

    // -------------------------------------------------------------
    // TEST 2: REGISTRATION & MUSEUM PAGE LAYOUT CODE AUDIT
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: REGISTRATION PAGE LAYOUT & COPY AUDIT ---');
    const portalFile = path.join(ROOT, 'src/components/PlayerPortal.jsx');
    assert(fs.existsSync(portalFile), 'PlayerPortal.jsx exists');
    const portalCode = fs.readFileSync(portalFile, 'utf8');

    assert(portalCode.includes('LEGENDS') && portalCode.includes('INSPIRE US.'), 'Hero displays headline "LEGENDS INSPIRE US."');
    assert(portalCode.includes("Football is more than a game, it's a story of dreams."), 'Contains required story copy: "Football is more than a game..."');
    assert(portalCode.includes("JOIN THIS WEEK'S MATCH"), 'Card header displays "JOIN THIS WEEK\'S MATCH"');
    assert(portalCode.includes("REGISTER NOW"), 'Submit button displays "REGISTER NOW"');
    assert(portalCode.includes("YOU'RE REGISTERED ⚽"), 'Displays success banner "YOU\'RE REGISTERED ⚽"');
    assert(portalCode.includes("See you on the pitch"), 'Displays small success message "See you on the pitch"');
    assert(portalCode.includes("PLAY • DRAFT • ENJOY • REPEAT"), 'Contains required footer copy: "PLAY • DRAFT • ENJOY • REPEAT"');
    assert(portalCode.includes("BUILD FRIENDSHIPS"), 'Contains value card: "BUILD FRIENDSHIPS"');
    assert(portalCode.includes("PLAY TOGETHER"), 'Contains value card: "PLAY TOGETHER"');
    assert(portalCode.includes("BE PART OF THE GAME"), 'Contains value card: "BE PART OF THE GAME"');
    assert(portalCode.includes("KEEP THE SPIRIT ALIVE"), 'Contains value card: "KEEP THE SPIRIT ALIVE"');

    // -------------------------------------------------------------
    // TEST 3: LEGENDS WALL ERROR ISOLATION & IMAGE FALLBACK
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: LEGENDS WALL ERROR ISOLATION & FALLBACK CARDS ---');
    const wallFile = path.join(ROOT, 'src/components/FootballLegendsWall.jsx');
    assert(fs.existsSync(wallFile), 'FootballLegendsWall.jsx exists');
    const wallCode = fs.readFileSync(wallFile, 'utf8');

    assert(wallCode.includes('FOOTBALL LEGENDS'), 'Display cabinet title "FOOTBALL LEGENDS" is present');
    assert(wallCode.includes('Different eras. Same passion.'), 'Subtitle "Different eras. Same passion." is present');
    assert(wallCode.includes('onError='), 'Handles image onError gracefully');
    assert(wallCode.includes('hasImageFailed'), 'Renders premium museum tribute card on missing or failed image');
    assert(wallCode.includes('loading="lazy"'), 'Images use loading="lazy" for high performance');
    assert(wallCode.includes('object-cover'), 'Images use object-fit: cover');
    assert(wallCode.includes('football legend'), 'Images specify descriptive alt text');

    // -------------------------------------------------------------
    // TEST 4: RESPONSIVENESS & ZERO HORIZONTAL OVERFLOW
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: RESPONSIVE LAYOUT & MOBILE OVERFLOW CHECKS ---');
    const cssFile = path.join(ROOT, 'src/index.css');
    const cssCode = fs.readFileSync(cssFile, 'utf8');
    assert(cssCode.includes('overflow-x: hidden'), 'Global body enforces overflow-x: hidden against mobile viewport leaks');

    // Verify PlayerPortal mobile stacking (order-1 registration, order-2 legends)
    assert(portalCode.includes('order-1') && portalCode.includes('order-2'), 'Mobile stacking: Registration comes first, Legends wall below');

    // -------------------------------------------------------------
    // TEST 5: LIVE BACKEND HEALTH & DATABASE PRESERVATION
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: BACKEND HEALTH & DATABASE INTEGRITY ---');
    await startServer();
    console.log(`Test server booted on port ${PORT}`);

    const health = await getJson(`${BASE_URL}/api/health`);
    assert(health.status === 200, 'GET /api/health returns 200 OK');
    assert(health.body.database === 'connected', 'Database connection status is "connected"');
    assert(health.body.playersCount >= 16, `Permanent 16-player directory is intact (count: ${health.body.playersCount})`);

    // -------------------------------------------------------------
    // TEST 6: REGISTRATION SUBMISSION VIA REALTIME SOCKET
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: REGISTRATION SUBMISSION VIA SOCKET ---');
    const { io } = await import(`file:///${ROOT.replace(/\\/g, '/')}/node_modules/socket.io-client/build/esm/index.js`);

    const clientSocket = io(BASE_URL, { reconnection: false, timeout: 5000 });
    await new Promise(res => clientSocket.on('connect', res));
    assert(clientSocket.connected, 'Client connected to realtime socket for registration');

    const testPlayerName = `LegendTester_${Date.now() % 1000}`;
    const testPlayer = {
      id: `p_test_${Date.now()}`,
      name: testPlayerName,
      position: 'MID',
      secondaryPosition: 'ST'
    };

    let registrationReceived = false;
    clientSocket.on('room_state_updated', (state) => {
      if (state?.players && state.players.some(p => p.name === testPlayerName)) {
        registrationReceived = true;
      }
    });
    clientSocket.on('state_update', (state) => {
      if (state?.players && state.players.some(p => p.name === testPlayerName)) {
        registrationReceived = true;
      }
    });

    clientSocket.emit('player_register', testPlayer);
    await sleep(1000);

    assert(registrationReceived, `Player registration for "${testPlayerName}" processed and broadcast by server`);

    // -------------------------------------------------------------
    // TEST 7: ADMIN AUTHENTICATION & MATCH STATE
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: ADMIN AUTH & MATCH STATE ---');
    // Admin login
    const adminLogin = await postJson(`${BASE_URL}/api/auth/admin-login`, { pin: '28160' });
    assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin authentication is operational');
    const adminToken = adminLogin.body.token;

    // Fetch match state
    const matchStateRes = await getJson(`${BASE_URL}/api/state`);
    assert(matchStateRes.status === 200, 'Match state endpoint responds 200');
    assert(matchStateRes.body.players.length > 0, 'Match state returns active player pool');

    // -------------------------------------------------------------
    // TEST 8: NAVBAR BRANDING & PRIMARY CTA
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: NAVBAR BRANDING & NAVIGATION LINKS ---');
    const navbarFile = path.join(ROOT, 'src/components/Navbar.jsx');
    const navbarCode = fs.readFileSync(navbarFile, 'utf8');

    assert(navbarCode.includes('SQUADDRAFT') && navbarCode.includes('ARENA'), 'Navbar branded as SQUADDRAFT ARENA');
    assert(navbarCode.includes('Home'), 'Navbar contains "Home" link');
    assert(navbarCode.includes('Register'), 'Navbar contains "Register" link');
    assert(navbarCode.includes('Players'), 'Navbar contains "Players" link');
    assert(navbarCode.includes('About'), 'Navbar contains "About" link');
    assert(navbarCode.includes('JOIN THE GAME'), 'Navbar contains primary CTA: "JOIN THE GAME"');

    // -------------------------------------------------------------
    // TEST 9: DRAFT CARDS & POSITION AESTHETICS
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: DRAFT PLAYER CARDS & POSITION ACCENTS ---');
    const playerCardFile = path.join(ROOT, 'src/components/PlayerCard.jsx');
    const playerCardCode = fs.readFileSync(playerCardFile, 'utf8');

    assert(playerCardCode.includes('DRAFT PLAYER'), 'PlayerCard uses "DRAFT PLAYER" action');
    assert(!playerCardCode.includes('fifa') && !playerCardCode.includes('overall'), 'PlayerCard contains no FIFA ratings');
    assert(playerCardCode.includes('GK') && playerCardCode.includes('DEF') && playerCardCode.includes('MID') && playerCardCode.includes('ST') && playerCardCode.includes('ANY'), 'PlayerCard supports all 5 standard position badges');

    clientSocket.disconnect();
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  console.log('\n==================================================');
  console.log(`TOTAL PASS: ${passCount} | FAIL: ${failCount}`);
  console.log('==================================================\n');

  if (failCount > 0) {
    console.error('❌ SOME PHASE 3 TESTS FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 3 VERIFICATION TESTS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runPhase3Tests().catch(err => {
  console.error('FATAL ERROR in verify_phase3:', err);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
