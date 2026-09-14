import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Creates and manages position-specific 3D celebration effects upon confirmed picks.
 */
export function createDraftPick3D({ pitchWidth = 36, pitchLength = 56 } = {}) {
  const pickGroup = new THREE.Group();

  // 1. Expanding Shield Ring (GK / DEF)
  const ringGeo = new THREE.RingGeometry(0.5, 2.2, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.1;
  pickGroup.add(ringMesh);

  // 2. Goal Blast / Energy Sphere (GK / ST)
  const sphereGeo = new THREE.SphereGeometry(1.5, 24, 24);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0,
    wireframe: true
  });
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  sphereMesh.position.y = 1.8;
  pickGroup.add(sphereMesh);

  // 3. Passing Energy Line (MID)
  const lineGeo = new THREE.CylinderGeometry(0.2, 0.2, 28, 12);
  lineGeo.rotateZ(Math.PI / 2);
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0
  });
  const lineMesh = new THREE.Mesh(lineGeo, lineMat);
  lineMesh.position.y = 0.4;
  pickGroup.add(lineMesh);

  /**
   * Plays the position-specific celebration strictly AFTER server confirms the pick.
   * @param {string} position - 'GK', 'DEF', 'MID', 'ST', 'FWD', 'ANY'
   * @param {number} teamNumber - 1 (Captain 1 / left) or 2 (Captain 2 / right)
   */
  function triggerPickCelebration(position = 'MID', teamNumber = 1) {
    const posUpper = (position || 'MID').toUpperCase();
    const targetX = teamNumber === 1 ? -10 : 10;
    const targetZ = 0;

    // Reset initial states
    ringMesh.scale.set(0.2, 0.2, 0.2);
    ringMesh.position.set(targetX, 0.1, targetZ);
    sphereMesh.scale.set(0.3, 0.3, 0.3);
    sphereMesh.position.set(targetX, 1.8, targetZ);
    lineMesh.scale.set(0.1, 0.1, 0.1);
    lineMesh.position.set(0, 0.4, targetZ);

    if (posUpper === 'GK') {
      // Golden Amber Goal Shield
      ringMat.color.setHex(0xf59e0b);
      sphereMat.color.setHex(0xfbbf24);

      const tl = gsap.timeline();
      tl.to([ringMat, sphereMat], { opacity: 0.9, duration: 0.15 });
      tl.to(ringMesh.scale, { x: 7.0, y: 7.0, z: 7.0, duration: 0.9, ease: 'power2.out' }, 0);
      tl.to(sphereMesh.scale, { x: 4.5, y: 4.5, z: 4.5, duration: 0.9, ease: 'power2.out' }, 0);
      tl.to([ringMat, sphereMat], { opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.55);

    } else if (posUpper === 'DEF') {
      // Blue Defensive Impact Barrier
      ringMat.color.setHex(0x0284c7);
      sphereMat.color.setHex(0x38bdf8);

      const tl = gsap.timeline();
      tl.to(ringMat, { opacity: 1.0, duration: 0.1 });
      tl.to(ringMesh.scale, { x: 9.0, y: 9.0, z: 9.0, duration: 0.8, ease: 'power3.out' }, 0);
      tl.to(ringMat, { opacity: 0, duration: 0.4 }, 0.4);

    } else if (posUpper === 'MID') {
      // Green Energy Passing Line across Pitch
      lineMat.color.setHex(0x10b981);
      ringMat.color.setHex(0x34d399);

      const tl = gsap.timeline();
      tl.to([lineMat, ringMat], { opacity: 0.95, duration: 0.1 });
      tl.to(lineMesh.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 0.7, ease: 'power2.out' }, 0);
      tl.to(ringMesh.scale, { x: 5.0, y: 5.0, z: 5.0, duration: 0.7, ease: 'power2.out' }, 0);
      tl.to([lineMat, ringMat], { opacity: 0, duration: 0.4 }, 0.4);

    } else if (posUpper === 'ST' || posUpper === 'FWD') {
      // Red-Orange Striker Goal Strike
      sphereMat.color.setHex(0xf97316);
      ringMat.color.setHex(0xef4444);

      const tl = gsap.timeline();
      tl.to([sphereMat, ringMat], { opacity: 1.0, duration: 0.1 });
      tl.to(sphereMesh.scale, { x: 6.0, y: 6.0, z: 6.0, duration: 0.75, ease: 'power2.out' }, 0);
      tl.to(ringMesh.scale, { x: 8.0, y: 8.0, z: 8.0, duration: 0.75, ease: 'power2.out' }, 0);
      tl.to([sphereMat, ringMat], { opacity: 0, duration: 0.35 }, 0.45);

    } else {
      // ANY: Royal Purple Star Burst
      sphereMat.color.setHex(0xa855f7);
      ringMat.color.setHex(0xd8b4fe);

      const tl = gsap.timeline();
      tl.to([sphereMat, ringMat], { opacity: 1.0, duration: 0.1 });
      tl.to(sphereMesh.scale, { x: 5.0, y: 5.0, z: 5.0, duration: 0.8, ease: 'back.out(1.7)' }, 0);
      tl.to(ringMesh.scale, { x: 7.5, y: 7.5, z: 7.5, duration: 0.8, ease: 'power2.out' }, 0);
      tl.to([sphereMat, ringMat], { opacity: 0, duration: 0.4 }, 0.45);
    }
  }

  return {
    group: pickGroup,
    triggerPickCelebration,
    dispose: () => {
      ringGeo.dispose();
      ringMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
    }
  };
}
