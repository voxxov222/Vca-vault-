import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  RefreshCw,
  Box,
  Layers,
  Sparkles,
  ArrowUpDown,
  PlusCircle,
  FolderOpen,
  Cpu,
} from 'lucide-react';
import { useVault } from '../firebase/VaultContext.tsx';
import { CardItem } from '../types/pokemon.ts';

interface VaultViewProps {
  onOpenCardDetail: (card: CardItem) => void;
  onOpen3DSlab: (card: CardItem) => void;
  onNavigateToScanner: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({
  onOpenCardDetail,
  onOpen3DSlab,
  onNavigateToScanner,
}) => {
  const { cards, loading, toggleFavorite, refreshCardPrices, isRefreshingPrices, totalRawValue } =
    useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'high_value' | 'vintage'>('all');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'name' | 'recent'>('value_desc');
  const [groupBySet, setGroupBySet] = useState(false);

  // Filter cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.setName.toLowerCase().includes(q) ||
          c.number.toLowerCase().includes(q) ||
          c.variant.toLowerCase().includes(q)
      );
    }

    // Filter pills
    if (activeFilter === 'favorites') {
      result = result.filter((c) => c.isFavorite);
    } else if (activeFilter === 'high_value') {
      result = result.filter((c) => c.rawPrice >= 30);
    } else if (activeFilter === 'vintage') {
      result = result.filter(
        (c) =>
          c.setName.toLowerCase().includes('base') ||
          c.setName.toLowerCase().includes('neo') ||
          c.setName.toLowerCase().includes('gym') ||
          c.setName.toLowerCase().includes('jungle') ||
          c.setName.toLowerCase().includes('fossil')
      );
    }

    // Sort
    result.sort((a, b) => {
      // Pinned favorites first if sorting by recent
      if (activeFilter === 'all' && a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      if (sortBy === 'value_desc') return b.rawPrice - a.rawPrice;
      if (sortBy === 'value_asc') return a.rawPrice - b.rawPrice;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [cards, searchQuery, activeFilter, sortBy]);

  // Group by set if enabled
  const groupedSets = useMemo(() => {
    if (!groupBySet) return null;
    const groups: { [setName: string]: CardItem[] } = {};
    for (const card of filteredCards) {
      const setKey = card.setName || 'Other Expansions';
      if (!groups[setKey]) groups[setKey] = [];
      groups[setKey].push(card);
    }
    return groups;
  }, [filteredCards, groupBySet]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Syncing Vault from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              MY POKÉVAULT
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
              {cards.length} CARDS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time portfolio synchronized with live TCGplayer market prices and eBay sold comps.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshCardPrices()}
            disabled={isRefreshingPrices || cards.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPrices ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isRefreshingPrices ? 'Updating Comps...' : 'Refresh Prices'}</span>
          </button>

          <button
            onClick={onNavigateToScanner}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>SCAN CARDS</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Pokémon, set, or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All ({cards.length})
          </button>

          <button
            onClick={() => setActiveFilter('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilter === 'favorites'
                ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => setActiveFilter('high_value')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilter === 'high_value'
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            $30+ High Value
          </button>

          <button
            onClick={() => setActiveFilter('vintage')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeFilter === 'vintage'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Vintage
          </button>

          {/* Group by set toggle */}
          <button
            onClick={() => setGroupBySet(!groupBySet)}
            className={`p-1.5 rounded-xl border transition-all ${
              groupBySet
                ? 'bg-sky-500 text-white border-sky-400'
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
            title="Group by Expansion Set"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Grid / Set Breakdown */}
      {filteredCards.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8">
          <FolderOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">No Cards in Vault</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            {cards.length === 0
              ? 'Start scanning Pokémon cards using the live camera scanner with real-time Gemini Vision recognition.'
              : 'No cards match the current search or filters.'}
          </p>
          <button
            onClick={onNavigateToScanner}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:brightness-105 transition-all"
          >
            Open Live Camera Scanner
          </button>
        </div>
      ) : groupBySet && groupedSets ? (
        // Grouped by Expansion Set
        <div className="space-y-8">
          {Object.entries(groupedSets).map(([setName, setCards]) => (
            <div key={setName} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-extrabold tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {setName}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {setCards.length} {setCards.length === 1 ? 'card' : 'cards'} • $
                  {setCards.reduce((acc, c) => acc + c.rawPrice, 0).toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {setCards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    onOpenDetail={() => onOpenCardDetail(card)}
                    onOpen3D={() => onOpen3DSlab(card)}
                    onToggleFav={() => toggleFavorite(card.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Standard Flat Grid
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredCards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              onOpenDetail={() => onOpenCardDetail(card)}
              onOpen3D={() => onOpen3DSlab(card)}
              onToggleFav={() => toggleFavorite(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CardTileProps {
  card: CardItem;
  onOpenDetail: () => void;
  onOpen3D: () => void;
  onToggleFav: () => void;
}

const CardTile: React.FC<CardTileProps> = ({ card, onOpenDetail, onOpen3D, onToggleFav }) => {
  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col ${
        card.isFavorite
          ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
          : 'border-slate-200 dark:border-slate-800 hover:border-sky-500/50'
      }`}
    >
      {/* Card Image Container */}
      <div
        onClick={onOpenDetail}
        className="relative aspect-[63/88] bg-slate-100 dark:bg-slate-950 p-2 flex items-center justify-center cursor-pointer overflow-hidden"
      >
        <img
          src={card.imageUrl}
          alt={card.name}
          loading="lazy"
          className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
        />

        {/* Shimmering Holo Gradient highlight on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Virtual VCA Slab Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-2 py-0.5 rounded-md text-[9px] font-mono text-cyan-300 font-bold shadow-md pointer-events-none">
          <Cpu className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>{card.slabConfig?.serialNumber || card.certNumber || 'VCA-26-0101'}</span>
        </div>

        {/* Favorite Pin badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full shadow-md backdrop-blur-md transition-all ${
            card.isFavorite
              ? 'bg-amber-400 text-slate-950'
              : 'bg-black/50 text-white/70 hover:text-amber-400'
          }`}
          title={card.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* 3D Slab Quick Launch Trigger on image hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen3D();
          }}
          className="absolute bottom-2.5 left-2.5 right-2.5 py-1.5 px-2.5 rounded-lg bg-slate-950/85 hover:bg-sky-500 text-white text-[11px] font-bold tracking-wider uppercase backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5 shadow-lg"
        >
          <Box className="w-3.5 h-3.5 text-sky-400 group-hover:text-white" />
          <span>VIEW 3D SLAB</span>
        </button>
      </div>

      {/* Info footer */}
      <div className="p-3 flex-1 flex flex-col justify-between" onClick={onOpenDetail}>
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={card.name}>
              {card.name}
            </h4>
            <span className="text-[10px] font-mono font-semibold text-slate-400 shrink-0">
              #{card.number}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{card.setName}</p>
        </div>

        {/* Prices */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[9px] text-slate-400 block leading-none">Raw Market</span>
            <span className="text-xs font-extrabold font-mono text-slate-900 dark:text-white">
              ${card.rawPrice.toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[9px] text-amber-500 block leading-none font-bold">PSA 10</span>
            <span className="text-xs font-extrabold font-mono text-amber-500">
              ${card.psa10Price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
