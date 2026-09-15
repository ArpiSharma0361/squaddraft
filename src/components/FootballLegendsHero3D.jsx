import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FOOTBALL_LEGENDS } from '../data/footballLegends';
import { ChevronLeft, ChevronRight, ArrowDown } from 'lucide-react';

const POSITION_BADGES = {
  GK: { label: 'GK', bg: 'bg-amber-500/25 text-amber-300 border-amber-400/50' },
  DEF: { label: 'DEF', bg: 'bg-blue-500/25 text-blue-300 border-blue-400/50' },
  MID: { label: 'MID', bg: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50' },
  ST: { label: 'ST', bg: 'bg-orange-500/25 text-orange-300 border-orange-400/50' }
};

const AUTOPLAY_INTERVAL = 3000;
const RESUME_DELAY = 5000;

/**
 * Compact Cinematic Pseudo-3D Football Legends Hero Carousel (Phase 3.3.2)
 * Height-optimized for one-page desktop landing view.
 * Continuous 3-second autoplay with active-interaction pause only (no hover pause).
 */
export default function FootballLegendsHero3D({ onRegisterClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  // Tab visibility listener (pauses while tab hidden, resumes when active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Manual interaction pause/resume: pauses for 5000ms on ACTIVE action only
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

  // Continuous Autoplay Lifecycle (3s interval, resumes 5s after active interaction, NO hover pause)
  useEffect(() => {
    if (prefersReducedMotion || isTabHidden || isInteracting) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalLegends);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, isTabHidden, isInteracting, totalLegends]);

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
    <div className="relative w-full flex flex-col items-center justify-center select-none">
      {/* 3D Carousel Stage - Height Optimized (~370-400px) */}
      <div
        className="relative w-full h-[340px] sm:h-[370px] md:h-[390px] lg:h-[405px] flex items-center justify-center overflow-hidden touch-pan-y"
        style={{ perspective: prefersReducedMotion ? 'none' : '1000px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle Oval Football Awards Gala Stage Platform */}
        {!prefersReducedMotion && (
          <div
            className="absolute bottom-2 sm:bottom-3 w-[82%] max-w-[520px] h-[32px] sm:h-[38px] rounded-[100%] pointer-events-none z-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.4) 0%, rgba(11, 35, 65, 0.8) 60%, rgba(3, 9, 20, 0.95) 85%)',
              boxShadow: '0 0 35px rgba(215, 165, 42, 0.3), inset 0 0 18px rgba(7, 136, 63, 0.4), 0 20px 35px rgba(0, 0, 0, 0.9)',
              border: '1.5px solid rgba(215, 165, 42, 0.5)',
              transform: 'rotateX(72deg)',
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

            // Phase 3.3.2 Exact Mathematical Transform Offsets
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
              // Left 1: 82% scale, visible curved depth
              transformStyle = 'translateX(-65%) translateZ(-70px) rotateY(18deg) scale(0.82)';
              opacityStyle = 0.90;
              zIndexStyle = 20;
            } else if (offset === 1) {
              // Right 1: 82% scale, visible curved depth
              transformStyle = 'translateX(65%) translateZ(-70px) rotateY(-18deg) scale(0.82)';
              opacityStyle = 0.90;
              zIndexStyle = 20;
            } else if (offset === -2) {
              // Left 2 (Desktop only): 65% scale
              transformStyle = 'translateX(-110%) translateZ(-140px) rotateY(26deg) scale(0.65)';
              opacityStyle = 0.65;
              zIndexStyle = 10;
            } else if (offset === 2) {
              // Right 2 (Desktop only): 65% scale
              transformStyle = 'translateX(110%) translateZ(-140px) rotateY(-26deg) scale(0.65)';
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
                className={`absolute w-[220px] sm:w-[245px] md:w-[260px] lg:w-[270px] h-[315px] sm:h-[345px] md:h-[365px] lg:h-[385px] rounded-2xl overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-shadow duration-300 group ${
                  isDesktopOnly ? 'hidden sm:flex' : 'flex'
                } ${
                  isCenter
                    ? 'bg-gradient-to-b from-[#0D1C2E] via-[#081321] to-[#040A12] border-2 border-[#D7A52A] shadow-[0_0_35px_rgba(215,165,42,0.35),0_15px_40px_rgba(0,0,0,0.85)] ring-1 ring-[#D7A52A]/50'
                    : 'bg-gradient-to-b from-[#0A1624]/95 via-[#060E18]/95 to-[#03070D]/95 border border-[#D7A52A]/30 hover:border-[#07883F] shadow-lg hover:shadow-xl'
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
                {/* Full-Bleed Player Photography Container (78% Card Height) */}
                <div className="relative w-full h-[78%] overflow-hidden bg-[#071320] flex items-center justify-center">
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
                    <div className="w-full h-full p-3 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#0B2341] to-[#030914]">
                      <span className="text-2xl">{legend.flag}</span>
                      <span className="text-xs font-black text-white mt-1">{legend.shortName}</span>
                    </div>
                  )}

                  {/* Dark Vignette Bottom Gradient for Seamless Typography Transition */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#081321] via-[#081321]/80 to-transparent pointer-events-none" />

                  {/* Top Left: Country Flag + Position Pill */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 shadow-md text-xs">
                    <span className="text-xs">{legend.flag}</span>
                    <span className="text-[9px] font-black text-white">{legend.position}</span>
                  </div>

                  {/* Top Right: Golden Era Pill */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#D7A52A]/20 backdrop-blur-md border border-[#D7A52A]/50 text-[8px] font-extrabold text-[#FDE047] shadow-xs">
                    {legend.era}
                  </div>
                </div>

                {/* Lower Information Strip (22% Card Height) */}
                <div className="p-2.5 sm:p-3 bg-[#081321] flex flex-col justify-between flex-1 relative z-10 border-t border-white/10 text-center">
                  <div>
                    <h3 className="font-black text-xs sm:text-sm lg:text-base text-white tracking-wider truncate group-hover:text-[#FDE047] transition-colors">
                      {legend.shortName}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[#FDE047] truncate">
                      {legend.label}
                    </p>
                  </div>

                  {/* Country Flag & Nationality Badge */}
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-300 font-semibold border-t border-white/10 pt-1 mt-0.5">
                    <span className="text-xs">{legend.flag}</span>
                    <span className="text-slate-300 font-bold">{legend.nationality}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrow Controls - Compact Circular Buttons Flanking Stage */}
        <button
          type="button"
          onClick={handlePrevClick}
          aria-label="Previous legend"
          className="absolute left-1 sm:left-2 z-40 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-[#D7A52A]/60 hover:border-[#D7A52A] text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          aria-label="Next legend"
          className="absolute right-1 sm:right-2 z-40 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-[#D7A52A]/60 hover:border-[#D7A52A] text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
      </div>

      {/* Carousel Footer Indicator & Status */}
      <div className="relative z-10 w-full flex items-center justify-center gap-2 pt-1 pb-1 text-xs text-slate-300">
        {/* Player Navigation Dots */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 max-w-full">
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
                  ? 'w-5 sm:w-6 h-1.5 bg-[#D7A52A] shadow-[0_0_6px_#D7A52A]'
                  : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Quick Registration Anchor CTA on Mobile below Carousel */}
      <div className="sm:hidden mt-2 w-full flex justify-center">
        <button
          type="button"
          onClick={handleScrollToRegister}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#07883F] hover:bg-[#13A653] text-white text-xs font-black uppercase tracking-wider shadow-md border border-[#10B981]/50 cursor-pointer"
        >
          <span>REGISTER FOR MATCH</span>
          <ArrowDown className="w-3 h-3 animate-bounce" />
        </button>
      </div>
    </div>
  );
}
