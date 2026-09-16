import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  Film,
  Compass,
  ChevronDown,
  FlaskConical,
  Trees,
  Flame,
} from 'lucide-react';
import { CardItem, SlabConfig, SlabType, LabelColor } from '../types/pokemon.ts';
import { useVault, generateNextVcaSerial, getDefaultSlabConfig } from '../firebase/VaultContext.tsx';
import { renderVcaFrontLabel, renderVcaBackLabel, LABEL_THEMES } from '../utils/vcaLabelGenerator.ts';
import { NfcAuthModal } from './NfcAuthModal.tsx';
import { SlabGifExportModal } from './SlabGifExportModal.tsx';
import {
  BackgroundEnvironment,
  EnvironmentOption,
  ENVIRONMENTS,
  buildStarlightEnvironment,
  buildLaboratoryEnvironment,
  buildForestEnvironment,
  buildVolcanicEnvironment,
  StarlightObjects,
  LaboratoryObjects,
  ForestObjects,
  VolcanicObjects,
} from './slabEnvironments.ts';
import {
  SlabGradeBadge,
  CONDITION_TIERS,
  ConditionTier,
  resolveConditionTier,
} from './SlabGradeBadge.tsx';

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
  const [showGifModal, setShowGifModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [serialError, setSerialError] = useState<string | null>(null);

  // 3D Background Environment State ('starlight', 'laboratory', 'forest', 'volcanic')
  const [environment, setEnvironment] = useState<BackgroundEnvironment>('starlight');
  const [isEnvDropdownOpen, setIsEnvDropdownOpen] = useState(false);
  const currentEnvOption = ENVIRONMENTS.find((e) => e.id === environment) || ENVIRONMENTS[0];

  // Three.js refs for live updating without tearing down the entire scene
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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

  // Environment objects reference for dynamic real-time swapping
  const envObjectsRef = useRef<{
    currentEnv: BackgroundEnvironment;
    ambientLight: THREE.AmbientLight | null;
    keyLight: THREE.DirectionalLight | null;
    fillLight: THREE.DirectionalLight | null;
    rimLight: THREE.PointLight | null;
    starlightGroup: THREE.Group | null;
    laboratoryGroup: THREE.Group | null;
    forestGroup: THREE.Group | null;
    volcanicGroup: THREE.Group | null;
    starlightObjects: StarlightObjects | null;
    laboratoryObjects: LaboratoryObjects | null;
    forestObjects: ForestObjects | null;
    volcanicObjects: VolcanicObjects | null;
  }>({
    currentEnv: 'starlight',
    ambientLight: null,
    keyLight: null,
    fillLight: null,
    rimLight: null,
    starlightGroup: null,
    laboratoryGroup: null,
    forestGroup: null,
    volcanicGroup: null,
    starlightObjects: null,
    laboratoryObjects: null,
    forestObjects: null,
    volcanicObjects: null,
  });

  // Apply environment changes dynamically to the active Three.js scene
  const applyEnvironment = useCallback((envId: BackgroundEnvironment) => {
    const envOpt = ENVIRONMENTS.find((e) => e.id === envId) || ENVIRONMENTS[0];
    const scene = sceneRef.current;
    const env = envObjectsRef.current;

    if (scene) {
      scene.background = new THREE.Color(envOpt.bgColor);
      if (scene.fog) {
        scene.fog.color.setHex(envOpt.fogColor);
        (scene.fog as THREE.FogExp2).density = envOpt.fogDensity;
      }
    }

    if (env.ambientLight) {
      env.ambientLight.color.setHex(envOpt.ambientColor);
      env.ambientLight.intensity = envOpt.ambientIntensity;
    }
    if (env.keyLight) {
      env.keyLight.color.setHex(envOpt.keyColor);
      env.keyLight.intensity = envOpt.keyIntensity;
    }
    if (env.fillLight) {
      env.fillLight.color.setHex(envOpt.fillColor);
      env.fillLight.intensity = envOpt.fillIntensity;
    }
    if (env.rimLight) {
      env.rimLight.color.setHex(envOpt.rimColor);
      env.rimLight.intensity = envOpt.rimIntensity;
    }

    if (env.starlightGroup) env.starlightGroup.visible = envId === 'starlight';
    if (env.laboratoryGroup) env.laboratoryGroup.visible = envId === 'laboratory';
    if (env.forestGroup) env.forestGroup.visible = envId === 'forest';
    if (env.volcanicGroup) env.volcanicGroup.visible = envId === 'volcanic';

    env.currentEnv = envId;
  }, []);

  // Update environment when state changes
  useEffect(() => {
    applyEnvironment(environment);
  }, [environment, applyEnvironment]);

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
    const initialEnv = ENVIRONMENTS.find((e) => e.id === environment) || ENVIRONMENTS[0];
    scene.background = new THREE.Color(initialEnv.bgColor);
    scene.fog = new THREE.FogExp2(initialEnv.fogColor, initialEnv.fogDensity);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 13); // Start far away for fly-in
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;
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

    // 5. Lighting (dynamically tinted per active environment)
    const ambientLight = new THREE.AmbientLight(initialEnv.ambientColor, initialEnv.ambientIntensity);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(initialEnv.keyColor, initialEnv.keyIntensity);
    keyLight.position.set(5, 8, 8);
    scene.add(keyLight);

    const cyanFillLight = new THREE.DirectionalLight(initialEnv.fillColor, initialEnv.fillIntensity);
    cyanFillLight.position.set(-6, -3, 6);
    scene.add(cyanFillLight);

    const magentaRimLight = new THREE.PointLight(initialEnv.rimColor, initialEnv.rimIntensity, 25);
    magentaRimLight.position.set(0, 5, -5);
    scene.add(magentaRimLight);

    // =========================================================================
    // 6. 3D BACKGROUND ENVIRONMENTS (Starlight, Laboratory, Forest, Volcanic)
    // =========================================================================
    const starlightObj = buildStarlightEnvironment();
    const labObj = buildLaboratoryEnvironment();
    const forestObj = buildForestEnvironment();
    const volcObj = buildVolcanicEnvironment();

    scene.add(starlightObj.group);
    scene.add(labObj.group);
    scene.add(forestObj.group);
    scene.add(volcObj.group);

    // Set initial visibility
    starlightObj.group.visible = environment === 'starlight';
    labObj.group.visible = environment === 'laboratory';
    forestObj.group.visible = environment === 'forest';
    volcObj.group.visible = environment === 'volcanic';

    // Store references for dynamic switching and per-frame animations
    envObjectsRef.current = {
      currentEnv: environment,
      ambientLight,
      keyLight,
      fillLight: cyanFillLight,
      rimLight: magentaRimLight,
      starlightGroup: starlightObj.group,
      laboratoryGroup: labObj.group,
      forestGroup: forestObj.group,
      volcanicGroup: volcObj.group,
      starlightObjects: starlightObj,
      laboratoryObjects: labObj,
      forestObjects: forestObj,
      volcanicObjects: volcObj,
    };

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

      // Update active environment animations
      const curEnv = envObjectsRef.current.currentEnv;
      if (curEnv === 'starlight' && envObjectsRef.current.starlightObjects) {
        const { starField, orbMeshes, stadiumRings } = envObjectsRef.current.starlightObjects;
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
        stadiumRings.outer.rotation.z = -elapsedTime * 0.15;
        stadiumRings.mid.rotation.z = elapsedTime * 0.22;
        stadiumRings.poke.rotation.z = -elapsedTime * 0.35;
      } else if (curEnv === 'laboratory' && envObjectsRef.current.laboratoryObjects) {
        const lab = envObjectsRef.current.laboratoryObjects;
        lab.hexRing.rotation.z = elapsedTime * 0.15;
        lab.outerTechRing.rotation.z = -elapsedTime * 0.2;
        lab.innerReticleRing.rotation.z = elapsedTime * 0.3;
        lab.containmentBeam.rotation.y = elapsedTime * 0.1;

        // Rise digital data matrix motes
        const pos = lab.matrixPositions;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] += 0.022;
          if (pos[i] > 3.8) {
            pos[i] = -3.8;
          }
        }
        lab.matrixPoints.geometry.attributes.position.needsUpdate = true;
      } else if (curEnv === 'forest' && envObjectsRef.current.forestObjects) {
        const forest = envObjectsRef.current.forestObjects;
        // Fireflies sinusoidal floating bob
        const pos = forest.fireflyPositions;
        const base = forest.fireflyBasePositions;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] = base[i] + Math.sin(elapsedTime * 1.2 + i) * 0.45;
          pos[i + 1] = base[i + 1] + Math.cos(elapsedTime * 0.9 + i * 1.3) * 0.35;
          pos[i + 2] = base[i + 2] + Math.sin(elapsedTime * 0.7 + i * 0.8) * 0.4;
        }
        forest.fireflyPoints.geometry.attributes.position.needsUpdate = true;

        // Rotate ancient rune rings slowly
        forest.runeRings.forEach((rr, idx) => {
          rr.rotation.z = (idx % 2 === 0 ? 1 : -1) * elapsedTime * 0.08;
        });

        // Wisps floating organically
        forest.wisps.forEach((wisp, idx) => {
          const angle = elapsedTime * 0.35 * (idx % 2 === 0 ? 1 : -1) + idx * 2.0;
          wisp.position.x = Math.cos(angle) * (3.2 + idx * 0.6);
          wisp.position.z = Math.sin(angle) * (3.2 + idx * 0.6);
          wisp.position.y = -0.5 + Math.sin(elapsedTime * 1.5 + idx) * 0.6;
        });
      } else if (curEnv === 'volcanic' && envObjectsRef.current.volcanicObjects) {
        const volc = envObjectsRef.current.volcanicObjects;
        const pos = volc.emberPositions;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i + 1] += 0.025;
          pos[i] += Math.sin(elapsedTime * 2.0 + i) * 0.005;
          if (pos[i + 1] > 4.5) {
            pos[i + 1] = -3.8;
          }
        }
        volc.emberPoints.geometry.attributes.position.needsUpdate = true;
        volc.magmaRings.forEach((mr, idx) => {
          mr.rotation.z = (idx % 2 === 0 ? 1 : -1) * elapsedTime * 0.12;
        });
      }

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
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
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

  const handleSelectCondition = (tier: ConditionTier) => {
    setConfig((prev) => ({
      ...prev,
      condition: tier.name,
      grade: tier.fullGradeString,
      subGrade: tier.subGrade,
      centeringScore: tier.defaultScores.centering,
      cornersScore: tier.defaultScores.corners,
      edgesScore: tier.defaultScores.edges,
      surfaceScore: tier.defaultScores.surface,
    }));
    setIsSaved(false);
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

      {/* Dynamic Slab Grade Badge (Interactive Corner Seal) */}
      <SlabGradeBadge card={card} config={config} onSelectCondition={handleSelectCondition} />

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
          {/* Quick Environment Preset Pill */}
          <button
            onClick={() => {
              const currentIndex = ENVIRONMENTS.findIndex((e) => e.id === environment);
              const nextEnv = ENVIRONMENTS[(currentIndex + 1) % ENVIRONMENTS.length];
              setEnvironment(nextEnv.id);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-cyan-400/80 backdrop-blur-md text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
            title={`Environment: ${currentEnvOption.name} (Click to cycle)`}
          >
            <span>{currentEnvOption.emoji}</span>
            <span className="hidden md:inline font-mono text-[11px] text-cyan-300">{currentEnvOption.name}</span>
          </button>

          <button
            onClick={() => setShowGifModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/85 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 backdrop-blur-md text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer shadow-cyan-500/10"
            title="Export 3D Slab as Animated GIF"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">EXPORT GIF</span>
          </button>

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

          {/* 3D Background Environment Dropdown Menu */}
          <div className="space-y-1.5 shrink-0 relative z-30">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Environment</span>
              </label>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                {currentEnvOption.badge}
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsEnvDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer shadow-md group ${
                  isEnvDropdownOpen
                    ? 'bg-slate-800/95 border-cyan-400 ring-1 ring-cyan-400/50 text-white'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/40 text-slate-200'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isEnvDropdownOpen}
                title="Switch 3D Environment (Starlight, Laboratory, Forest, Volcanic)"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg p-1.5 rounded-xl bg-slate-900 border border-slate-700/60 shrink-0 shadow-inner">
                    {currentEnvOption.emoji}
                  </span>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black tracking-wide text-white group-hover:text-cyan-300 transition-colors">
                        {currentEnvOption.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        LIVE
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {currentEnvOption.tagline}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-200 ml-2 ${
                    isEnvDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Options Popup */}
              {isEnvDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsEnvDropdownOpen(false)}
                  />
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-slate-900/98 backdrop-blur-2xl border border-cyan-500/50 rounded-2xl shadow-2xl z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150"
                    role="listbox"
                  >
                    <div className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider uppercase text-cyan-400/90 border-b border-slate-800 flex items-center justify-between">
                      <span>Select Environment Theme</span>
                      <span className="text-[8px] text-slate-500">4 PRESETS</span>
                    </div>
                    {ENVIRONMENTS.map((env) => {
                      const isSelected = environment === env.id;
                      return (
                        <button
                          key={env.id}
                          type="button"
                          onClick={() => {
                            setEnvironment(env.id);
                            setIsEnvDropdownOpen(false);
                          }}
                          role="option"
                          aria-selected={isSelected}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-500/20 border border-cyan-400/70 text-white shadow-sm ring-1 ring-cyan-400/30'
                              : 'hover:bg-slate-800/90 border border-transparent text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0 p-1 rounded-lg bg-slate-950 border border-slate-800">
                              {env.emoji}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black tracking-wide">{env.name}</span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {env.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                {env.tagline}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
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

                {/* 0. Card Condition & Dynamic Slab Grade Tier */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-200 font-bold uppercase flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-cyan-400" /> Card Condition
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">
                      {config.condition || 'Gem Mint'}
                    </span>
                  </div>

                  {/* Input for user input of card condition */}
                  <input
                    type="text"
                    value={config.condition !== undefined ? config.condition : 'Gem Mint'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matchedTier = resolveConditionTier(val);
                      setConfig((prev) => ({
                        ...prev,
                        condition: val,
                        grade: matchedTier.fullGradeString,
                        subGrade: matchedTier.subGrade,
                      }));
                      setIsSaved(false);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    placeholder="e.g. Gem Mint, Pristine 10, Mint 9, Near Mint..."
                  />

                  {/* Quick Condition Tiers Grid */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {CONDITION_TIERS.map((tier) => {
                      const currentConditionStr = (config.condition || 'Gem Mint').toLowerCase();
                      const isSelected = currentConditionStr.includes(tier.name.toLowerCase().split(' ')[0]);
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => handleSelectCondition(tier)}
                          className={`p-2 rounded-lg text-left text-xs font-mono border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? `${tier.cardBg} ${tier.borderClass} ${tier.textColor} font-bold ring-1`
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[11px] truncate">{tier.name}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/50 text-cyan-300 ml-1">
                            {tier.gradeNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
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

                {/* 3D Background Environment Selector Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3D Background Scene</span>
                    </label>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                      {currentEnvOption.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {ENVIRONMENTS.map((env) => {
                      const isSelected = environment === env.id;
                      return (
                        <button
                          key={env.id}
                          type="button"
                          onClick={() => setEnvironment(env.id)}
                          className={`p-2.5 rounded-2xl text-left transition-all border relative overflow-hidden group cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-lg p-1 rounded-lg bg-slate-950 border border-slate-800">
                              {env.emoji}
                            </span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                              {env.name}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1 font-mono">
                              {env.badge}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
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

            <button
              type="button"
              onClick={() => setShowGifModal(true)}
              className="w-full mt-2 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 bg-slate-800/90 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 active:scale-95 cursor-pointer shadow-md"
            >
              <Film className="w-4 h-4 text-cyan-400" />
              <span>EXPORT 3D SLAB AS GIF</span>
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

          {/* Export GIF Button */}
          <button
            onClick={() => setShowGifModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-xs font-bold border border-cyan-500/40 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Export 3D Slab as Animated GIF"
          >
            <Film className="w-4 h-4 text-cyan-400" />
            <span>Export GIF</span>
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
        {(() => {
          const tier = resolveConditionTier(config.condition, config.grade, config.subGrade);
          const tierPrice =
            tier.pricingTier === 'psa10'
              ? card.psa10Price
              : tier.pricingTier === 'psa9'
              ? card.psa9Price
              : tier.pricingTier === 'psa8'
              ? card.psa8Price
              : card.rawPrice;
          const delta =
            card.rawPrice > 0 ? Math.round(((tierPrice - card.rawPrice) / card.rawPrice) * 100) : 0;

          return (
            <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-1.5 w-full flex items-center justify-between text-xs pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/40">
                  {tier.name}
                </span>
                <span className="text-white font-bold text-sm font-mono">${tierPrice.toFixed(2)}</span>
                {delta !== 0 && (
                  <span
                    className={`text-[11px] font-semibold ${
                      delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {delta > 0 ? `+${delta}%` : `${delta}%`} vs Raw
                  </span>
                )}
              </div>
              <div className="text-slate-400 flex items-center gap-1 font-mono">
                <span>Raw Market:</span>
                <span className="text-slate-200 font-semibold">${card.rawPrice.toFixed(2)}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* NFC Cryptographic Authenticity Modal */}
      {showNfcModal && (
        <NfcAuthModal card={card} config={config} onClose={() => setShowNfcModal(false)} />
      )}

      {/* Animated 3D Slab GIF Export Modal */}
      <SlabGifExportModal
        isOpen={showGifModal}
        onClose={() => setShowGifModal(false)}
        card={card}
        config={config}
        sceneRef={sceneRef}
        cameraRef={cameraRef}
        rendererRef={rendererRef}
        slabGroupRef={slabGroupRef}
        holoUniformsRef={holoUniformsRef}
      />
    </div>
  );
};
