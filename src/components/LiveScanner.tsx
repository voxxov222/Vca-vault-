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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useVault } from '../firebase/VaultContext.tsx';
import { CardVariant, CARD_VARIANTS, ScanTrayItem } from '../types/pokemon.ts';

interface LiveScannerProps {
  onScanSaved?: () => void;
}

export const LiveScanner: React.FC<LiveScannerProps> = ({ onScanSaved }) => {
  const { addBatchToVault } = useVault();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeSessionRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMultiScan, setIsMultiScan] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'JP'>('EN');
  const [isScanning, setIsScanning] = useState(false);

  // Recognition detection state
  const [detectedBox, setDetectedBox] = useState<{ ymin: number; xmin: number; ymax: number; xmax: number } | null>(null);
  const [currentResult, setCurrentResult] = useState<any | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>('Normal');
  const [floatingValue, setFloatingValue] = useState<number | null>(null);
  const [valuePopupPos, setValuePopupPos] = useState<{ top: string; left: string } | null>(null);

  // Scan Tray (batch of cards to save)
  const [scanTray, setScanTray] = useState<ScanTrayItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Start Camera
  const startCamera = async () => {
    const sessionId = ++activeSessionRef.current;
    setCameraError(null);

    // Stop any existing tracks before starting a new stream
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

      // If user switched or unmounted while waiting for userMedia
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
          // Play request interruptions (e.g. AbortError / new load request) are benign
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
      // If session is outdated or component unmounted, do not report error
      if (!isMountedRef.current || sessionId !== activeSessionRef.current) {
        return;
      }

      if (err?.name === 'AbortError' || err?.message?.includes('interrupted')) {
        return;
      }

      console.error('Camera access error:', err);
      setCameraActive(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in browser settings.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Camera is in use by another application or tab.');
      } else {
        setCameraError(err?.message || 'Could not access camera feed. Verify your device camera.');
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
    setDetectedBox(null);
  };

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [facingMode]);

  // Periodic capture & recognition trigger
  const captureAndRecognize = async () => {
    if (!videoRef.current || isScanning) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsScanning(true);

    try {
      // Capture frame to offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 800);
      canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      // Call server recognition endpoint with Gemini Vision
      const res = await fetch('/api/recognize-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, language }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cardDetected && data.matchedCard) {
          // Bounding box lock (normalized 0-1000)
          const bbox = data.boundingBox || { ymin: 150, xmin: 200, ymax: 850, xmax: 800 };
          setDetectedBox(bbox);

          // Position floating gold badge
          const topPercent = `${(bbox.ymin / 1000) * 100 + 4}%`;
          const leftPercent = `${((bbox.xmin + bbox.xmax) / 2000) * 100}%`;
          setValuePopupPos({ top: topPercent, left: leftPercent });

          const initialPrice = data.livePricing?.rawPrice || 12.50;
          setFloatingValue(initialPrice);
          setCurrentResult(data);

          const detectedVar = (data.variantGuess as CardVariant) || 'Normal';
          setSelectedVariant(detectedVar);

          // Add to Scan Tray automatically if in Multi-scan mode
          const trayItem: ScanTrayItem = {
            tempId: `tray_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            cardId: data.matchedCard.id,
            name: data.matchedCard.name,
            setName: data.matchedCard.set?.name || data.setName || 'Pokémon TCG',
            number: data.matchedCard.number || data.cardNumber || '001',
            rarity: data.matchedCard.rarity || 'Rare',
            imageUrl: data.matchedCard.images?.small || data.matchedCard.images?.large || '',
            imageUrlHiRes: data.matchedCard.images?.large || data.matchedCard.images?.small || '',
            language,
            variant: detectedVar,
            pricing: data.livePricing,
            scannedAt: new Date(),
          };

          // Check if already in tray to avoid duplicate instant scans
          setScanTray((prev) => {
            const exists = prev.some((p) => p.cardId === trayItem.cardId && p.variant === trayItem.variant);
            if (exists) return prev;
            return [trayItem, ...prev];
          });
        } else {
          setDetectedBox(null);
        }
      }
    } catch (err) {
      console.warn('Recognition frame cycle error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Re-calculate price when variant changes
  const handleVariantChange = async (newVariant: CardVariant) => {
    setSelectedVariant(newVariant);
    if (!currentResult?.matchedCard) return;

    try {
      const res = await fetch(
        `/api/cards/pricing?cardId=${currentResult.matchedCard.id}&variant=${encodeURIComponent(newVariant)}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.pricing) {
          setFloatingValue(json.pricing.rawPrice);
          // Update item in tray
          setScanTray((prev) =>
            prev.map((item, idx) =>
              idx === 0
                ? {
                    ...item,
                    variant: newVariant,
                    pricing: json.pricing,
                  }
                : item
            )
          );
        }
      }
    } catch (e) {
      console.error('Variant pricing update error:', e);
    }
  };

  // Test / Demo card scanner simulator if user doesn't have a physical card handy in front of camera
  const handleScanSampleCard = async (sampleName: string, sampleVariant: CardVariant = 'Holo') => {
    setIsScanning(true);
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(sampleName)}&language=${language}`);
      if (res.ok) {
        const json = await res.json();
        const card = json.data?.[0];
        if (card) {
          // Fetch pricing for this card
          const priceRes = await fetch(
            `/api/cards/pricing?cardId=${card.id}&variant=${encodeURIComponent(sampleVariant)}`
          );
          const priceJson = await priceRes.json();
          const pricing = priceJson.pricing || {
            rawPrice: 15.0,
            psa10Price: 65.0,
            psa9Price: 28.0,
            psa8Price: 19.0,
            psa10DeltaPercent: 333,
            recentComps: [],
          };

          setDetectedBox({ ymin: 160, xmin: 240, ymax: 840, xmax: 760 });
          setValuePopupPos({ top: '20%', left: '50%' });
          setFloatingValue(pricing.rawPrice);
          setSelectedVariant(sampleVariant);

          const trayItem: ScanTrayItem = {
            tempId: `tray_${Date.now()}`,
            cardId: card.id,
            name: card.name,
            setName: card.set?.name || 'Scarlet & Violet',
            number: card.number || '001',
            rarity: card.rarity || 'Rare Holo',
            imageUrl: card.images?.small || '',
            imageUrlHiRes: card.images?.large || card.images?.small || '',
            language,
            variant: sampleVariant,
            pricing,
            scannedAt: new Date(),
          };

          setScanTray((prev) => [trayItem, ...prev]);
        }
      }
    } catch (e) {
      console.error('Sample card scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Commit batch to Firestore
  const handleSaveToVault = async () => {
    if (scanTray.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await addBatchToVault(scanTray);
      setSaveSuccess(true);
      confetti({
        particleCount: 80,
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

  // Calculate Running Total Value in tray
  const trayTotalValue = scanTray.reduce((acc, item) => acc + (item.pricing?.rawPrice || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Camera Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                cameraActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                cameraActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
            {cameraActive ? 'GEMINI VISION RADAR' : 'STANDBY'}
          </span>
        </div>

        {/* Toggles: Multi-scan & Language */}
        <div className="flex items-center gap-2">
          {/* EN/JP Toggle */}
          <button
            onClick={() => setLanguage((l) => (l === 'EN' ? 'JP' : 'EN'))}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400 transition-all"
            title="Card Language Mode"
          >
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>{language}</span>
          </button>

          {/* Single vs Multiple scan toggle */}
          <button
            onClick={() => setIsMultiScan(!isMultiScan)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
              isMultiScan
                ? 'bg-sky-500 text-white border-sky-400 shadow-sm shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isMultiScan ? 'MULTI' : 'SINGLE'}</span>
          </button>

          {/* Flip camera front/back */}
          <button
            onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-sky-400"
            title="Switch Camera Lens"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport: Live Camera Feed + Optical Frame + Green Lock Box */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px]">
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Framing Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
          <div className="w-full max-w-xs aspect-[63/88] border-2 border-dashed border-white/40 rounded-2xl relative shadow-2xl">
            {/* Corner Reticles */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-white/75 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                FIT CARD IN FRAME
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Green Bounding Box that locks onto card */}
        {detectedBox && (
          <div
            className="absolute border-2 border-emerald-400 rounded-xl transition-all duration-200 pointer-events-none shadow-[0_0_20px_rgba(52,211,153,0.6)] animate-pulse"
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

        {/* Floating Gold Market Value Pop-up appears the instant card is recognized */}
        {floatingValue !== null && valuePopupPos && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-300 z-30"
            style={{ top: valuePopupPos.top, left: valuePopupPos.left }}
          >
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-extrabold text-sm sm:text-base px-3.5 py-1.5 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.8)] border border-white/60 flex items-center gap-1.5 animate-bounce">
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>${floatingValue.toFixed(2)}</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full font-mono">LIVE TCG</span>
            </div>
          </div>
        )}

        {/* Camera Permission Denied / Error Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <VideoOff className="w-12 h-12 text-amber-400 mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">Camera Feed Inactive</h3>
            <p className="text-slate-400 text-xs max-w-sm mb-4">{cameraError}</p>
            <div className="flex gap-2">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                Retry Camera
              </button>
            </div>
          </div>
        )}

        {/* Quick Trigger Button overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          {/* One-click Sample Cards for testing if no physical card handy */}
          <div className="pointer-events-auto flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <span className="text-[10px] font-bold text-amber-400 px-2">QUICK TEST:</span>
            <button
              onClick={() => handleScanSampleCard('Charizard Base Set', 'Holo')}
              className="text-[11px] font-medium text-white px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              Charizard
            </button>
            <button
              onClick={() => handleScanSampleCard('Pikachu Scarlet & Violet 151', 'Full Art')}
              className="text-[11px] font-medium text-white px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              Pikachu
            </button>
            <button
              onClick={() => handleScanSampleCard('Mewtwo VSTAR', 'Alt Art')}
              className="text-[11px] font-medium text-white px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              Mewtwo
            </button>
          </div>

          {/* Manual Scan Trigger button */}
          <button
            onClick={captureAndRecognize}
            disabled={isScanning}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-xl transition-all active:scale-95 ${
              isScanning
                ? 'bg-amber-400 text-slate-950 animate-pulse'
                : 'bg-gradient-to-r from-sky-400 to-blue-600 text-white hover:from-sky-300 hover:to-blue-500'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isScanning ? 'ANALYZING...' : 'SCAN FRAME'}</span>
          </button>
        </div>
      </div>

      {/* Variant Selector Dropdown after scan */}
      {currentResult && (
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border-y border-amber-500/20 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Card Variant:</span>
            <div className="relative">
              <select
                value={selectedVariant}
                onChange={(e) => handleVariantChange(e.target.value as CardVariant)}
                className="appearance-none bg-white dark:bg-slate-900 border border-amber-500/40 text-slate-800 dark:text-amber-200 text-xs font-bold py-1 pl-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {CARD_VARIANTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-amber-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Live Variant Price: </span>
            <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
              ${floatingValue?.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Scan Tray at Bottom: Thumbnails of everything scanned this session + Running TOTAL VALUE */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
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
          <div className="py-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Point your camera at a Pokémon card or click "Scan Frame" above.
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
            onClick={handleSaveToVault}
            disabled={isSaving}
            className={`w-full mt-2.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
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
    </div>
  );
};
