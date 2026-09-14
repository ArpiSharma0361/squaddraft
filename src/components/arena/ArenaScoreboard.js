import * as THREE from 'three';

/**
 * Creates an in-stadium Jumbotron scoreboard displaying live match details or final score.
 */
export function createArenaScoreboard({ pitchLength = 56 } = {}) {
  const boardGroup = new THREE.Group();

  // 1. Dynamic 2D Canvas for Scoreboard LED Screen
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  function renderScoreboard(state = {}) {
    const {
      matchTitle = 'SQUADDRAFT PRO',
      currentTurn = 1,
      pickNumber = 1,
      totalPicks = 16,
      timerSeconds = 90,
      isFinalScore = false,
      team1Name = 'Team White',
      team2Name = 'Team Black',
      team1Score = 0,
      team2Score = 0,
      winner = 'Team White'
    } = state;

    // Dark sleek stadium background
    ctx.fillStyle = '#060b17';
    ctx.fillRect(0, 0, 1024, 512);

    // Glowing outer border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1012, 500);

    // Top Brand Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(12, 12, 1000, 70);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 8;
    ctx.fillText(`⚽ ${matchTitle.toUpperCase()} ⚽`, 512, 47);
    ctx.shadowBlur = 0;

    if (isFinalScore) {
      // --- FINAL SCORE LAYOUT ---
      // Team 1 Block (Left)
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(team1Name.toUpperCase(), 250, 160);

      ctx.font = 'black 120px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.fillText(String(team1Score), 250, 265);
      ctx.shadowBlur = 0;

      // Center "FINAL" Badge
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(440, 190, 144, 60);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.strokeRect(440, 190, 144, 60);

      ctx.font = 'black 28px system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('FINAL', 512, 220);

      // Team 2 Block (Right)
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#d8b4fe';
      ctx.fillText(team2Name.toUpperCase(), 774, 160);

      ctx.font = 'black 120px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.fillText(String(team2Score), 774, 265);
      ctx.shadowBlur = 0;

      // Winner Banner at Bottom
      const winBannerGrad = ctx.createLinearGradient(150, 0, 874, 0);
      winBannerGrad.addColorStop(0, '#0284c7');
      winBannerGrad.addColorStop(0.5, '#10b981');
      winBannerGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = winBannerGrad;
      ctx.fillRect(80, 390, 864, 85);

      ctx.font = 'black 40px system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(`🏆 ${winner.toUpperCase()} WINS! 🏆`, 512, 432);
      ctx.shadowBlur = 0;

    } else {
      // --- DRAFT IN PROGRESS LAYOUT ---
      // Current Turn Highlight
      const isCap1 = currentTurn === 1;
      const activeColor = isCap1 ? '#38bdf8' : '#c084fc';
      const capName = isCap1 ? team1Name : team2Name;

      ctx.fillStyle = isCap1 ? '#0c4a6e' : '#4c1d95';
      ctx.fillRect(160, 110, 704, 90);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(160, 110, 704, 90);

      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('CURRENT TURN', 512, 138);

      ctx.font = 'black 42px system-ui, sans-serif';
      ctx.fillStyle = activeColor;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 12;
      ctx.fillText(capName.toUpperCase(), 512, 172);
      ctx.shadowBlur = 0;

      // Pick Progress
      ctx.font = 'bold 36px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`PICK ${pickNumber} OF ${totalPicks}`, 512, 270);

      // Countdown Timer
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(380, 320, 264, 110);
      ctx.strokeStyle = timerSeconds < 15 ? '#ef4444' : '#10b981';
      ctx.lineWidth = 4;
      ctx.strokeRect(380, 320, 264, 110);

      ctx.font = 'black 64px system-ui, sans-serif';
      ctx.fillStyle = timerSeconds < 15 ? '#f87171' : '#34d399';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fillText(`${timerSeconds}s`, 512, 375);
      ctx.shadowBlur = 0;

      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('SERVER SYNCHRONIZED', 512, 460);
    }
  }

  // Initial draw
  renderScoreboard();

  const boardTexture = new THREE.CanvasTexture(canvas);

  // 2. Scoreboard 3D Geometry & Casing
  const screenW = 18;
  const screenH = 9;
  const screenD = 1.2;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    metalness: 0.9,
    roughness: 0.2
  });
  const screenMat = new THREE.MeshBasicMaterial({
    map: boardTexture
  });

  // Main Box Casing
  const boxGeo = new THREE.BoxGeometry(screenW, screenH, screenD);
  const materials = [
    frameMat, // right
    frameMat, // left
    frameMat, // top
    frameMat, // bottom
    screenMat, // front (display face)
    frameMat  // back
  ];
  const boardMesh = new THREE.Mesh(boxGeo, materials);
  boardMesh.castShadow = true;

  // Support Gantry / Tower Truss
  const gantryGeo = new THREE.CylinderGeometry(0.35, 0.5, 14, 8);
  const gantry1 = new THREE.Mesh(gantryGeo, frameMat);
  gantry1.position.set(-screenW / 2 + 1, -7, 0);
  const gantry2 = new THREE.Mesh(gantryGeo, frameMat);
  gantry2.position.set(screenW / 2 - 1, -7, 0);

  boardGroup.add(boardMesh);
  boardGroup.add(gantry1);
  boardGroup.add(gantry2);

  // Situated high at the North End of the pitch
  boardGroup.position.set(0, 18, -(pitchLength / 2 + 14));
  boardGroup.lookAt(0, 4, 0); // Angled down toward pitch center

  return {
    group: boardGroup,
    update: (state) => {
      renderScoreboard(state);
      boardTexture.needsUpdate = true;
    },
    dispose: () => {
      boxGeo.dispose();
      gantryGeo.dispose();
      frameMat.dispose();
      screenMat.dispose();
      boardTexture.dispose();
    }
  };
}
