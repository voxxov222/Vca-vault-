import React, { useState } from 'react';
import { AuthProvider, useAuth } from './firebase/AuthContext.tsx';
import { VaultProvider, useVault } from './firebase/VaultContext.tsx';
import { LiveScanner } from './components/LiveScanner.tsx';
import { VaultView } from './components/VaultView.tsx';
import { PortfolioView } from './components/PortfolioView.tsx';
import { ProfileDashboard } from './components/ProfileDashboard.tsx';
import { CardDetailModal } from './components/CardDetailModal.tsx';
import { ThreeSlabViewer } from './components/ThreeSlabViewer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CardItem } from './types/pokemon.ts';
import {
  Camera,
  FolderLock,
  LineChart,
  LogOut,
  User,
  Sparkles,
  Zap,
  ShieldCheck,
  Moon,
  Sun,
  LayoutDashboard,
} from 'lucide-react';

function PokeVaultApp() {
  const { user, logout } = useAuth();
  const { totalRawValue, totalPsa10Value, cards, profile } = useVault();

  // Navigation tab: 'vault' | 'scanner' | 'portfolio' | 'profile'
  const [activeTab, setActiveTab] = useState<'vault' | 'scanner' | 'portfolio' | 'profile'>('vault');

  // Modals & 3D Viewer states
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<CardItem | null>(null);
  const [selectedCardFor3D, setSelectedCardFor3D] = useState<CardItem | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <div
            onClick={() => setActiveTab('vault')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 flex items-center justify-center shadow-md shadow-amber-400/30 group-hover:scale-105 transition-transform">
              <span className="text-slate-950 font-black text-lg">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  POKÉ<span className="text-amber-500">VAULT</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-400">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Live TCG Valuation & 3D Slab Vault
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'vault'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderLock className="w-3.5 h-3.5 text-amber-500" />
              <span>Vault ({cards.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scanner'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-sky-500" />
              <span>Live Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-purple-500" />
              <span>Portfolio</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span>Profile & MCP</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Live Portfolio Ticker */}
            <div
              onClick={() => setActiveTab('portfolio')}
              className="hidden sm:flex flex-col items-end cursor-pointer bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700/60"
            >
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                PORTFOLIO
              </span>
              <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                ${totalRawValue.toFixed(2)}{' '}
                <span className="text-emerald-500 font-semibold">
                  (${totalPsa10Value.toFixed(2)} PSA 10)
                </span>
              </span>
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs transition-colors"
                  title="View Profile Dashboard"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-900 flex-shrink-0">
                    <img
                      src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=100&auto=format&fit=crop&q=80'}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 max-w-[110px] truncate">
                    {profile?.displayName || (user.isAnonymous ? 'Guest Collector' : user.email?.split('@')[0])}
                  </span>
                </button>

                <button
                  onClick={() => logout()}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 pb-24">
        {activeTab === 'vault' && (
          <VaultView
            onOpenCardDetail={(card) => setSelectedCardForDetail(card)}
            onOpen3DSlab={(card) => setSelectedCardFor3D(card)}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'scanner' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 min-h-[calc(100vh-140px)]">
            <LiveScanner
              onScanSaved={() => setActiveTab('vault')}
              onOpen3DSlab={(card) => setSelectedCardFor3D(card)}
              onOpenCardDetail={(card) => setSelectedCardForDetail(card)}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            onOpenCardDetail={(card) => setSelectedCardForDetail(card)}
            onOpen3DSlab={(card) => setSelectedCardFor3D(card)}
            onNavigateToScanner={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileDashboard
            onOpenCardDetail={(card) => setSelectedCardForDetail(card)}
            onOpen3DSlab={(card) => setSelectedCardFor3D(card)}
            onNavigateToScanner={() => setActiveTab('scanner')}
            onNavigateToVault={() => setActiveTab('vault')}
          />
        )}
      </main>

      {/* Signature Pokéball Floating Navigation Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
        <button
          onClick={() => setActiveTab(activeTab === 'scanner' ? 'vault' : 'scanner')}
          className="relative w-16 h-16 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-transform duration-200 overflow-hidden border-2 border-slate-900 flex flex-col justify-between group cursor-pointer"
          title="Pokéball Scanner Trigger"
        >
          {/* Top Half (Crimson Red) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-red-500 to-red-600" />

          {/* Center Dividing Band */}
          <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-slate-950" />

          {/* Bottom Half (Crisp White) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-slate-100 to-slate-200" />

          {/* Center Pokéball Button & Glow Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-950 flex items-center justify-center shadow">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 group-hover:bg-sky-400 transition-colors animate-pulse" />
          </div>
        </button>

        {/* Mobile Navigation bar around the Pokéball */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 -z-10 flex items-center justify-around px-4">
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'vault' ? 'text-amber-500' : 'text-slate-400'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            <span>Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'portfolio' ? 'text-amber-500' : 'text-slate-400'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>Portfolio</span>
          </button>

          {/* Spacer for Pokéball button */}
          <div className="w-12" />

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'profile' ? 'text-pink-500' : 'text-slate-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Card Detail Popup Modal */}
      {selectedCardForDetail && (
        <CardDetailModal
          card={selectedCardForDetail}
          onClose={() => setSelectedCardForDetail(null)}
          onOpen3DSlab={(card) => {
            setSelectedCardForDetail(null);
            setSelectedCardFor3D(card);
          }}
        />
      )}

      {/* Signature 3D Holographic Slab Viewer (Three.js WebGL) */}
      {selectedCardFor3D && (
        <ThreeSlabViewer
          card={selectedCardFor3D}
          onClose={() => setSelectedCardFor3D(null)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <PokeVaultApp />
      </VaultProvider>
    </AuthProvider>
  );
}
