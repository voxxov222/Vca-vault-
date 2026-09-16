import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  X,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowLeftRight,
  Sliders,
  Play,
  Pause,
  Save,
  Check,
  QrCode,
  Layers,
  Palette,
  Award,
  Hash,
  AlertCircle,
  Type,
  RefreshCw,
  Eye,
  Crown,
} from 'lucide-react';
import { CardItem, SlabConfig, SlabType, LabelColor } from '../types/pokemon.ts';
import { useVault, generateNextVcaSerial, getDefaultSlabConfig } from '../firebase/VaultContext.tsx';
import { renderVcaFrontLabel, renderVcaBackLabel, LABEL_THEMES } from '../utils/vcaLabelGenerator.ts';
import { NfcAuthModal } from './NfcAuthModal.tsx';

export interface SlabColorOption {
  id: SlabType;
  name: string;
  badge: string;
  desc: string;
  gradient: string;
  borderColor: string;
  acrylicHex: number;
  roughness: number;
  metalness: number;
  transmission: number;
  opacity: number;
  rimHex: number;
  textColor: string;
  emoji: string;
}

export const SLAB_COLORS: SlabColorOption[] = [
  {
    id: 'gold_ingot',
    name: 'Championship Gold',
    badge: '24K Gilded',
    desc: 'Liquid gold-tinted acrylic with metallic luster & 24K gold rim',
    gradient: 'from-amber-400 via-yellow-300 to-amber-600',
    borderColor: 'border-amber-400',
    acrylicHex: 0xfef08a,
    roughness: 0.08,
    metalness: 0.55,
    transmission: 0.74,
    opacity: 0.95,
    rimHex: 0xf59e0b,
    textColor: 'text-amber-400',
    emoji: '👑',
  },
  {
    id: 'silver_platinum',
    name: 'Sterling Silver',
    badge: 'Mirror Chrome',
    desc: 'Polished silver-platinum reflective case with diamond cut bevels',
    gradient: 'from-slate-200 via-gray-300 to-slate-400',
    borderColor: 'border-slate-300',
    acrylicHex: 0xf1f5f9,
    roughness: 0.05,
    metalness: 0.72,
    transmission: 0.80,
    opacity: 0.94,
    rimHex: 0xcbd5e1,
    textColor: 'text-slate-200',
    emoji: '⚪',
  },
  {
    id: 'obsidian_black',
    name: 'Obsidian Black',
    badge: 'Cyber Stealth',
    desc: 'Deep smoked obsidian case with cybernetic neon edge glow',
    gradient: 'from-slate-900 via-zinc-900 to-black',
    borderColor: 'border-slate-700',
    acrylicHex: 0x090d16,
    roughness: 0.10,
    metalness: 0.35,
    transmission: 0.55,
    opacity: 0.96,
    rimHex: 0x38bdf8,
    textColor: 'text-cyan-400',
    emoji: '🖤',
  },
  {
    id: 'crystal_clear',
    name: 'Crystal Clear',
    badge: 'Diamond Optical',
    desc: 'Pure optical grade acrylic with zero color distortion',
    gradient: 'from-white/90 via-cyan-100/40 to-slate-200/50',
    borderColor: 'border-cyan-300/40',
    acrylicHex: 0xffffff,
    roughness: 0.04,
    metalness: 0.08,
    transmission: 0.92,
    opacity: 0.88,
    rimHex: 0x38bdf8,
    textColor: 'text-white',
    emoji: '🧊',
  },
  {
    id: 'ruby_crimson',
    name: 'Ruby Crimson',
    badge: 'Fire Edition',
    desc: 'Vibrant flame-tinted ruby acrylic channeling Charizard energy',
    gradient: 'from-rose-500 via-red-600 to-rose-900',
    borderColor: 'border-rose-500',
    acrylicHex: 0xffe4e6,
    roughness: 0.06,
    metalness: 0.30,
    transmission: 0.75,
    opacity: 0.93,
    rimHex: 0xef4444,
    textColor: 'text-rose-400',
    emoji: '🔥',
  },
  {
    id: 'emerald_jade',
    name: 'Emerald Jade',
    badge: 'Rayquaza Edition',
    desc: 'Lush dragon emerald crystal acrylic with radiant green edge',
    gradient: 'from-emerald-400 via-emerald-600 to-teal-900',
    borderColor: 'border-emerald-400',
    acrylicHex: 0xd1fae5,
    roughness: 0.06,
    metalness: 0.30,
    transmission: 0.75,
    opacity: 0.93,
    rimHex: 0x10b981,
    textColor: 'text-emerald-400',
    emoji: '🐉',
  },
  {
    id: 'cosmic_stellar',
    name: 'Cosmic Violet',
    badge: 'Ultra Space',
    desc: 'Nebula-infused astral violet acrylic with celestial shimmer',
    gradient: 'from-purple-400 via-violet-600 to-indigo-900',
    borderColor: 'border-violet-400',
    acrylicHex: 0xedd5fe,
    roughness: 0.06,
    metalness: 0.25,
    transmission: 0.82,
    opacity: 0.92,
    rimHex: 0xc084fc,
    textColor: 'text-purple-300',
    emoji: '🌌',
  },
  {
    id: 'frosted_ice',
    name: 'Frosted Ice',
    badge: 'Sub-Zero Matte',
    desc: 'Precision laser-frosted matte acrylic with diffused icy refraction',
    gradient: 'from-sky-100 via-cyan-200 to-blue-300',
    borderColor: 'border-sky-300',
    acrylicHex: 0xe0f2fe,
    roughness: 0.38,
    metalness: 0.05,
    transmission: 0.72,
    opacity: 0.92,
    rimHex: 0x38bdf8,
    textColor: 'text-sky-300',
    emoji: '❄️',
  },
];

export const HOLO_PATTERNS = [
  {
    id: 'cosmos',
    name: 'Cosmos Galaxy',
    badge: 'Vintage WotC / 151',
    emoji: '🌌',
    desc: 'Classic starburst glitter clusters with cosmic spectral swirls',
  },
  {
    id: 'prism',
    name: 'Prism Diagonal',
    badge: 'Secret Rare',
    emoji: '🌈',
    desc: 'Modern angled diffraction grating with sweeping rainbow beams',
  },
  {
    id: 'gold',
    name: 'VSTAR Gold',
    badge: 'Ultra Premium',
    emoji: '👑',
    desc: 'Liquid 24K gold metallic shimmer with radiant specular flares',
  },
  {
    id: 'cyber',
    name: 'Cyber Matrix',
    badge: 'Special Art Rare',
    emoji: '⚡',
    desc: 'Precision etched micro-grid holographic reflection texture',
  },
] as const;

interface ThreeSlabViewerProps {
  card: CardItem | null;
  onClose: () => void;
}

function playNfcChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext blocked or not supported
  }
}

export const ThreeSlabViewer: React.FC<ThreeSlabViewerProps> = ({ card, onClose }) => {
  const { cards, updateSlabConfig } = useVault();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Slab configuration state
  const [config, setConfig] = useState<SlabConfig>(() => {
    if (card?.slabConfig) {
      return { ...card.slabConfig };
    }
    const initialSerial = card?.certNumber || 'VCA-26-0101';
    return getDefaultSlabConfig(initialSerial);
  });

  // UI state
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(true);
  const [activeTab, setActiveTab] = useState<'colors' | 'label' | 'serial' | 'fx'>('colors');
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);

  // Three.js refs for live updating without tearing down the entire scene
  const controlsRef = useRef<OrbitControls | null>(null);
  const slabGroupRef = useRef<THREE.Group | null>(null);
  const frontLabelMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const backLabelMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const acrylicMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const rimMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const holoUniformsRef = useRef<{
    uTime: { value: number };
    uIntensity: { value: number };
    uCameraPos: { value: THREE.Vector3 };
    uPointer: { value: THREE.Vector2 };
    uCardRotation: { value: THREE.Vector3 };
    uCardTexture: { value: THREE.Texture | null };
    uHasTexture: { value: number };
    uPattern: { value: number };
  } | null>(null);

  // Synchronize config if card prop changes
  useEffect(() => {
    if (card?.slabConfig) {
      setConfig({ ...card.slabConfig });
    }
  }, [card]);

  // Main Three.js Scene Setup (Mounts once or when card identity changes)
  useEffect(() => {
    if (!card || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030611); // Deep Ultra Space void
    scene.fog = new THREE.FogExp2(0x030611, 0.028);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 13); // Start far away for fly-in

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.minPolarAngle = Math.PI * 0.12;
    controlsRef.current = controls;

    // 4b. Pointer tracking for movement-reactive holographic foil
    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetPointer.set(x, y);
    };

    const onPointerLeave = () => {
      targetPointer.set(0, 0);
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 8);
    scene.add(keyLight);

    const cyanFillLight = new THREE.DirectionalLight(0x00f2fe, 1.8);
    cyanFillLight.position.set(-6, -3, 6);
    scene.add(cyanFillLight);

    const magentaRimLight = new THREE.PointLight(0xa855f7, 2.8, 25);
    magentaRimLight.position.set(0, 5, -5);
    scene.add(magentaRimLight);

    // =========================================================================
    // 6. ANIMATED POKÉMON UNIVERSE BACKGROUND
    // =========================================================================

    // 6a. Starfield (1,200 multi-colored stars in Pokémon galaxy)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0x38bdf8), // sapphire
      new THREE.Color(0xfacc15), // electric gold
      new THREE.Color(0xc084fc), // psychic violet
      new THREE.Color(0xffffff), // starlight white
      new THREE.Color(0xf43f5e), // fire crimson
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 55;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 40;
      starPositions[i3 + 2] = (Math.random() - 0.5) * 50;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i3] = col.r;
      starColors[i3 + 1] = col.g;
      starColors[i3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6b. Drifting Cosmic Nebula Cloud
    const nebulaCount = 60;
    const nebulaGeo = new THREE.BufferGeometry();
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    for (let i = 0; i < nebulaCount * 3; i += 3) {
      nebulaPositions[i] = (Math.random() - 0.5) * 30;
      nebulaPositions[i + 1] = (Math.random() - 0.5) * 20;
      nebulaPositions[i + 2] = -6 + (Math.random() - 0.5) * 15;
    }
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    const nebulaMat = new THREE.PointsMaterial({
      color: 0x6366f1,
      size: 1.8,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const nebula = new THREE.Points(nebulaGeo, nebulaMat);
    scene.add(nebula);

    // 6c. Floating Pokémon Elemental Energy Orbs (Fire, Water, Electric, Grass, Psychic, Dark)
    const energyTypes = [
      { name: 'Fire', color: 0xef4444, radius: 5.2, speed: 0.4, yOffset: 1.2 },
      { name: 'Water', color: 0x0ea5e9, radius: 6.0, speed: -0.32, yOffset: -0.8 },
      { name: 'Electric', color: 0xeab308, radius: 4.8, speed: 0.52, yOffset: 2.1 },
      { name: 'Grass', color: 0x10b981, radius: 6.5, speed: -0.28, yOffset: 0.2 },
      { name: 'Psychic', color: 0xa855f7, radius: 5.6, speed: 0.36, yOffset: -1.8 },
      { name: 'Darkness', color: 0x6366f1, radius: 7.2, speed: -0.22, yOffset: 1.6 },
    ];

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    const orbMeshes = energyTypes.map((et) => {
      const orbSubGroup = new THREE.Group();

      // Glowing core sphere
      const sphereGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: et.color,
        emissive: et.color,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      });
      const core = new THREE.Mesh(sphereGeo, sphereMat);
      orbSubGroup.add(core);

      // Outer aura ring
      const ringGeo = new THREE.RingGeometry(0.24, 0.32, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: et.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      orbSubGroup.add(ring);

      // Light emitted from each energy orb
      const orbLight = new THREE.PointLight(et.color, 1.2, 7);
      orbSubGroup.add(orbLight);

      orbGroup.add(orbSubGroup);
      return { group: orbSubGroup, config: et, ring };
    });

    // 6d. Holographic Battle Stadium Dais / Hall of Fame Platform
    const stadiumGroup = new THREE.Group();
    stadiumGroup.position.y = -3.8;
    scene.add(stadiumGroup);

    // Outer Glowing Battle Ring
    const outerRingGeo = new THREE.RingGeometry(3.6, 3.85, 48);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = Math.PI * 0.5;
    stadiumGroup.add(outerRing);

    // Middle Concentric Ring
    const midRingGeo = new THREE.RingGeometry(2.4, 2.5, 48);
    const midRingMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const midRing = new THREE.Mesh(midRingGeo, midRingMat);
    midRing.rotation.x = Math.PI * 0.5;
    stadiumGroup.add(midRing);

    // Center Etched Pokéball Ring Platform
    const pokeRingGeo = new THREE.RingGeometry(1.2, 1.28, 36);
    const pokeRingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const pokeRing = new THREE.Mesh(pokeRingGeo, pokeRingMat);
    pokeRing.rotation.x = Math.PI * 0.5;
    stadiumGroup.add(pokeRing);

    // Holographic Pillar of Light beam
    const cylinderGeo = new THREE.CylinderGeometry(2.4, 3.6, 5.0, 32, 1, true);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(cylinderGeo, cylinderMat);
    beam.position.y = 2.5;
    stadiumGroup.add(beam);

    // =========================================================================
    // 7. BUILD 3D VCA SLAB
    // =========================================================================
    const slabGroup = new THREE.Group();
    slabGroupRef.current = slabGroup;
    scene.add(slabGroup);

    const slabWidth = 3.6;
    const slabHeight = 5.4;
    const slabDepth = 0.22;

    // 7a. Acrylic Slab Outer Case
    const initialSlabOpt = SLAB_COLORS.find((sc) => sc.id === config.slabType) || SLAB_COLORS[3];
    const acrylicGeo = new THREE.BoxGeometry(slabWidth, slabHeight, slabDepth);
    const acrylicMat = new THREE.MeshPhysicalMaterial({
      color: initialSlabOpt.acrylicHex,
      metalness: initialSlabOpt.metalness,
      roughness: initialSlabOpt.roughness,
      transmission: initialSlabOpt.transmission,
      thickness: 0.6,
      ior: 1.52,
      reflectivity: 0.9,
      transparent: true,
      opacity: initialSlabOpt.opacity,
    });
    acrylicMatRef.current = acrylicMat;
    const acrylicMesh = new THREE.Mesh(acrylicGeo, acrylicMat);
    slabGroup.add(acrylicMesh);

    // 7b. Acrylic Rim Bevel Wireframe
    const rimGeo = new THREE.BoxGeometry(slabWidth + 0.04, slabHeight + 0.04, slabDepth * 0.92);
    const rimMat = new THREE.MeshBasicMaterial({
      color: initialSlabOpt.rimHex,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    rimMatRef.current = rimMat;
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    slabGroup.add(rimMesh);

    // 7c. Front Label Plane
    const labelGeo = new THREE.PlaneGeometry(slabWidth * 0.92, 1.12);
    const frontLabelMat = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.FrontSide,
    });
    frontLabelMatRef.current = frontLabelMat;
    const frontLabelMesh = new THREE.Mesh(labelGeo, frontLabelMat);
    frontLabelMesh.position.set(0, slabHeight * 0.5 - 0.76, 0.015);
    slabGroup.add(frontLabelMesh);

    // 7d. Back Label Plane (Security Registry & Subgrades)
    const backLabelMat = new THREE.MeshBasicMaterial({
      transparent: true,
      side: THREE.BackSide,
    });
    backLabelMatRef.current = backLabelMat;
    const backLabelMesh = new THREE.Mesh(labelGeo, backLabelMat);
    backLabelMesh.position.set(0, slabHeight * 0.5 - 0.76, -0.015);
    slabGroup.add(backLabelMesh);

    // Load initial label canvases
    renderVcaFrontLabel(card, config).then((canvas) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      frontLabelMat.map = tex;
      frontLabelMat.needsUpdate = true;
    });

    renderVcaBackLabel(card, config).then((canvas) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      backLabelMat.map = tex;
      backLabelMat.needsUpdate = true;
    });

    // 7e. Pokémon Card Artwork Plane (Front)
    const cardWidth = slabWidth * 0.85;
    const cardHeight = slabHeight * 0.68;
    const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);

    const textureLoader = new THREE.TextureLoader();
    const cardImgUrl = card.imageUrlHiRes || card.imageUrl;

    textureLoader.load(
      cardImgUrl,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        const cardFrontMat = new THREE.MeshStandardMaterial({
          map: loadedTexture,
          roughness: 0.22,
          metalness: 0.12,
          side: THREE.FrontSide,
        });
        const cardFrontMesh = new THREE.Mesh(cardGeo, cardFrontMat);
        cardFrontMesh.position.set(0, -0.65, 0.02);
        slabGroup.add(cardFrontMesh);

        // Bind loaded card texture into holographic foil shader
        if (holoUniformsRef.current) {
          holoUniformsRef.current.uCardTexture.value = loadedTexture;
          holoUniformsRef.current.uHasTexture.value = 1.0;
        }
      },
      undefined,
      (err) => console.warn('Could not load card texture:', err)
    );

    // Card Back Plane (Standard Pokémon Blue Card Back)
    const cardBackMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.35,
      metalness: 0.08,
      side: THREE.BackSide,
    });
    const cardBackMesh = new THREE.Mesh(cardGeo, cardBackMat);
    cardBackMesh.position.set(0, -0.65, -0.02);
    slabGroup.add(cardBackMesh);

    // 7f. Shimmering Iridescent Holographic Foil Shader (Movement & Angular Dispersion Reactive)
    const patternMap: Record<string, number> = {
      cosmos: 0,
      prism: 1,
      gold: 2,
      cyber: 3,
    };

    const holoUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: config.holoIntensity },
      uCameraPos: { value: camera.position.clone() },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uCardRotation: { value: new THREE.Vector3(0, 0, 0) },
      uCardTexture: { value: null as THREE.Texture | null },
      uHasTexture: { value: 0.0 },
      uPattern: { value: patternMap[config.holoPattern || 'cosmos'] ?? 0 },
    };
    holoUniformsRef.current = holoUniforms;

    const holoVertShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;
      varying vec3 vLightDir;

      uniform vec3 uCameraPos;
      uniform vec2 uPointer;

      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPosition.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(uCameraPos - vWorldPos);

        // Virtual incident light reacting to pointer movement
        vec3 lightSource = vec3(uPointer.x * 6.0, uPointer.y * 6.0 + 1.2, 7.5);
        vLightDir = normalize(lightSource - vWorldPos);

        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const holoFragShader = `
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uCameraPos;
      uniform vec2 uPointer;
      uniform vec3 uCardRotation;
      uniform sampler2D uCardTexture;
      uniform float uHasTexture;
      uniform int uPattern;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec3 vViewDir;
      varying vec3 vLightDir;

      vec3 spectralRainbow(float t) {
        vec3 c = vec3(
          sin(t * 6.2831853) * 0.5 + 0.5,
          sin(t * 6.2831853 + 2.0943951) * 0.5 + 0.5,
          sin(t * 6.2831853 + 4.1887902) * 0.5 + 0.5
        );
        return pow(c, vec3(1.35)) * 1.3;
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(234.34, 435.345));
        p += dot(p, p + 34.23);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float starGlint(vec2 p, float size) {
        p = abs(p);
        float flare = max(0.0, 1.0 - (p.x * 24.0 + p.y * 3.5)) + max(0.0, 1.0 - (p.y * 24.0 + p.x * 3.5));
        float center = clamp(1.0 - length(p) * 18.0, 0.0, 1.0);
        return pow(flare + center, 2.5) * size;
      }

      void main() {
        if (vNormal.z < 0.0 && dot(vNormal, vViewDir) < -0.05) {
          discard;
        }

        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(vLightDir);
        vec3 H = normalize(L + V);

        float NdotV = clamp(dot(N, V), 0.001, 1.0);
        float NdotL = clamp(dot(N, L), 0.0, 1.0);
        float NdotH = clamp(dot(N, H), 0.0, 1.0);

        // Fresnel edge gleam
        float fresnel = pow(1.0 - NdotV, 2.5);

        // Specular reflections
        float specSharp = pow(NdotH, 64.0);
        float specBroad = pow(NdotH, 14.0);

        // Movement tilt offset reacting to pointer position and 3D slab rotation
        vec2 tiltCoord = vUv - 0.5;
        float tilt = tiltCoord.x * (uPointer.x * 3.4 + uCardRotation.y * 2.8) +
                     tiltCoord.y * (uPointer.y * 3.4 - uCardRotation.x * 2.8);

        // Diffraction Grating phase: angular reflection shifted by tilt, UV position, and camera viewing angle
        float angle = atan(V.y + uPointer.y * 0.5, V.x + uPointer.x * 0.5);
        float dispPhase = angle * 1.8 + tilt * 4.6 + (vUv.x * 2.4 + vUv.y * 1.9) + uTime * 0.12;

        // Primary iridescent rainbow wave
        vec3 rainbow = spectralRainbow(dispPhase);

        float sparkle = 0.0;
        vec3 patternColor = vec3(0.0);

        if (uPattern == 0) {
          // PATTERN 0: COSMOS GALAXY (Classic Pokemon Holo Stars & Clusters)
          vec2 gridUv = vUv * 36.0;
          vec2 cellId = floor(gridUv);
          vec2 cellUv = fract(gridUv) - 0.5;
          float cellRand = hash21(cellId);

          float starPhase = sin(dispPhase * 5.0 + cellRand * 25.0 + uTime * 2.2);
          if (cellRand > 0.45 && starPhase > 0.6) {
            float star = starGlint(cellUv, cellRand);
            sparkle += star * pow(starPhase, 3.0) * 1.8;
          }

          float neb = noise(vUv * 8.0 + vec2(uTime * 0.15, -uTime * 0.1) + uPointer * 0.5);
          patternColor = rainbow * (0.55 + neb * 0.45);

        } else if (uPattern == 1) {
          // PATTERN 1: PRISM DIAGONAL (Modern Secret Rare Diagonal Beams)
          float diag = (vUv.x * 1.8 - vUv.y * 1.2) * 28.0 + dispPhase * 3.5;
          float prismBeams = sin(diag) * 0.5 + 0.5;
          prismBeams = pow(prismBeams, 4.0) * 1.4;

          float crossBeams = sin((vUv.x * 1.2 + vUv.y * 1.8) * 22.0 - dispPhase * 2.5) * 0.5 + 0.5;
          crossBeams = pow(crossBeams, 6.0) * 1.2;

          vec3 beamR = spectralRainbow(dispPhase + 0.08) * prismBeams;
          vec3 beamG = spectralRainbow(dispPhase) * (prismBeams + crossBeams * 0.5);
          vec3 beamB = spectralRainbow(dispPhase - 0.08) * prismBeams;
          patternColor = (beamR + beamG + beamB) * 0.45;
          sparkle = (prismBeams + crossBeams) * 0.6;

        } else if (uPattern == 2) {
          // PATTERN 2: VSTAR GILDED GOLD (Liquid 24K Gold Specular Shimmer)
          vec3 goldBase = vec3(1.0, 0.82, 0.28);
          vec3 amberHighlight = vec3(1.0, 0.95, 0.75);

          float goldSheen = pow(NdotH, 18.0) * 1.8;
          float goldRipples = sin(dispPhase * 4.0 + tilt * 6.0) * 0.3 + 0.7;

          vec2 dustUv = vUv * 65.0;
          float dust = hash21(floor(dustUv));
          float dustFlicker = sin(uTime * 5.0 + dust * 40.0 + tilt * 15.0);
          if (dust > 0.65 && dustFlicker > 0.5) {
            sparkle += pow(dustFlicker, 4.0) * 1.6;
          }

          patternColor = mix(goldBase, amberHighlight, goldSheen) * goldRipples + rainbow * 0.25;

        } else {
          // PATTERN 3: CYBER MATRIX (Full Art Etched Textured Grid)
          vec2 grid = fract(vUv * vec2(90.0, 130.0));
          float lines = step(0.88, grid.x) + step(0.88, grid.y);
          float gridShine = sin(dispPhase * 6.0 + (vUv.x + vUv.y) * 20.0) * 0.5 + 0.5;
          gridShine = pow(gridShine, 3.0) * 1.5;

          patternColor = rainbow * (0.4 + gridShine * lines * 0.9);
          sparkle = gridShine * lines * 0.8;
        }

        // Card texture luminance integration
        float lum = 0.6;
        if (uHasTexture > 0.5) {
          vec4 cardTex = texture2D(uCardTexture, vUv);
          lum = dot(cardTex.rgb, vec3(0.299, 0.587, 0.114));
          lum = smoothstep(0.08, 0.85, lum);
        }

        vec3 foilGlow = (patternColor + vec3(sparkle)) * uIntensity;
        vec3 specLight = vec3(1.0) * specSharp * 1.2 * uIntensity;

        vec3 finalColor = foilGlow * (0.35 + lum * 0.65) + specLight;
        float baseAlpha = (0.28 + fresnel * 0.45 + specBroad * 0.35 + sparkle * 0.4) * uIntensity;
        float alpha = clamp(baseAlpha * (0.4 + lum * 0.6), 0.0, 0.95);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    const holoMat = new THREE.ShaderMaterial({
      vertexShader: holoVertShader,
      fragmentShader: holoFragShader,
      uniforms: holoUniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const holoMesh = new THREE.Mesh(cardGeo, holoMat);
    holoMesh.position.set(0, -0.65, 0.028);
    slabGroup.add(holoMesh);

    // 7g. NFC Holographic Chip Tag (Bottom Right corner)
    const nfcCanvas = document.createElement('canvas');
    nfcCanvas.width = 256;
    nfcCanvas.height = 256;
    const nfcCtx = nfcCanvas.getContext('2d')!;
    nfcCtx.fillStyle = '#00000000';
    nfcCtx.fillRect(0, 0, 256, 256);

    // Outer cyber circle
    nfcCtx.strokeStyle = '#00f2fe';
    nfcCtx.lineWidth = 10;
    nfcCtx.beginPath();
    nfcCtx.arc(128, 128, 105, 0, Math.PI * 2);
    nfcCtx.stroke();

    // Concentric radio waves
    nfcCtx.beginPath();
    nfcCtx.arc(128, 128, 70, -Math.PI * 0.35, Math.PI * 0.35);
    nfcCtx.stroke();
    nfcCtx.beginPath();
    nfcCtx.arc(128, 128, 45, -Math.PI * 0.35, Math.PI * 0.35);
    nfcCtx.stroke();

    nfcCtx.fillStyle = '#00f2fe';
    nfcCtx.font = '900 36px monospace';
    nfcCtx.fillText('NFC', 95, 140);

    const nfcTexture = new THREE.CanvasTexture(nfcCanvas);
    const nfcGeo = new THREE.PlaneGeometry(0.55, 0.55);
    const nfcMat = new THREE.MeshBasicMaterial({
      map: nfcTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const nfcMesh = new THREE.Mesh(nfcGeo, nfcMat);
    nfcMesh.position.set(slabWidth * 0.34, -slabHeight * 0.5 + 0.46, 0.04);
    slabGroup.add(nfcMesh);

    // =========================================================================
    // 8. ANIMATION & RENDER LOOP
    // =========================================================================
    let animationFrameId: number;
    const targetCameraZ = 6.8;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera fly-in
      camera.position.z += (targetCameraZ - camera.position.z) * 0.05;

      // Smooth interpolation of pointer for fluid movement reaction
      pointer.lerp(targetPointer, 0.08);

      // Update holo shader with real-time movement parameters
      if (holoUniformsRef.current) {
        holoUniformsRef.current.uTime.value = elapsedTime;
        holoUniformsRef.current.uCameraPos.value.copy(camera.position);
        holoUniformsRef.current.uPointer.value.copy(pointer);
        if (slabGroup) {
          holoUniformsRef.current.uCardRotation.value.set(
            slabGroup.rotation.x,
            slabGroup.rotation.y,
            slabGroup.rotation.z
          );
        }
      }

      // Gentle levitation breathing animation on the slab
      if (slabGroup) {
        slabGroup.position.y = Math.sin(elapsedTime * 1.6) * 0.09;
      }

      // Auto-spin slab if enabled
      if (isAutoSpinning && slabGroup) {
        slabGroup.rotation.y += 0.012;
      }

      // Rotate Starfield slowly
      starField.rotation.y = elapsedTime * 0.015;
      starField.rotation.x = Math.sin(elapsedTime * 0.008) * 0.05;

      // Orbit Elemental Pokémon Energy Orbs
      orbMeshes.forEach(({ group, config: et, ring }) => {
        const angle = elapsedTime * et.speed;
        group.position.x = Math.cos(angle) * et.radius;
        group.position.z = Math.sin(angle) * et.radius;
        group.position.y = et.yOffset + Math.sin(elapsedTime * 1.5 + et.radius) * 0.35;
        ring.rotation.z = elapsedTime * 1.2;
        ring.lookAt(camera.position);
      });

      // Rotate Stadium Rings
      outerRing.rotation.z = -elapsedTime * 0.15;
      midRing.rotation.z = elapsedTime * 0.22;
      pokeRing.rotation.z = -elapsedTime * 0.35;

      // Pulse NFC badge
      const nfcPulse = 1.0 + Math.sin(elapsedTime * 4.5) * 0.08;
      nfcMesh.scale.set(nfcPulse, nfcPulse, 1);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [card]);

  // =========================================================================
  // LIVE RE-RENDER OF SLAB MATERIALS ON CONFIG CHANGES
  // =========================================================================
  useEffect(() => {
    if (!card) return;

    // 1. Update Front & Back Canvas Textures
    renderVcaFrontLabel(card, config).then((canvas) => {
      if (frontLabelMatRef.current) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        frontLabelMatRef.current.map = tex;
        frontLabelMatRef.current.needsUpdate = true;
      }
    });

    renderVcaBackLabel(card, config).then((canvas) => {
      if (backLabelMatRef.current) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        backLabelMatRef.current.map = tex;
        backLabelMatRef.current.needsUpdate = true;
      }
    });

    // 2. Update Acrylic Slab Materials based on SlabType
    if (acrylicMatRef.current && rimMatRef.current) {
      const slabOpt = SLAB_COLORS.find((sc) => sc.id === config.slabType) || SLAB_COLORS[3];
      acrylicMatRef.current.color.set(slabOpt.acrylicHex);
      acrylicMatRef.current.roughness = slabOpt.roughness;
      acrylicMatRef.current.metalness = slabOpt.metalness;
      acrylicMatRef.current.transmission = slabOpt.transmission;
      acrylicMatRef.current.opacity = slabOpt.opacity;

      const theme = LABEL_THEMES[config.labelColor] || LABEL_THEMES.cyber_cyan;
      rimMatRef.current.color.set(slabOpt.rimHex || theme.primary);
      acrylicMatRef.current.needsUpdate = true;
      rimMatRef.current.needsUpdate = true;
    }

    // 3. Update Holo Uniforms
    if (holoUniformsRef.current) {
      holoUniformsRef.current.uIntensity.value = config.holoIntensity;
      const patternMap: Record<string, number> = {
        cosmos: 0,
        prism: 1,
        gold: 2,
        cyber: 3,
      };
      holoUniformsRef.current.uPattern.value = patternMap[config.holoPattern || 'cosmos'] ?? 0;
    }
  }, [config, card]);

  // =========================================================================
  // INTERACTION HANDLERS
  // =========================================================================
  const handleFlip = () => {
    if (slabGroupRef.current) {
      const startRot = slabGroupRef.current.rotation.y;
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.08;
        if (slabGroupRef.current) {
          slabGroupRef.current.rotation.y = startRot + Math.PI * Math.min(progress, 1.0);
        }
        if (progress >= 1.0) {
          clearInterval(interval);
        }
      }, 16);
    }
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (slabGroupRef.current) {
      slabGroupRef.current.rotation.set(0, 0, 0);
    }
    setIsAutoSpinning(false);
  };

  const handleNfcTap = () => {
    playNfcChime();
    setShowNfcModal(true);
  };

  // Validate serial number: must start from VCA-26-0101 (VCA-26-0100 already in use!)
  const handleSerialChange = (val: string) => {
    const trimmed = val.toUpperCase().trim();
    const match = trimmed.match(/^VCA-26-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num <= 100) {
        setSerialError('VCA-26-0100 is already in use. Serials must start from VCA-26-0101!');
      } else {
        setSerialError(null);
      }
    } else {
      setSerialError('Format must be VCA-26-XXXX (e.g. VCA-26-0101)');
    }
    setConfig((prev) => ({ ...prev, serialNumber: trimmed }));
    setIsSaved(false);
  };

  const handleAssignNextSerial = () => {
    const next = generateNextVcaSerial(cards);
    setConfig((prev) => ({ ...prev, serialNumber: next }));
    setSerialError(null);
    setIsSaved(false);
  };

  const handleSaveToVault = async () => {
    if (!card || serialError) return;
    await updateSlabConfig(card.id, config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExit = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  if (!card) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: VCA Branding & Actions */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-sky-500/40 px-4 py-2 rounded-full pointer-events-auto shadow-xl shadow-sky-500/10">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-mono text-xs font-black tracking-wider">VCA 3D DIGITAL SLAB</span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-amber-400 font-mono text-xs font-bold">{config.serialNumber}</span>
          </div>
          <span className="text-slate-500 text-xs hidden sm:inline">•</span>
          <span className="text-white text-xs font-semibold hidden sm:inline truncate max-w-xs">{card.name}</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowCustomizer((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-md text-xs font-bold tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
              showCustomizer
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/30'
                : 'bg-slate-900/85 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">CONTROL PANEL</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 text-white font-mono hidden md:inline">
              {SLAB_COLORS.find((sc) => sc.id === config.slabType)?.emoji}{' '}
              {SLAB_COLORS.find((sc) => sc.id === config.slabType)?.name.split(' ')[0]}
            </span>
          </button>

          <button
            onClick={handleExit}
            className="bg-slate-800/85 hover:bg-red-500/90 text-white p-2.5 rounded-full border border-slate-700 hover:border-red-400 backdrop-blur-md transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            title="Exit 3D Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Customize Slab Drawer / Control Panel (Right Side) */}
      {showCustomizer && (
        <div className="absolute top-18 right-3 bottom-24 w-96 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl overflow-y-auto space-y-4 pointer-events-auto animate-in slide-in-from-right duration-200 z-40 text-slate-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                  <span>SLAB CONTROL PANEL</span>
                </h3>
                <p className="text-[10px] text-cyan-400 font-mono">Live 3D Customizer</p>
              </div>
            </div>
            <button
              onClick={() => setShowCustomizer(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Minimize Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shrink-0">
            {[
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'label', label: 'Label', icon: Type },
              { id: 'serial', label: 'Serial', icon: Hash },
              { id: 'fx', label: 'FX/Holo', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mb-0.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Container */}
          <div className="space-y-4 flex-1">
            {/* ============================================================= */}
            {/* TAB 1: SLAB COLORS & MATERIALS */}
            {/* ============================================================= */}
            {activeTab === 'colors' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                {/* Slab Acrylic Cases */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Slab Acrylic Color</span>
                    </label>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      {SLAB_COLORS.find((sc) => sc.id === config.slabType)?.badge || 'Custom'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {SLAB_COLORS.map((st) => {
                      const isSelected = config.slabType === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, slabType: st.id }));
                            setIsSaved(false);
                          }}
                          className={`p-2.5 rounded-2xl text-left transition-all border relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1.5">
                            <div
                              className={`w-6 h-6 rounded-lg bg-gradient-to-br ${st.gradient} border border-white/20 shadow-sm flex items-center justify-center text-xs shrink-0`}
                            >
                              <span>{st.emoji}</span>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {st.badge}
                            </span>
                          </div>
                          <div>
                            <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {st.name}
                            </div>
                            <div className="text-[9.5px] text-slate-400 line-clamp-1 mt-0.5">{st.desc}</div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Label Theme & Bezel Color */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Label Bezel Palette</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(LABEL_THEMES).map(([key, t]) => {
                      const isSelected = config.labelColor === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, labelColor: key as LabelColor }));
                            setIsSaved(false);
                          }}
                          className={`p-2 rounded-xl text-left border flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-500/15 text-white ring-1 ring-cyan-400'
                              : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                            style={{ backgroundColor: t.primary }}
                          />
                          <span className="text-[11px] font-semibold truncate">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: DYNAMIC LABEL TEXT */}
            {/* ============================================================= */}
            {activeTab === 'label' && (
              <div className="space-y-3.5 animate-in fade-in-50 duration-150">
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2.5 text-[11px] text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Edits render immediately onto the 3D holographic canvas!</span>
                </div>

                {/* 1. Grade Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-cyan-400" /> Grade Header
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">e.g. #10 GRADE</span>
                  </div>
                  <input
                    type="text"
                    value={config.grade}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, grade: e.target.value }));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                    placeholder="#10 GRADE"
                  />
                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {['#10 GRADE', 'PRISTINE 10', 'GEM MINT 10', '#9.5 MINT+', '#9 MINT', 'AUTHENTIC', '10 AUTO'].map(
                      (g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, grade: g }));
                            setIsSaved(false);
                          }}
                          className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono transition-all cursor-pointer ${
                            config.grade === g
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {g}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 2. Subgrade / Qualifier */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-cyan-400" /> Subgrade / Designation
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">e.g. GEM MINT</span>
                  </div>
                  <input
                    type="text"
                    value={config.subGrade}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, subGrade: e.target.value }));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    placeholder="GEM MINT"
                  />
                  {/* Quick Subgrade Presets */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {['GEM MINT', 'PRISTINE', 'PERFECT 10', '1ST EDITION', 'SHADOWLESS', 'AUTO 10'].map((sg) => (
                      <button
                        key={sg}
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, subGrade: sg }));
                          setIsSaved(false);
                        }}
                        className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono transition-all cursor-pointer ${
                          config.subGrade === sg
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Card Title Override */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-amber-400" /> Custom Card Title
                    </label>
                    {config.customCardTitle && config.customCardTitle !== card.name && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, customCardTitle: undefined }));
                          setIsSaved(false);
                        }}
                        className="text-[9.5px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer font-mono"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={config.customCardTitle !== undefined ? config.customCardTitle : card.name}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, customCardTitle: e.target.value }));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                    placeholder={card.name}
                  />
                </div>

                {/* 4. Details / Subtitle Line */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                      <Type className="w-3.5 h-3.5 text-slate-400" /> Details / Set Line
                    </label>
                    {config.customSubtitle && (
                      <button
                        type="button"
                        onClick={() => {
                          setConfig((prev) => ({ ...prev, customSubtitle: undefined }));
                          setIsSaved(false);
                        }}
                        className="text-[9.5px] text-slate-400 hover:underline flex items-center gap-0.5 cursor-pointer font-mono"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={
                      config.customSubtitle !== undefined
                        ? config.customSubtitle
                        : `#${card.number} • ${card.variant}`
                    }
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, customSubtitle: e.target.value }));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
                    placeholder={`#${card.number} • ${card.variant}`}
                  />
                </div>

                {/* 5. Authority Branding */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Authority Acronym
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Left Logo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={config.customAuthorityText || 'VCA'}
                      onChange={(e) => {
                        setConfig((prev) => ({ ...prev, customAuthorityText: e.target.value.toUpperCase() }));
                        setIsSaved(false);
                      }}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-cyan-300 text-center uppercase focus:outline-none focus:border-cyan-400"
                      placeholder="VCA"
                    />
                    <div className="flex flex-wrap gap-1">
                      {['VCA', 'PSA', 'BGS', 'CGC', 'VAULT'].map((auth) => (
                        <button
                          key={auth}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, customAuthorityText: auth }));
                            setIsSaved(false);
                          }}
                          className={`text-[9.5px] px-2 py-1 rounded-lg font-mono transition-all cursor-pointer ${
                            (config.customAuthorityText || 'VCA') === auth
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {auth}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. Backplate Subgrades */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <label className="font-mono text-slate-300 text-xs font-bold uppercase flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Backplate Subgrade Scores
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'centeringScore', label: 'Centering', val: config.centeringScore || '10.0' },
                      { key: 'cornersScore', label: 'Corners', val: config.cornersScore || '10.0' },
                      { key: 'edgesScore', label: 'Edges', val: config.edgesScore || '9.5' },
                      { key: 'surfaceScore', label: 'Surface', val: config.surfaceScore || '10.0' },
                    ].map((sg) => (
                      <div key={sg.key} className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase truncate block">
                          {sg.label}
                        </span>
                        <input
                          type="text"
                          maxLength={4}
                          value={sg.val}
                          onChange={(e) => {
                            setConfig((prev) => ({ ...prev, [sg.key]: e.target.value }));
                            setIsSaved(false);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: SERIAL & NFC */}
            {/* ============================================================= */}
            {activeTab === 'serial' && (
              <div className="space-y-3.5 animate-in fade-in-50 duration-150">
                {/* VCA Serial Number Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-cyan-400" /> VCA Serial (Starts ≥ 0101)
                    </label>
                    <button
                      onClick={handleAssignNextSerial}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold underline cursor-pointer"
                    >
                      Auto Next
                    </button>
                  </div>
                  <input
                    type="text"
                    value={config.serialNumber}
                    onChange={(e) => handleSerialChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                    placeholder="VCA-26-0101"
                  />
                  {serialError ? (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{serialError}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-mono">
                      Official register: VCA-26-0100 is reserved. Starts from 0101.
                    </p>
                  )}
                </div>

                {/* Toggles for QR Code and NFC */}
                <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                    <span className="font-mono text-slate-300 flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="font-bold">Scannable QR Code</div>
                        <div className="text-[10px] text-slate-500">Links to digital registry verification</div>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={config.qrEnabled}
                      onChange={(e) => {
                        setConfig((prev) => ({ ...prev, qrEnabled: e.target.checked }));
                        setIsSaved(false);
                      }}
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                    <span className="font-mono text-slate-300 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="font-bold">NFC Holographic Badge</div>
                        <div className="text-[10px] text-slate-500">Physical chip simulation on label</div>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={config.nfcEnabled}
                      onChange={(e) => {
                        setConfig((prev) => ({ ...prev, nfcEnabled: e.target.checked }));
                        setIsSaved(false);
                      }}
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </label>
                </div>

                {/* Tap to test NFC button */}
                <button
                  type="button"
                  onClick={handleNfcTap}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black tracking-wider uppercase border border-amber-400/50 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Test Tap NFC Chip (Audio & Cert)</span>
                </button>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: LIGHTING & FX */}
            {/* ============================================================= */}
            {activeTab === 'fx' && (
              <div className="space-y-3.5 animate-in fade-in-50 duration-150">
                {/* Movement Reaction Status Banner */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-cyan-950/60 border border-purple-500/40 text-[11px] text-purple-200">
                  <div className="flex items-center gap-1.5 font-bold font-mono text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>MOVEMENT-REACTIVE FOIL</span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                    Move your cursor or rotate the slab in 3D to tilt the incident light angle. The custom shader calculates angular rainbow diffraction, specular sheen, and sparkling micro-facets in real time.
                  </p>
                </div>

                {/* Holo Foil Pattern Selector */}
                <div className="space-y-2">
                  <label className="font-mono text-slate-300 text-xs font-bold uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Holo Foil Pattern
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {HOLO_PATTERNS.find((p) => p.id === (config.holoPattern || 'cosmos'))?.badge}
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {HOLO_PATTERNS.map((pat) => {
                      const isSelected = (config.holoPattern || 'cosmos') === pat.id;
                      return (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, holoPattern: pat.id }));
                            setIsSaved(false);
                          }}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-purple-950/60 border-purple-400 text-white shadow-md shadow-purple-500/20 ring-1 ring-purple-400/50'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{pat.emoji}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{pat.name}</div>
                            <div className="text-[9px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                              {pat.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Holo Foil Slider */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Foil Shimmer Intensity
                    </span>
                    <span className="font-mono font-bold text-purple-400">
                      {Math.round(config.holoIntensity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={config.holoIntensity}
                    onChange={(e) => {
                      setConfig((prev) => ({ ...prev, holoIntensity: parseFloat(e.target.value) }));
                      setIsSaved(false);
                    }}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, holoIntensity: 0.3 }));
                        setIsSaved(false);
                      }}
                      className="hover:text-purple-300 cursor-pointer"
                    >
                      Subtle (30%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, holoIntensity: 1.0 }));
                        setIsSaved(false);
                      }}
                      className="hover:text-purple-300 cursor-pointer font-bold text-purple-400"
                    >
                      Balanced (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, holoIntensity: 1.8 }));
                        setIsSaved(false);
                      }}
                      className="hover:text-purple-300 cursor-pointer"
                    >
                      Ultra Prismatic (180%)
                    </button>
                  </div>
                </div>

                {/* Quick 3D View Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setIsAutoSpinning((prev) => !prev)}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isAutoSpinning
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isAutoSpinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isAutoSpinning ? 'Pause Spin' : 'Auto 3D Spin'}</span>
                  </button>

                  <button
                    onClick={handleFlip}
                    className="p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Flip 180°</span>
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset Camera View</span>
                </button>
              </div>
            )}
          </div>

          {/* Sticky Save Footer */}
          <div className="pt-3 border-t border-slate-800 shrink-0">
            <button
              onClick={handleSaveToVault}
              disabled={!!serialError}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                serialError
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isSaved
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>SAVED TO VAULT!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>SAVE SLAB TO VAULT</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Controls Toolbar Overlay (Bottom) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-2xl px-3">
        {/* Quick Slab Color Swatches Bar */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 pointer-events-auto overflow-x-auto max-w-full">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
            Slab:
          </span>
          {SLAB_COLORS.map((st) => {
            const isSelected = config.slabType === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setConfig((prev) => ({ ...prev, slabType: st.id }));
                  setIsSaved(false);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 scale-105 font-black ring-1 ring-cyan-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
                }`}
                title={`${st.name} (${st.badge})`}
              >
                <span className="text-xs">{st.emoji}</span>
                <span className="text-[11px]">{st.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-2 rounded-2xl shadow-2xl flex items-center gap-2 pointer-events-auto w-full justify-around sm:w-auto">
          {/* Spin 360 Showcase Toggle */}
          <button
            onClick={() => setIsAutoSpinning((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
              isAutoSpinning
                ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isAutoSpinning ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400" />}
            <span>{isAutoSpinning ? 'Pause Spin' : '3D Spin'}</span>
          </button>

          {/* Flip Slab Front/Back */}
          <button
            onClick={handleFlip}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 text-xs font-medium border border-slate-700 hover:border-cyan-500/40 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
            <span>Flip 180°</span>
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Tap NFC to Authenticate */}
          <button
            onClick={handleNfcTap}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black tracking-wider uppercase border border-amber-400/50 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Cpu className="w-4 h-4" />
            <span>AUTHENTICATE NFC</span>
          </button>
        </div>

        {/* Live Card Valuation Banner */}
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-1.5 w-full flex items-center justify-between text-xs pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/40">
              {config.grade}
            </span>
            <span className="text-white font-bold text-sm font-mono">${card.psa10Price.toFixed(2)}</span>
            <span className="text-emerald-400 text-[11px] font-semibold">
              +{Math.round(((card.psa10Price - card.rawPrice) / card.rawPrice) * 100)}% vs Raw
            </span>
          </div>
          <div className="text-slate-400 flex items-center gap-1 font-mono">
            <span>Raw Market:</span>
            <span className="text-slate-200 font-semibold">${card.rawPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* NFC Cryptographic Authenticity Modal */}
      {showNfcModal && (
        <NfcAuthModal card={card} config={config} onClose={() => setShowNfcModal(false)} />
      )}
    </div>
  );
};
