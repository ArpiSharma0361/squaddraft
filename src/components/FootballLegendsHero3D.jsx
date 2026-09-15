import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FOOTBALL_LEGENDS } from '../data/footballLegends';
import { ChevronLeft, ChevronRight, Sparkles, ArrowDown } from 'lucide-react';

const POSITION_BADGES = {
  GK: { label: 'GK', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  DEF: { label: 'DEF', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  MID: { label: 'MID', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  ST: { label: 'ST', bg: 'bg-orange-100 text-orange-800 border-orange-300' }
};

const AUTOPLAY_INTERVAL = 3000;
const RESUME_DELAY = 5000;

/**
 * Cinematic Pseudo-3D Football Legends Hero Carousel
 * Pure CSS transforms + React state. Zero WebGL / Three.js.
 * Windowed 5-card active layout on desktop, 3-card on mobile.
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

  // Autoplay loop
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
      className="relative w-full rounded-3xl bg-gradient-to-b from-[#FFFDF8] via-[#FFF8E8]/70 to-[#F8F7F2] border border-[#E5E7EB] shadow-md p-4 sm:p-6 lg:p-7 overflow-hidden text-[#0B2341] select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stadium floodlight golden glow accent */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#D7A52A]/10 via-[#FFF8E8]/40 to-transparent pointer-events-none" />
      <div className="absolute -top-20 right-1/4 w-72 h-72 rounded-full bg-[#07883F]/5 blur-3xl pointer-events-none" />

      {/* Top Header & Intro Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D7A52A]/40 text-[#07883F] text-xs font-black uppercase tracking-wider mb-2 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D7A52A]" />
            <span>MUSEUM 3D ROTATION</span>
            <span className="text-[10px] text-[#536273] font-bold">
              ({currentIndex + 1}/{totalLegends})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#0B2341]">
            LEGENDS <span className="text-[#07883F]">IN MOTION</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#536273] font-semibold mt-0.5">
            17 Icons who defined the beautiful game.
          </p>
        </div>

        {/* Quick Registration Anchor CTA */}
        <button
          type="button"
          onClick={() => {
            if (onRegisterClick) onRegisterClick();
            else {
              const el = document.getElementById('register-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#07883F] hover:bg-[#13A653] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:shadow-md active:scale-98 cursor-pointer"
        >
          <span>REGISTER FOR MATCH</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </div>

      {/* 3D Carousel Stage */}
      <div
        className="relative w-full h-[290px] sm:h-[330px] md:h-[360px] flex items-center justify-center overflow-hidden touch-pan-y"
        style={{ perspective: prefersReducedMotion ? 'none' : '1000px' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: prefersReducedMotion ? 'flat' : 'preserve-3d' }}
        >
          {offsets.map((offset) => {
            const index = (currentIndex + offset + totalLegends) % totalLegends;
            const legend = FOOTBALL_LEGENDS[index];
            const hasImageFailed = !!imageErrors[legend.id];
            const posStyle = POSITION_BADGES[legend.position] || POSITION_BADGES.MID;
            const isCenter = offset === 0;
            const isDesktopOnly = Math.abs(offset) === 2;

            // Responsive 3D transform calculation
            let transformStyle = '';
            let opacityStyle = 1;
            let zIndexStyle = 30;

            if (prefersReducedMotion) {
              transformStyle = 'none';
              opacityStyle = 1;
              zIndexStyle = 30;
            } else if (isCenter) {
              transformStyle = 'translateX(0%) translateZ(0px) scale(1) rotateY(0deg)';
              opacityStyle = 1;
              zIndexStyle = 30;
            } else if (offset === -1) {
              // Left 1
              transformStyle = 'translateX(-58%) translateZ(-90px) scale(0.84) rotateY(18deg)';
              opacityStyle = 0.72;
              zIndexStyle = 20;
            } else if (offset === 1) {
              // Right 1
              transformStyle = 'translateX(58%) translateZ(-90px) scale(0.84) rotateY(-18deg)';
              opacityStyle = 0.72;
              zIndexStyle = 20;
            } else if (offset === -2) {
              // Left 2 (Desktop only)
              transformStyle = 'translateX(-104%) translateZ(-180px) scale(0.68) rotateY(28deg)';
              opacityStyle = 0.38;
              zIndexStyle = 10;
            } else if (offset === 2) {
              // Right 2 (Desktop only)
              transformStyle = 'translateX(104%) translateZ(-180px) scale(0.68) rotateY(-28deg)';
              opacityStyle = 0.38;
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
                    : 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                className={`absolute w-[185px] sm:w-[215px] md:w-[235px] aspect-[4/5] rounded-2xl bg-white border overflow-hidden flex flex-col justify-between select-none cursor-pointer transition-shadow duration-300 ${
                  isDesktopOnly ? 'hidden sm:flex' : 'flex'
                } ${
                  isCenter
                    ? 'border-[#D7A52A] shadow-2xl shadow-[#07883F]/15 ring-2 ring-[#D7A52A]/90'
                    : 'border-[#E5E7EB] hover:border-[#07883F] shadow-md hover:shadow-lg'
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
                {/* Card Top: Photo Container */}
                <div className="relative w-full h-[66%] bg-[#F8F7F2] overflow-hidden flex items-center justify-center border-b border-[#E5E7EB]/80">
                  {!hasImageFailed ? (
                    <img
                      src={legend.image}
                      alt={`${legend.name} football legend`}
                      loading={isCenter ? 'eager' : 'lazy'}
                      decoding="async"
                      {...(isCenter ? { fetchpriority: 'high' } : {})}
                      onError={() => handleImageError(legend.id)}
                      style={{ objectPosition: legend.objectPosition || 'center 25%' }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#FFF8E8] to-[#FFFFFF]">
                      <span className="text-xl">{legend.flag}</span>
                      <span className="text-[10px] font-black text-[#0B2341] mt-1">{legend.shortName}</span>
                    </div>
                  )}

                  {/* Corner Position & Flag Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#E5E7EB] shadow-xs text-xs">
                    <span>{legend.flag}</span>
                    <span className="text-[9px] font-black text-[#0B2341]">{legend.position}</span>
                  </div>

                  {/* Era pill on top right */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-white/95 backdrop-blur-xs border border-[#E5E7EB] text-[8px] font-bold text-[#536273]">
                    {legend.era}
                  </div>
                </div>

                {/* Card Bottom: Metadata */}
                <div className="p-2 sm:p-2.5 bg-white flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-black text-xs sm:text-sm text-[#0B2341] tracking-tight truncate">
                        {legend.shortName}
                      </h3>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black uppercase border ${posStyle.bg}`}>
                        {posStyle.label}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-[#07883F] truncate mt-0.5">
                      {legend.label}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-[#536273] font-semibold border-t border-[#E5E7EB]/60 pt-1 mt-1">
                    <span className="truncate">{legend.nationality}</span>
                    <span className="text-[#D7A52A] font-bold">★ LEGEND</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrow Controls */}
        <button
          type="button"
          onClick={handlePrevClick}
          aria-label="Previous legend"
          className="absolute left-1 sm:left-3 z-40 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white border border-[#E5E7EB] hover:border-[#07883F] text-[#0B2341] shadow-md hover:shadow-lg transition-all active:scale-90 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B2341]" />
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          aria-label="Next legend"
          className="absolute right-1 sm:right-3 z-40 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white border border-[#E5E7EB] hover:border-[#07883F] text-[#0B2341] shadow-md hover:shadow-lg transition-all active:scale-90 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B2341]" />
        </button>
      </div>

      {/* Carousel Footer Indicator & Status */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 mt-1 border-t border-[#E5E7EB] text-xs text-[#536273]">
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
                  ? 'w-5 sm:w-6 h-2 bg-[#07883F]'
                  : 'w-2 h-2 bg-[#E5E7EB] hover:bg-[#D7A52A]'
              }`}
            />
          ))}
        </div>

        {/* Current Active Legend Summary Pill */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="text-[#0B2341] font-black">{currentLegend.name}</span>
          <span className="text-[#07883F]">({currentLegend.label})</span>
          {isInteracting && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-in fade-in">
              Paused (5s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
