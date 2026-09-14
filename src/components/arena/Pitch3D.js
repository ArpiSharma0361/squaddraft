import * as THREE from 'three';

/**
 * Creates the 3D football pitch with striped turf texture, white markings, and 3D goalposts.
 */
export function createPitch3D({ width = 36, length = 56 } = {}) {
  const pitchGroup = new THREE.Group();

  // 1. Procedural Turf Texture (Lawnmower stripes + grass noise)
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Alternating turf stripes
  const stripeCount = 14;
  const stripeWidth = canvas.width / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1b6b33' : '#1e7839';
    ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
  }

  // Subtle grass texture noise
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const turfTexture = new THREE.CanvasTexture(canvas);
  turfTexture.wrapS = THREE.RepeatWrapping;
  turfTexture.wrapT = THREE.RepeatWrapping;

  // Turf Plane
  const turfGeo = new THREE.PlaneGeometry(width + 8, length + 8);
  const turfMat = new THREE.MeshStandardMaterial({
    map: turfTexture,
    roughness: 0.85,
    metalness: 0.1
  });
  const turfMesh = new THREE.Mesh(turfGeo, turfMat);
  turfMesh.rotation.x = -Math.PI / 2;
  turfMesh.receiveShadow = true;
  pitchGroup.add(turfMesh);

  // 2. White Pitch Markings Line Texture
  const linesCanvas = document.createElement('canvas');
  linesCanvas.width = 1024;
  linesCanvas.height = 1024;
  const lctx = linesCanvas.getContext('2d');
  lctx.clearRect(0, 0, 1024, 1024);

  lctx.strokeStyle = '#ffffff';
  lctx.lineWidth = 10;
  lctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
  lctx.shadowBlur = 4;

  const pad = 64;
  const w = 1024 - pad * 2;
  const h = 1024 - pad * 2;

  // Outer Touchlines
  lctx.strokeRect(pad, pad, w, h);

  // Halfway Line
  lctx.beginPath();
  lctx.moveTo(pad, 1024 / 2);
  lctx.lineTo(1024 - pad, 1024 / 2);
  lctx.stroke();

  // Center Circle
  lctx.beginPath();
  lctx.arc(512, 512, 110, 0, Math.PI * 2);
  lctx.stroke();

  // Center Spot
  lctx.fillStyle = '#ffffff';
  lctx.beginPath();
  lctx.arc(512, 512, 8, 0, Math.PI * 2);
  lctx.fill();

  // Top Penalty Box & Goal Box
  lctx.strokeRect(512 - 200, pad, 400, 190);
  lctx.strokeRect(512 - 90, pad, 180, 75);
  // Top Penalty Spot & Arc
  lctx.beginPath();
  lctx.arc(512, pad + 135, 6, 0, Math.PI * 2);
  lctx.fill();
  lctx.beginPath();
  lctx.arc(512, pad + 135, 80, 0.25 * Math.PI, 0.75 * Math.PI);
  lctx.stroke();

  // Bottom Penalty Box & Goal Box
  lctx.strokeRect(512 - 200, 1024 - pad - 190, 400, 190);
  lctx.strokeRect(512 - 90, 1024 - pad - 75, 180, 75);
  // Bottom Penalty Spot & Arc
  lctx.beginPath();
  lctx.arc(512, 1024 - pad - 135, 6, 0, Math.PI * 2);
  lctx.fill();
  lctx.beginPath();
  lctx.arc(512, 1024 - pad - 135, 80, 1.25 * Math.PI, 1.75 * Math.PI);
  lctx.stroke();

  // Corner Arcs
  const cornerR = 24;
  lctx.beginPath();
  lctx.arc(pad, pad, cornerR, 0, 0.5 * Math.PI);
  lctx.stroke();
  lctx.beginPath();
  lctx.arc(1024 - pad, pad, cornerR, 0.5 * Math.PI, Math.PI);
  lctx.stroke();
  lctx.beginPath();
  lctx.arc(pad, 1024 - pad, cornerR, 1.5 * Math.PI, 2 * Math.PI);
  lctx.stroke();
  lctx.beginPath();
  lctx.arc(1024 - pad, 1024 - pad, cornerR, Math.PI, 1.5 * Math.PI);
  lctx.stroke();

  const linesTexture = new THREE.CanvasTexture(linesCanvas);
  const linesGeo = new THREE.PlaneGeometry(width, length);
  const linesMat = new THREE.MeshBasicMaterial({
    map: linesTexture,
    transparent: true,
    opacity: 0.95,
    depthWrite: false
  });
  const linesMesh = new THREE.Mesh(linesGeo, linesMat);
  linesMesh.rotation.x = -Math.PI / 2;
  linesMesh.position.y = 0.02; // Slightly above turf to prevent z-fighting
  pitchGroup.add(linesMesh);

  // 3. 3D Goal Posts (North & South ends)
  const goalWidth = 9;
  const goalHeight = 3.6;
  const goalDepth = 3.2;

  const postMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.4,
    roughness: 0.3
  });
  const netMat = new THREE.MeshBasicMaterial({
    color: 0xcccccc,
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  function createGoal(zPos, rotY) {
    const goal = new THREE.Group();
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, goalHeight, 16);
    const barGeo = new THREE.CylinderGeometry(0.12, 0.12, goalWidth, 16);

    // Left post
    const lp = new THREE.Mesh(postGeo, postMat);
    lp.position.set(-goalWidth / 2, goalHeight / 2, 0);
    goal.add(lp);

    // Right post
    const rp = new THREE.Mesh(postGeo, postMat);
    rp.position.set(goalWidth / 2, goalHeight / 2, 0);
    goal.add(rp);

    // Crossbar
    const bar = new THREE.Mesh(barGeo, postMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, goalHeight, 0);
    goal.add(bar);

    // Net box
    const netGeo = new THREE.BoxGeometry(goalWidth, goalHeight, goalDepth);
    const net = new THREE.Mesh(netGeo, netMat);
    net.position.set(0, goalHeight / 2, -goalDepth / 2);
    goal.add(net);

    goal.position.set(0, 0, zPos);
    goal.rotation.y = rotY;
    return goal;
  }

  pitchGroup.add(createGoal(-length / 2 + 0.5, 0));
  pitchGroup.add(createGoal(length / 2 - 0.5, Math.PI));

  return {
    group: pitchGroup,
    dispose: () => {
      turfGeo.dispose();
      turfMat.dispose();
      turfTexture.dispose();
      linesGeo.dispose();
      linesMat.dispose();
      linesTexture.dispose();
    }
  };
}
