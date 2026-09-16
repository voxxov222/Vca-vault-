import React from 'react';
import { ShieldCheck, Cpu, QrCode, CheckCircle2, X, ExternalLink, Sparkles, Hash, Calendar, Award } from 'lucide-react';
import { CardItem, SlabConfig } from '../types/pokemon.ts';
import { LABEL_THEMES } from '../utils/vcaLabelGenerator.ts';

interface NfcAuthModalProps {
  card: CardItem;
  config: SlabConfig;
  onClose: () => void;
}

export const NfcAuthModal: React.FC<NfcAuthModalProps> = ({ card, config, onClose }) => {
  const serial = config.serialNumber || card.certNumber || 'VCA-26-0101';
  const theme = LABEL_THEMES[config.labelColor] || LABEL_THEMES.cyber_cyan;

  // Pseudo-cryptographic SHA256 simulation based on serial
  const cryptoHash = `0x7f${serial.replace(/[^0-9]/g, '')}b4e9${card.name.length}c8d19a2f3e84b017d6c5`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-sky-500/20 relative">
        {/* Top Cybernetic Scan Header */}
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wider text-white">VCA NFC AUTHENTICATION</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Digital Twin Cryptographic Handshake</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-5">
          {/* Card & Slab Summary Row */}
          <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-16 h-22 object-contain rounded-lg border border-slate-700 shadow-md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-400">{serial}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                  {config.grade} • {config.subGrade}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white truncate mt-1">{card.name}</h4>
              <p className="text-xs text-slate-400 truncate">
                {card.setName} #{card.number} ({card.variant})
              </p>
            </div>
          </div>

          {/* NFC Hardware & Security Spec Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 font-mono text-[10px] block uppercase">NFC IC Protocol</span>
              <span className="text-white font-mono font-bold">ISO/IEC 14443-A (NTAG215)</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 font-mono text-[10px] block uppercase">Chip Unique ID (UID)</span>
              <span className="text-sky-300 font-mono font-bold">04:A2:89:C1:F8:70:80</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 font-mono text-[10px] block uppercase">Authority Issuer</span>
              <span className="text-white font-semibold">Verified Card Authority (VCA)</span>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 font-mono text-[10px] block uppercase">Encryption Standard</span>
              <span className="text-emerald-400 font-mono font-bold">ECDSA P-256 + SHA-256</span>
            </div>
          </div>

          {/* Subgrade Breakdown Bar */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> VCA Subgrade Verification
              </span>
              <span className="text-amber-400 font-mono font-bold">Overall: 10.0</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Centering</span>
                <span className="font-mono font-bold text-sky-400">10.0</span>
              </div>
              <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Corners</span>
                <span className="font-mono font-bold text-sky-400">10.0</span>
              </div>
              <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Edges</span>
                <span className="font-mono font-bold text-sky-400">9.5</span>
              </div>
              <div className="bg-slate-900/80 py-1.5 px-1 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Surface</span>
                <span className="font-mono font-bold text-sky-400">10.0</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash String */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 font-mono block uppercase">Digital Hash Signature</span>
            <div className="font-mono text-[11px] text-sky-400/90 break-all select-all font-semibold">
              {cryptoHash}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">VCA Global Registry v2.6</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold tracking-wider uppercase transition-all cursor-pointer shadow-lg shadow-sky-500/20 active:scale-95"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
