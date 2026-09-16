import React, { useState } from 'react';
import {
  Award,
  Crown,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Check,
  Flame,
  Gem,
  Zap,
  SlidersHorizontal,
  ChevronUp,
} from 'lucide-react';
import { CardItem, SlabConfig } from '../types/pokemon.ts';

export interface ConditionTier {
  id: string;
  name: string;
  gradeNumber: string;
  fullGradeString: string;
  subGrade: string;
  badge: string;
  desc: string;
  // Visual styling
  cardBg: string;
  borderClass: string;
  glowShadow: string;
  textColor: string;
  accentColor: string;
  gradeNumberColor: string;
  pillBg: string;
  icon: 'crown' | 'gem' | 'sparkles' | 'shield' | 'flame' | 'zap' | 'award';
  defaultScores: {
    centering: string;
    corners: string;
    edges: string;
    surface: string;
  };
  pricingTier: 'psa10' | 'psa9' | 'psa8' | 'raw';
}

export const CONDITION_TIERS: ConditionTier[] = [
  {
    id: 'pristine',
    name: 'Pristine 10',
    gradeNumber: '10',
    fullGradeString: 'PRISTINE 10',
    subGrade: 'PRISTINE',
    badge: 'BLACK LABEL 10',
    desc: 'Flawless 50/50 centering, pristine surface, zero micro-wear',
    cardBg: 'bg-gradient-to-br from-amber-950/90 via-yellow-950/80 to-slate-950',
    borderClass: 'border-amber-400/90 ring-1 ring-amber-300/60',
    glowShadow: 'shadow-[0_0_25px_rgba(245,158,11,0.45)]',
    textColor: 'text-amber-200',
    accentColor: '#f59e0b',
    gradeNumberColor: 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-amber-300 to-amber-500 font-black',
    pillBg: 'bg-amber-400 text-slate-950 font-black',
    icon: 'crown',
    defaultScores: {
      centering: '10.0',
      corners: '10.0',
      edges: '10.0',
      surface: '10.0',
    },
    pricingTier: 'psa10',
  },
  {
    id: 'gem_mint',
    name: 'Gem Mint 10',
    gradeNumber: '10',
    fullGradeString: '#10 GRADE',
    subGrade: 'GEM MINT',
    badge: 'GEM MINT',
    desc: 'Virtual perfection with sharp focus, full gloss, clean corners',
    cardBg: 'bg-gradient-to-br from-emerald-950/90 via-teal-950/80 to-slate-950',
    borderClass: 'border-emerald-400/90 ring-1 ring-teal-400/50',
    glowShadow: 'shadow-[0_0_25px_rgba(52,211,153,0.4)]',
    textColor: 'text-emerald-200',
    accentColor: '#10b981',
    gradeNumberColor: 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-400 font-black',
    pillBg: 'bg-emerald-400 text-slate-950 font-black',
    icon: 'gem',
    defaultScores: {
      centering: '10.0',
      corners: '10.0',
      edges: '9.5',
      surface: '10.0',
    },
    pricingTier: 'psa10',
  },
  {
    id: 'mint_plus',
    name: 'Mint+ 9.5',
    gradeNumber: '9.5',
    fullGradeString: '#9.5 MINT+',
    subGrade: 'MINT+',
    badge: 'MINT PLUS',
    desc: 'Near-flawless presentation exceeding standard mint thresholds',
    cardBg: 'bg-gradient-to-br from-cyan-950/90 via-sky-950/80 to-slate-950',
    borderClass: 'border-cyan-400/90 ring-1 ring-sky-400/50',
    glowShadow: 'shadow-[0_0_25px_rgba(56,189,248,0.4)]',
    textColor: 'text-cyan-200',
    accentColor: '#06b6d4',
    gradeNumberColor: 'text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-sky-300 to-blue-400 font-black',
    pillBg: 'bg-cyan-400 text-slate-950 font-black',
    icon: 'sparkles',
    defaultScores: {
      centering: '9.5',
      corners: '9.5',
      edges: '9.5',
      surface: '9.5',
    },
    pricingTier: 'psa10',
  },
  {
    id: 'mint',
    name: 'Mint 9',
    gradeNumber: '9',
    fullGradeString: '#9 MINT',
    subGrade: 'MINT',
    badge: 'MINT 9',
    desc: 'High-end investment grade with slight single flaw allowed',
    cardBg: 'bg-gradient-to-br from-blue-950/90 via-indigo-950/80 to-slate-950',
    borderClass: 'border-blue-400/80 ring-1 ring-blue-500/40',
    glowShadow: 'shadow-[0_0_20px_rgba(96,165,250,0.35)]',
    textColor: 'text-blue-200',
    accentColor: '#3b82f6',
    gradeNumberColor: 'text-transparent bg-clip-text bg-gradient-to-br from-blue-200 via-indigo-300 to-blue-500 font-black',
    pillBg: 'bg-blue-500 text-white font-black',
    icon: 'shield',
    defaultScores: {
      centering: '9.0',
      corners: '9.0',
      edges: '9.0',
      surface: '9.0',
    },
    pricingTier: 'psa9',
  },
  {
    id: 'near_mint_mint',
    name: 'Near Mint-Mint 8',
    gradeNumber: '8',
    fullGradeString: '#8 NM-MT',
    subGrade: 'NM-MT',
    badge: 'NM-MT 8',
    desc: 'Superb eye appeal with minor surface wear or slight corner touch',
    cardBg: 'bg-gradient-to-br from-teal-950/80 via-slate-900/90 to-black',
    borderClass: 'border-teal-400/70 ring-1 ring-teal-500/30',
    glowShadow: 'shadow-[0_0_18px_rgba(45,212,191,0.3)]',
    textColor: 'text-teal-200',
    accentColor: '#14b8a6',
    gradeNumberColor: 'text-teal-300 font-black',
    pillBg: 'bg-teal-500/30 border border-teal-400/60 text-teal-200 font-bold',
    icon: 'award',
    defaultScores: {
      centering: '8.5',
      corners: '8.0',
      edges: '8.5',
      surface: '8.0',
    },
    pricingTier: 'psa8',
  },
  {
    id: 'near_mint',
    name: 'Near Mint 7',
    gradeNumber: '7',
    fullGradeString: '#7 NM',
    subGrade: 'NEAR MINT',
    badge: 'NEAR MINT 7',
    desc: 'Slight surface wear or minor edge whitening, strong display',
    cardBg: 'bg-gradient-to-br from-amber-950/70 via-slate-900/90 to-black',
    borderClass: 'border-amber-500/60 ring-1 ring-amber-500/30',
    glowShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    textColor: 'text-amber-300',
    accentColor: '#d97706',
    gradeNumberColor: 'text-amber-300 font-black',
    pillBg: 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold',
    icon: 'shield',
    defaultScores: {
      centering: '7.5',
      corners: '7.0',
      edges: '7.0',
      surface: '7.5',
    },
    pricingTier: 'psa8',
  },
  {
    id: 'excellent',
    name: 'Excellent 6',
    gradeNumber: '6',
    fullGradeString: '#6 EX',
    subGrade: 'EXCELLENT',
    badge: 'EXCELLENT 6',
    desc: 'Visible edge wear, light scratches, intact visual integrity',
    cardBg: 'bg-gradient-to-br from-orange-950/70 via-stone-900/90 to-black',
    borderClass: 'border-orange-500/60 ring-1 ring-orange-500/30',
    glowShadow: 'shadow-[0_0_15px_rgba(234,88,12,0.25)]',
    textColor: 'text-orange-300',
    accentColor: '#ea580c',
    gradeNumberColor: 'text-orange-400 font-black',
    pillBg: 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold',
    icon: 'flame',
    defaultScores: {
      centering: '6.5',
      corners: '6.0',
      edges: '6.0',
      surface: '6.0',
    },
    pricingTier: 'raw',
  },
  {
    id: 'authentic',
    name: 'Authentic',
    gradeNumber: 'AUTH',
    fullGradeString: 'AUTHENTIC',
    subGrade: 'VERIFIED',
    badge: 'AUTHENTIC',
    desc: 'Certified genuine card without numerical grade designation',
    cardBg: 'bg-gradient-to-br from-purple-950/80 via-violet-950/80 to-slate-950',
    borderClass: 'border-purple-400/70 ring-1 ring-purple-400/40',
    glowShadow: 'shadow-[0_0_18px_rgba(168,85,247,0.35)]',
    textColor: 'text-purple-200',
    accentColor: '#a855f7',
    gradeNumberColor: 'text-purple-300 font-black text-xl',
    pillBg: 'bg-purple-500/30 border border-purple-400/60 text-purple-200 font-bold',
    icon: 'zap',
    defaultScores: {
      centering: 'AUTH',
      corners: 'AUTH',
      edges: 'AUTH',
      surface: 'AUTH',
    },
    pricingTier: 'raw',
  },
];

export function resolveConditionTier(
  condition?: string,
  grade?: string,
  subGrade?: string
): ConditionTier {
  const haystack = `${condition || ''} ${grade || ''} ${subGrade || ''}`.toLowerCase();

  if (haystack.includes('pristine') || haystack.includes('perfect') || haystack.includes('black label')) {
    return CONDITION_TIERS[0]; // Pristine
  }
  if (haystack.includes('gem') || (haystack.includes('10') && !haystack.includes('auto') && !haystack.includes('9.'))) {
    return CONDITION_TIERS[1]; // Gem Mint
  }
  if (haystack.includes('9.5') || haystack.includes('mint+')) {
    return CONDITION_TIERS[2]; // Mint+
  }
  if (haystack.includes('mint 9') || (haystack.includes('9') && !haystack.includes('9.5') && !haystack.includes('19'))) {
    return CONDITION_TIERS[3]; // Mint 9
  }
  if (haystack.includes('nm-mt') || haystack.includes('near mint-mint') || haystack.includes('8')) {
    return CONDITION_TIERS[4]; // Near Mint-Mint 8
  }
  if (haystack.includes('near mint') || haystack.includes('nm') || haystack.includes('7')) {
    return CONDITION_TIERS[5]; // Near Mint 7
  }
  if (haystack.includes('excellent') || haystack.includes('ex') || haystack.includes('6')) {
    return CONDITION_TIERS[6]; // Excellent 6
  }
  if (haystack.includes('auth') || haystack.includes('genuine')) {
    return CONDITION_TIERS[7]; // Authentic
  }

  // Default to Gem Mint 10
  return CONDITION_TIERS[1];
}

interface SlabGradeBadgeProps {
  card: CardItem;
  config: SlabConfig;
  onSelectCondition: (tier: ConditionTier) => void;
}

export const SlabGradeBadge: React.FC<SlabGradeBadgeProps> = ({
  card,
  config,
  onSelectCondition,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeTier = resolveConditionTier(config.condition, config.grade, config.subGrade);

  // Compute tier estimated value
  const getTierPrice = () => {
    switch (activeTier.pricingTier) {
      case 'psa10':
        return card.psa10Price;
      case 'psa9':
        return card.psa9Price;
      case 'psa8':
        return card.psa8Price;
      case 'raw':
      default:
        return card.rawPrice;
    }
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'crown':
        return <Crown className="w-4 h-4 text-amber-300" />;
      case 'gem':
        return <Gem className="w-4 h-4 text-emerald-300" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4 text-cyan-300" />;
      case 'shield':
        return <ShieldCheck className="w-4 h-4 text-blue-300" />;
      case 'flame':
        return <Flame className="w-4 h-4 text-orange-300" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-purple-300" />;
      default:
        return <Award className="w-4 h-4 text-teal-300" />;
    }
  };

  const currentPrice = getTierPrice();
  const rawPrice = card.rawPrice;
  const deltaPercent = rawPrice > 0 ? Math.round(((currentPrice - rawPrice) / rawPrice) * 100) : 0;

  return (
    <div className="absolute top-16 left-4 z-40 flex flex-col items-start select-none">
      {/* Dynamic Badge Container */}
      <div
        className={`relative rounded-2xl backdrop-blur-xl border transition-all duration-300 ${activeTier.cardBg} ${activeTier.borderClass} ${activeTier.glowShadow} overflow-visible`}
        style={{ minWidth: isCollapsed ? 'auto' : '230px' }}
      >
        {/* Shimmering Top Accent Line */}
        <div
          className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl opacity-80"
          style={{
            background: `linear-gradient(90deg, transparent, ${activeTier.accentColor}, transparent)`,
          }}
        />

        {/* Collapsed State Mini Chip */}
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 px-3 py-2 text-left cursor-pointer group"
          >
            <div className="p-1 rounded-lg bg-black/40 border border-white/10">
              {renderIcon(activeTier.icon)}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold leading-none">
                SLAB GRADE
              </span>
              <span className={`text-xs font-mono font-black ${activeTier.textColor}`}>
                {activeTier.name}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ml-1" />
          </button>
        ) : (
          <div className="p-3">
            {/* Header: Authority & Collapse Toggle */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-mono uppercase tracking-widest font-black text-slate-400">
                  {config.customAuthorityText || 'VCA'} SLAB GRADE
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                title="Minimize Grade Badge"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Main Grade Display & Big Number */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                {/* Condition Pill / Badge */}
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wide uppercase shadow-sm">
                  {renderIcon(activeTier.icon)}
                  <span className={`font-black ${activeTier.textColor}`}>
                    {config.condition || activeTier.name}
                  </span>
                </div>

                {/* Subgrade / Certification Status */}
                <div className="text-[10px] font-mono text-slate-300 font-bold flex items-center gap-1 pl-1">
                  <span>{config.subGrade || activeTier.subGrade}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono text-[9px]">{config.serialNumber}</span>
                </div>
              </div>

              {/* Huge Numerical Grade */}
              <div className="flex flex-col items-center justify-center min-w-[52px] h-[52px] rounded-xl bg-black/50 border border-white/10 px-2">
                <span
                  className={`text-2xl leading-none tracking-tight ${activeTier.gradeNumberColor}`}
                >
                  {activeTier.gradeNumber}
                </span>
                <span className="text-[8px] font-mono tracking-widest text-slate-400 font-black mt-0.5 uppercase">
                  GRADE
                </span>
              </div>
            </div>

            {/* Micro Subgrades Preview Bar */}
            <div className="grid grid-cols-4 gap-1 mt-2.5 pt-2 border-t border-white/10 text-center">
              {[
                { label: 'CENT', score: config.centeringScore || activeTier.defaultScores.centering },
                { label: 'CORN', score: config.cornersScore || activeTier.defaultScores.corners },
                { label: 'EDGE', score: config.edgesScore || activeTier.defaultScores.edges },
                { label: 'SURF', score: config.surfaceScore || activeTier.defaultScores.surface },
              ].map((sg) => (
                <div key={sg.label} className="bg-black/30 rounded py-0.5 px-1 border border-white/5">
                  <div className="text-[7.5px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                    {sg.label}
                  </div>
                  <div className="text-[9.5px] font-mono font-bold text-white leading-tight">
                    {sg.score}
                  </div>
                </div>
              ))}
            </div>

            {/* Valuation & Interactive Condition Selector Dropdown Trigger */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider">
                  Est. Market Value
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-black text-xs text-white">
                    ${currentPrice.toFixed(2)}
                  </span>
                  {deltaPercent !== 0 && (
                    <span
                      className={`text-[9px] font-mono font-bold ${
                        deltaPercent > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                    </span>
                  )}
                </div>
              </div>

              {/* Change Condition Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10.5px] font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-300" />
                <span>Condition</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Dropdown Menu to Choose Condition */}
        {isDropdownOpen && !isCollapsed && (
          <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-950/95 backdrop-blur-2xl border border-slate-700 rounded-xl p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150 max-h-72 overflow-y-auto space-y-1">
            <div className="px-2 py-1 text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
              <span>Select Card Condition</span>
              <span className="text-cyan-400">8 Tiers</span>
            </div>

            {CONDITION_TIERS.map((tier) => {
              const isSelected = activeTier.id === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    onSelectCondition(tier);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-2 rounded-lg text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-400/50 text-white'
                      : 'hover:bg-slate-900 border border-transparent text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-black/40">{renderIcon(tier.icon)}</div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-black">{tier.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight line-clamp-1">
                        {tier.desc}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-cyan-300">
                    {tier.gradeNumber}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
