import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Creates 4 stadium floodlight towers and manages dynamic team lighting (Cyan for Cap 1, Purple for Cap 2).
 */
export function createStadiumLights({ pitchWidth = 36, pitchLength = 56 } = {}) {
  const lightsGroup = new THREE.Group();

  // 1. Ambient Lighting (Night match deep atmospheric tint)
  const ambient = new THREE.AmbientLight(0x0a162b, 1.4);
  lightsGroup.add(ambient);

  // 2. Main Matchday Overhead Directional Light
  const mainLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
  mainLight.position.set(20, 45, 25);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  mainLight.shadow.camera.near = 10;
  mainLight.shadow.camera.far = 100;
  mainLight.shadow.camera.left = -35;
  mainLight.shadow.camera.right = 35;
  mainLight.shadow.camera.top = 45;
  mainLight.shadow.camera.bottom = -45;
  lightsGroup.add(mainLight);

  // 3. Dynamic Team Side Lights
  // Captain 1 Side Light (Cyan / Blue: 0x00d2ff)
  const cap1Light = new THREE.SpotLight(0x00d2ff, 4.0, 70, Math.PI / 4, 0.4, 1.2);
  cap1Light.position.set(-(pitchWidth / 2 + 14), 28, 0);
  cap1Light.target.position.set(-8, 0, 0);
  lightsGroup.add(cap1Light);
  lightsGroup.add(cap1Light.target);

  // Captain 2 Side Light (Purple / Violet: 0xa855f7)
  const cap2Light = new THREE.SpotLight(0xa855f7, 4.0, 70, Math.PI / 4, 0.4, 1.2);
  cap2Light.position.set(pitchWidth / 2 + 14, 28, 0);
  cap2Light.target.position.set(8, 0, 0);
  lightsGroup.add(cap2Light);
  lightsGroup.add(cap2Light.target);

  // 4. Four Corner Floodlight Towers
  const towerH = 26;
  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3
  });
  const bulbMat = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });

  const cornerCoords = [
    { x: -(pitchWidth / 2 + 10), z: -(pitchLength / 2 + 10) },
    { x: pitchWidth / 2 + 10, z: -(pitchLength / 2 + 10) },
    { x: -(pitchWidth / 2 + 10), z: pitchLength / 2 + 10 },
    { x: pitchWidth / 2 + 10, z: pitchLength / 2 + 10 }
  ];

  cornerCoords.forEach((c) => {
    const tower = new THREE.Group();
    // Pylon Column
    const pylonGeo = new THREE.CylinderGeometry(0.5, 1.2, towerH, 8);
    const pylon = new THREE.Mesh(pylonGeo, towerMat);
    pylon.position.y = towerH / 2;
    tower.add(pylon);

    // Floodlight Bank (Angled toward center pitch)
    const bankGeo = new THREE.BoxGeometry(4.0, 2.5, 0.8);
    const bank = new THREE.Mesh(bankGeo, towerMat);
    bank.position.set(0, towerH, 0);
    bank.lookAt(0, 0, 0);

    // Glowing Light Bulbs Grid
    const bulbsGeo = new THREE.BoxGeometry(3.6, 2.1, 0.2);
    const bulbs = new THREE.Mesh(bulbsGeo, bulbMat);
    bulbs.position.set(0, 0, 0.4);
    bank.add(bulbs);

    tower.add(bank);
    tower.position.set(c.x, 0, c.z);
    lightsGroup.add(tower);
  });

  /**
   * Updates lighting mood according to match stage and active turn.
   */
  function updateLightingState({ currentTurn = 1, isTossWinner = null, isPaused = false } = {}) {
    if (isTossWinner) {
      // Winner side celebration flood
      if (isTossWinner === 1) {
        gsap.to(cap1Light, { intensity: 7.5, duration: 0.8, ease: 'power2.out' });
        gsap.to(cap2Light, { intensity: 1.0, duration: 0.8, ease: 'power2.out' });
      } else {
        gsap.to(cap1Light, { intensity: 1.0, duration: 0.8, ease: 'power2.out' });
        gsap.to(cap2Light, { intensity: 7.5, duration: 0.8, ease: 'power2.out' });
      }
      return;
    }

    if (isPaused) {
      gsap.to(cap1Light, { intensity: 2.0, duration: 0.5 });
      gsap.to(cap2Light, { intensity: 2.0, duration: 0.5 });
      return;
    }

    if (currentTurn === 1) {
      gsap.to(cap1Light, { intensity: 5.5, duration: 0.6, ease: 'power2.out' });
      gsap.to(cap2Light, { intensity: 1.8, duration: 0.6, ease: 'power2.out' });
    } else {
      gsap.to(cap1Light, { intensity: 1.8, duration: 0.6, ease: 'power2.out' });
      gsap.to(cap2Light, { intensity: 5.5, duration: 0.6, ease: 'power2.out' });
    }
  }

  return {
    group: lightsGroup,
    updateLightingState,
    dispose: () => {
      towerMat.dispose();
      bulbMat.dispose();
    }
  };
}
