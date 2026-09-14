import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

console.log('🧪 RUNNING PHASE 2.1 ADMIN REGRESSION VERIFICATION SUITE...\n');

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

// TEST 1: Check ArenaErrorBoundary implementation
console.log('--- TEST 1: ARENA ERROR BOUNDARY IMPLEMENTATION ---');
const errorBoundaryPath = path.join(ROOT, 'src/components/arena/ArenaErrorBoundary.jsx');
assert(fs.existsSync(errorBoundaryPath), 'ArenaErrorBoundary.jsx exists in src/components/arena');
const errorBoundaryCode = fs.readFileSync(errorBoundaryPath, 'utf8');
assert(errorBoundaryCode.includes('class ArenaErrorBoundary extends React.Component'), 'ArenaErrorBoundary is a React ErrorBoundary class');
assert(errorBoundaryCode.includes('static getDerivedStateFromError'), 'ArenaErrorBoundary implements getDerivedStateFromError');
assert(errorBoundaryCode.includes('componentDidCatch'), 'ArenaErrorBoundary implements componentDidCatch');
assert(errorBoundaryCode.includes('ArenaFallback'), 'ArenaErrorBoundary renders ArenaFallback on error');
assert(errorBoundaryCode.includes('Retry 3D') || errorBoundaryCode.includes('handleRetry'), 'ArenaErrorBoundary provides retry capability');

// TEST 2: Check AdminDashboard for safe prop handling and isolation
console.log('\n--- TEST 2: ADMIN DASHBOARD PROPS & ERROR BOUNDARY ISOLATION ---');
const adminPath = path.join(ROOT, 'src/components/AdminDashboard.jsx');
const adminCode = fs.readFileSync(adminPath, 'utf8');
assert(adminCode.includes("import { ArenaErrorBoundary } from './arena/ArenaErrorBoundary'"), 'AdminDashboard imports ArenaErrorBoundary');
assert(adminCode.includes("roomStep = 'setup'"), 'AdminDashboard accepts roomStep with default fallback');
assert(adminCode.includes("draftState = null"), 'AdminDashboard accepts draftState with default fallback');
assert(adminCode.includes("finalTeam1 = []"), 'AdminDashboard accepts finalTeam1 with default fallback');
assert(adminCode.includes("finalTeam2 = []"), 'AdminDashboard accepts finalTeam2 with default fallback');
assert(adminCode.includes("tossState = null"), 'AdminDashboard accepts tossState with default fallback');
assert(adminCode.includes("safeRoomState"), 'AdminDashboard constructs safeRoomState with null/undefined guards');
assert(!adminCode.includes("roomState?.finalTeam1"), 'AdminDashboard does NOT access undeclared roomState');
assert(adminCode.includes("<ArenaErrorBoundary"), 'AdminDashboard wraps 3D Arena preview inside ArenaErrorBoundary');

// TEST 3: Check App.jsx passes missing props to AdminDashboard
console.log('\n--- TEST 3: APP.JSX PROP PASSING TO ADMIN DASHBOARD ---');
const appPath = path.join(ROOT, 'src/App.jsx');
const appCode = fs.readFileSync(appPath, 'utf8');
assert(appCode.includes("roomStep={roomStep}"), 'App.jsx passes roomStep to AdminDashboard');
assert(appCode.includes("draftState={draftState}"), 'App.jsx passes draftState to AdminDashboard');
assert(appCode.includes("finalTeam1={finalTeam1}"), 'App.jsx passes finalTeam1 to AdminDashboard');
assert(appCode.includes("finalTeam2={finalTeam2}"), 'App.jsx passes finalTeam2 to AdminDashboard');
assert(appCode.includes("tossState={tossState}"), 'App.jsx passes tossState to AdminDashboard');

// TEST 4: Check ErrorBoundary isolation in TossArena, DraftRoom, SpectatorBroadcast
console.log('\n--- TEST 4: ERROR BOUNDARY ISOLATION ACROSS ALL ARENA SURFACES ---');
const tossCode = fs.readFileSync(path.join(ROOT, 'src/components/TossArena.jsx'), 'utf8');
const draftCode = fs.readFileSync(path.join(ROOT, 'src/components/DraftRoom.jsx'), 'utf8');
const specCode = fs.readFileSync(path.join(ROOT, 'src/components/SpectatorBroadcast.jsx'), 'utf8');
assert(tossCode.includes("<ArenaErrorBoundary"), 'TossArena wraps ArenaCanvas in ArenaErrorBoundary');
assert(draftCode.includes("<ArenaErrorBoundary"), 'DraftRoom wraps ArenaCanvas in ArenaErrorBoundary');
assert(specCode.includes("<ArenaErrorBoundary"), 'SpectatorBroadcast wraps ArenaCanvas in ArenaErrorBoundary');

// TEST 5: Production Build Integrity
console.log('\n--- TEST 5: PRODUCTION BUNDLE VALIDATION ---');
const distAssets = path.join(ROOT, 'dist/assets');
assert(fs.existsSync(distAssets), 'Production dist/assets exists');
const distFiles = fs.readdirSync(distAssets);
const mainAppJs = distFiles.find(f => f.startsWith('index-') && f.endsWith('.js'));
assert(!!mainAppJs, `Main application bundle found: ${mainAppJs}`);
const mainJsCode = fs.readFileSync(path.join(distAssets, mainAppJs), 'utf8');
assert(!mainJsCode.includes('roomState.finalTeam1'), 'Bundle contains no broken roomState global lookups');
assert(mainJsCode.includes('ArenaErrorBoundary') || mainJsCode.includes('hasError'), 'Bundle contains ErrorBoundary fault isolation logic');

console.log(`\n==================================================`);
console.log(`TOTAL PASS: ${passCount} | FAIL: ${failCount}`);
console.log(`==================================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 PHASE 2.1 REGRESSION TESTS ALL PASSED!');
}
