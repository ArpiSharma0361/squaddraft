import * as THREE from 'three';

/**
 * Creates the stylized miniature football stadium bowl, grandstand tiers, perimeter LED ribbon, and crowd lights.
 */
export function createStadium3D({ pitchWidth = 36, pitchLength = 56, crowdDensity = 500 } = {}) {
  const stadiumGroup = new THREE.Group();

  // 1. Tiered Grandstands
  const standMat = new THREE.MeshStandardMaterial({
    color: 0x11192e,
    roughness: 0.7,
    metalness: 0.3
  });

  const seatColorMat1 = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Blue seats (Captain 1 side)
    roughness: 0.6
  });
  const seatColorMat2 = new THREE.MeshStandardMaterial({
    color: 0x7c3aed, // Purple seats (Captain 2 side)
    roughness: 0.6
  });

  const tiers = 6;
  const standWidth = pitchWidth + 16;
  const standLength = pitchLength + 16;

  for (let t = 0; t < tiers; t++) {
    const tierH = 1.2;
    const tierY = (t + 1) * tierH;
    const stepOffset = (t + 1) * 2.2;

    // West Stand (Team 1 side)
    const wGeo = new THREE.BoxGeometry(2.2, tierH, standLength + stepOffset * 2);
    const wMesh = new THREE.Mesh(wGeo, t % 2 === 0 ? seatColorMat1 : standMat);
    wMesh.position.set(-(standWidth / 2 + stepOffset), tierY, 0);
    stadiumGroup.add(wMesh);

    // East Stand (Team 2 side)
    const eGeo = new THREE.BoxGeometry(2.2, tierH, standLength + stepOffset * 2);
    const eMesh = new THREE.Mesh(eGeo, t % 2 === 0 ? seatColorMat2 : standMat);
    eMesh.position.set(standWidth / 2 + stepOffset, tierY, 0);
    stadiumGroup.add(eMesh);

    // North Stand
    const nGeo = new THREE.BoxGeometry(standWidth + stepOffset * 2, tierH, 2.2);
    const nMesh = new THREE.Mesh(nGeo, standMat);
    nMesh.position.set(0, tierY, -(standLength / 2 + stepOffset));
    stadiumGroup.add(nMesh);

    // South Stand
    const sGeo = new THREE.BoxGeometry(standWidth + stepOffset * 2, tierH, 2.2);
    const sMesh = new THREE.Mesh(sGeo, standMat);
    sMesh.position.set(0, tierY, standLength / 2 + stepOffset);
    stadiumGroup.add(sMesh);
  }

  // 2. Animated Perimeter LED Ribbon Boards
  const ledCanvas = document.createElement('canvas');
  ledCanvas.width = 1024;
  ledCanvas.height = 64;
  const lctx = ledCanvas.getContext('2d');

  function updateLedTexture(offset = 0) {
    lctx.fillStyle = '#060a17';
    lctx.fillRect(0, 0, 1024, 64);

    lctx.font = 'bold 22px system-ui, sans-serif';
    lctx.fillStyle = '#38bdf8';
    lctx.shadowColor = '#0284c7';
    lctx.shadowBlur = 8;

    const text = '⚽ SQUADDRAFT ARENA  ★  TURF HEROES  ★  CAPTAIN 1 vs CAPTAIN 2  ★  PLAY • DRAFT • MATCH • REPEAT  ★  ';
    const textWidth = lctx.measureText(text).width;

    const startX = -(offset % textWidth);
    for (let x = startX; x < 1024 + textWidth; x += textWidth) {
      lctx.fillText(text, x, 40);
    }
  }
  updateLedTexture(0);

  const ledTexture = new THREE.CanvasTexture(ledCanvas);
  ledTexture.wrapS = THREE.RepeatWrapping;
  const ledMat = new THREE.MeshBasicMaterial({
    map: ledTexture
  });

  const boardH = 1.0;
  // West Board
  const bWest = new THREE.Mesh(new THREE.PlaneGeometry(pitchLength + 4, boardH), ledMat);
  bWest.rotation.y = Math.PI / 2;
  bWest.position.set(-(pitchWidth / 2 + 1.2), boardH / 2, 0);
  stadiumGroup.add(bWest);

  // East Board
  const bEast = new THREE.Mesh(new THREE.PlaneGeometry(pitchLength + 4, boardH), ledMat);
  bEast.rotation.y = -Math.PI / 2;
  bEast.position.set(pitchWidth / 2 + 1.2, boardH / 2, 0);
  stadiumGroup.add(bEast);

  // North Board
  const bNorth = new THREE.Mesh(new THREE.PlaneGeometry(pitchWidth + 4, boardH), ledMat);
  bNorth.position.set(0, boardH / 2, -(pitchLength / 2 + 1.2));
  stadiumGroup.add(bNorth);

  // South Board
  const bSouth = new THREE.Mesh(new THREE.PlaneGeometry(pitchWidth + 4, boardH), ledMat);
  bSouth.rotation.y = Math.PI;
  bSouth.position.set(0, boardH / 2, pitchLength / 2 + 1.2);
  stadiumGroup.add(bSouth);

  // 3. Stadium Crowd Flash Lights (Particles)
  const crowdGeo = new THREE.BufferGeometry();
  const crowdPositions = new Float32Array(crowdDensity * 3);
  const crowdColors = new Float32Array(crowdDensity * 3);

  for (let i = 0; i < crowdDensity; i++) {
    // Distribute around stands
    const side = Math.floor(Math.random() * 4);
    const tier = 1 + Math.random() * 5;
    const y = tier * 1.2 + Math.random() * 1.5;
    const offset = tier * 2.2;
    let x = 0, z = 0;

    if (side === 0) { // West (Blue side)
      x = -(standWidth / 2 + offset + Math.random() * 2);
      z = (Math.random() - 0.5) * (standLength + offset * 2);
    } else if (side === 1) { // East (Purple side)
      x = standWidth / 2 + offset + Math.random() * 2;
      z = (Math.random() - 0.5) * (standLength + offset * 2);
    } else if (side === 2) { // North
      x = (Math.random() - 0.5) * (standWidth + offset * 2);
      z = -(standLength / 2 + offset + Math.random() * 2);
    } else { // South
      x = (Math.random() - 0.5) * (standWidth + offset * 2);
      z = standLength / 2 + offset + Math.random() * 2;
    }

    crowdPositions[i * 3] = x;
    crowdPositions[i * 3 + 1] = y;
    crowdPositions[i * 3 + 2] = z;

    // Crowd light colors (subtle white, cyan, gold flash)
    const isFlash = Math.random() > 0.7;
    crowdColors[i * 3] = isFlash ? 1.0 : 0.4;
    crowdColors[i * 3 + 1] = isFlash ? 0.95 : 0.6;
    crowdColors[i * 3 + 2] = isFlash ? 1.0 : 0.9;
  }

  crowdGeo.setAttribute('position', new THREE.BufferAttribute(crowdPositions, 3));
  crowdGeo.setAttribute('color', new THREE.BufferAttribute(crowdColors, 3));

  const crowdMat = new THREE.PointsMaterial({
    size: 0.65,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });
  const crowdPoints = new THREE.Points(crowdGeo, crowdMat);
  stadiumGroup.add(crowdPoints);

  // Animation ticker for LED board & subtle crowd twinkle
  let tick = 0;
  function animate(time = 0) {
    tick += 1.5;
    if (Math.floor(tick) % 2 === 0) {
      updateLedTexture(tick);
      ledTexture.needsUpdate = true;
    }
    // Shimmer crowd opacity
    crowdMat.opacity = 0.65 + Math.sin(time * 0.003) * 0.25;
  }

  return {
    group: stadiumGroup,
    animate,
    dispose: () => {
      standMat.dispose();
      seatColorMat1.dispose();
      seatColorMat2.dispose();
      ledMat.dispose();
      ledTexture.dispose();
      crowdGeo.dispose();
      crowdMat.dispose();
    }
  };
}
