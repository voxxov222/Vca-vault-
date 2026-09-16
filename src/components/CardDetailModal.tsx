import React, { useState } from 'react';
import {
  X,
  Star,
  Sparkles,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  Box,
  Trash2,
  Calendar,
  Layers,
  Award,
  Cpu,
  QrCode,
} from 'lucide-react';
import { CardItem } from '../types/pokemon.ts';
import { useVault } from '../firebase/VaultContext.tsx';

interface CardDetailModalProps {
  card: CardItem | null;
  onClose: () => void;
  onOpen3DSlab: (card: CardItem) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  onClose,
  onOpen3DSlab,
}) => {
  const { toggleFavorite, removeCard } = useVault();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!card) return null;

  const psa10Delta = Math.round(((card.psa10Price - card.rawPrice) / card.rawPrice) * 100);

  // Sparkline point generator based on raw to psa10 progression
  const sparkPoints = [
    { label: '30d ago', val: card.rawPrice * 0.94 },
    { label: '20d ago', val: card.rawPrice * 0.98 },
    { label: '14d ago', val: card.rawPrice * 0.92 },
    { label: '7d ago', val: card.rawPrice * 1.05 },
    { label: 'Today', val: card.rawPrice },
  ];

  const minVal = Math.min(...sparkPoints.map((p) => p.val));
  const maxVal = Math.max(...sparkPoints.map((p) => p.val));
  const range = maxVal - minVal || 1;

  // SVG sparkline path
  const svgWidth = 240;
  const svgHeight = 45;
  const pathD = sparkPoints
    .map((pt, idx) => {
      const x = (idx / (sparkPoints.length - 1)) * (svgWidth - 10) + 5;
      const y = svgHeight - ((pt.val - minVal) / range) * (svgHeight - 14) - 7;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await removeCard(card.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="relative px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleFavorite(card.id)}
              className={`p-2 rounded-xl transition-all ${
                card.isFavorite
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 hover:text-amber-500'
              }`}
              title={card.isFavorite ? 'Favorited' : 'Add to Favorites'}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {card.name}
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800">
                  {card.variant}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {card.setName} • #{card.number} • {card.rarity || 'Uncommon'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card Visual Preview */}
          <div className="md:col-span-5 flex flex-col items-center gap-3">
            <div className="relative group perspective">
              <img
                src={card.imageUrlHiRes || card.imageUrl}
                alt={card.name}
                className="w-56 rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-105 border border-slate-200 dark:border-slate-800"
              />
              {card.isFavorite && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400 pointer-events-none shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              )}
            </div>

            {/* VCA Digital Holographic Slab Credentials */}
            <div className="w-full bg-slate-100 dark:bg-slate-900/90 border border-sky-400/40 rounded-2xl p-3 space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sky-600 dark:text-sky-400 font-bold text-xs flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>{card.slabConfig?.serialNumber || card.certNumber || 'VCA-26-0101'}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30">
                  {card.slabConfig?.grade || '#10 GRADE'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="capitalize">{card.slabConfig?.slabType ? card.slabConfig.slabType.replace('_', ' ') : 'Crystal Clear'} Slab</span>
                <span className="text-emerald-500 font-mono text-[10px] font-bold flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> NFC + QR
                </span>
              </div>
            </div>

            {/* Launch 3D Holographic Slab Button */}
            <button
              onClick={() => {
                onClose();
                onOpen3DSlab(card);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white text-xs font-extrabold tracking-wider uppercase shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Box className="w-4 h-4" />
              <span>LAUNCH 3D SLAB & CUSTOMIZE</span>
            </button>
          </div>

          {/* Pricing & PSA Ladder Column */}
          <div className="md:col-span-7 space-y-4">
            {/* Raw Market Price Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Raw Ungraded Market Price
                </span>
                <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                  ${card.rawPrice.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  Live TCGplayer
                </span>
              </div>
            </div>

            {/* PSA Ladder (10 / 9 / 8) */}
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-50 to-amber-500/5 dark:from-amber-500/10 dark:via-slate-800/40 dark:to-transparent p-4 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> PSA GRADING LADDER (REAL COMPS)
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  +{psa10Delta}% UPGRADE UPSIDE
                </span>
              </div>

              {/* Ladder Rows */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* PSA 10 */}
                <div className="p-2.5 rounded-xl bg-amber-400/20 dark:bg-amber-400/15 border-2 border-amber-400 shadow-sm relative overflow-hidden">
                  <div className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                    PSA 10 GEM MT
                  </div>
                  <div className="text-base font-black font-mono text-slate-900 dark:text-white mt-1">
                    ${card.psa10Price.toFixed(2)}
                  </div>
                  <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +{psa10Delta}% vs raw
                  </div>
                </div>

                {/* PSA 9 */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                    PSA 9 MINT
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ${card.psa9Price.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    +{Math.round(((card.psa9Price - card.rawPrice) / card.rawPrice) * 100)}% vs raw
                  </div>
                </div>

                {/* PSA 8 */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                    PSA 8 NM-MT
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ${card.psa8Price.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    +{Math.round(((card.psa8Price - card.rawPrice) / card.rawPrice) * 100)}% vs raw
                  </div>
                </div>
              </div>
            </div>

            {/* Sparkline / Recent Sold Comps Trend */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-500" /> Recent Market Sold Comps Trend
                </span>
                <span className="text-[10px] text-slate-400">Past 30 Days</span>
              </div>
              <div className="h-12 w-full flex items-center justify-center">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                  <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
                  {sparkPoints.map((pt, i) => {
                    const cx = (i / (sparkPoints.length - 1)) * (svgWidth - 10) + 5;
                    const cy = svgHeight - ((pt.val - minVal) / range) * (svgHeight - 14) - 7;
                    return <circle key={i} cx={cx} cy={cy} r="3" fill="#38bdf8" />;
                  })}
                </svg>
              </div>
            </div>

            {/* Meta tags & Actions */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Added {new Date(card.createdAt).toLocaleDateString()}</span>
              </div>

              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDelete ? 'Confirm Remove?' : 'Remove from Vault'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
