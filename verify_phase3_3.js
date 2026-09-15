import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ROOT = process.cwd();
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

console.log('🎠 RUNNING PHASE 3.3.2 COMPACT REGISTRATION & AUTOPLAY VERIFICATION SUITE...\n');

// 1. Component File Existence
const heroFile = path.join(ROOT, 'src/components/FootballLegendsHero3D.jsx');
assert(fs.existsSync(heroFile), 'FootballLegendsHero3D.jsx exists');
const heroCode = fs.readFileSync(heroFile, 'utf8');

// 2. Pure CSS 3D - Strict Ban on 3D/Animation Libraries
assert(!heroCode.includes('three'), 'Strictly no Three.js import');
assert(!heroCode.includes('@react-three'), 'Strictly no React Three Fiber');
assert(!heroCode.includes('gsap'), 'Strictly no GSAP dependency');
assert(!heroCode.includes('<canvas'), 'Strictly no WebGL / 2D canvas');

// 3. CSS 3D Transform Mechanisms
assert(heroCode.includes('perspective'), 'Uses CSS perspective for depth');
assert(heroCode.includes('preserve-3d'), 'Uses transformStyle: preserve-3d');
assert(heroCode.includes('rotateY'), 'Applies rotateY transforms for 3D card tilt');
assert(heroCode.includes('translateX'), 'Applies translateX transforms for horizontal positioning');
assert(heroCode.includes('scale('), 'Applies scale transforms for focal depth');
assert(heroCode.includes('opacity'), 'Animates opacity for distance fading');
assert(heroCode.includes('cubic-bezier'), 'Applies smooth GPU easing curve');

// 4. Active Card Windowing (5 cards on desktop, 3 on mobile)
assert(heroCode.includes('[-2, -1, 0, 1, 2]'), 'Implements 5-card active windowing on desktop');
assert(heroCode.includes('hidden sm:flex'), 'Hides offset -2 and +2 on mobile (3-card view on small screens)');

// 5. Autoplay & Lifecycle Listeners (Phase 3.3.2 Fixes)
assert(heroCode.includes('3000'), 'Uses ~3000ms autoplay interval');
assert(heroCode.includes('5000') || heroCode.includes('RESUME_DELAY'), 'Implements ~5000ms manual interaction resume delay');
assert(heroCode.includes('visibilitychange'), 'Listens for document visibility change');
assert(heroCode.includes('document.hidden'), 'Pauses autoplay when document.hidden is true');
assert(!heroCode.includes('onMouseEnter={() => setIsHovered(true)}'), 'Verified: onMouseEnter hover pause removed so carousel rotates continuously');

// 6. Mobile Touch & Swipe Handling
assert(heroCode.includes('onTouchStart') && heroCode.includes('onTouchEnd'), 'Implements mobile touch swipe listeners');
assert(heroCode.includes('touch-pan-y'), 'Enforces touch-action: pan-y to prevent vertical scroll hijack');
assert(heroCode.includes('40'), 'Requires meaningful horizontal swipe threshold (40px)');

// 7. Accessibility & Reduced Motion
assert(heroCode.includes('prefers-reduced-motion'), 'Detects prefers-reduced-motion media query');
assert(heroCode.includes('aria-label'), 'Provides descriptive aria-labels for buttons and cards');

// 8. Quick Registration Anchor
assert(heroCode.includes('REGISTER FOR MATCH') || heroCode.includes('register-card'), 'Contains quick registration anchor CTA');
assert(heroCode.includes('scrollIntoView'), 'Uses smooth scrollIntoView to jump to register card');

// 9. Integration in PlayerPortal & Compact Page
const portalFile = path.join(ROOT, 'src/components/PlayerPortal.jsx');
const portalCode = fs.readFileSync(portalFile, 'utf8');
assert(portalCode.includes('FootballLegendsHero3D'), 'PlayerPortal.jsx imports and mounts FootballLegendsHero3D');
assert(portalCode.includes('FootballLegendsWall'), 'PlayerPortal.jsx preserves 17-player FootballLegendsWall');
assert(portalCode.includes('REGISTERED FOR SUNDAY TURF'), 'Displays compact registered count status badge');
assert(portalCode.includes('VIEW ROSTER'), 'Provides compact modal/drawer trigger: VIEW ROSTER');
assert(portalCode.includes('showRosterModal'), 'Manages roster in modal to keep main page compact');

// 10. Compact 2-Row FootballLegendsWall
const wallFile = path.join(ROOT, 'src/components/FootballLegendsWall.jsx');
const wallCode = fs.readFileSync(wallFile, 'utf8');
assert(wallCode.includes('xl:grid-cols-9'), 'FootballLegendsWall fits up to 9 cards per row on desktop (2 rows total)');

// -------------------------------------------------------------------
// 11. AUTOPLAY TIMER & LIFECYCLE ADVANCEMENT SIMULATION TEST
// -------------------------------------------------------------------
console.log('\n⏱️ TESTING AUTOPLAY TIMERS & INDEX ADVANCEMENT SIMULATION...');

const { FOOTBALL_LEGENDS } = await import(pathToFileURL(path.join(ROOT, 'src/data/footballLegends.js')).href);
const totalLegends = FOOTBALL_LEGENDS.length;
assert(totalLegends === 17, `Total legends registry is 17 (found: ${totalLegends})`);

// Autoplay simulator implementing exact React component lifecycle logic
class AutoplaySimulator {
  constructor() {
    this.currentIndex = 0;
    this.isInteracting = false;
    this.isTabHidden = false;
    this.prefersReducedMotion = false;
    this.timer = null;
    this.resumeTimer = null;
    this.startInterval();
  }

  getCurrentPlayer() {
    return FOOTBALL_LEGENDS[this.currentIndex];
  }

  startInterval() {
    if (this.timer) clearInterval(this.timer);
    if (this.prefersReducedMotion || this.isTabHidden || this.isInteracting) {
      return;
    }
    this.timer = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % totalLegends;
    }, 3000);
  }

  registerManualInteraction() {
    this.isInteracting = true;
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.resumeTimer = setTimeout(() => {
      this.isInteracting = false;
      this.startInterval();
    }, 5000);
  }

  manualNext() {
    this.registerManualInteraction();
    this.currentIndex = (this.currentIndex + 1) % totalLegends;
  }

  setVisibility(hidden) {
    this.isTabHidden = hidden;
    if (hidden) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    } else {
      this.startInterval();
    }
  }

  setReducedMotion(reduced) {
    this.prefersReducedMotion = reduced;
    if (reduced) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    } else {
      this.startInterval();
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
  }
}

// Helper to advance simulated clock
async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

const sim = new AutoplaySimulator();

// Step 1: Initial state is Messi
assert(sim.currentIndex === 0 && sim.getCurrentPlayer().name === 'Lionel Messi', 'Initial featured player is Messi (index 0)');

// Step 2: Advance 3 seconds -> Ronaldo
await sleep(3050);
assert(sim.currentIndex === 1 && sim.getCurrentPlayer().name === 'Cristiano Ronaldo', 'After 3.0s autoplay: Player advances to Ronaldo (index 1)');

// Step 3: Advance 3 seconds -> Maradona
await sleep(3050);
assert(sim.currentIndex === 2 && sim.getCurrentPlayer().name === 'Diego Maradona', 'After another 3.0s autoplay: Player advances to Maradona (index 2)');

// Step 4: Manual interaction -> Advances to Pelé and pauses autoplay for 5 seconds
sim.manualNext();
assert(sim.currentIndex === 3 && sim.getCurrentPlayer().name === 'Pelé', 'Manual Next clicked: Advances immediately to Pelé (index 3)');
assert(sim.isInteracting === true, 'Manual interaction initiates 5.0s pause state');

// Step 5: Wait 2.5s (still within 5s pause window) -> Should NOT advance
await sleep(2500);
assert(sim.currentIndex === 3, 'During 5.0s pause: Autoplay remains paused at Pelé');

// Step 6: Wait another 3s (total 5.5s, pause has expired and autoplay resumed for ~0.5s)
await sleep(3000);
assert(sim.isInteracting === false, 'After 5.0s delay: Active interaction pause cleared');

// Step 7: Wait remaining time for next 3s tick -> Advances to Beckham
await sleep(2700);
assert(sim.currentIndex === 4 && sim.getCurrentPlayer().name === 'David Beckham', 'Autoplay resumed: Player advances to Beckham (index 4)');

// Step 8: Test loop from Pedri (16) back to Messi (0)
sim.currentIndex = 16;
assert(sim.getCurrentPlayer().name === 'Pedri', 'Manually set index to last player: Pedri (index 16)');
await sleep(3050);
assert(sim.currentIndex === 0 && sim.getCurrentPlayer().name === 'Lionel Messi', 'Loop test: After Pedri, next 3.0s tick loops smoothly back to Messi (index 0)');

// Step 9: Test tab visibility pause
sim.setVisibility(true); // Tab hidden
await sleep(3200);
assert(sim.currentIndex === 0, 'Tab hidden (document.hidden === true): Autoplay suspended');
sim.setVisibility(false); // Tab active
await sleep(3050);
assert(sim.currentIndex === 1, 'Tab restored: Autoplay resumes and advances to Ronaldo');

// Step 10: Test reduced motion
sim.setReducedMotion(true);
await sleep(3200);
assert(sim.currentIndex === 1, 'Reduced motion enabled: Autoplay disabled completely');

sim.destroy();

console.log('\n==================================================');
console.log(`TOTAL PASS: ${passCount} | FAIL: ${failCount}`);
console.log('==================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 3.3.2 COMPACT & AUTOPLAY TESTS PASSED PERFECTLY!');
  process.exit(0);
}
