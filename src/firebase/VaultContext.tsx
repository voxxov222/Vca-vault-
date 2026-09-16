import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config.ts';
import { useAuth } from './AuthContext.tsx';
import { CardItem, ScanTrayItem, PortfolioSnapshot, SlabConfig, SlabType, LabelColor } from '../types/pokemon.ts';

export function generateNextVcaSerial(existingCards: CardItem[], offset = 0): string {
  let highestNum = 100; // VCA-26-0100 is already in use, so must start from 101!
  for (const card of existingCards) {
    const cert = card.slabConfig?.serialNumber || card.certNumber;
    if (cert) {
      const match = cert.match(/VCA-26-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestNum) {
          highestNum = num;
        }
      }
    }
  }
  const nextNum = highestNum + 1 + offset;
  return `VCA-26-${String(nextNum).padStart(4, '0')}`;
}

export function getDefaultSlabConfig(serial: string): SlabConfig {
  return {
    slabType: 'crystal_clear',
    labelColor: 'cyber_cyan',
    grade: '#10 GRADE',
    subGrade: 'GEM MINT',
    serialNumber: serial,
    qrEnabled: true,
    nfcEnabled: true,
    holoIntensity: 1.0,
    holoPattern: 'cosmos',
  };
}

interface VaultContextType {
  cards: CardItem[];
  loading: boolean;
  portfolioSnapshots: PortfolioSnapshot[];
  addBatchToVault: (items: ScanTrayItem[]) => Promise<void>;
  toggleFavorite: (cardId: string) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<CardItem>) => Promise<void>;
  updateSlabConfig: (cardId: string, updates: Partial<SlabConfig>) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  refreshCardPrices: () => Promise<void>;
  isRefreshingPrices: boolean;
  totalRawValue: number;
  totalPsa10Value: number;
  favoritesCount: number;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

  // Sync Cards collection
  useEffect(() => {
    if (!user) {
      setCards([]);
      setPortfolioSnapshots([]);
      setLoading(false);
      return;
    }

    const vaultPath = `users/${user.uid}/vault`;
    const q = query(collection(db, vaultPath));

    const unsubscribeCards = onSnapshot(
      q,
      (snapshot) => {
        const fetchedCards: CardItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let certNumber = data.certNumber || data.slabConfig?.serialNumber;
          // Ensure serial starts from VCA-26-0101 and is not 0100
          if (!certNumber || !certNumber.startsWith('VCA-26-') || certNumber === 'VCA-26-0100') {
            certNumber = `VCA-26-${String(101 + fetchedCards.length).padStart(4, '0')}`;
          }
          const slabConfig = data.slabConfig
            ? {
                ...getDefaultSlabConfig(certNumber),
                ...data.slabConfig,
                serialNumber: data.slabConfig.serialNumber || certNumber,
              }
            : getDefaultSlabConfig(certNumber);

          fetchedCards.push({
            id: docSnap.id,
            ...data,
            certNumber,
            slabConfig,
          } as CardItem);
        });

        // Sort: favorites first, then by createdAt desc
        fetchedCards.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        setCards(fetchedCards);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, vaultPath);
      }
    );

    // Sync Portfolio History
    const historyPath = `users/${user.uid}/portfolioHistory`;
    const historyQuery = query(collection(db, historyPath), orderBy('recordedAt', 'asc'));

    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        const snaps: PortfolioSnapshot[] = [];
        snapshot.forEach((docSnap) => {
          snaps.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as PortfolioSnapshot);
        });
        setPortfolioSnapshots(snaps);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, historyPath);
      }
    );

    return () => {
      unsubscribeCards();
      unsubscribeHistory();
    };
  }, [user]);

  // Totals
  const totalRawValue = useMemo(() => {
    return Number(cards.reduce((sum, c) => sum + (c.rawPrice || 0), 0).toFixed(2));
  }, [cards]);

  const totalPsa10Value = useMemo(() => {
    return Number(cards.reduce((sum, c) => sum + (c.psa10Price || 0), 0).toFixed(2));
  }, [cards]);

  const favoritesCount = useMemo(() => {
    return cards.filter((c) => c.isFavorite).length;
  }, [cards]);

  // Record a portfolio snapshot if changed
  useEffect(() => {
    if (!user || cards.length === 0) return;

    const timer = setTimeout(async () => {
      const snapId = `snap_${Date.now()}`;
      const snapPath = `users/${user.uid}/portfolioHistory/${snapId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'portfolioHistory', snapId), {
          id: snapId,
          userId: user.uid,
          totalRawValue,
          totalPsa10Value,
          cardCount: cards.length,
          recordedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, snapPath);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [cards.length, totalRawValue, totalPsa10Value, user]);

  const addBatchToVault = async (items: ScanTrayItem[]) => {
    if (!user) throw new Error('Must be signed in to save cards to Vault');

    const createdCards: CardItem[] = [];
    for (const item of items) {
      const docId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const cardPath = `users/${user.uid}/vault/${docId}`;
      const nextSerial = generateNextVcaSerial([...cards, ...createdCards]);
      const slabConfig = getDefaultSlabConfig(nextSerial);

      const newCard: CardItem = {
        id: docId,
        userId: user.uid,
        cardId: item.cardId,
        name: item.name,
        setName: item.setName,
        number: item.number,
        rarity: item.rarity,
        imageUrl: item.imageUrl,
        imageUrlHiRes: item.imageUrlHiRes || item.imageUrl,
        language: item.language,
        variant: item.variant,
        rawPrice: item.pricing.rawPrice,
        psa10Price: item.pricing.psa10Price,
        psa9Price: item.pricing.psa9Price,
        psa8Price: item.pricing.psa8Price,
        isFavorite: false,
        customGrade: '#10 GRADE',
        certNumber: nextSerial,
        slabConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createdCards.push(newCard);

      try {
        await setDoc(doc(db, 'users', user.uid, 'vault', docId), newCard);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, cardPath);
      }
    }
  };

  const updateSlabConfig = async (cardId: string, updates: Partial<SlabConfig>) => {
    if (!user) return;
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;

    const cardPath = `users/${user.uid}/vault/${cardId}`;
    const baseConfig = target.slabConfig || getDefaultSlabConfig(target.certNumber || 'VCA-26-0101');
    const newSlabConfig: SlabConfig = {
      ...baseConfig,
      ...updates,
    };
    const newCertNumber = newSlabConfig.serialNumber || target.certNumber || 'VCA-26-0101';

    try {
      await updateDoc(doc(db, 'users', user.uid, 'vault', cardId), {
        slabConfig: newSlabConfig,
        certNumber: newCertNumber,
        customGrade: newSlabConfig.grade,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, cardPath);
    }
  };

  const toggleFavorite = async (cardId: string) => {
    if (!user) return;
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;

    const cardPath = `users/${user.uid}/vault/${cardId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'vault', cardId), {
        isFavorite: !target.isFavorite,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, cardPath);
    }
  };

  const updateCard = async (cardId: string, updates: Partial<CardItem>) => {
    if (!user) return;
    const cardPath = `users/${user.uid}/vault/${cardId}`;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'vault', cardId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, cardPath);
    }
  };

  const removeCard = async (cardId: string) => {
    if (!user) return;
    const cardPath = `users/${user.uid}/vault/${cardId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'vault', cardId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, cardPath);
    }
  };

  // Schedule or trigger live refresh for all cards in vault
  const refreshCardPrices = async () => {
    if (!user || cards.length === 0 || isRefreshingPrices) return;
    setIsRefreshingPrices(true);

    try {
      for (const card of cards) {
        if (!card.cardId || card.cardId.startsWith('auto-')) continue;
        try {
          const res = await fetch(`/api/cards/${card.cardId}?variant=${encodeURIComponent(card.variant)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.pricing) {
              const cardPath = `users/${user.uid}/vault/${card.id}`;
              await updateDoc(doc(db, 'users', user.uid, 'vault', card.id), {
                rawPrice: json.pricing.rawPrice,
                psa10Price: json.pricing.psa10Price,
                psa9Price: json.pricing.psa9Price,
                psa8Price: json.pricing.psa8Price,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (e) {
          console.warn(`Price refresh skipped for ${card.name}:`, e);
        }
      }
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  // Auto-refresh schedule once per day or on demand
  useEffect(() => {
    if (!user || cards.length === 0) return;
    const interval = setInterval(() => {
      refreshCardPrices();
    }, 1000 * 60 * 30); // every 30 minutes
    return () => clearInterval(interval);
  }, [cards.length, user]);

  return (
    <VaultContext.Provider
      value={{
        cards,
        loading,
        portfolioSnapshots,
        addBatchToVault,
        toggleFavorite,
        updateCard,
        updateSlabConfig,
        removeCard,
        refreshCardPrices,
        isRefreshingPrices,
        totalRawValue,
        totalPsa10Value,
        favoritesCount,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
