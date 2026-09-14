import * as THREE from 'three';

/**
 * Creates 3D tactical player markers on the pitch for final team lineups.
 */
export function createFinalTeams3D({ pitchWidth = 36, pitchLength = 56 } = {}) {
  const teamsGroup = new THREE.Group();
  teamsGroup.visible = false;

  const markers = [];

  function createPlayerMarker(player, teamNum = 1, x = 0, z = 0) {
    const marker = new THREE.Group();

    // 1. Position-colored Base Cylinder Pedestal
    const pos = (player.position || 'MID').toUpperCase();
    let colorHex = 0x10b981; // green
    if (pos === 'GK') colorHex = 0xf59e0b;
    else if (pos === 'DEF') colorHex = 0x0284c7;
    else if (pos === 'ST' || pos === 'FWD') colorHex = 0xf97316;
    else if (pos === 'ANY') colorHex = 0xa855f7;

    const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.35, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.7,
      roughness: 0.3
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.2;
    marker.add(baseMesh);

    // 2. Glowing Ring Underneath
    const ringGeo = new THREE.RingGeometry(0.8, 1.3, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: teamNum === 1 ? 0x38bdf8 : 0xc084fc,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.05;
    marker.add(ringMesh);

    // 3. Nameplate Billboard Texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Background pill
    ctx.fillStyle = teamNum === 1 ? '#0c4a6e' : '#4c1d95';
    ctx.roundRect(4, 4, 248, 88, 16);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Position tag
    ctx.fillStyle = colorHex === 0xf59e0b ? '#fbbf24' : '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pos, 128, 34);

    // Player Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText(player.name?.substring(0, 12) || 'Player', 128, 68);

    const nameTexture = new THREE.CanvasTexture(canvas);
    const plateGeo = new THREE.PlaneGeometry(2.4, 0.9);
    const plateMat = new THREE.MeshBasicMaterial({
      map: nameTexture,
      transparent: true,
      depthTest: false
    });
    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    plateMesh.position.y = 1.6;
    marker.add(plateMesh);

    marker.position.set(x, 0, z);
    teamsGroup.add(marker);
    markers.push({ group: marker, baseY: marker.position.y });
  }

  /**
   * Arranges squad members into clean tactical formations on their respective halves.
   */
  function updateSquads(team1 = [], team2 = []) {
    // Clear previous
    while (teamsGroup.children.length > 0) {
      teamsGroup.remove(teamsGroup.children[0]);
    }
    markers.length = 0;

    // Team 1 Formation on Left Half (-X)
    const t1GKs = team1.filter(p => p.position === 'GK');
    const t1Outfield = team1.filter(p => p.position !== 'GK');

    // Place GK
    if (t1GKs.length > 0) {
      createPlayerMarker(t1GKs[0], 1, -12, 0);
    }
    // Place Outfielders in grid
    t1Outfield.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = -8 + col * 4.5;
      const z = -14 + row * 8;
      createPlayerMarker(p, 1, x, z);
    });

    // Team 2 Formation on Right Half (+X)
    const t2GKs = team2.filter(p => p.position === 'GK');
    const t2Outfield = team2.filter(p => p.position !== 'GK');

    // Place GK
    if (t2GKs.length > 0) {
      createPlayerMarker(t2GKs[0], 2, 12, 0);
    }
    // Place Outfielders in grid
    t2Outfield.forEach((p, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 8 - col * 4.5;
      const z = -14 + row * 8;
      createPlayerMarker(p, 2, x, z);
    });
  }

  function animate(time = 0) {
    // Gentle floating hover motion for markers
    markers.forEach((m, idx) => {
      m.group.position.y = 0.15 * Math.sin(time * 0.003 + idx * 0.5);
    });
  }

  function setVisible(visible) {
    teamsGroup.visible = visible;
  }

  return {
    group: teamsGroup,
    updateSquads,
    animate,
    setVisible,
    dispose: () => {
      while (teamsGroup.children.length > 0) {
        teamsGroup.remove(teamsGroup.children[0]);
      }
    }
  };
}
