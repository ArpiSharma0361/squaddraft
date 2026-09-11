import React, { useState } from 'react';

// Position Configuration & Visual Identity Tokens
export const POSITION_THEMES = {
  GK: {
    code: 'GK',
    name: 'Goalkeeper',
    actionText: 'SAVE!',
    celebrationTitle: 'CLEAN SHEET LOCKED! 🧤',
    subtitle: 'Shot Stopper & Goalie',
    badge: '🧤',
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    bgGradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
    borderLight: 'border-amber-300',
    borderGlow: 'hover:border-amber-400 hover:shadow-amber-500/20',
    activeBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    accentText: 'text-amber-600',
    buttonBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/25'
  },
  DEF: {
    code: 'DEF',
    name: 'Defender',
    actionText: 'BLOCK!',
    celebrationTitle: 'DEFENSIVE WALL LOCKED! 🛡️',
    subtitle: 'Defensive Anchor & Guard',
    badge: '🛡️',
    primaryColor: '#0284C7',
    secondaryColor: '#0369A1',
    glowColor: 'rgba(2, 132, 199, 0.35)',
    bgGradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
    borderLight: 'border-sky-300',
    borderGlow: 'hover:border-sky-400 hover:shadow-sky-500/20',
    activeBadge: 'bg-sky-100 text-sky-900 border-sky-300',
    accentText: 'text-sky-600',
    buttonBg: 'bg-sky-600 hover:bg-sky-500 text-white font-black shadow-sky-500/25'
  },
  MID: {
    code: 'MID',
    name: 'Midfielder',
    actionText: 'VISION!',
    celebrationTitle: 'PLAYMAKER SIGNED! 🎯',
    subtitle: 'Engine & Tactical Playmaker',
    badge: '🎯',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    bgGradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    borderLight: 'border-emerald-300',
    borderGlow: 'hover:border-emerald-400 hover:shadow-emerald-500/20',
    activeBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentText: 'text-emerald-600',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-emerald-500/25'
  },
  ST: {
    code: 'ST',
    name: 'Striker',
    actionText: 'GOAL!',
    celebrationTitle: 'GOAL MACHINE SIGNED! ⚡',
    subtitle: 'Attacker & Clinical Finisher',
    badge: '⚡',
    primaryColor: '#F97316',
    secondaryColor: '#DC2626',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    bgGradient: 'from-orange-500/10 via-rose-500/5 to-transparent',
    borderLight: 'border-orange-300',
    borderGlow: 'hover:border-orange-400 hover:shadow-orange-500/20',
    activeBadge: 'bg-orange-100 text-orange-900 border-orange-300',
    accentText: 'text-orange-600',
    buttonBg: 'bg-orange-500 hover:bg-orange-400 text-white font-black shadow-orange-500/25'
  },
  ANY: {
    code: 'ANY',
    name: 'Universal',
    actionText: 'VERSATILE!',
    celebrationTitle: 'VERSATILE TALENT LOCKED! ⭐',
    subtitle: 'Any Position & Multi-Role',
    badge: '⭐',
    primaryColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    bgGradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
    borderLight: 'border-purple-300',
    borderGlow: 'hover:border-purple-400 hover:shadow-purple-500/20',
    activeBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    accentText: 'text-purple-600',
    buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white font-black shadow-purple-500/25'
  }
};

export function normalizePosition(pos) {
  const p = (pos || '').toUpperCase().trim();
  if (p === 'GK' || p.includes('GOAL') || p.includes('KEEPER')) return 'GK';
  if (p === 'DEF' || p.includes('DEFEND') || p.includes('BACK') || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 'DEF';
  if (p === 'MID' || p.includes('MIDFIELD') || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) return 'MID';
  if (p === 'ST' || p === 'FWD' || p.includes('STRIKE') || p.includes('FORWARD') || p.includes('ATTACK') || p.includes('WING')) return 'ST';
  return 'ANY';
}

/**
 * Reusable PositionAnimation Component
 * Compact, interactive vector visuals with high-impact selection celebration states
 */
export default function PositionAnimation({
  position = 'ANY',
  size = 'sm', // 'xs' (28px) | 'sm' (44px) | 'md' (64px) | 'celebration' (112px)
  isHovered = false,
  isSelected = false,
  className = '',
  showLabel = false,
  interactive = false
}) {
  const [internalHover, setInternalHover] = useState(false);
  const activeHover = isHovered || internalHover;
  const posKey = normalizePosition(position);
  const theme = POSITION_THEMES[posKey] || POSITION_THEMES.ANY;

  // Responsive, compact dimension mappings
  const sizeMap = {
    xs: { box: 'w-7 h-7', scale: 0.5 },
    sm: { box: 'w-11 h-11', scale: 0.75 },
    md: { box: 'w-16 h-16', scale: 1 },
    celebration: { box: 'w-28 h-28', scale: 1.6 }
  };

  const dim = sizeMap[size] || sizeMap.sm;

  return (
    <div
      className={`relative flex items-center justify-center select-none shrink-0 ${dim.box} ${className}`}
      onMouseEnter={() => interactive && setInternalHover(true)}
      onMouseLeave={() => interactive && setInternalHover(false)}
      style={{ perspective: 800 }}
    >
      {/* Subtle Glow Aura — Only active on hover or selection */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
          isSelected
            ? 'scale-150 opacity-90 blur-md'
            : activeHover
            ? 'scale-125 opacity-60 blur-sm'
            : 'scale-90 opacity-15 blur-xs'
        }`}
        style={{
          background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)`
        }}
      />

      {/* Vector Graphic Container with micro-transform on hover */}
      <div
        className={`relative w-full h-full flex items-center justify-center transition-transform duration-250 ease-out ${
          isSelected
            ? 'scale-115'
            : activeHover
            ? '-translate-y-0.5 scale-105'
            : 'translate-y-0 scale-100'
        }`}
      >
        {posKey === 'GK' && (
          <GoalkeeperAnimation activeHover={activeHover} isSelected={isSelected} />
        )}
        {posKey === 'DEF' && (
          <DefenderAnimation activeHover={activeHover} isSelected={isSelected} />
        )}
        {posKey === 'MID' && (
          <MidfielderAnimation activeHover={activeHover} isSelected={isSelected} />
        )}
        {posKey === 'ST' && (
          <StrikerAnimation activeHover={activeHover} isSelected={isSelected} />
        )}
        {posKey === 'ANY' && (
          <UniversalAnimation activeHover={activeHover} isSelected={isSelected} />
        )}
      </div>

      {showLabel && (
        <span className={`mt-1 text-[10px] font-black uppercase tracking-wider ${theme.accentText}`}>
          {theme.name}
        </span>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 1. GOALKEEPER (GK) — 3D Gloves & Clean Sheet Save
// -------------------------------------------------------------
function GoalkeeperAnimation({ activeHover, isSelected }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        <radialGradient id="gkBallGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>
        <linearGradient id="gkGloveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>

      {/* Hexagonal Goal Net Mesh — subtle in background */}
      <g opacity={activeHover ? 0.35 : 0.18}>
        <path d="M22 22 L36 14 L50 22 L64 14 L78 22 M22 40 L36 32 L50 40 L64 32 L78 40 M22 58 L36 50 L50 58 L64 50 L78 58 M36 14 V70 M50 22 V80 M64 14 V70" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
      </g>

      {/* Save Shockwave Ring */}
      <circle
        cx="50"
        cy="45"
        r={isSelected ? "40" : activeHover ? "34" : "26"}
        fill="none"
        stroke="#FCD34D"
        strokeWidth={isSelected ? "2.5" : "1.2"}
        opacity={isSelected ? 0.9 : activeHover ? 0.5 : 0.2}
        className="transition-all duration-300"
      />

      {/* Left Glove */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '32px 55px',
          transform: isSelected
            ? 'translate(5px, -3px) rotate(14deg) scale(1.08)'
            : activeHover
            ? 'translate(2px, -1px) rotate(6deg)'
            : 'rotate(0deg)'
        }}
      >
        <path d="M22 46 C20 41 24 36 29 36 C31 36 33 38 35 40 C36 37 39 35 42 37 C45 39 46 44 44 48 L44 60 C44 64 38 66 33 66 C28 66 22 62 22 57 Z" fill="url(#gkGloveGrad)" stroke="#92400E" strokeWidth="1.6" />
        <rect x="24" y="61" width="18" height="6" rx="2.5" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />
      </g>

      {/* Right Glove */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '68px 55px',
          transform: isSelected
            ? 'translate(-5px, -3px) rotate(-14deg) scale(1.08)'
            : activeHover
            ? 'translate(-2px, -1px) rotate(-6deg)'
            : 'rotate(0deg)'
        }}
      >
        <path d="M78 46 C80 41 76 36 71 36 C69 36 67 38 65 40 C64 37 61 35 58 37 C55 39 54 44 56 48 L56 60 C56 64 62 66 67 66 C72 66 78 62 78 57 Z" fill="url(#gkGloveGrad)" stroke="#92400E" strokeWidth="1.6" />
        <rect x="58" y="61" width="18" height="6" rx="2.5" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />
      </g>

      {/* Center Golden Saved Football */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '50px 42px',
          transform: isSelected ? 'scale(1.2) translateY(-2px)' : activeHover ? 'translateY(-2px) scale(1.06)' : 'scale(1)'
        }}
      >
        <circle cx="50" cy="42" r="13" fill="url(#gkBallGrad)" stroke="#FEF3C7" strokeWidth="1.6" />
        <polygon points="50,35 55,39 53,44 47,44 45,39" fill="#78350F" opacity="0.85" />
        <ellipse cx="46" cy="38" rx="3.5" ry="1.8" fill="#FFFFFF" opacity="0.6" />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 2. DEFENDER (DEF) — 3D Fortress Shield & Defensive Wall
// -------------------------------------------------------------
function DefenderAnimation({ activeHover, isSelected }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="defShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="45%" stopColor="#0284C7" />
          <stop offset="85%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
      </defs>

      {/* Barrier Shockwave Ring */}
      <circle
        cx="50"
        cy="50"
        r={isSelected ? "42" : activeHover ? "36" : "28"}
        fill="none"
        stroke="#38BDF8"
        strokeWidth={isSelected ? "2.5" : "1.2"}
        strokeDasharray="4 3"
        opacity={isSelected ? 0.9 : activeHover ? 0.55 : 0.2}
        className="transition-all duration-300"
      />

      {/* 3D Shield */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '50px 50px',
          transform: isSelected ? 'scale(1.12) translateY(-2px)' : activeHover ? 'translateY(-2px) scale(1.05)' : 'scale(1)'
        }}
      >
        <path d="M50 18 L74 25 C74 54 50 76 50 76 C50 76 26 54 26 25 Z" fill="rgba(0,0,0,0.2)" transform="translate(1, 3)" />
        <path d="M50 18 L74 25 C74 54 50 76 50 76 C50 76 26 54 26 25 Z" fill="url(#defShieldGrad)" stroke="#BAE6FD" strokeWidth="2.5" />
        <path d="M50 24 L68 29 C68 50 50 67 50 67 L50 24 Z" fill="#38BDF8" opacity="0.25" />
        {/* Shield Chevron Crest */}
        <path d="M50 32 L63 39 L50 48 L37 39 Z" fill="#F0F9FF" stroke="#0284C7" strokeWidth="1.2" opacity="0.9" />
        <path d="M50 45 L60 51 L50 59 L40 51 Z" fill="#38BDF8" opacity="0.75" />
      </g>

      {/* Ricochet Football */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '74px 30px',
          transform: isSelected ? 'translate(5px, -5px) scale(1.18)' : activeHover ? 'translate(2px, -2px) scale(1.05)' : 'scale(1)'
        }}
      >
        <circle cx="74" cy="30" r="8.5" fill="#FFFFFF" stroke="#0369A1" strokeWidth="1.4" />
        <polygon points="74,26 77,28 76,31 72,31 71,28" fill="#0284C7" />
        {(activeHover || isSelected) && (
          <g stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round">
            <line x1="67" y1="22" x2="63" y2="18" />
            <line x1="81" y1="22" x2="85" y2="18" />
          </g>
        )}
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 3. MIDFIELDER (MID) — 3D Playmaker Compass & Passing Vector
// -------------------------------------------------------------
function MidfielderAnimation({ activeHover, isSelected }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        <radialGradient id="midRadar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#064E3B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="midBall" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="50%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="36" fill="url(#midRadar)" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#10B981" strokeWidth="1.2" strokeDasharray="5 3" opacity={activeHover ? 0.8 : 0.3} />

      {/* Crosshairs */}
      <g stroke="#10B981" strokeWidth="1" opacity="0.45" strokeDasharray="2 2">
        <line x1="50" y1="12" x2="50" y2="88" />
        <line x1="12" y1="50" x2="88" y2="50" />
      </g>

      {/* Passing Arc */}
      <path
        d="M22 68 Q36 26 74 36"
        fill="none"
        stroke="#6EE7B7"
        strokeWidth={isSelected ? "2.5" : "1.8"}
        strokeLinecap="round"
        strokeDasharray={activeHover ? "4 2" : "none"}
      />
      <circle cx="22" cy="68" r="3.5" fill="#047857" stroke="#34D399" strokeWidth="1.2" />

      {/* Target Node */}
      <circle cx="74" cy="36" r="7.5" fill="none" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="74" cy="36" r="3" fill="#34D399" />

      {/* Playmaker Football */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '50px 45px',
          transform: isSelected ? 'translate(10px, -4px) scale(1.18)' : activeHover ? 'translate(5px, -2px) scale(1.08)' : 'scale(1)'
        }}
      >
        <circle cx="50" cy="45" r="12" fill="url(#midBall)" stroke="#A7F3D0" strokeWidth="1.6" />
        <polygon points="50,38 52,43 57,45 52,47 50,52 48,47 43,45 48,43" fill="#064E3B" opacity="0.8" />
        <ellipse cx="47" cy="41" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.7" />
      </g>
    </svg>
  );
}

// -------------------------------------------------------------
// 4. STRIKER (ST) — 3D Rocket Shot & Goal Strike
// -------------------------------------------------------------
function StrikerAnimation({ activeHover, isSelected }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        <radialGradient id="stGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="35%" stopColor="#F97316" />
          <stop offset="80%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
        <linearGradient id="stTrail" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
          <stop offset="60%" stopColor="#F97316" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FDE047" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Combustion Speed Trail */}
      <path d="M18 82 Q36 68 46 56 L38 52 Q24 66 18 82 Z" fill="url(#stTrail)" opacity={activeHover ? 0.95 : 0.55} />
      <path d="M22 72 L32 58 L27 56 L40 42" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={activeHover ? 1 : 0.4} />

      {/* Goal Target Corner */}
      <g stroke="#F97316" strokeWidth="1.4" fill="none" opacity={activeHover ? 0.75 : 0.3}>
        <path d="M72 18 L86 18 L86 32" strokeLinecap="round" />
      </g>

      {/* 3D Striker Rocket Ball */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '56px 44px',
          transform: isSelected ? 'translate(8px, -8px) scale(1.2) rotate(16deg)' : activeHover ? 'translate(4px, -4px) scale(1.08) rotate(8deg)' : 'scale(1)'
        }}
      >
        <circle cx="56" cy="44" r="12.5" fill="url(#stGrad)" stroke="#FEF08A" strokeWidth="1.6" />
        <polygon points="56,36 61,40 59,46 52,46 51,40" fill="#7F1D1D" opacity="0.9" />
        <ellipse cx="53" cy="40" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.75" />
      </g>

      {(activeHover || isSelected) && (
        <g stroke="#FEF08A" strokeWidth="1.6" strokeLinecap="round">
          <line x1="70" y1="28" x2="76" y2="22" />
          <line x1="74" y1="36" x2="82" y2="34" />
        </g>
      )}
    </svg>
  );
}

// -------------------------------------------------------------
// 5. UNIVERSAL / UTILITY (ANY) — 3D Gyroscope & Celestial Star
// -------------------------------------------------------------
function UniversalAnimation({ activeHover, isSelected }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
      <defs>
        <radialGradient id="anyGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F5D0FE" />
          <stop offset="45%" stopColor="#C084FC" />
          <stop offset="80%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#3B0764" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="32" fill="none" stroke="#C084FC" strokeWidth="1" strokeDasharray="4 3" opacity={activeHover ? 0.6 : 0.25} />
      <ellipse cx="50" cy="50" rx="34" ry="14" fill="none" stroke="#E879F9" strokeWidth="1.6" transform="rotate(-30 50 50)" opacity={activeHover ? 0.9 : 0.55} />
      <ellipse cx="50" cy="50" rx="34" ry="14" fill="none" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="5 3" transform="rotate(40 50 50)" opacity={activeHover ? 0.75 : 0.35} />

      {/* Orbiting Star Diamond */}
      <polygon points="22,36 24,38 22,40 20,38" fill="#FDE047" />
      <polygon points="78,64 80,66 78,68 76,66" fill="#FDE047" />

      {/* 3D Universal Football */}
      <g
        className="transition-transform duration-250 ease-out"
        style={{
          transformOrigin: '50px 50px',
          transform: isSelected ? 'scale(1.2) rotate(12deg)' : activeHover ? 'scale(1.08)' : 'scale(1)'
        }}
      >
        <circle cx="50" cy="50" r="12.5" fill="url(#anyGrad)" stroke="#F5D0FE" strokeWidth="1.6" />
        <polygon points="50,42 54,46 53,51 47,51 46,46" fill="#3B0764" opacity="0.8" />
        <polygon points="50,39 52,43 56,44 53,47 54,51 50,49 46,51 47,47 44,44 48,43" fill="#FDE047" opacity="0.8" />
        <ellipse cx="47" cy="46" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.75" />
      </g>
    </svg>
  );
}
