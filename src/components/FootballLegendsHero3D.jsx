import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FOOTBALL_LEGENDS } from '../data/footballLegends';
import { ChevronLeft, ChevronRight, Sparkles, ArrowDown } from 'lucide-react';

const POSITION_BADGES = {
  GK: { label: 'GK', bg: 'bg-amber-500/25 text-amber-300 border-amber-400/50' },
  DEF: { label: 'DEF', bg: 'bg-blue-500/25 text-blue-300 border-blue-400/50' },
  MID: { label: 'MID', bg: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50' },
  ST: { label: 'ST', bg: 'bg-orange-500/25 text-orange-300 border-orange-400/50' }
};

const AUTOPLAY_INTERVAL = 3000;
const RESUME_DELAY = 5000;

/**
 * Cinematic Pseudo-3D Football Legends Hero Carousel (Phase 3.3.1)
 * Full-bleed player photography, dramatic 3D curved awards wall,
 * illuminated stadium platform, pure CSS transforms. Zero Three.js/WebGL.
 */
export default function FootballLegendsHero3D({ onRegisterClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const resumeTimerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const totalLegends = FOOTBALL_LEGENDS.length;

  // Reduced motion preference detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Tab visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Manual interaction pause/resume
  const registerManualInteraction = useCallback(() => {
    setIsInteracting(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, RESUME_DELAY);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalLegends);
  }, [totalLegends]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalLegends) % totalLegends);
  }, [totalLegends]);

  const handleNextClick = () => {
    registerManualInteraction();
    goToNext();
  };

  const handlePrevClick = () => {
    registerManualInteraction();
    goToPrev();
  };

  const handleCardClick = (offset) => {
    if (offset === 0) return;
    registerManualInteraction();
    setCurrentIndex((prev) => (prev + offset + totalLegends) % totalLegends);
  };

  const handleScrollToRegister = () => {
    if (onRegisterClick) {
      onRegisterClick();
    } else {
      document.getElementById('register-card')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Autoplay loop (3s interval, 5s resume delay)
  useEffect(() => {
    if (prefersReducedMotion || isHovered || isInteracting || isTabHidden) {
      return;
    }
    const timer = setInterval(() => {
      goToNext();
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, isHovered, isInteracting, isTabHidden, goToNext]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Meaningful horizontal threshold (>40px and predominantly horizontal)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      registerManualInteraction();
      if (deltaX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Active window of 5 cards (-2, -1, 0, 1, 2) on desktop, 3 on mobile/reduced motion
  const offsets = prefersReducedMotion ? [0] : [-2, -1, 0, 1, 2];

  const currentLegend = FOOTBALL_LEGENDS[currentIndex];

  return (
    <div
      className="relative w-full flex flex-col items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D Carousel Stage */}
      <div
        className="relative w-full h-[410px] sm:h-[450px] md:h-[480px] lg:h-[510px] flex items-center justify-center overflow-hidden touch-pan-y"
        style={{ perspective: prefersReducedMotion ? 'none' : '1100px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle Oval Football Awards Gala Stage Platform */}
        {!prefersReducedMotion && (
          <div
            className="absolute bottom-3 sm:bottom-6 w-[88%] max-w-[660px] h-[40px] sm:h-[50px] rounded-[100%] pointer-events-none z-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.35) 0%, rgba(11, 35, 65, 0.75) 60%, rgba(3, 9, 20, 0.95) 85%)',
              boxShadow: '0 0 50px rgba(215, 165, 42, 0.32), inset 0 0 25px rgba(7, 136, 63, 0.4), 0 25px 50px rgba(0, 0, 0, 0.9)',
              border: '1.5px solid rgba(215, 165, 42, 0.45)',
              transform: 'rotateX(70deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="absolute inset-1 rounded-[100%] border border-[#10B981]/25" />
          </div>
        )}

        {/* 3D Cards Track */}
        <div
          className="relative w-full h-full flex items-center justify-center z-10"
          style={{ transformStyle: prefersReducedMotion ? 'flat' : 'preserve-3d' }}
        >
          {offsets.map((offset) => {
            const index = (currentIndex + offset + totalLegends) % totalLegends;
            const legend = FOOTBALL_LEGENDS[index];
            const hasImageFailed = !!imageErrors[legend.id];
            const posStyle = POSITION_BADGES[legend.position] || POSITION_BADGES.MID;
            const isCenter = offset === 0;
            const isDesktopOnly = Math.abs(offset) === 2;

            // Phase 3.3.1 Approved Exact Mathematical Transform Offsets
            let transformStyle = '';
            let opacityStyle = 1;
            let zIndexStyle = 30;

            if (prefersReducedMotion) {
              transformStyle = 'none';
              opacityStyle = 1;
              zIndexStyle = 30;
            } else if (isCenter) {
              transformStyle = 'translateX(0%) translateZ(0px) rotateY(0deg) scale(1)';
              opacityStyle = 1;
              zIndexStyle = 30;
            } else if (offset === -1) {
              // Left 1: ~82% size, visible curved depth
              transformStyle = 'translateX(-65%) translateZ(-80px) rotateY(18deg) scale(0.82)';
              opacityStyle = 0.90;
              zIndexStyle = 20;
            } else if (offset === 1) {
              // Right 1: ~82% size, visible curved depth
              transformStyle = 'translateX(65%) translateZ(-80px) rotateY(-18deg) scale(0.82)';
              opacityStyle = 0.90;
              zIndexStyle = 20;
            } else if (offset === -2) {
              // Left 2 (Desktop only): ~65% size
              transformStyle = 'translateX(-110%) translateZ(-160px) rotateY(26deg) scale(0.65)';
              opacityStyle = 0.65;
              zIndexStyle = 10;
            } else if (offset === 2) {
              // Right 2 (Desktop only): ~65% size
              transformStyle = 'translateX(110%) translateZ(-160px) rotateY(-26deg) scale(0.65)';
              opacityStyle = 0.65;
              zIndexStyle = 10;
            }

            return (
              <div
                key={legend.id}
                onClick={() => handleCardClick(offset)}
                style={{
                  transform: transformStyle,
                  opacity: opacityStyle,
                  zIndex: zIndexStyle,
                  transition: prefersReducedMotion
                    ? 'opacity 150ms ease'
                    : 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1), opacity 750ms ease',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                className={`absolute w-[240px] sm:w-[270px] md:w-[300px] lg:w-[320px] h-[370px] sm:h-[420px] md:h-[450px] lg:h-[475px] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-shadow duration-300 group ${
                  isDesktopOnly ? 'hidden sm:flex' : 'flex'
                } ${
                  isCenter
                    ? 'bg-gradient-to-b from-[#0D1C2E] via-[#081321] to-[#040A12] border-2 border-[#D7A52A] shadow-[0_0_40px_rgba(215,165,42,0.35),0_20px_50px_rgba(0,0,0,0.9)] ring-1 ring-[#D7A52A]/60'
                    : 'bg-gradient-to-b from-[#0A1624]/95 via-[#060E18]/95 to-[#03070D]/95 border border-[#D7A52A]/30 hover:border-[#07883F] shadow-xl hover:shadow-2xl'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${legend.name} (${legend.shortName}) - ${legend.label}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCardClick(offset);
                  }
                }}
              >
                {/* Full-Bleed Player Photography Container (77% Card Height) */}
                <div className="relative w-full h-[77%] overflow-hidden bg-[#071320] flex items-center justify-center">
                  {!hasImageFailed ? (
                    <img
                      src={legend.image}
                      alt={`${legend.name} football legend`}
                      loading={isCenter ? 'eager' : 'lazy'}
                      decoding="async"
                      {...(isCenter ? { fetchpriority: 'high' } : {})}
                      onError={() => handleImageError(legend.id)}
                      style={{
                        objectPosition: legend.objectPosition || 'center 25%',
                        transform: 'scale(1.14)'
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-120"
                    />
                  ) : (
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#0B2341] to-[#030914]">
                      <span className="text-3xl">{legend.flag}</span>
                      <span className="text-sm font-black text-white mt-2">{legend.shortName}</span>
                    </div>
                  )}

                  {/* Dark Vignette Bottom Gradient for Seamless Typography Transition */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#081321] via-[#081321]/80 to-transparent pointer-events-none" />

                  {/* Top Left: Country Flag + Position Pill */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 shadow-md text-xs">
                    <span className="text-sm">{legend.flag}</span>
                    <span className="text-[10px] font-black text-white">{legend.position}</span>
                  </div>

                  {/* Top Right: Golden Era Pill */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#D7A52A]/20 backdrop-blur-md border border-[#D7A52A]/50 text-[9px] font-extrabold text-[#FDE047] shadow-xs">
                    {legend.era}
                  </div>
                </div>

                {/* Lower Information Strip (23% Card Height) */}
                <div className="p-3 sm:p-3.5 bg-[#081321] flex flex-col justify-between flex-1 relative z-10 border-t border-white/10">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-black text-sm sm:text-base lg:text-lg text-white tracking-wider truncate group-hover:text-[#FDE047] transition-colors">
                        {legend.shortName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase border tracking-wider ${posStyle.bg}`}>
                        {posStyle.label}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-[#10B981] truncate mt-0.5">
                      {legend.label}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-300 font-semibold border-t border-white/10 pt-1.5 mt-1">
                    <span className="truncate">{legend.name}</span>
                    <span className="text-[#D7A52A] font-extrabold shrink-0">★ {legend.nationality}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrow Controls - Positioned Tight to Stage */}
        <button
          type="button"
          onClick={handlePrevClick}
          aria-label="Previous legend"
          className="absolute left-1 sm:left-2 lg:left-4 z-40 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-[#D7A52A]/60 hover:border-[#D7A52A] text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          aria-label="Next legend"
          className="absolute right-1 sm:right-2 lg:right-4 z-40 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-[#D7A52A]/60 hover:border-[#D7A52A] text-white shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Carousel Footer Indicator & Player Navigation Bar */}
      <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 px-2 text-xs text-slate-300">
        {/* Player Dots Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 max-w-full">
          {FOOTBALL_LEGENDS.map((leg, idx) => (
            <button
              key={leg.id}
              type="button"
              onClick={() => {
                registerManualInteraction();
                setCurrentIndex(idx);
              }}
              aria-label={`Jump to ${leg.shortName}`}
              className={`transition-all rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 sm:w-7 h-2 bg-[#D7A52A] shadow-[0_0_8px_#D7A52A]'
                  : 'w-2 h-2 bg-white/25 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Current Active Legend Summary Pill */}
        <div className="flex items-center gap-2 text-[11px] font-bold px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
          <span className="font-black text-white">{currentLegend.name}</span>
          <span className="text-[#10B981]">({currentLegend.label})</span>
          <span className="text-white/40">•</span>
          <span className="text-[#D7A52A]">{currentIndex + 1}/{totalLegends}</span>
          {isInteracting && (
            <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
              Paused (5s)
            </span>
          )}
        </div>
      </div>

      {/* Quick Registration Anchor CTA on Mobile below Carousel */}
      <div className="sm:hidden mt-4 w-full flex justify-center">
        <button
          type="button"
          onClick={handleScrollToRegister}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#07883F] hover:bg-[#13A653] text-white text-xs font-black uppercase tracking-wider shadow-lg border border-[#10B981]/50 cursor-pointer"
        >
          <span>REGISTER FOR MATCH</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </div>
    </div>
  );
}
