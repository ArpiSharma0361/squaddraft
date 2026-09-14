import { useMemo } from 'react';

export function useArenaPerformance() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { tier: 'medium', maxDpr: 1.5, isMobile: false };
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    let tier = 'high';
    if (isMobile || memory < 4 || cores < 4) {
      tier = 'medium';
    }
    if (memory <= 2 || cores <= 2) {
      tier = 'low';
    }

    const nativeDpr = window.devicePixelRatio || 1;
    const maxDpr = tier === 'high' ? Math.min(nativeDpr, 2) : Math.min(nativeDpr, 1.5);

    return {
      tier,
      maxDpr,
      isMobile,
      shadows: tier === 'high',
      particles: tier !== 'low',
      crowdDensity: tier === 'high' ? 800 : tier === 'medium' ? 400 : 150
    };
  }, []);
}
