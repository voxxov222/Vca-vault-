import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  VideoOff,
  RotateCw,
  Layers,
  Sparkles,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ChevronDown,
  Trash2,
  Save,
  Globe,
  Zap,
  Upload,
  Search,
  ShieldCheck,
  Crown,
  Gem,
  SlidersHorizontal,
  Copy,
  ExternalLink,
  Box,
  QrCode,
  Radio,
  Check,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Calculator,
  Percent,
  HelpCircle,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVault, generateNextVcaSerial, getDefaultSlabConfig } from '../firebase/VaultContext.tsx';
import { CardVariant, CARD_VARIANTS, ScanTrayItem, CardItem, SlabType, SlabConfig, CardPricing } from '../types/pokemon.ts';
import { CONDITION_TIERS, ConditionTier } from './SlabGradeBadge.tsx';
import { PriceGuideModal } from './PriceGuideModal.tsx';

interface LiveScannerProps {
  onScanSaved?: () => void;
  onOpen3DSlab?: (card: CardItem) => void;
  onOpenCardDetail?: (card: CardItem) => void;
}

type ScanMode = 'camera' | 'upload' | 'search';

interface SlabOption {
  id: SlabType;
  name: string;
  badge: string;
  accent: string;
  bgPreview: string;
}

const SLAB_CASING_OPTIONS: SlabOption[] = [
  { id: 'crystal_clear', name: 'Diamond Clear', badge: 'Standard', accent: '#38bdf8', bgPreview: 'bg-sky-500/20 border-sky-400' },
  { id: 'gold_ingot', name: 'Golden Aurum', badge: '24K Gilded', accent: '#f59e0b', bgPreview: 'bg-amber-500/20 border-amber-400' },
  { id: 'obsidian_black', name: 'Obsidian Onyx', badge: 'Dark Edition', accent: '#64748b', bgPreview: 'bg-slate-800 border-slate-600' },
  { id: 'silver_platinum', name: 'Silver Platinum', badge: 'Mirror Spec', accent: '#94a3b8', bgPreview: 'bg-slate-300/30 border-slate-300' },
  { id: 'cosmic_stellar', name: 'Cosmic Stellar', badge: 'Iridescent', accent: '#a855f7', bgPreview: 'bg-purple-500/20 border-purple-400' },
  { id: 'ruby_crimson', name: 'Ruby Crimson', badge: 'Collector', accent: '#ef4444', bgPreview: 'bg-red-500/20 border-red-400' },
  { id: 'emerald_jade', name: 'Emerald Jade', badge: 'Rayquaza', accent: '#10b981', bgPreview: 'bg-emerald-500/20 border-emerald-400' },
  { id: 'frosted_ice', name: 'Frosted Ice', badge: 'Matte', accent: '#06b6d4', bgPreview: 'bg-cyan-500/20 border-cyan-400' },
];

export const LiveScanner: React.FC<LiveScannerProps> = ({
  onScanSaved,
  onOpen3DSlab,
  onOpenCardDetail,
}) => {
  const { cards, addBatchToVault, addSingleCardToVault } = useVault();

  // Mode: Camera, Photo Upload, or Direct Card Search
  const [activeMode, setActiveMode] = useState<ScanMode>('camera');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeSessionRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMultiScan, setIsMultiScan] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'JP'>('EN');
  const [isScanning, setIsScanning] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);

  // Reference to identified card card for smooth auto-scrolling
  const identifiedSectionRef = useRef<HTMLDivElement>(null);
  const [showPriceGuideModal, setShowPriceGuideModal] = useState(false);

  // Recognition detection state
  const [detectedBox, setDetectedBox] = useState<{ ymin: number; xmin: number; ymax: number; xmax: number } | null>(null);
  const [floatingValue, setFloatingValue] = useState<number | null>(null);
  const [valuePopupPos, setValuePopupPos] = useState<{ top: string; left: string } | null>(null);

  // Active Identified Card details
  const [identifiedCard, setIdentifiedCard] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>('Normal');
  const [pricingData, setPricingData] = useState<any | null>(null);

  // Virtual Grading state
  const [selectedCondition, setSelectedCondition] = useState<ConditionTier>(
    CONDITION_TIERS.find((t) => t.id === 'gem_mint') || CONDITION_TIERS[1]
  );
  const [subgrades, setSubgrades] = useState({
    centering: '10.0',
    corners: '10.0',
    edges: '9.5',
    surface: '10.0',
  });
  const [showSubgradeSliders, setShowSubgradeSliders] = useState(false);

  // Virtual Slab with Serial Number state
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [selectedSlabType, setSelectedSlabType] = useState<SlabType>('crystal_clear');
  const [qrSecurityEnabled, setQrSecurityEnabled] = useState(true);
  const [nfcSecurityEnabled, setNfcSecurityEnabled] = useState(true);
  const [copiedSerial, setCopiedSerial] = useState(false);

  // Direct Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload state
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scan Tray (batch of cards to save)
  const [scanTray, setScanTray] = useState<ScanTrayItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingSingle, setIsSavingSingle] = useState(false);
  const [singleSaveSuccess, setSingleSaveSuccess] = useState(false);
  const [scannerNotice, setScannerNotice] = useState<string | null>(null);

  // Card correction & alternative predictions
  const [alternativeGuesses, setAlternativeGuesses] = useState<string[]>([]);
  const [candidateMatches, setCandidateMatches] = useState<any[]>([]);
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false);
  const [correctionSearchQuery, setCorrectionSearchQuery] = useState('');
  const [correctionResults, setCorrectionResults] = useState<any[]>([]);
  const [isCorrectionSearching, setIsCorrectionSearching] = useState(false);

  // Confidence score & Low-confidence verification state
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [pendingLowConfidenceCard, setPendingLowConfidenceCard] = useState<{
    card: any;
    variant: CardVariant;
    confidence: number;
    livePricing?: any;
    rawImagePreview?: string;
  } | null>(null);

  // Initialize Serial Number on mount
  useEffect(() => {
    setSerialNumber(generateNextVcaSerial(cards));
  }, [cards]);

  // Start Camera
  const startCamera = async () => {
    const sessionId = ++activeSessionRef.current;
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const oldStream = videoRef.current.srcObject as MediaStream;
      oldStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraActive(false);
      setCameraError('Camera API is not supported in this browser or context.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!isMountedRef.current || sessionId !== activeSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const attemptPlay = async () => {
        if (!isMountedRef.current || sessionId !== activeSessionRef.current || !videoRef.current) {
          return;
        }
        try {
          await videoRef.current.play();
          if (isMountedRef.current && sessionId === activeSessionRef.current) {
            setCameraActive(true);
            setCameraError(null);
          }
        } catch (playErr: any) {
          if (
            playErr?.name === 'AbortError' ||
            playErr?.message?.includes('interrupted') ||
            playErr?.message?.includes('pause')
          ) {
            if (videoRef.current && !videoRef.current.paused) {
              setCameraActive(true);
              setCameraError(null);
            }
            return;
          }
          console.warn('Video playback warning:', playErr);
        }
      };

      video.onloadedmetadata = () => {
        attemptPlay();
      };

      if (video.readyState >= 1) {
        attemptPlay();
      }
    } catch (err: any) {
      if (!isMountedRef.current || sessionId !== activeSessionRef.current) {
        return;
      }

      if (err?.name === 'AbortError' || err?.message?.includes('interrupted')) {
        return;
      }

      console.error('Camera access error:', err);
      setCameraActive(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Try Uploading a Photo or Search below.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Use Upload or Direct Search.');
      } else {
        setCameraError(err?.message || 'Could not access camera feed.');
      }
    }
  };

  // Stop Camera
  const stopCamera = () => {
    activeSessionRef.current++;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      videoRef.current.onloadedmetadata = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [facingMode, activeMode]);

  // Continuous Auto-Scan Interval for Camera Feed
  useEffect(() => {
    if (!autoScanEnabled || activeMode !== 'camera' || !cameraActive) return;

    const interval = setInterval(() => {
      if (!isScanning && videoRef.current && videoRef.current.readyState >= 2) {
        captureAndRecognize();
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [autoScanEnabled, activeMode, cameraActive, isScanning]);

  // Set card and retrieve live pricing immediately
  const setupIdentifiedCard = async (card: any, variant: CardVariant = 'Normal', confidence?: number) => {
    setIdentifiedCard(card);
    setSelectedVariant(variant);
    if (typeof confidence === 'number') {
      setConfidenceScore(confidence);
    }

    // Smooth auto-scroll down to the identified card and price guide
    setTimeout(() => {
      identifiedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    try {
      const priceRes = await fetch(
        `/api/cards/pricing?cardId=${card.id}&variant=${encodeURIComponent(variant)}`
      );
      if (priceRes.ok) {
        const priceJson = await priceRes.json();
        const p = priceJson.pricing || {
          rawPrice: card.tcgplayer?.prices?.holofoil?.market || 15.0,
          psa10Price: 65.0,
          psa9Price: 28.0,
          psa8Price: 19.0,
          psa10DeltaPercent: 333,
          recentComps: [],
        };
        setPricingData(p);
        setFloatingValue(p.rawPrice);
      }
    } catch (e) {
      console.error('Pricing error:', e);
    }
  };

  // Capture & Recognize frame from live camera
  const captureAndRecognize = async () => {
    if (!videoRef.current || isScanning || pendingLowConfidenceCard) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsScanning(true);
    setScannerNotice(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 800);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      await processCardImageBase64(base64);
    } catch (err) {
      console.warn('Recognition frame cycle error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Process base64 card image with Gemini Vision / Server
  const processCardImageBase64 = async (base64: string) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/recognize-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, language }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cardDetected && data.matchedCard) {
          setScannerNotice(null);
          setAlternativeGuesses(data.alternativeGuesses || []);
          setCandidateMatches(data.candidateMatches || []);
          const bbox = data.boundingBox || { ymin: 150, xmin: 200, ymax: 850, xmax: 800 };
          setDetectedBox(bbox);
          setValuePopupPos({ top: `${(bbox.ymin / 1000) * 100 + 4}%`, left: '50%' });

          const detectedVar = (data.variantGuess as CardVariant) || 'Normal';
          const matchConfidence = typeof data.confidence === 'number' ? data.confidence : 0.95;

          // If match confidence is below threshold (< 0.80), prompt user for confirmation
          if (matchConfidence < 0.8) {
            setPendingLowConfidenceCard({
              card: data.matchedCard,
              variant: detectedVar,
              confidence: matchConfidence,
              livePricing: data.livePricing,
              rawImagePreview: base64,
            });
          } else {
            // High confidence match: proceed directly
            await setupIdentifiedCard(data.matchedCard, detectedVar, matchConfidence);

            // Add to Scan Tray in multi-scan mode
            if (isMultiScan) {
              addCardToScanTray(data.matchedCard, detectedVar, data.livePricing);
            }
          }
        } else if (data.cardDetected && !data.matchedCard) {
          // If a card name was parsed, try searching catalog directly
          if (data.cardName) {
            handleSearchCards(data.cardName);
            setActiveMode('search');
            setScannerNotice(`AI recognized "${data.cardName}". Search results opened below.`);
          } else {
            setScannerNotice('Card detected. Please select match or use Direct Search / Quick Identify below.');
          }
          if (data.alternativeGuesses) setAlternativeGuesses(data.alternativeGuesses);
        } else if (data.errorMessage) {
          setScannerNotice(data.errorMessage);
          if (data.alternativeGuesses) setAlternativeGuesses(data.alternativeGuesses);
        } else {
          setScannerNotice('Card not clearly detected in frame. Hold the card steady and centered, or use Quick Search.');
        }
      } else {
        const errorJson = await res.json().catch(() => ({}));
        setScannerNotice(errorJson.error || 'Scanner connection busy. Retrying or use Direct Search below.');
      }
    } catch (err) {
      console.warn('Recognition notice:', err);
      setScannerNotice('Scanner network busy. You can use Direct Search or Quick Identify below.');
    } finally {
      setIsScanning(false);
    }
  };

  // Add item to the multi-scan tray
  const addCardToScanTray = (card: any, variant: CardVariant, pricing: any) => {
    const p = pricing || {
      rawPrice: 25.0,
      psa10Price: 85.0,
      psa9Price: 40.0,
      psa8Price: 28.0,
      psa10DeltaPercent: 240,
    };

    const trayItem: ScanTrayItem = {
      tempId: `tray_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      cardId: card.id,
      name: card.name,
      setName: card.set?.name || 'Scarlet & Violet',
      number: card.number || '001',
      rarity: card.rarity || 'Rare',
      imageUrl: card.images?.small || '',
      imageUrlHiRes: card.images?.large || card.images?.small || '',
      language,
      variant,
      pricing: p,
      scannedAt: new Date(),
    };

    setScanTray((prev) => {
      const exists = prev.some((item) => item.cardId === trayItem.cardId && item.variant === trayItem.variant);
      if (exists) return prev;
      return [trayItem, ...prev];
    });
  };

  // Re-calculate price when variant changes
  const handleVariantChange = async (newVariant: CardVariant) => {
    setSelectedVariant(newVariant);
    if (!identifiedCard) return;

    try {
      const res = await fetch(
        `/api/cards/pricing?cardId=${identifiedCard.id}&variant=${encodeURIComponent(newVariant)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.pricing) {
          setPricingData(json.pricing);
          setFloatingValue(json.pricing.rawPrice);
        }
      }
    } catch (e) {
      console.error('Variant pricing update error:', e);
    }
  };

  // Instant card identifier preset (especially Gardevoir!)
  const handleScanSampleCard = async (sampleName: string, sampleVariant: CardVariant = 'Holo') => {
    setIsScanning(true);
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(sampleName)}&language=${language}`);
      if (res.ok) {
        const json = await res.json();
        const card = json.data?.[0];
        if (card) {
          setDetectedBox({ ymin: 150, xmin: 240, ymax: 850, xmax: 760 });
          setValuePopupPos({ top: '20%', left: '50%' });
          await setupIdentifiedCard(card, sampleVariant);

          if (isMultiScan) {
            addCardToScanTray(card, sampleVariant, null);
          }
        }
      }
    } catch (e) {
      console.error('Sample card scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Direct Card Search handler
  const handleSearchCards = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    // Auto-replace "garden" query with Gardevoir for intuitive matching
    const queryTerm = q.toLowerCase() === 'garden' ? 'Gardevoir' : q;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(queryTerm)}&language=${language}`);
      if (res.ok) {
        const json = await res.json();
        setSearchResults(json.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // File upload reader with automatic downscaling
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setScannerNotice(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawData = e.target?.result as string;
      setUploadPreview(rawData);

      // Optimize image on canvas with high resolution (max 1600px, 0.92 quality) for sharp OCR & number recognition
      const img = new Image();
      img.onload = async () => {
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const scaledBase64 = canvas.toDataURL('image/jpeg', 0.92);
          await processCardImageBase64(scaledBase64);
        } else {
          await processCardImageBase64(rawData);
        }
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  // Condition Tier Selection
  const handleConditionSelect = (tier: ConditionTier) => {
    setSelectedCondition(tier);
    setSubgrades({ ...tier.defaultScores });
  };

  // Card correction search handler
  const handleCorrectionSearch = async (term: string) => {
    setCorrectionSearchQuery(term);
    if (!term.trim()) {
      setCorrectionResults([]);
      return;
    }
    setIsCorrectionSearching(true);
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(term)}&language=${language}`);
      if (res.ok) {
        const json = await res.json();
        setCorrectionResults(json.data || []);
      }
    } catch (e) {
      console.warn('Correction search error:', e);
    } finally {
      setIsCorrectionSearching(false);
    }
  };

  const handleSelectCorrectedCard = async (card: any) => {
    await setupIdentifiedCard(card, selectedVariant);
    setShowCorrectionDialog(false);
    setCorrectionResults([]);
    setCorrectionSearchQuery('');
    setScannerNotice(null);
  };

  // Build CardItem representation for 3D Slab Viewer or Vault
  const constructGradedCardItem = (): CardItem => {
    if (!identifiedCard) throw new Error('No card identified');

    const effectiveSerial = serialNumber.trim() || generateNextVcaSerial(cards);
    const rawPrice = pricingData?.rawPrice || 25.0;
    const psa10Price = pricingData?.psa10Price || rawPrice * 3.4;
    const psa9Price = pricingData?.psa9Price || rawPrice * 1.8;
    const psa8Price = pricingData?.psa8Price || rawPrice * 1.25;

    const slabConfig: SlabConfig = {
      slabType: selectedSlabType,
      labelColor: 'cyber_cyan',
      grade: selectedCondition.fullGradeString,
      subGrade: selectedCondition.subGrade,
      condition: selectedCondition.name,
      serialNumber: effectiveSerial,
      customCardTitle: identifiedCard.name,
      customSubtitle: `${identifiedCard.set?.name || 'Scarlet & Violet'} #${identifiedCard.number || '001'}`,
      centeringScore: subgrades.centering,
      cornersScore: subgrades.corners,
      edgesScore: subgrades.edges,
      surfaceScore: subgrades.surface,
      qrEnabled: qrSecurityEnabled,
      nfcEnabled: nfcSecurityEnabled,
      holoIntensity: 1.2,
      holoPattern: 'cosmos',
    };

    return {
      id: `virtual_${Date.now()}`,
      userId: 'current_user',
      cardId: identifiedCard.id,
      name: identifiedCard.name,
      setName: identifiedCard.set?.name || 'Scarlet & Violet',
      number: identifiedCard.number || '001',
      rarity: identifiedCard.rarity || 'Special Illustration Rare',
      imageUrl: identifiedCard.images?.small || '',
      imageUrlHiRes: identifiedCard.images?.large || identifiedCard.images?.small || '',
      language,
      variant: selectedVariant,
      rawPrice,
      psa10Price,
      psa9Price,
      psa8Price,
      isFavorite: false,
      customGrade: selectedCondition.fullGradeString,
      certNumber: effectiveSerial,
      slabConfig,
      createdAt: new Date().toISOString(),
    };
  };

  // Launch 3D Slab directly in ThreeSlabViewer
  const handleLaunch3DSlab = () => {
    if (!identifiedCard) return;
    const cardItem = constructGradedCardItem();
    if (onOpen3DSlab) {
      onOpen3DSlab(cardItem);
    }
  };

  // Save Graded Virtual Slab directly to Vault
  const handleSaveGradedSlabToVault = async () => {
    if (!identifiedCard || isSavingSingle) return;
    setIsSavingSingle(true);

    try {
      const cardItem = constructGradedCardItem();
      await addSingleCardToVault(cardItem);
      setSingleSaveSuccess(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.7 },
      });

      // Advance serial for next card
      setSerialNumber(generateNextVcaSerial([...cards, cardItem]));

      setTimeout(() => {
        setSingleSaveSuccess(false);
        if (onScanSaved) onScanSaved();
      }, 1400);
    } catch (err) {
      console.error('Failed to save graded slab:', err);
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Commit batch tray to Firestore
  const handleSaveBatchToVault = async () => {
    if (scanTray.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await addBatchToVault(scanTray);
      setSaveSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
      });
      setScanTray([]);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onScanSaved) onScanSaved();
      }, 1500);
    } catch (err) {
      console.error('Error saving batch to vault:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Serial Number
  const handleCopySerial = () => {
    navigator.clipboard.writeText(serialNumber);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  // Calculate Running Total Value in tray
  const trayTotalValue = scanTray.reduce((acc, item) => acc + (item.pricing?.rawPrice || 0), 0);

  // Projected Value based on selected condition
  const getProjectedGradedValue = () => {
    if (!pricingData) return 0;
    switch (selectedCondition.pricingTier) {
      case 'psa10':
        return pricingData.psa10Price || pricingData.rawPrice * 3.4;
      case 'psa9':
        return pricingData.psa9Price || pricingData.rawPrice * 1.8;
      case 'psa8':
        return pricingData.psa8Price || pricingData.rawPrice * 1.25;
      default:
        return pricingData.rawPrice || 0;
    }
  };

  const projectedValue = getProjectedGradedValue();
  const rawPrice = pricingData?.rawPrice || 0;
  const valueDelta = projectedValue - rawPrice;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Header & Mode Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  cameraActive || activeMode !== 'camera' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  cameraActive || activeMode !== 'camera' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="text-xs font-black tracking-wider uppercase text-slate-800 dark:text-slate-200">
              CARD SCANNER & SLAB STUDIO
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'camera'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'upload'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
            <button
              onClick={() => setActiveMode('search')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'search'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Direct Search</span>
            </button>
          </div>
        </div>

        {/* Global Controls: Language, Multi-scan, Lens flip */}
        <div className="flex items-center gap-2">
          {/* EN/JP Toggle */}
          <button
            onClick={() => setLanguage((l) => (l === 'EN' ? 'JP' : 'EN'))}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400 transition-all"
            title="Switch Language Mode"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>{language}</span>
          </button>

          {/* Single vs Multi scan toggle */}
          <button
            onClick={() => setIsMultiScan(!isMultiScan)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
              isMultiScan
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isMultiScan ? 'BATCH TRAY ON' : 'SINGLE'}</span>
          </button>

          {activeMode === 'camera' && (
            <button
              onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-sky-400"
              title="Flip Camera Lens"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Identify Bar - Feature Gardevoir directly */}
      <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-purple-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            QUICK IDENTIFY:
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {/* Gardevoir (The Garden) prominently featured */}
          <button
            onClick={() => handleScanSampleCard('Gardevoir ex', 'Holo')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            <span>✨ Gardevoir ex (Paldea)</span>
          </button>
          <button
            onClick={() => handleScanSampleCard('Radiant Gardevoir', 'Holo')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all"
          >
            Radiant Gardevoir
          </button>
          <button
            onClick={() => handleScanSampleCard('Charizard Base Set', 'Holo')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all"
          >
            Charizard Base Set
          </button>
          <button
            onClick={() => handleScanSampleCard('Pikachu 151', 'Full Art')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all"
          >
            Pikachu 151
          </button>
          <button
            onClick={() => handleScanSampleCard('Umbreon VMAX', 'Alt Art')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all"
          >
            Umbreon VMAX
          </button>
        </div>
      </div>

      {/* Dynamic Status / Fallback Notification Banner */}
      {scannerNotice && (
        <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{scannerNotice}</span>
          </div>
          <button
            onClick={() => setScannerNotice(null)}
            className="text-[11px] font-bold underline text-amber-600 dark:text-amber-400 hover:opacity-80 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Scanner / Input Section */}
      <div className="relative flex-1 flex flex-col overflow-y-auto">
        {/* MODE 1: Camera Feed */}
        {activeMode === 'camera' && (
          <div className="relative bg-black flex items-center justify-center min-h-[340px] max-h-[460px] overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Framing Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-full max-w-xs aspect-[63/88] border-2 border-dashed border-white/50 rounded-2xl relative shadow-2xl">
                {/* Corner Reticles */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-white/90 bg-black/70 px-3 py-1 rounded-full backdrop-blur-sm">
                    FIT POKÉMON CARD IN FRAME
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Green Bounding Box lock */}
            {detectedBox && (
              <div
                className="absolute border-2 border-emerald-400 rounded-xl transition-all duration-200 pointer-events-none shadow-[0_0_25px_rgba(52,211,153,0.7)] animate-pulse"
                style={{
                  top: `${(detectedBox.ymin / 1000) * 100}%`,
                  left: `${(detectedBox.xmin / 1000) * 100}%`,
                  width: `${((detectedBox.xmax - detectedBox.xmin) / 1000) * 100}%`,
                  height: `${((detectedBox.ymax - detectedBox.ymin) / 1000) * 100}%`,
                }}
              >
                <div className="absolute -top-7 left-0 bg-emerald-500 text-slate-950 font-bold font-mono text-[10px] px-2 py-0.5 rounded shadow">
                  LOCKED • GEMINI VISION
                </div>
              </div>
            )}

            {/* Floating Gold Market Value Pop-up */}
            {floatingValue !== null && valuePopupPos && (
              <div
                className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-300 z-30"
                style={{ top: valuePopupPos.top, left: valuePopupPos.left }}
              >
                <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-extrabold text-sm px-3.5 py-1.5 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.8)] border border-white/60 flex items-center gap-1.5 animate-bounce">
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span>${floatingValue.toFixed(2)}</span>
                  <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full font-mono">LIVE TCG</span>
                </div>
              </div>
            )}

            {/* Camera Error / Permission Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                <VideoOff className="w-10 h-10 text-amber-400 mb-2" />
                <h3 className="text-white font-bold text-base mb-1">Camera Feed Inactive</h3>
                <p className="text-slate-400 text-xs max-w-sm mb-4">{cameraError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow transition-all"
                  >
                    Retry Camera
                  </button>
                  <button
                    onClick={() => setActiveMode('upload')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                  >
                    Upload Photo Instead
                  </button>
                </div>
              </div>
            )}

            {/* Top Camera Controls Overlay */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
              <button
                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow backdrop-blur-md ${
                  autoScanEnabled
                    ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
                    : 'bg-black/60 text-slate-300 border border-white/20 hover:text-white'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${autoScanEnabled ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>Auto-Scan: {autoScanEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {isScanning && (
                <div className="flex items-center gap-1.5 bg-amber-500/90 text-slate-950 font-black text-xs px-3 py-1.5 rounded-full shadow animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>IDENTIFYING & PRICING...</span>
                </div>
              )}
            </div>

            {/* Bottom Scan Trigger Overlay */}
            <div className="absolute bottom-4 right-4 z-20">
              <button
                onClick={captureAndRecognize}
                disabled={isScanning}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-xs shadow-xl transition-all active:scale-95 ${
                  isScanning
                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                    : 'bg-gradient-to-r from-sky-400 to-blue-600 text-white hover:from-sky-300 hover:to-blue-500'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isScanning ? 'ANALYZING CARD...' : 'SCAN FRAME NOW'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Photo Upload */}
        {activeMode === 'upload' && (
          <div className="p-6 bg-slate-900/30 flex flex-col items-center justify-center min-h-[300px]">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-md aspect-[16/10] border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden ${
                isDragging
                  ? 'border-sky-400 bg-sky-500/10'
                  : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 hover:border-amber-400'
              }`}
            >
              {isScanning ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                    <Sparkles className="w-5 h-5 text-sky-400 absolute -top-1 -right-1 animate-ping" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    Analyzing Card Image with Gemini Vision...
                  </h4>
                  <p className="text-xs text-amber-500 font-bold">
                    Retrieving Live Market Comps & Price Guide...
                  </p>
                </div>
              ) : uploadPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={uploadPreview} alt="Upload preview" className="w-24 h-32 object-cover rounded-lg shadow-md" />
                  <span className="text-xs text-slate-400">Click to upload another photo</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Upload Pokémon Card Image
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Drag and drop a photo or click to browse. Instant card identification & price guide.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* MODE 3: Direct Card Search */}
        {activeMode === 'search' && (
          <div className="p-4 bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-xl mx-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchCards(e.target.value)}
                placeholder="Search card by name (e.g. 'Gardevoir', 'garden', 'Charizard')..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {isSearching && (
                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>

            {/* Live Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-w-3xl mx-auto max-h-60 overflow-y-auto">
                {searchResults.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setupIdentifiedCard(card, 'Holo');
                      if (isMultiScan) addCardToScanTray(card, 'Holo', null);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 cursor-pointer transition-all shadow-sm group"
                  >
                    <img
                      src={card.images?.small}
                      alt={card.name}
                      className="w-10 h-14 object-cover rounded shadow group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">{card.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {card.set?.name} • #{card.number}
                      </p>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${(card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 15.0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IDENTIFIED CARD & VIRTUAL GRADING / SLAB STUDIO */}
        {identifiedCard && (
          <div
            ref={identifiedSectionRef}
            className="p-4 sm:p-5 bg-gradient-to-b from-amber-500/5 via-slate-100/50 dark:via-slate-900/50 to-white dark:to-slate-900 border-t border-amber-500/20"
          >
            {/* Header Badge & Match Confidence Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  CARD IDENTIFIED & DIGITIZED
                </span>
                <span className="text-[11px] font-mono text-slate-400">ID: {identifiedCard.id}</span>

                {/* Match Confidence Badge */}
                {confidenceScore !== null && (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                      confidenceScore >= 0.9
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : confidenceScore >= 0.8
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}
                    title={`Vision model match confidence: ${Math.round(confidenceScore * 100)}%`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{Math.round(confidenceScore * 100)}% Match</span>
                  </div>
                )}
              </div>

              {/* Price Guide Action & Variant Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPriceGuideModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-105 text-slate-950 text-xs font-black rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Price Guide</span>
                </button>

                <div className="relative">
                  <select
                    value={selectedVariant}
                    onChange={(e) => handleVariantChange(e.target.value as CardVariant)}
                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-1 pl-2.5 pr-7 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {CARD_VARIANTS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Studio Bento: Card Preview | Virtual Grading Options | Virtual Slab & Serial */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Col 1: Card Visual & Pricing (3 cols) */}
              <div className="md:col-span-4 flex flex-col items-center bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <div className="relative group mb-3">
                  <img
                    src={identifiedCard.images?.large || identifiedCard.images?.small}
                    alt={identifiedCard.name}
                    className="w-40 sm:w-48 aspect-[63/88] object-cover rounded-xl shadow-xl group-hover:scale-[1.02] transition-all"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400">
                    {identifiedCard.rarity || 'Rare Holo'}
                  </div>
                </div>

                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {identifiedCard.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {identifiedCard.set?.name || 'Scarlet & Violet'} • #{identifiedCard.number || '001'}
                </p>

                {/* Wrong Card? Change Button */}
                <button
                  onClick={() => {
                    setShowCorrectionDialog(!showCorrectionDialog);
                    if (!showCorrectionDialog) {
                      handleCorrectionSearch(identifiedCard.name.split(' ')[0]);
                    }
                  }}
                  className="mt-2 text-[11px] font-bold text-amber-500 hover:text-amber-400 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-all"
                >
                  <Search className="w-3 h-3" />
                  <span>{showCorrectionDialog ? 'Close Search' : 'Not your card? Change'}</span>
                </button>

                {/* Alternative Vision Guesses */}
                {alternativeGuesses.length > 0 && !showCorrectionDialog && (
                  <div className="mt-2.5 w-full text-center">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Possible alternatives:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {alternativeGuesses.map((alt) => (
                        <button
                          key={alt}
                          onClick={() => {
                            setShowCorrectionDialog(true);
                            handleCorrectionSearch(alt);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-400 hover:text-slate-950 transition-all border border-slate-200 dark:border-slate-700"
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Card Correction Search Drawer */}
                {showCorrectionDialog && (
                  <div className="w-full mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={correctionSearchQuery}
                        onChange={(e) => handleCorrectionSearch(e.target.value)}
                        placeholder="Search card by name..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      {isCorrectionSearching && (
                        <RefreshCw className="w-3 h-3 text-amber-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {correctionResults.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                        {correctionResults.slice(0, 6).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCorrectedCard(c)}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-400 cursor-pointer transition-all text-left"
                          >
                            <img
                              src={c.images?.small}
                              alt={c.name}
                              className="w-7 h-10 object-cover rounded shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate">
                                {c.set?.name} • #{c.number}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : candidateMatches.length > 1 ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">
                          Detected Variant Candidates:
                        </span>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                          {candidateMatches.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => handleSelectCorrectedCard(c)}
                              className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all text-left ${
                                c.id === identifiedCard.id
                                  ? 'bg-amber-400/10 border-amber-400'
                                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-400'
                              }`}
                            >
                              <img
                                src={c.images?.small}
                                alt={c.name}
                                className="w-7 h-10 object-cover rounded shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                                  {c.name}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate">
                                  {c.set?.name} • #{c.number} {c.rarity ? `(${c.rarity})` : ''}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 text-center py-2">
                        {isCorrectionSearching ? 'Searching database...' : 'Type name above to find any card'}
                      </p>
                    )}
                  </div>
                )}

                {/* Match Probability & AI Confidence Meter */}
                {confidenceScore !== null && (
                  <div className="w-full mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>Match Probability</span>
                      </span>
                      <span
                        className={`font-mono text-xs font-black ${
                          confidenceScore >= 0.9
                            ? 'text-emerald-500'
                            : confidenceScore >= 0.8
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {Math.round(confidenceScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          confidenceScore >= 0.9
                            ? 'bg-emerald-500'
                            : confidenceScore >= 0.8
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, confidenceScore * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Market Valuation Pill */}
                <div className="w-full mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">RAW VALUE</span>
                    <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200">
                      ${rawPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-500 block">GRADED EST.</span>
                    <span className="text-sm font-extrabold font-mono text-emerald-500">
                      ${projectedValue.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Direct Price Guide Action Button */}
                <button
                  onClick={() => setShowPriceGuideModal(true)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-105 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Open Real-Time Price Guide</span>
                </button>
              </div>

              {/* Col 2: Virtual Grading & Slab Config (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-4">
                {/* 1. VIRTUAL GRADING OPTIONS */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        VIRTUAL GRADING OPTIONS
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowSubgradeSliders(!showSubgradeSliders)}
                      className="text-[11px] font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{showSubgradeSliders ? 'Hide Subgrades' : 'Custom Subgrades'}</span>
                    </button>
                  </div>

                  {/* Grade Tiers Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {CONDITION_TIERS.slice(0, 4).map((tier) => {
                      const isSelected = selectedCondition.id === tier.id;
                      return (
                        <button
                          key={tier.id}
                          onClick={() => handleConditionSelect(tier)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? `${tier.cardBg} ${tier.borderClass} ${tier.glowShadow}`
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-base font-black ${isSelected ? tier.gradeNumberColor : 'text-slate-800 dark:text-slate-200'}`}>
                              {tier.gradeNumber}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <span className={`text-xs font-bold block ${isSelected ? tier.textColor : 'text-slate-600 dark:text-slate-400'}`}>
                            {tier.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Subgrade Sliders (Centering, Corners, Edges, Surface) */}
                  {showSubgradeSliders && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Centering</span>
                          <span className="text-amber-500 font-mono">{subgrades.centering}</span>
                        </div>
                        <input
                          type="range"
                          min="7.0"
                          max="10.0"
                          step="0.5"
                          value={subgrades.centering}
                          onChange={(e) => setSubgrades((s) => ({ ...s, centering: e.target.value }))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Corners</span>
                          <span className="text-amber-500 font-mono">{subgrades.corners}</span>
                        </div>
                        <input
                          type="range"
                          min="7.0"
                          max="10.0"
                          step="0.5"
                          value={subgrades.corners}
                          onChange={(e) => setSubgrades((s) => ({ ...s, corners: e.target.value }))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Edges</span>
                          <span className="text-amber-500 font-mono">{subgrades.edges}</span>
                        </div>
                        <input
                          type="range"
                          min="7.0"
                          max="10.0"
                          step="0.5"
                          value={subgrades.edges}
                          onChange={(e) => setSubgrades((s) => ({ ...s, edges: e.target.value }))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Surface</span>
                          <span className="text-amber-500 font-mono">{subgrades.surface}</span>
                        </div>
                        <input
                          type="range"
                          min="7.0"
                          max="10.0"
                          step="0.5"
                          value={subgrades.surface}
                          onChange={(e) => setSubgrades((s) => ({ ...s, surface: e.target.value }))}
                          className="w-full accent-amber-500 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Profit Multiplier Summary */}
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold">Grading Premium Unlocked:</span>
                    </div>
                    <span className="font-black font-mono">
                      +${valueDelta > 0 ? valueDelta.toFixed(2) : '0.00'} (
                      {rawPrice > 0 ? `+${Math.round((valueDelta / rawPrice) * 100)}%` : '+0%'})
                    </span>
                  </div>
                </div>

                {/* 2. VIRTUAL SLAB & SERIAL NUMBER CONFIG */}
                <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-sky-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        VIRTUAL SLAB & CERTIFICATION SERIAL
                      </h4>
                    </div>
                  </div>

                  {/* Serial Number Display & Editing */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        CERTIFICATION / SERIAL NUMBER
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm text-sky-600 dark:text-sky-400 py-2 pl-3 pr-20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          onClick={handleCopySerial}
                          className="absolute right-2 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-sky-500 transition-all flex items-center gap-1"
                        >
                          {copiedSerial ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSerial ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setSerialNumber(generateNextVcaSerial(cards, Math.floor(Math.random() * 50)))}
                      className="mt-5 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-sky-400 text-slate-500 dark:text-slate-400 hover:text-sky-400 transition-all"
                      title="Generate new unique serial"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Slab Casing Options */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      SLAB CASING MATERIAL
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SLAB_CASING_OPTIONS.map((opt) => {
                        const isSelected = selectedSlabType === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setSelectedSlabType(opt.id)}
                            className={`px-2.5 py-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                              isSelected
                                ? `${opt.bgPreview} border-2 shadow-sm`
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: opt.accent }}
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold truncate block text-slate-800 dark:text-slate-200">
                                {opt.name}
                              </span>
                              <span className="text-[9px] text-slate-400 block">{opt.badge}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security Features */}
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={qrSecurityEnabled}
                        onChange={(e) => setQrSecurityEnabled(e.target.checked)}
                        className="rounded accent-sky-500 cursor-pointer"
                      />
                      <span>Holographic QR Security</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nfcSecurityEnabled}
                        onChange={(e) => setNfcSecurityEnabled(e.target.checked)}
                        className="rounded accent-sky-500 cursor-pointer"
                      />
                      <span>NFC Microchip Tag</span>
                    </label>
                  </div>
                </div>

                {/* 3. PRIMARY ACTION BUTTONS */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Launch in 3D Viewer */}
                  <button
                    onClick={handleLaunch3DSlab}
                    className="flex-1 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white hover:brightness-110 shadow-lg shadow-sky-500/20 active:scale-[0.99] transition-all"
                  >
                    <Box className="w-4 h-4" />
                    <span>LAUNCH 3D VIRTUAL SLAB</span>
                  </button>

                  {/* Save to Vault directly */}
                  <button
                    onClick={handleSaveGradedSlabToVault}
                    disabled={isSavingSingle}
                    className={`py-3 px-5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] ${
                      singleSaveSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-105'
                    }`}
                  >
                    {singleSaveSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>SLAB SAVED!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isSavingSingle ? 'SAVING...' : 'SAVE GRADED SLAB'}</span>
                      </>
                    )}
                  </button>

                  {/* Add to Tray */}
                  <button
                    onClick={() => addCardToScanTray(identifiedCard, selectedVariant, pricingData)}
                    className="py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Tray</span>
                  </button>
                </div>
              </div>
            </div>

            {/* EMBEDDED REAL-TIME PRICE GUIDE & VALUATION MODULE */}
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-amber-500/30 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>REAL-TIME PRICE GUIDE</span>
                      <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        LIVE MARKET
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Cross-referenced TCGplayer Market, PSA Census, & eBay Sold Comps
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPriceGuideModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span>Expand Price Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Grade Ladder Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {/* Raw */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Raw / NM</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white block mt-0.5">
                    ${rawPrice.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">TCG Median</span>
                </div>

                {/* PSA 10 */}
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/15 to-yellow-500/20 border border-amber-500/40">
                  <span className="text-[10px] font-black text-amber-500 dark:text-amber-400 block uppercase flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> PSA 10
                  </span>
                  <span className="text-sm font-black font-mono text-amber-500 block mt-0.5">
                    ${(pricingData?.psa10Price || rawPrice * 3.4).toFixed(2)}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-500 font-mono">
                    +{pricingData?.psa10DeltaPercent || Math.round((((pricingData?.psa10Price || rawPrice * 3.4) - rawPrice) / rawPrice) * 100)}%
                  </span>
                </div>

                {/* PSA 9 */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-sky-500 block uppercase">PSA 9</span>
                  <span className="text-sm font-black font-mono text-sky-500 block mt-0.5">
                    ${(pricingData?.psa9Price || rawPrice * 1.8).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Mint</span>
                </div>

                {/* PSA 8 */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">PSA 8</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 block mt-0.5">
                    ${(pricingData?.psa8Price || rawPrice * 1.25).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">NM-MT</span>
                </div>

                {/* CGC 10 */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-sky-400 block uppercase">CGC 10</span>
                  <span className="text-sm font-black font-mono text-sky-400 block mt-0.5">
                    ${(pricingData?.cgc10Price || (pricingData?.psa10Price || rawPrice * 3.4) * 1.05).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Pristine</span>
                </div>

                {/* BGS 9.5 */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-purple-400 block uppercase">BGS 9.5</span>
                  <span className="text-sm font-black font-mono text-purple-400 block mt-0.5">
                    ${(pricingData?.bgs95Price || (pricingData?.psa10Price || rawPrice * 3.4) * 0.92).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Gem Mint</span>
                </div>
              </div>

              {/* Recent sales snippet */}
              {pricingData?.recentComps && pricingData.recentComps.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      LATEST SOLD COMP:
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                      {pricingData.recentComps[0].grade} • ${pricingData.recentComps[0].price.toFixed(2)} ({pricingData.recentComps[0].date})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPriceGuideModal(true)}
                    className="text-[11px] font-bold text-amber-500 hover:text-amber-400 underline"
                  >
                    View all {pricingData.recentComps.length} recent comps
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FULL PRICE GUIDE MODAL */}
      {identifiedCard && (
        <PriceGuideModal
          isOpen={showPriceGuideModal}
          onClose={() => setShowPriceGuideModal(false)}
          cardName={identifiedCard.name}
          setName={identifiedCard.set?.name || 'Pokemon Set'}
          cardNumber={identifiedCard.number || '001'}
          cardRarity={identifiedCard.rarity}
          cardImageUrl={identifiedCard.images?.large || identifiedCard.images?.small}
          variant={selectedVariant}
          pricing={pricingData}
        />
      )}

      {/* SCAN TRAY AT BOTTOM: Multi-card batching & Running Total Value */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-slate-600 dark:text-slate-400">
              SCAN TRAY ({scanTray.length})
            </span>
            {scanTray.length > 0 && (
              <button
                onClick={() => setScanTray([])}
                className="text-slate-400 hover:text-red-500 text-[11px] transition-colors"
                title="Clear tray"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Running TOTAL VALUE */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">TOTAL VALUE:</span>
            <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              ${trayTotalValue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Thumbnail Carousel */}
        {scanTray.length === 0 ? (
          <div className="py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {identifiedCard
                ? 'Click "Add to Tray" above to queue this card in the batch.'
                : 'Point camera, upload a photo, or click "Gardevoir ex" above to scan and grade.'}
            </p>
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
            {scanTray.map((item, idx) => (
              <div
                key={item.tempId}
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-1.5 rounded-xl shrink-0 w-48 relative group"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-10 h-14 object-cover rounded-md shadow shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.setName}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded">
                      {item.variant}
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ${item.pricing?.rawPrice?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Remove from tray */}
                <button
                  onClick={() => setScanTray((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Save to Vault Commit Button */}
        {scanTray.length > 0 && (
          <button
            onClick={handleSaveBatchToVault}
            disabled={isSaving}
            className={`w-full mt-2.5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              saveSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 hover:brightness-105 active:scale-[0.99]'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>SAVED {scanTray.length} CARDS TO VAULT!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'PERSISTING TO FIRESTORE...' : `SAVE ${scanTray.length} CARDS TO VAULT`}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Low Confidence Match Confirmation Dialog */}
      {pendingLowConfidenceCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 text-slate-900 dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">Confirm Card Match</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Match probability is below 80%</p>
                </div>
              </div>
              <button
                onClick={() => setPendingLowConfidenceCard(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Match Comparison & Confidence Details */}
            <div className="mt-4 flex gap-4 items-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <img
                src={pendingLowConfidenceCard.card.images?.small || pendingLowConfidenceCard.card.images?.large}
                alt={pendingLowConfidenceCard.card.name}
                className="w-16 h-22 object-cover rounded-lg shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {Math.round(pendingLowConfidenceCard.confidence * 100)}% Match
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    #{pendingLowConfidenceCard.card.number}
                  </span>
                </div>
                <h4 className="text-sm font-black truncate">{pendingLowConfidenceCard.card.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {pendingLowConfidenceCard.card.set?.name || 'Pokemon TCG'} • {pendingLowConfidenceCard.variant}
                </p>
                <div className="mt-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Est. Raw: ${pendingLowConfidenceCard.livePricing?.rawPrice?.toFixed(2) || (pendingLowConfidenceCard.card.tcgplayer?.prices?.holofoil?.market || 15.0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Alternative Guesses if available */}
            {alternativeGuesses.length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  Did you mean one of these?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {alternativeGuesses.map((alt) => (
                    <button
                      key={alt}
                      onClick={() => {
                        setPendingLowConfidenceCard(null);
                        setShowCorrectionDialog(true);
                        handleCorrectionSearch(alt);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  const cardToSearch = pendingLowConfidenceCard.card.name;
                  setPendingLowConfidenceCard(null);
                  setShowCorrectionDialog(true);
                  handleCorrectionSearch(cardToSearch);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search Correct Card</span>
              </button>

              <button
                onClick={async () => {
                  const pending = pendingLowConfidenceCard;
                  setPendingLowConfidenceCard(null);
                  await setupIdentifiedCard(pending.card, pending.variant, pending.confidence);
                  if (isMultiScan) {
                    addCardToScanTray(pending.card, pending.variant, pending.livePricing);
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 text-xs font-black hover:brightness-105 transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Digitize</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
