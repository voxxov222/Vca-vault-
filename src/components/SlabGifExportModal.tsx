import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Download,
  Copy,
  Check,
  X,
  Share2,
  Sparkles,
  RotateCw,
  Sliders,
  Play,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers,
  Maximize2,
} from 'lucide-react';
import * as THREE from 'three';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { CardItem, SlabConfig } from '../types/pokemon.ts';
import { resolveConditionTier } from './SlabGradeBadge.tsx';

export type AnimationType = 'spin360' | 'shimmer' | 'flip';
export type QualityPreset = 'balanced' | 'ultra' | 'compact';
export type ResolutionOption = 'vertical' | 'hd' | 'square';

interface SlabGifExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardItem;
  config: SlabConfig;
  sceneRef: React.RefObject<THREE.Scene | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  slabGroupRef: React.RefObject<THREE.Group | null>;
  holoUniformsRef: React.RefObject<{
    uTime: { value: number };
    uIntensity: { value: number };
    uCameraPos: { value: THREE.Vector3 };
    uPointer: { value: THREE.Vector2 };
    uCardRotation: { value: THREE.Vector3 };
    uCardTexture: { value: THREE.Texture | null };
    uHasTexture: { value: number };
    uPattern: { value: number };
  } | null>;
}

export const SlabGifExportModal: React.FC<SlabGifExportModalProps> = ({
  isOpen,
  onClose,
  card,
  config,
  sceneRef,
  cameraRef,
  rendererRef,
  slabGroupRef,
  holoUniformsRef,
}) => {
  // Settings state
  const [animationType, setAnimationType] = useState<AnimationType>('spin360');
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('balanced');
  const [resolution, setResolution] = useState<ResolutionOption>('vertical');
  const [includeWatermark, setIncludeWatermark] = useState(true);

  // Generation state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifFileSize, setGifFileSize] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cancelRequestedRef = useRef(false);

  // Clean up object URL when closing or re-exporting
  useEffect(() => {
    return () => {
      if (gifUrl) {
        URL.revokeObjectURL(gifUrl);
      }
    };
  }, [gifUrl]);

  if (!isOpen) return null;

  // Preset Configurations
  const getPresetConfig = () => {
    let frameCount = 30;
    let fps = 15;

    if (qualityPreset === 'ultra') {
      frameCount = 42;
      fps = 20;
    } else if (qualityPreset === 'compact') {
      frameCount = 20;
      fps = 12;
    }

    let width = 360;
    let height = 480;

    if (resolution === 'hd') {
      width = 480;
      height = 640;
    } else if (resolution === 'square') {
      width = 400;
      height = 400;
    }

    return { frameCount, fps, width, height };
  };

  const handleStartExport = async () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const slabGroup = slabGroupRef.current;
    const holoUniforms = holoUniformsRef.current;

    if (!scene || !camera || !renderer || !slabGroup) {
      setErrorMessage('3D viewer elements are not ready. Please try again in a moment.');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setStatusText('Preparing 3D camera & viewport...');
    setErrorMessage(null);
    cancelRequestedRef.current = false;

    // Free previous GIF URL
    if (gifUrl) {
      URL.revokeObjectURL(gifUrl);
      setGifUrl(null);
      setGifBlob(null);
    }

    const { frameCount, fps, width, height } = getPresetConfig();
    const frameDelayMs = Math.round(1000 / fps);

    // Save previous state to restore seamlessly after export
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);
    const originalAspect = camera.aspect;
    const originalCamPos = camera.position.clone();
    const originalCamRot = camera.rotation.clone();
    const originalSlabRot = slabGroup.rotation.clone();
    const originalSlabPos = slabGroup.position.clone();

    // Create offscreen 2D canvas for compositing watermarks & frame extraction
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d', { willReadFrequently: true });

    if (!exportCtx) {
      setErrorMessage('Failed to create 2D canvas context.');
      setIsExporting(false);
      return;
    }

    try {
      // 1. Setup 3D camera framing for ideal slab presentation
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Position camera so slab fills ~80% of view with elegant breathing room
      const cameraZ = resolution === 'square' ? 8.2 : 7.6;
      camera.position.set(0, 0, cameraZ);
      camera.lookAt(0, 0, 0);

      // Reset slab position (disable floating bob during recording for perfect loop)
      slabGroup.position.set(0, 0, 0);

      // Initialize GIF encoder
      const gif = GIFEncoder();

      // 2. Render each frame
      for (let i = 0; i < frameCount; i++) {
        if (cancelRequestedRef.current) {
          throw new Error('Export cancelled by user.');
        }

        const t = i / frameCount; // 0 to 1
        const progressPercent = Math.round((i / frameCount) * 85);
        setProgress(progressPercent);
        setStatusText(`Rendering 3D frame ${i + 1} of ${frameCount}...`);

        // Compute rotation angle based on chosen animation type
        if (animationType === 'spin360') {
          // Continuous 360° turntable spin
          const angle = t * Math.PI * 2;
          slabGroup.rotation.set(0, angle, 0);
        } else if (animationType === 'shimmer') {
          // Subtle holographic tilt shimmer (±32° Y, ±12° X)
          const angleY = Math.sin(t * Math.PI * 2) * 0.55;
          const angleX = Math.cos(t * Math.PI * 2) * 0.18;
          slabGroup.rotation.set(angleX, angleY, 0);
        } else if (animationType === 'flip') {
          // Front-to-back 180° flip loop
          const angle = Math.sin(t * Math.PI) * Math.PI;
          slabGroup.rotation.set(0, angle, 0);
        }

        // Update holographic lighting reflection for current angle
        if (holoUniforms) {
          holoUniforms.uTime.value = t * 4.0;
          holoUniforms.uCardRotation.value.set(
            slabGroup.rotation.x,
            slabGroup.rotation.y,
            slabGroup.rotation.z
          );
          // Realistic light ray sweep following the card's tilt
          holoUniforms.uPointer.value.set(
            Math.sin(slabGroup.rotation.y) * 0.75,
            Math.cos(slabGroup.rotation.x) * 0.4
          );
        }

        // Render WebGL frame
        renderer.render(scene, camera);

        // Composite onto 2D canvas
        exportCtx.clearRect(0, 0, width, height);
        exportCtx.drawImage(renderer.domElement, 0, 0, width, height);

        // Draw Certification Watermark if enabled
        if (includeWatermark) {
          drawWatermark(exportCtx, width, height, card, config);
        }

        // Extract pixel data for GIF quantization
        const imageData = exportCtx.getImageData(0, 0, width, height);

        // Quantize colors to 256-color palette (fast rgb565 format)
        const palette = quantize(imageData.data, 256, { format: 'rgb565' });
        const index = applyPalette(imageData.data, palette, 'rgb565');

        // Write frame into GIF encoder
        gif.writeFrame(index, width, height, {
          palette,
          delay: frameDelayMs,
        });

        // Yield to browser UI thread so the progress bar updates smoothly
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      // 3. Finalize GIF
      setProgress(90);
      setStatusText('Encoding palette & compiling GIF file...');
      await new Promise((resolve) => setTimeout(resolve, 20));

      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([bytes], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);

      // Compute friendly file size string
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
      setGifFileSize(`${sizeMb} MB`);
      setGifBlob(blob);
      setGifUrl(url);

      setProgress(100);
      setStatusText('Done!');
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user.') {
        console.error('GIF export error:', err);
        setErrorMessage(err.message || 'An error occurred during GIF generation.');
      }
    } finally {
      // Always restore original renderer and camera setup
      renderer.setSize(originalSize.x, originalSize.y);
      camera.aspect = originalAspect;
      camera.updateProjectionMatrix();
      camera.position.copy(originalCamPos);
      camera.rotation.copy(originalCamRot);
      slabGroup.rotation.copy(originalSlabRot);
      slabGroup.position.copy(originalSlabPos);

      // Render one frame to restore the canvas view
      renderer.render(scene, camera);

      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!gifUrl) return;
    const sanitizedCardName = (card.name || 'Pokemon-Card')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const sanitizedSerial = (config.serialNumber || 'VCA-001').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `VCA_${sanitizedSerial}_${sanitizedCardName}_Slab.gif`;

    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyToClipboard = async () => {
    if (!gifBlob) return;
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/gif': gifBlob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch (e) {
      console.warn('Clipboard write failed, downloading instead:', e);
      handleDownload();
    }
  };

  const handleShare = async () => {
    if (!gifBlob) return;
    const filename = `VCA-${config.serialNumber}-${card.name}.gif`;
    const file = new File([gifBlob], filename, { type: 'image/gif' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `${card.name} - VCA Graded Slab`,
          text: `Check out my 3D VCA Graded Slab for ${card.name} (${config.condition || config.grade})!`,
          files: [file],
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow Accent Header */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-90" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase text-white flex items-center gap-2">
                Export 3D Slab as GIF
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  ANIMATED
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate an animated 3D turntable GIF ready for Discord, Twitter, or Vault sharing.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isExporting) {
                cancelRequestedRef.current = true;
              }
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="py-4 overflow-y-auto space-y-5 flex-1 pr-1">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* If GIF is ready, show preview player */}
          {gifUrl && !isExporting ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/40 flex items-center justify-center p-3 group">
                <img
                  src={gifUrl}
                  alt={`${card.name} 3D Slab GIF`}
                  className="max-h-72 object-contain rounded-xl shadow-2xl transition-transform"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                  <Maximize2 className="w-3 h-3 text-cyan-400" />
                  <span>{gifFileSize}</span>
                </div>
              </div>

              {/* Action Buttons for Finished GIF */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-cyan-500/25 cursor-pointer font-mono"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-mono"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                {typeof navigator !== 'undefined' && 'canShare' in navigator && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-mono"
                  >
                    <Share2 className="w-4 h-4 text-purple-400" />
                    <span>Share</span>
                  </button>
                )}
              </div>

              {/* Re-export / Tweak settings button */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Want different camera motion or resolution?</span>
                <button
                  type="button"
                  onClick={() => setGifUrl(null)}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Adjust Settings</span>
                </button>
              </div>
            </div>
          ) : isExporting ? (
            /* Progress Bar View during recording */
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin flex items-center justify-center">
                  <Film className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-sm text-white">
                  {progress}%
                </div>
              </div>

              <div className="space-y-1 w-full max-w-sm">
                <div className="text-sm font-bold text-white tracking-wide">{statusText}</div>
                <p className="text-xs text-slate-400 font-mono">
                  Capturing 3D holographic frames and quantizing colors...
                </p>
              </div>

              {/* Progress track */}
              <div className="w-full max-w-sm bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  cancelRequestedRef.current = true;
                }}
                className="mt-2 text-xs text-slate-400 hover:text-rose-400 underline transition-colors cursor-pointer"
              >
                Cancel Export
              </button>
            </div>
          ) : (
            /* Configuration Settings Form */
            <div className="space-y-4">
              {/* 1. Animation Motion Style */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  Motion & Animation Preset
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'spin360',
                      title: '360° Turntable',
                      desc: 'Full loop showing front, crystal rails & back cert',
                      icon: Play,
                    },
                    {
                      id: 'shimmer',
                      title: 'Holo Shimmer',
                      desc: 'Tilt wave showing dynamic prism foil & light rays',
                      icon: Sparkles,
                    },
                    {
                      id: 'flip',
                      title: '180° Flip Loop',
                      desc: 'Smooth back-and-forth front/back presentation',
                      icon: Layers,
                    },
                  ].map((item) => {
                    const isSelected = animationType === item.id;
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAnimationType(item.id as AnimationType)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/80 text-white ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <IconComponent
                            className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}
                          />
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <div className="font-bold text-xs text-white">{item.title}</div>
                        <div className="text-[10px] text-slate-400 mt-1 leading-tight">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quality & Framerate */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Framerate & Smoothness
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'balanced',
                      title: 'Balanced',
                      badge: '30 frames • 15 fps',
                      sub: '~1.5 MB (Recommended)',
                    },
                    {
                      id: 'ultra',
                      title: 'Ultra Smooth',
                      badge: '42 frames • 20 fps',
                      sub: '~2.8 MB (Silky)',
                    },
                    {
                      id: 'compact',
                      title: 'Compact',
                      badge: '20 frames • 12 fps',
                      sub: '~700 KB (Fast)',
                    },
                  ].map((q) => {
                    const isSelected = qualityPreset === q.id;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setQualityPreset(q.id as QualityPreset)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/80 text-white ring-1 ring-cyan-400/40'
                            : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span>{q.title}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                        </div>
                        <div className="text-[10.5px] font-mono text-cyan-300 font-bold mt-0.5">
                          {q.badge}
                        </div>
                        <div className="text-[9.5px] text-slate-400">{q.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Resolution & Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Resolution & Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'vertical',
                      title: 'Standard (3:4)',
                      dim: '360 × 480',
                      desc: 'Ideal for phone & mobile cards',
                    },
                    {
                      id: 'hd',
                      title: 'High-Def HD',
                      dim: '480 × 640',
                      desc: 'Crisp text & holographic edges',
                    },
                    {
                      id: 'square',
                      title: 'Square (1:1)',
                      dim: '400 × 400',
                      desc: 'Perfect for avatars & social feeds',
                    },
                  ].map((r) => {
                    const isSelected = resolution === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setResolution(r.id as ResolutionOption)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/80 text-white ring-1 ring-cyan-400/40'
                            : 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs text-white flex items-center justify-between">
                          <span>{r.title}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                        </div>
                        <div className="text-[11px] font-mono text-cyan-300 font-bold mt-0.5">{r.dim}</div>
                        <div className="text-[9.5px] text-slate-400">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Certification Watermark Toggle */}
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">VCA Certification Watermark</div>
                    <div className="text-[10px] text-slate-400">
                      Stamp grade, serial number & VCA authentication seal onto the GIF.
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500" />
                </label>
              </div>

              {/* Start Export Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartExport}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:via-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-cyan-500/25 active:scale-98 cursor-pointer font-mono"
                >
                  <Film className="w-5 h-5" />
                  <span>Generate Animated GIF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to draw clean, official VCA certification badge at the bottom of the GIF frame
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  card: CardItem,
  config: SlabConfig
) {
  const tier = resolveConditionTier(config.condition, config.grade, config.subGrade);
  const pillHeight = Math.max(24, Math.round(height * 0.055));
  const pillY = height - pillHeight - 10;

  ctx.save();

  // Glassmorphic background pill
  const marginX = 14;
  const pillWidth = width - marginX * 2;
  const radius = pillHeight / 2;

  ctx.beginPath();
  ctx.roundRect(marginX, pillY, pillWidth, pillHeight, radius);
  ctx.fillStyle = 'rgba(3, 6, 17, 0.78)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.stroke();

  // Text inside pill
  const fontSize = Math.max(9, Math.round(pillHeight * 0.42));
  ctx.font = `900 ${fontSize}px monospace`;
  ctx.fillStyle = '#00f2fe';
  ctx.textBaseline = 'middle';

  // Left side: Authority + Grade
  const leftText = `VCA ${tier.name.toUpperCase()}`;
  ctx.fillText(leftText, marginX + 12, pillY + pillHeight / 2);

  // Right side: Serial Number
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'right';
  ctx.fillText(config.serialNumber, width - marginX - 12, pillY + pillHeight / 2);

  ctx.restore();
}
