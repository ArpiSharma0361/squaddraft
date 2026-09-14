import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

/**
 * Creates the 3D golden SQUADDRAFT coin and manages the cinematic flip animation
 * to land precisely on the server-authoritative result (heads or tails).
 */
export function createCoinToss3D() {
  const coinGroup = new THREE.Group();

  // 1. Procedural Coin Face Textures
  function createCoinFaceCanvas(text, isHeads = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Metallic Gold Gradient Base
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    grad.addColorStop(0, '#fef08a'); // Bright gold
    grad.addColorStop(0.5, '#eab308'); // Rich amber gold
    grad.addColorStop(0.9, '#a16207'); // Deep bronze gold
    grad.addColorStop(1, '#713f12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Beaded Outer Coin Rim
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 224, 0, Math.PI * 2);
    ctx.stroke();

    // Center Crest
    ctx.fillStyle = '#451a03';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isHeads) {
      // Soccer Ball icon + HEADS
      ctx.font = '90px sans-serif';
      ctx.fillText('⚽', 256, 210);

      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText('SQUADDRAFT', 256, 310);
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('PRO', 256, 350);

      ctx.font = 'black 28px system-ui, sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.fillText('★ HEADS ★', 256, 410);
    } else {
      // Star Trophy icon + TAILS
      ctx.font = '90px sans-serif';
      ctx.fillText('🏆', 256, 210);

      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillText('SQUADDRAFT', 256, 310);
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('ARENA', 256, 350);

      ctx.font = 'black 28px system-ui, sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.fillText('★ TAILS ★', 256, 410);
    }

    return new THREE.CanvasTexture(canvas);
  }

  const headsTexture = createCoinFaceCanvas('HEADS', true);
  const tailsTexture = createCoinFaceCanvas('TAILS', false);

  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.25
  });
  const headsMat = new THREE.MeshStandardMaterial({
    map: headsTexture,
    metalness: 0.85,
    roughness: 0.3
  });
  const tailsMat = new THREE.MeshStandardMaterial({
    map: tailsTexture,
    metalness: 0.85,
    roughness: 0.3
  });

  // CylinderGeometry materials order: [side, top (heads), bottom (tails)]
  const coinGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.32, 48);
  const coinMesh = new THREE.Mesh(coinGeo, [edgeMat, headsMat, tailsMat]);
  coinMesh.castShadow = true;
  coinMesh.receiveShadow = true;

  // Initial rest position at pitch center
  coinMesh.position.set(0, 0.2, 0);
  coinGroup.add(coinMesh);

  let isFlipping = false;

  /**
   * Triggers the cinematic coin toss animation.
   * @param {string} outcome - 'heads' or 'tails' (from server)
   * @param {Function} onComplete - callback after coin lands
   */
  function startFlip(outcome = 'heads', onComplete = () => {}) {
    if (isFlipping) return;
    isFlipping = true;

    // Reset rotation and initial height
    coinMesh.position.set(0, 0.2, 0);
    coinMesh.rotation.set(0, 0, 0);

    // Target flip rotations:
    // Heads up = rotation.x is 0 (or multiple of 2*PI)
    // Tails up = rotation.x is PI (or odd multiple of PI)
    const spins = 6; // full rotations
    const targetRotX = outcome.toLowerCase() === 'heads'
      ? Math.PI * 2 * spins
      : Math.PI * 2 * spins + Math.PI;

    const targetRotY = Math.PI * 4; // Horizontal spin

    const tl = gsap.timeline({
      onComplete: () => {
        isFlipping = false;
        // Confetti burst
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (e) {}
        onComplete(outcome);
      }
    });

    // 1. Coin ascends with violent spin
    tl.to(coinMesh.position, {
      y: 12.0,
      duration: 1.1,
      ease: 'power2.out'
    }, 0);

    tl.to(coinMesh.rotation, {
      x: targetRotX * 0.6,
      y: targetRotY * 0.6,
      duration: 1.1,
      ease: 'power1.inOut'
    }, 0);

    // 2. Coin descends and settles precisely on target face
    tl.to(coinMesh.position, {
      y: 0.2,
      duration: 1.2,
      ease: 'bounce.out'
    }, 1.1);

    tl.to(coinMesh.rotation, {
      x: targetRotX,
      y: targetRotY,
      duration: 1.2,
      ease: 'power3.out'
    }, 1.1);
  }

  function setVisible(visible) {
    coinGroup.visible = visible;
  }

  return {
    group: coinGroup,
    startFlip,
    setVisible,
    dispose: () => {
      coinGeo.dispose();
      headsTexture.dispose();
      tailsTexture.dispose();
      edgeMat.dispose();
      headsMat.dispose();
      tailsMat.dispose();
    }
  };
}
