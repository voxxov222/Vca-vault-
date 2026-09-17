import React, { useState, useRef } from 'react';
import {
  User,
  Image,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Save,
  Sparkles,
  Award,
  Zap,
  RefreshCw,
  Star,
  ChevronRight,
  TrendingUp,
  FileImage,
  Link,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../firebase/AuthContext.tsx';
import { useVault } from '../firebase/VaultContext.tsx';
import { UserProfileData, ProfileSection, CardItem } from '../types/pokemon.ts';

interface ProfileDashboardProps {
  onOpenCardDetail: (card: CardItem) => void;
  onOpen3DSlab: (card: CardItem) => void;
  onNavigateToScanner: () => void;
  onNavigateToVault: () => void;
}

// Curated collector avatar presets including animated GIFs & iconic Pokémon art
const AVATAR_PRESETS = [
  {
    name: 'Pikachu Spark GIF',
    url: 'https://media.giphy.com/media/xx0JzzsBXzcMK542tx/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Gengar Haunt GIF',
    url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Charizard Flame GIF',
    url: 'https://media.giphy.com/media/ardUtHLT12jy32dtln/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Eevee Cute GIF',
    url: 'https://media.giphy.com/media/vsyKKf1t22nmw/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Mew Radiant GIF',
    url: 'https://media.giphy.com/media/5gQhH42sHPzTW/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Gardevoir Prism',
    url: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&auto=format&fit=crop&q=80',
    type: 'photo',
  },
];

// Curated collector header/banner presets with GIF & HD wallpapers
const HEADER_PRESETS = [
  {
    name: 'Cosmic Hologram GIF',
    url: 'https://media.giphy.com/media/3o7TKTDnUxE0gpnPNe/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Neon Cyber Grid GIF',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    type: 'gif',
  },
  {
    name: 'Starlit Aurora Sky',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80',
    type: 'photo',
  },
  {
    name: 'Luxury Dark Obsidian',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
    type: 'photo',
  },
  {
    name: 'Gold Foil Vault',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&auto=format&fit=crop&q=80',
    type: 'photo',
  },
];

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  onOpenCardDetail,
  onOpen3DSlab,
  onNavigateToScanner,
  onNavigateToVault,
}) => {
  const { user } = useAuth();
  const {
    cards,
    totalRawValue,
    totalPsa10Value,
    favoritesCount,
    profile,
    updateProfile,
    addProfileSection,
    updateProfileSection,
    removeProfileSection,
  } = useVault();

  // Editing profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || 'Master Trainer');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [headerImageUrl, setHeaderImageUrl] = useState(profile?.headerImageUrl || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [favoritePokemon, setFavoritePokemon] = useState(profile?.favoritePokemon || 'Gardevoir ex');
  const [collectorRank, setCollectorRank] = useState(profile?.collectorRank || 'Grandmaster Elite');
  const [currency, setCurrency] = useState(profile?.currency || 'USD');
  const [featuredCardId, setFeaturedCardId] = useState(profile?.featuredCardId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hidden File input refs for uploading Avatar & Header
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  // New Section State
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [newSectionType, setNewSectionType] = useState<ProfileSection['type']>('custom');
  const [newSectionTags, setNewSectionTags] = useState('');

  // Section Inline Edit
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');
  const [editSectionContent, setEditSectionContent] = useState('');

  // Synchronize initial form state when profile changes
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAvatarUrl(profile.avatarUrl || '');
      setHeaderImageUrl(profile.headerImageUrl || '');
      setBio(profile.bio || '');
      setFavoritePokemon(profile.favoritePokemon || 'Gardevoir ex');
      setCollectorRank(profile.collectorRank || 'Grandmaster Elite');
      setCurrency(profile.currency || 'USD');
      setFeaturedCardId(profile.featuredCardId || '');
    }
  }, [profile]);

  // Featured Card in vault
  const featuredCard = cards.find((c) => c.id === featuredCardId) || cards[0] || null;

  // File Upload Handlers (Supports GIF, PNG, JPEG, WebP)
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Check size limit: 5MB for GIF/Image to prevent browser memory issues
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Profile avatar file size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleHeaderFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Check size limit: 10MB for GIF/Image header
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Header banner file size should be under 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setHeaderImageUrl(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read header file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName,
        avatarUrl,
        headerImageUrl,
        bio,
        favoritePokemon,
        collectorRank,
        currency,
        featuredCardId,
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !newSectionContent.trim()) return;

    const tags = newSectionTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await addProfileSection({
      title: newSectionTitle.trim(),
      content: newSectionContent.trim(),
      type: newSectionType,
      tags: tags.length > 0 ? tags : undefined,
    });

    setNewSectionTitle('');
    setNewSectionContent('');
    setNewSectionTags('');
    setIsAddingSection(false);
  };

  const handleStartEditSection = (sec: ProfileSection) => {
    setEditingSectionId(sec.id);
    setEditSectionTitle(sec.title);
    setEditSectionContent(sec.content);
  };

  const handleSaveEditSection = async (sectionId: string) => {
    if (!editSectionTitle.trim() || !editSectionContent.trim()) return;
    await updateProfileSection(sectionId, {
      title: editSectionTitle.trim(),
      content: editSectionContent.trim(),
    });
    setEditingSectionId(null);
  };

  const currentAvatar =
    avatarUrl ||
    profile?.avatarUrl ||
    'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&auto=format&fit=crop&q=80';

  const currentHeader =
    headerImageUrl ||
    profile?.headerImageUrl ||
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80';

  const isGif = (url: string) =>
    url.toLowerCase().includes('.gif') ||
    url.includes('giphy.com') ||
    url.startsWith('data:image/gif');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
      {/* Hidden File Inputs for Direct Device Uploads */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarFileUpload}
        accept="image/gif,image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />
      <input
        type="file"
        ref={headerFileInputRef}
        onChange={handleHeaderFileUpload}
        accept="image/gif,image/png,image/jpeg,image/webp,image/jpg"
        className="hidden"
      />

      {/* 1. Header Banner & Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        {/* Customizable Header Image / GIF */}
        <div className="relative h-60 sm:h-80 w-full bg-slate-950 overflow-hidden group">
          <img
            src={currentHeader}
            alt="Collector Header"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Header Badges & Instant Quick Upload */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isGif(currentHeader) && (
              <span className="px-2.5 py-1 rounded-lg bg-pink-500/80 backdrop-blur-md text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                <Zap className="w-3 h-3 animate-pulse" /> Animated GIF
              </span>
            )}
            <button
              onClick={() => headerFileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md text-xs font-bold border border-white/20 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
              title="Upload header image or animated GIF from device"
            >
              <Upload className="w-3.5 h-3.5 text-pink-400" />
              <span>Upload Banner GIF/Pic</span>
            </button>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-slate-950 font-bold backdrop-blur-md text-xs border border-amber-400/40 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Details & Avatar Bar */}
        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-20 sm:-mt-24 mb-6">
            {/* Avatar with GIF badge and Quick Upload Trigger */}
            <div className="relative group">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-900 relative ring-4 ring-amber-400/40">
                <img
                  src={currentAvatar}
                  alt="Collector Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {isGif(currentAvatar) && (
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-pink-500/90 text-white font-mono font-bold text-[9px] uppercase shadow">
                    GIF
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarFileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
                title="Upload Profile Pic or GIF from device"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            {/* Collector Quick Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Vault Cards</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {cards.length}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Portfolio (Raw)</span>
                <span className="text-lg font-black font-mono text-amber-500">
                  ${totalRawValue.toFixed(0)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PSA 10 Value</span>
                <span className="text-lg font-black font-mono text-emerald-500">
                  ${totalPsa10Value.toFixed(0)}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Favorites</span>
                <span className="text-lg font-black font-mono text-purple-500">
                  {favoritesCount}
                </span>
              </div>
            </div>
          </div>

          {/* User Bio & Collector Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {profile?.displayName || 'Master Trainer'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wide border border-amber-400/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {profile?.collectorRank || 'Grandmaster Elite'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-600 dark:text-sky-400 text-xs font-mono font-bold border border-sky-400/30">
                ⭐ {profile?.favoritePokemon || 'Gardevoir ex'}
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              {profile?.bio ||
                'Elite Pokémon Card Collector & Holographic Slab Enthusiast. Building a PSA 10 Master Set.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>Account: <strong className="text-slate-600 dark:text-slate-200">{user?.email || 'Guest Session'}</strong></span>
              <span>•</span>
              <span>Primary Currency: <strong className="text-slate-600 dark:text-slate-200">{profile?.currency || 'USD'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Collector Profile
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Featured Holy Grail Slab Showcase & Collector Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Card Showcase */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Showcase Grail
              </span>
              {featuredCard && (
                <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono">
                  {featuredCard.certNumber || 'VCA-26-0101'}
                </span>
              )}
            </div>

            {featuredCard ? (
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div
                  onClick={() => onOpen3DSlab(featuredCard)}
                  className="w-20 h-28 rounded-xl overflow-hidden bg-slate-950 border border-white/20 shadow-lg cursor-pointer hover:scale-105 transition-transform flex-shrink-0 relative group"
                >
                  <img
                    src={featuredCard.imageUrlHiRes || featuredCard.imageUrl}
                    alt={featuredCard.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">3D Slab</span>
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{featuredCard.name}</h3>
                  <p className="text-xs text-slate-400 truncate">
                    {featuredCard.setName} • {featuredCard.number}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-amber-400">
                      ${featuredCard.rawPrice.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      (${featuredCard.psa10Price?.toFixed(2)} PSA 10)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
                <p className="text-xs text-slate-400 mb-3">No cards stored in vault yet</p>
                <button
                  onClick={onNavigateToScanner}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:brightness-110"
                >
                  Scan First Card
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-4">
            <button
              onClick={() => onNavigateToVault()}
              className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
            >
              <span>View Full Vault</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {featuredCard && (
              <button
                onClick={() => onOpen3DSlab(featuredCard)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
              >
                Inspect 3D WebGL Slab
              </button>
            )}
          </div>
        </div>

        {/* Collector Portfolio Highlights & Stats Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Collection Valuation & Statistics
              </h2>
              <span className="text-xs font-mono font-bold text-amber-500">
                {cards.length} Total Slabs
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live automated valuation comparison between ungraded raw market values and PSA 10 gem mint grade premiums.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Est. Ungraded Raw</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                ${totalRawValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400">Market median pricing</span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">PSA 10 Gem Value</span>
              <div className="text-2xl font-black font-mono text-emerald-500">
                ${totalPsa10Value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">
                +{totalRawValue > 0 ? (((totalPsa10Value - totalRawValue) / totalRawValue) * 100).toFixed(0) : 0}% Slab Grade Premium
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Vault Quality Index</span>
              <div className="text-2xl font-black font-mono text-purple-500">
                {cards.length > 0 ? (totalPsa10Value / (cards.length * 50)).toFixed(1) : '0.0'}x
              </div>
              <span className="text-[10px] text-slate-400">Rarity & gem multiplier</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs">GIF</span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Animated Profile & Headers Enabled
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload GIF files directly or paste URLs to personalize your collector showcase.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow"
            >
              Upload / Change Images
            </button>
          </div>
        </div>
      </div>

      {/* 3. Customizable Profile Sections (Bio, Grails, Trade Policies, Lore, etc.) */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Collector Profile Sections
            </h2>
            <p className="text-xs text-slate-400">
              Customize your public collector lore, grail wishlist, trading policies, and personal notes
            </p>
          </div>

          <button
            onClick={() => setIsAddingSection(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Section</span>
          </button>
        </div>

        {/* Section List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(profile?.sections || []).map((section) => (
            <div
              key={section.id}
              className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-4 hover:border-amber-400/50 transition-colors"
            >
              {editingSectionId === section.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editSectionTitle}
                    onChange={(e) => setEditSectionTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <textarea
                    rows={3}
                    value={editSectionContent}
                    onChange={(e) => setEditSectionContent(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEditSection(section.id)}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-sm">✦</span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {section.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                        <button
                          onClick={() => handleStartEditSection(section)}
                          className="p-1 rounded text-slate-400 hover:text-amber-500"
                          title="Edit section"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeProfileSection(section.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>

                  {section.tags && section.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                      {section.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add Section Form */}
        {isAddingSection && (
          <form
            onSubmit={handleCreateSection}
            className="p-5 rounded-2xl bg-amber-400/5 dark:bg-amber-400/10 border border-amber-400/30 space-y-4 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> New Profile Section
              </span>
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Vintage Booster Box Collection"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Section Category
                </label>
                <select
                  value={newSectionType}
                  onChange={(e) => setNewSectionType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="bio">Collector Bio / Lore</option>
                  <option value="grail">Grail Targets & Wishlist</option>
                  <option value="trade_policy">Trading / Authentication Policy</option>
                  <option value="custom">Custom Section</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Content / Details
              </label>
              <textarea
                rows={3}
                required
                value={newSectionContent}
                onChange={(e) => setNewSectionContent(e.target.value)}
                placeholder="Write your custom notes, rules, or details here..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={newSectionTags}
                onChange={(e) => setNewSectionTags(e.target.value)}
                placeholder="WOTC, Shadowless, Japanese, Mint"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow hover:brightness-110 active:scale-95"
              >
                Publish Section
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. Customize Profile Modal (Upload Avatar GIF / Header GIF / Bio / Display Name) */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/20 text-amber-500">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Customize Profile & Images
                </h3>
              </div>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                {uploadError}
              </div>
            )}

            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
              {/* Display Name & Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Collector Rank Title
                  </label>
                  <input
                    type="text"
                    value={collectorRank}
                    onChange={(e) => setCollectorRank(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Avatar Image Upload or URL / GIF */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Profile Picture (Upload from Device or Paste GIF / Image URL)
                  </label>
                  <span className="text-[10px] text-pink-500 font-mono font-bold">GIF COMPATIBLE</span>
                </div>

                {/* Upload Button + URL Input Bar */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload GIF / Photo</span>
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Or paste direct .gif or image URL"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Avatar Preview & Presets */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                    <img
                      src={avatarUrl || currentAvatar}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Or Quick Presets:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border transition-all ${
                            avatarUrl === preset.url
                              ? 'bg-amber-400 text-slate-950 font-bold border-amber-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Image Upload or URL / GIF */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Header Banner Image (Upload from Device or Paste GIF / Image URL)
                  </label>
                  <span className="text-[10px] text-pink-500 font-mono font-bold">GIF COMPATIBLE</span>
                </div>

                {/* Upload Button + URL Input Bar */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => headerFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow active:scale-95 transition-all flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner GIF / Photo</span>
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={headerImageUrl}
                      onChange={(e) => setHeaderImageUrl(e.target.value)}
                      placeholder="Or paste direct header .gif or image URL"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Header Preview & Presets */}
                <div className="pt-2 flex items-center gap-3">
                  <div className="w-20 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                    <img
                      src={headerImageUrl || currentHeader}
                      alt="Header Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Or Quick Banner Presets:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {HEADER_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHeaderImageUrl(preset.url)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] border transition-all ${
                            headerImageUrl === preset.url
                              ? 'bg-amber-400 text-slate-950 font-bold border-amber-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Favorite Pokémon */}
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Collector Bio & Description
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Favorite Pokémon / Specie
                    </label>
                    <input
                      type="text"
                      value={favoritePokemon}
                      onChange={(e) => setFavoritePokemon(e.target.value)}
                      placeholder="Gardevoir ex, Charizard, Gengar..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Featured Showcase Card (from Vault)
                    </label>
                    <select
                      value={featuredCardId}
                      onChange={(e) => setFeaturedCardId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Default (First Card in Vault)</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.setName}) - ${c.rawPrice.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Profile Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
