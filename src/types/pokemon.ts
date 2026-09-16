export type CardVariant =
  | 'Normal'
  | 'Holo'
  | 'Reverse Holo'
  | '1st Edition'
  | 'Shadowless'
  | 'Unlimited'
  | "Promo (McDonald's)"
  | 'Promo (Poké Ball)'
  | 'Promo (Cracked Ice)'
  | 'Full Art'
  | 'Alt Art'
  | 'Rainbow Rare'
  | 'Error';

export const CARD_VARIANTS: CardVariant[] = [
  'Normal',
  'Holo',
  'Reverse Holo',
  '1st Edition',
  'Shadowless',
  'Unlimited',
  "Promo (McDonald's)",
  'Promo (Poké Ball)',
  'Promo (Cracked Ice)',
  'Full Art',
  'Alt Art',
  'Rainbow Rare',
  'Error',
];

export interface SoldComp {
  id: string;
  date: string;
  price: number;
  grade: string;
  source: 'eBay Sold' | 'TCGplayer Market';
  title: string;
}

export interface CardPricing {
  rawPrice: number;
  psa10Price: number;
  psa9Price: number;
  psa8Price: number;
  psa10DeltaPercent: number;
  recentComps: SoldComp[];
}

export type SlabType =
  | 'crystal_clear'
  | 'obsidian_black'
  | 'gold_ingot'
  | 'silver_platinum'
  | 'cosmic_stellar'
  | 'frosted_ice'
  | 'ruby_crimson'
  | 'emerald_jade';

export type LabelColor =
  | 'cyber_cyan'
  | 'crimson_red'
  | 'electric_yellow'
  | 'master_purple'
  | 'emerald_rayquaza'
  | 'holo_iridescent';

export interface SlabConfig {
  slabType: SlabType;
  labelColor: LabelColor;
  grade: string; // e.g. "#10 GRADE"
  subGrade: string; // e.g. "GEM MINT"
  condition?: string; // e.g. "Gem Mint", "Pristine", "Mint", "Near Mint", etc.
  serialNumber: string; // e.g. "VCA-26-0101"
  customCardTitle?: string; // Dynamic custom card title override
  customSubtitle?: string; // Dynamic set / edition subtitle override
  customAuthorityText?: string; // e.g. "VCA", "PSA", "BGS"
  customAuthoritySubtext?: string; // e.g. "VERIFIED CARD AUTHORITY"
  centeringScore?: string; // e.g. "10.0"
  cornersScore?: string; // e.g. "10.0"
  edgesScore?: string; // e.g. "9.5"
  surfaceScore?: string; // e.g. "10.0"
  qrEnabled: boolean;
  nfcEnabled: boolean;
  holoIntensity: number; // 0.0 - 2.0
  holoPattern?: 'cosmos' | 'prism' | 'gold' | 'cyber';
}

export interface CardItem {
  id: string; // Firestore document ID
  userId: string;
  cardId: string;
  name: string;
  setName: string;
  setId?: string;
  number: string;
  rarity: string;
  imageUrl: string;
  imageUrlHiRes: string;
  language: 'EN' | 'JP';
  variant: CardVariant;
  rawPrice: number;
  psa10Price: number;
  psa9Price: number;
  psa8Price: number;
  isFavorite: boolean;
  customGrade?: string; // e.g. "GEM MT 10", "PSA 9", "RAW"
  certNumber?: string; // e.g. "VCA-26-0101"
  slabConfig?: SlabConfig;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScanTrayItem {
  tempId: string;
  cardId: string;
  name: string;
  setName: string;
  number: string;
  rarity: string;
  imageUrl: string;
  imageUrlHiRes: string;
  language: 'EN' | 'JP';
  variant: CardVariant;
  pricing: CardPricing;
  scannedAt: Date;
}

export interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalRawValue: number;
  totalPsa10Value: number;
  cardCount: number;
  recordedAt: string;
}
