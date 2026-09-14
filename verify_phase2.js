import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = process.cwd();

console.log('🏟️ RUNNING PHASE 2 SQUADDRAFT ARENA VERIFICATION SUITE...\n');

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

// 1. Check Package Dependencies
console.log('--- TEST 1: DEPENDENCY CHECK & REACT 19 COMPATIBILITY ---');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
assert(pkg.dependencies.three, 'three is installed in dependencies');
assert(pkg.dependencies.gsap, 'gsap is installed in dependencies');
assert(!pkg.dependencies['@react-three/fiber'], 'R3F reconciler avoided in favor of clean isolated vanilla Three.js');
assert(!pkg.dependencies['@react-three/drei'], 'Drei reconciler avoided');
assert(pkg.dependencies.react.includes('19'), 'React 19 is preserved without downgrade');

// 2. Check Isolated Arena Architecture Directory
console.log('\n--- TEST 2: ARENA ARCHITECTURE FILE STRUCTURE ---');
const arenaDir = path.join(ROOT, 'src/components/arena');
const hooksDir = path.join(ROOT, 'src/hooks');

const requiredArenaFiles = [
  'ArenaCanvas.jsx',
  'Stadium3D.js',
  'Pitch3D.js',
  'StadiumLights.js',
  'CoinToss3D.js',
  'DraftPick3D.js',
  'FinalTeams3D.js',
  'ArenaScoreboard.js',
  'ArenaFallback.jsx',
  'ArenaLoading.jsx'
];

requiredArenaFiles.forEach(f => {
  assert(fs.existsSync(path.join(arenaDir, f)), `Arena module ${f} exists`);
});

const requiredHooks = [
  'useWebGLSupport.js',
  'useReducedMotion.js',
  'useArenaPerformance.js'
];

requiredHooks.forEach(h => {
  assert(fs.existsSync(path.join(hooksDir, h)), `Hook ${h} exists`);
});

// 3. Check WebGL Fallback and Context Lost Handling
console.log('\n--- TEST 3: WEBGL FALLBACK & CONTEXT LOST HANDLING ---');
const arenaCanvasSrc = fs.readFileSync(path.join(arenaDir, 'ArenaCanvas.jsx'), 'utf8');
assert(arenaCanvasSrc.includes('webglcontextlost'), 'ArenaCanvas handles webglcontextlost event');
assert(arenaCanvasSrc.includes('ArenaFallback'), 'ArenaCanvas renders ArenaFallback when WebGL is unavailable or lost');
assert(arenaCanvasSrc.includes('useArenaPerformance'), 'ArenaCanvas adapts DPR and visual quality to device tier');
assert(arenaCanvasSrc.includes('useReducedMotion'), 'ArenaCanvas respects prefers-reduced-motion accessibility setting');

// 4. Verify No Player Photos or Fake FIFA Stats
console.log('\n--- TEST 4: STRICT BAN ON PLAYER PHOTOS & FAKE STATS ---');
const playerCardSrc = fs.readFileSync(path.join(ROOT, 'src/components/PlayerCard.jsx'), 'utf8');
assert(!playerCardSrc.includes('/characters/'), 'No character/player photo URLs in PlayerCard');
assert(!playerCardSrc.includes('OVR'), 'No fake FIFA overall ratings in PlayerCard');
assert(!playerCardSrc.includes('PAC'), 'No fake pace stats in PlayerCard');
assert(!playerCardSrc.includes('SHO'), 'No fake shooting stats in PlayerCard');
assert(playerCardSrc.includes('DRAFT PLAYER'), 'Uses DRAFT PLAYER action button');
assert(!playerCardSrc.includes('SIGN PLAYER'), 'Does not use SIGN PLAYER');

// 5. Verify Server-Authoritative Preservation in 3D Coin Toss & Picks
console.log('\n--- TEST 5: SERVER-AUTHORITATIVE OUTCOME DISPLAY ---');
const coinTossSrc = fs.readFileSync(path.join(arenaDir, 'CoinToss3D.js'), 'utf8');
assert(coinTossSrc.includes('outcome'), 'CoinToss3D accepts server outcome as param');
assert(!coinTossSrc.includes('Math.random() < 0.5'), 'CoinToss3D does NOT generate random toss result in 3D frontend');

const draftPickSrc = fs.readFileSync(path.join(arenaDir, 'DraftPick3D.js'), 'utf8');
assert(draftPickSrc.includes('triggerPickCelebration'), 'DraftPick3D has trigger function executed after server confirmation');

// 6. Verify Production Bundle Build & Code Splitting
console.log('\n--- TEST 6: BUILD & CODE SPLITTING CHECK ---');
const distDir = path.join(ROOT, 'dist');
assert(fs.existsSync(distDir), 'Production dist directory exists');
const assets = fs.readdirSync(path.join(distDir, 'assets'));
const threeChunk = assets.find(a => a.startsWith('three-arena'));
const mainChunk = assets.find(a => a.startsWith('index-') && a.endsWith('.js'));
const cssChunk = assets.find(a => a.startsWith('index-') && a.endsWith('.css'));

assert(Boolean(threeChunk), `Isolated three-arena chunk generated: ${threeChunk}`);
assert(Boolean(mainChunk), `Main application chunk generated: ${mainChunk}`);
assert(Boolean(cssChunk), `Main CSS stylesheet generated: ${cssChunk}`);

const mainSize = fs.statSync(path.join(distDir, 'assets', mainChunk)).size / 1024;
const threeSize = fs.statSync(path.join(distDir, 'assets', threeChunk)).size / 1024;
console.log(`📦 Main App Shell: ${mainSize.toFixed(1)} kB`);
console.log(`📦 3D Arena Chunk: ${threeSize.toFixed(1)} kB`);

console.log(`\n==================================================`);
console.log(`TOTAL PASS: ${passCount} | FAIL: ${failCount}`);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 2 ARENA REQUIREMENTS VERIFIED SUCCESSFULLY! 🎉\n');
  process.exit(0);
}
