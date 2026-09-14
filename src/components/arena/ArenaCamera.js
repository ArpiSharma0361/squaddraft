import gsap from 'gsap';

/**
 * Manages cinematic camera positions and smooth GSAP transitions matching match stages.
 */
export function createArenaCamera(camera, { prefersReducedMotion = false } = {}) {
  // Predefined cinematic camera poses
  const CAMERA_POSES = {
    // 1. Match Setup / Idle
    setup: {
      pos: { x: 0, y: 32, z: 38 },
      target: { x: 0, y: 0, z: 0 }
    },
    // 2. Captain Assignment
    captains: {
      pos: { x: 0, y: 28, z: 34 },
      target: { x: 0, y: 0, z: 0 }
    },
    // 3. Cinematic Coin Toss (Dives close into the center circle)
    toss: {
      pos: { x: 0, y: 11, z: 14 },
      target: { x: 0, y: 0.5, z: 0 }
    },
    // 4. Live Draft Room (Elevated perspective sports broadcast angle)
    draft: {
      pos: { x: 0, y: 27, z: 32 },
      target: { x: 0, y: 1, z: 0 }
    },
    // 5. Final Teams Tactical View (High overhead isometric angle)
    finalTeams: {
      pos: { x: 0, y: 44, z: 18 },
      target: { x: 0, y: 0, z: 0 }
    },
    // 6. Match Scoreboard Hero View (Focal view of Jumbotron scoreboard)
    finalScore: {
      pos: { x: 0, y: 13, z: 8 },
      target: { x: 0, y: 18, z: -40 }
    }
  };

  let currentTarget = { x: 0, y: 0, z: 0 };

  // Set initial pose
  camera.position.set(CAMERA_POSES.setup.pos.x, CAMERA_POSES.setup.pos.y, CAMERA_POSES.setup.pos.z);
  camera.lookAt(0, 0, 0);

  /**
   * Smoothly animates camera to target stage pose.
   */
  function transitionToStage(stage = 'draft', duration = 1.4) {
    const pose = CAMERA_POSES[stage] || CAMERA_POSES.draft;

    if (prefersReducedMotion) {
      camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
      currentTarget = { ...pose.target };
      camera.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);
      return;
    }

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(currentTarget);

    gsap.to(camera.position, {
      x: pose.pos.x,
      y: pose.pos.y,
      z: pose.pos.z,
      duration,
      ease: 'power3.inOut'
    });

    gsap.to(currentTarget, {
      x: pose.target.x,
      y: pose.target.y,
      z: pose.target.z,
      duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        camera.lookAt(currentTarget.x, currentTarget.y, currentTarget.z);
      }
    });
  }

  return {
    transitionToStage,
    getCurrentTarget: () => currentTarget
  };
}
