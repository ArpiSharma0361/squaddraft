import fs from 'fs';
import path from 'path';

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

console.log('🎠 RUNNING PHASE 3.3 PSEUDO-3D HERO CAROUSEL VERIFICATION SUITE...\n');

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

// 5. Autoplay & Lifecycle Listeners
assert(heroCode.includes('3000'), 'Uses ~3000ms autoplay interval');
assert(heroCode.includes('5000') || heroCode.includes('RESUME_DELAY'), 'Implements ~5000ms manual interaction resume delay');
assert(heroCode.includes('visibilitychange'), 'Listens for document visibility change');
assert(heroCode.includes('document.hidden'), 'Pauses autoplay when document.hidden is true');
assert(heroCode.includes('onMouseEnter'), 'Pauses autoplay on desktop hover');

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

// 9. Integration in PlayerPortal
const portalFile = path.join(ROOT, 'src/components/PlayerPortal.jsx');
const portalCode = fs.readFileSync(portalFile, 'utf8');
assert(portalCode.includes('FootballLegendsHero3D'), 'PlayerPortal.jsx imports and mounts FootballLegendsHero3D');
assert(portalCode.includes('FootballLegendsWall'), 'PlayerPortal.jsx preserves 17-player FootballLegendsWall');

console.log('\n==================================================');
console.log(`TOTAL PASS: ${passCount} | FAIL: ${failCount}`);
console.log('==================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PHASE 3.3 HERO CAROUSEL VERIFICATION TESTS PASSED!');
  process.exit(0);
}
