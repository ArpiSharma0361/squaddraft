import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useWebGLSupport } from '../../hooks/useWebGLSupport';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useArenaPerformance } from '../../hooks/useArenaPerformance';
import { ArenaFallback } from './ArenaFallback';
import { ArenaLoading } from './ArenaLoading';
import { createPitch3D } from './Pitch3D';
import { createStadium3D } from './Stadium3D';
import { createStadiumLights } from './StadiumLights';
import { createCoinToss3D } from './CoinToss3D';
import { createDraftPick3D } from './DraftPick3D';
import { createArenaScoreboard } from './ArenaScoreboard';
import { createFinalTeams3D } from './FinalTeams3D';
import { createArenaCamera } from './ArenaCamera';

export function ArenaCanvas({
  roomState,
  activeStage = 'draft',
  currentTurn = 1,
  timerSeconds = 90,
  lastConfirmedPick = null,
  tossFlipEvent = null,
  onTossFlipComplete,
  onCoinFlip,
  role = 'spectator',
  canFlipToss = false
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const hasWebGL = useWebGLSupport();
  const prefersReducedMotion = useReducedMotion();
  const performance = useArenaPerformance();

  const [contextLost, setContextLost] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  // References for live 3D modules
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const lightsRef = useRef(null);
  const coinTossRef = useRef(null);
  const draftPickRef = useRef(null);
  const scoreboardRef = useRef(null);
  const finalTeamsRef = useRef(null);
  const cameraControllerRef = useRef(null);

  // 1. Scene Initialization
  useEffect(() => {
    if (!hasWebGL || contextLost || !canvasRef.current) return;

    let animId = null;
    const container = containerRef.current;
    const canvas = canvasRef.current;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
    const cameraController = createArenaCamera(camera, { prefersReducedMotion });
    cameraControllerRef.current = cameraController;

    // Renderer
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: performance.tier !== 'low',
        powerPreference: 'high-performance',
        alpha: false
      });
      renderer.setPixelRatio(performance.maxDpr);
      renderer.setSize(width, height);
      if (performance.shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('WebGL initialization failed, using 2D fallback:', err);
      setContextLost(true);
      return;
    }

    // Add Modules
    const pitch = createPitch3D();
    scene.add(pitch.group);

    const stadium = createStadium3D({ crowdDensity: performance.crowdDensity });
    scene.add(stadium.group);

    const lights = createStadiumLights();
    scene.add(lights.group);
    lightsRef.current = lights;

    const coinToss = createCoinToss3D();
    scene.add(coinToss.group);
    coinTossRef.current = coinToss;

    const draftPick = createDraftPick3D();
    scene.add(draftPick.group);
    draftPickRef.current = draftPick;

    const scoreboard = createArenaScoreboard();
    scene.add(scoreboard.group);
    scoreboardRef.current = scoreboard;

    const finalTeams = createFinalTeams3D();
    scene.add(finalTeams.group);
    finalTeamsRef.current = finalTeams;

    // Context Lost Handlers
    const handleContextLost = (e) => {
      e.preventDefault();
      console.warn('WebGL Context Lost! Switching gracefully to 2D Stadium fallback.');
      setContextLost(true);
    };
    const handleContextRestored = () => {
      console.log('WebGL Context Restored!');
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0 && renderer) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Initial Stage Transition
    cameraController.transitionToStage(activeStage, 0.1);
    setIsSceneReady(true);

    // Main Render Loop
    let clock = new THREE.Clock();
    const renderLoop = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime() * 1000;

      stadium.animate(elapsed);
      finalTeams.animate(elapsed);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);

    // Cleanup
    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      pitch.dispose();
      stadium.dispose();
      lights.dispose();
      coinToss.dispose();
      draftPick.dispose();
      scoreboard.dispose();
      finalTeams.dispose();

      if (renderer) {
        renderer.dispose();
      }
    };
  }, [hasWebGL, contextLost, performance]);

  // 2. Camera transition when stage changes
  useEffect(() => {
    if (cameraControllerRef.current) {
      cameraControllerRef.current.transitionToStage(activeStage);
    }
    // Visibility toggle for stage specific items
    if (coinTossRef.current) {
      coinTossRef.current.setVisible(activeStage === 'toss' || activeStage === 'captains');
    }
    if (finalTeamsRef.current) {
      const isFinal = activeStage === 'finalTeams' || activeStage === 'finalScore';
      finalTeamsRef.current.setVisible(isFinal);
      if (isFinal) {
        const t1 = roomState?.finalTeam1?.length > 0 ? roomState.finalTeam1 : (roomState?.draftState?.team1 || []);
        const t2 = roomState?.finalTeam2?.length > 0 ? roomState.finalTeam2 : (roomState?.draftState?.team2 || []);
        finalTeamsRef.current.updateSquads(t1, t2);
      }
    }
  }, [activeStage, roomState]);

  // 3. Dynamic Stadium Lighting Reacting to Turn
  useEffect(() => {
    if (lightsRef.current) {
      lightsRef.current.updateLightingState({
        currentTurn,
        isTossWinner: roomState?.tossState?.winner
          ? (roomState.tossState.winner.id === roomState.captain1?.id ? 1 : 2)
          : null,
        isPaused: roomState?.draftState?.isPaused
      });
    }
  }, [currentTurn, roomState]);

  // 4. Update Jumbotron Scoreboard State
  useEffect(() => {
    if (scoreboardRef.current) {
      const isScoreStage = activeStage === 'finalScore' || Boolean(roomState?.matchScore?.winner);
      scoreboardRef.current.update({
        matchTitle: roomState?.matchMetadata?.name || roomState?.matchTitle || 'SQUADDRAFT PRO',
        currentTurn,
        pickNumber: roomState?.draftState?.pickNumber || 1,
        totalPicks: (roomState?.players?.length || 16) - 2,
        timerSeconds,
        isFinalScore: isScoreStage,
        team1Name: roomState?.team1Name || 'Team White',
        team2Name: roomState?.team2Name || 'Team Black',
        team1Score: roomState?.matchScore?.team1Score || 0,
        team2Score: roomState?.matchScore?.team2Score || 0,
        winner: roomState?.matchScore?.winner || 'Draw'
      });
    }
  }, [currentTurn, timerSeconds, activeStage, roomState]);

  // 5. Position Pick Celebration Trigger (Strictly after server confirmation)
  useEffect(() => {
    if (lastConfirmedPick && draftPickRef.current) {
      draftPickRef.current.triggerPickCelebration(
        lastConfirmedPick.player?.position || 'MID',
        lastConfirmedPick.teamNumber || 1
      );
    }
  }, [lastConfirmedPick]);

  // 6. Coin Toss Animation Trigger (Strictly with server outcome)
  useEffect(() => {
    if (tossFlipEvent && coinTossRef.current) {
      coinTossRef.current.startFlip(
        tossFlipEvent.outcome || 'heads',
        (result) => {
          if (onTossFlipComplete) onTossFlipComplete(result);
        }
      );
    }
  }, [tossFlipEvent]);

  // If WebGL is not supported or context is lost, render the high-fidelity 2D fallback
  if (!hasWebGL || contextLost) {
    return (
      <ArenaFallback
        roomState={roomState}
        currentTurn={currentTurn}
        activeStage={activeStage}
        onCoinFlip={onCoinFlip}
        tossState={roomState?.tossState}
        isTossFlipping={roomState?.tossState?.isFlipping}
        tossWinner={roomState?.tossState?.winner}
        role={role}
        canFlipToss={canFlipToss}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] md:h-[540px] rounded-2xl overflow-hidden bg-[#060c18] border border-blue-900/50 shadow-2xl select-none"
    >
      {!isSceneReady && <ArenaLoading />}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Broadcast Watermark Overlays */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-xs font-bold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          SQUADDRAFT ARENA 3D
        </div>
      </div>
    </div>
  );
}
