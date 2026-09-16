import * as THREE from 'three';

export type BackgroundEnvironment = 'starlight' | 'laboratory' | 'forest' | 'volcanic';

export interface EnvironmentOption {
  id: BackgroundEnvironment;
  name: string;
  badge: string;
  tagline: string;
  desc: string;
  emoji: string;
  bgColor: number;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  keyColor: number;
  keyIntensity: number;
  fillColor: number;
  fillIntensity: number;
  rimColor: number;
  rimIntensity: number;
}

export const ENVIRONMENTS: EnvironmentOption[] = [
  {
    id: 'starlight',
    name: 'Starlight',
    badge: 'Cosmic Void',
    tagline: 'Deep space void with elemental orbs & battle dais',
    desc: 'Deep cosmic nebula with 1,200 twinkling multi-colored stars, 6 orbiting Pokémon elemental energy spheres, and a glowing battle stadium ring platform.',
    emoji: '✨',
    bgColor: 0x030611,
    fogColor: 0x030611,
    fogDensity: 0.028,
    ambientColor: 0xffffff,
    ambientIntensity: 1.4,
    keyColor: 0xffffff,
    keyIntensity: 2.5,
    fillColor: 0x00f2fe,
    fillIntensity: 1.8,
    rimColor: 0xa855f7,
    rimIntensity: 2.8,
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    badge: 'Silph Co. Tech',
    tagline: 'High-tech research dais with laser field & data motes',
    desc: 'Clean futuristic research facility with a holographic laser containment field, hexagonal scanner grid, floating digital matrix data motes, and analytical cool lighting.',
    emoji: '🔬',
    bgColor: 0x080f1a,
    fogColor: 0x080f1a,
    fogDensity: 0.032,
    ambientColor: 0xdbeafe,
    ambientIntensity: 1.6,
    keyColor: 0xffffff,
    keyIntensity: 2.8,
    fillColor: 0x38bdf8,
    fillIntensity: 2.2,
    rimColor: 0x22d3ee,
    rimIntensity: 2.6,
  },
  {
    id: 'forest',
    name: 'Forest',
    badge: 'Viridian Canopy',
    tagline: 'Mystical woodland with fireflies, ancient dais & sunbeams',
    desc: 'Enchanted Viridian woodland canopy filled with drifting bioluminescent fireflies, golden spore motes, ancient mossy druidic stone rings, and warm dappled canopy lighting.',
    emoji: '🌲',
    bgColor: 0x041309,
    fogColor: 0x041309,
    fogDensity: 0.035,
    ambientColor: 0xfef3c7,
    ambientIntensity: 1.5,
    keyColor: 0xffedd5,
    keyIntensity: 2.4,
    fillColor: 0x10b981,
    fillIntensity: 1.8,
    rimColor: 0xfacc15,
    rimIntensity: 2.4,
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    badge: 'Cinnabar Magma',
    tagline: 'Subterranean cavern with magma fissures & rising embers',
    desc: 'Subterranean volcanic cavern featuring glowing molten magma rings, rising fiery ember particles, volcanic smoke haze, and dramatic high-contrast crimson rim lighting.',
    emoji: '🌋',
    bgColor: 0x140505,
    fogColor: 0x140505,
    fogDensity: 0.038,
    ambientColor: 0xfee2e2,
    ambientIntensity: 1.4,
    keyColor: 0xffedd5,
    keyIntensity: 2.6,
    fillColor: 0xf97316,
    fillIntensity: 2.2,
    rimColor: 0xef4444,
    rimIntensity: 3.0,
  },
];

// =============================================================================
// 1. STARLIGHT ENVIRONMENT BUILDER
// =============================================================================
export interface StarlightObjects {
  group: THREE.Group;
  starField: THREE.Points;
  orbMeshes: Array<{ group: THREE.Group; config: any; ring: THREE.Mesh }>;
  stadiumRings: { outer: THREE.Mesh; mid: THREE.Mesh; poke: THREE.Mesh; beam: THREE.Mesh };
}

export function buildStarlightEnvironment(): StarlightObjects {
  const group = new THREE.Group();

  // 1a. Starfield (1,200 multi-colored stars in Pokémon galaxy)
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
  group.add(starField);

  // 1b. Drifting Cosmic Nebula Cloud
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
  group.add(nebula);

  // 1c. Floating Pokémon Elemental Energy Orbs
  const energyTypes = [
    { name: 'Fire', color: 0xef4444, radius: 5.2, speed: 0.4, yOffset: 1.2 },
    { name: 'Water', color: 0x0ea5e9, radius: 6.0, speed: -0.32, yOffset: -0.8 },
    { name: 'Electric', color: 0xeab308, radius: 4.8, speed: 0.52, yOffset: 2.1 },
    { name: 'Grass', color: 0x10b981, radius: 6.5, speed: -0.28, yOffset: 0.2 },
    { name: 'Psychic', color: 0xa855f7, radius: 5.6, speed: 0.36, yOffset: -1.8 },
    { name: 'Darkness', color: 0x6366f1, radius: 7.2, speed: -0.22, yOffset: 1.6 },
  ];

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

    group.add(orbSubGroup);
    return { group: orbSubGroup, config: et, ring };
  });

  // 1d. Holographic Battle Stadium Dais / Hall of Fame Platform
  const stadiumGroup = new THREE.Group();
  stadiumGroup.position.y = -3.8;
  group.add(stadiumGroup);

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

  return {
    group,
    starField,
    orbMeshes,
    stadiumRings: { outer: outerRing, mid: midRing, poke: pokeRing, beam },
  };
}

// =============================================================================
// 2. LABORATORY ENVIRONMENT BUILDER
// =============================================================================
export interface LaboratoryObjects {
  group: THREE.Group;
  hexRing: THREE.Mesh;
  outerTechRing: THREE.Mesh;
  innerReticleRing: THREE.Mesh;
  containmentBeam: THREE.Mesh;
  matrixPoints: THREE.Points;
  matrixPositions: Float32Array;
  diagnosticPillars: THREE.Group[];
}

export function buildLaboratoryEnvironment(): LaboratoryObjects {
  const group = new THREE.Group();

  // Platform at y = -3.8
  const daisGroup = new THREE.Group();
  daisGroup.position.y = -3.8;
  group.add(daisGroup);

  // High-Tech Hexagonal Outer Reticle Ring
  const hexRingGeo = new THREE.RingGeometry(3.6, 3.82, 6);
  const hexRingMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const hexRing = new THREE.Mesh(hexRingGeo, hexRingMat);
  hexRing.rotation.x = Math.PI * 0.5;
  daisGroup.add(hexRing);

  // Concentric Circular Tech Ring
  const outerTechGeo = new THREE.RingGeometry(2.6, 2.75, 48);
  const outerTechMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const outerTechRing = new THREE.Mesh(outerTechGeo, outerTechMat);
  outerTechRing.rotation.x = Math.PI * 0.5;
  daisGroup.add(outerTechRing);

  // Inner Calibrated Reticle Ring
  const innerReticleGeo = new THREE.RingGeometry(1.3, 1.38, 36);
  const innerReticleMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const innerReticleRing = new THREE.Mesh(innerReticleGeo, innerReticleMat);
  innerReticleRing.rotation.x = Math.PI * 0.5;
  daisGroup.add(innerReticleRing);

  // Diagnostic Floor Grid
  const gridHelper = new THREE.GridHelper(10, 20, 0x00f2fe, 0x1e293b);
  gridHelper.position.y = -3.81;
  group.add(gridHelper);

  // Cylindrical Laser Containment Field
  const cylinderGeo = new THREE.CylinderGeometry(2.5, 2.5, 7.5, 32, 1, true);
  const cylinderMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const containmentBeam = new THREE.Mesh(cylinderGeo, cylinderMat);
  containmentBeam.position.y = 0;
  group.add(containmentBeam);

  // 4 Corner Diagnostic Laser Emitter Pillars
  const diagnosticPillars: THREE.Group[] = [];
  const pillarAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  const pillarRadius = 3.6;

  pillarAngles.forEach((angle) => {
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(Math.cos(angle) * pillarRadius, -3.8, Math.sin(angle) * pillarRadius);

    // Slim metallic pillar node
    const colGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.4, 16);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.y = 0.7;
    pillarGroup.add(col);

    // Glowing emitter lens
    const lensGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const lensMat = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.y = 1.4;
    pillarGroup.add(lens);

    // Subtle blue diagnostic light
    const pLight = new THREE.PointLight(0x00f2fe, 0.8, 4);
    pLight.position.y = 1.4;
    pillarGroup.add(pLight);

    group.add(pillarGroup);
    diagnosticPillars.push(pillarGroup);
  });

  // Floating Analytical Data Matrix Particles (Cyan & Azure motes rising inside chamber)
  const matrixCount = 200;
  const matrixPositions = new Float32Array(matrixCount * 3);
  const matrixColors = new Float32Array(matrixCount * 3);

  const cyanCol = new THREE.Color(0x00f2fe);
  const blueCol = new THREE.Color(0x38bdf8);

  for (let i = 0; i < matrixCount; i++) {
    const i3 = i * 3;
    const r = 0.5 + Math.random() * 2.8;
    const theta = Math.random() * Math.PI * 2;
    matrixPositions[i3] = Math.cos(theta) * r;
    matrixPositions[i3 + 1] = -3.8 + Math.random() * 7.5;
    matrixPositions[i3 + 2] = Math.sin(theta) * r;

    const col = Math.random() > 0.4 ? cyanCol : blueCol;
    matrixColors[i3] = col.r;
    matrixColors[i3 + 1] = col.g;
    matrixColors[i3 + 2] = col.b;
  }

  const matrixGeo = new THREE.BufferGeometry();
  matrixGeo.setAttribute('position', new THREE.BufferAttribute(matrixPositions, 3));
  matrixGeo.setAttribute('color', new THREE.BufferAttribute(matrixColors, 3));

  const matrixMat = new THREE.PointsMaterial({
    size: 0.07,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });
  const matrixPoints = new THREE.Points(matrixGeo, matrixMat);
  group.add(matrixPoints);

  return {
    group,
    hexRing,
    outerTechRing,
    innerReticleRing,
    containmentBeam,
    matrixPoints,
    matrixPositions,
    diagnosticPillars,
  };
}

// =============================================================================
// 3. FOREST ENVIRONMENT BUILDER
// =============================================================================
export interface ForestObjects {
  group: THREE.Group;
  fireflyPoints: THREE.Points;
  fireflyPositions: Float32Array;
  fireflyBasePositions: Float32Array;
  runeRings: THREE.Mesh[];
  sunbeam: THREE.Mesh;
  wisps: THREE.Group[];
  sporePoints: THREE.Points;
  sporePositions: Float32Array;
}

export function buildForestEnvironment(): ForestObjects {
  const group = new THREE.Group();

  // Ancient Druidic Woodland Dais at y = -3.8
  const forestDais = new THREE.Group();
  forestDais.position.y = -3.8;
  group.add(forestDais);

  // Mossy Earthen Floor Disc
  const discGeo = new THREE.CircleGeometry(4.6, 32);
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x081c0f,
    roughness: 0.95,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI * 0.5;
  forestDais.add(disc);

  // Ancient Jade Rune Ring
  const runeGeo = new THREE.RingGeometry(3.5, 3.8, 48);
  const runeMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
  });
  const outerRuneRing = new THREE.Mesh(runeGeo, runeMat);
  outerRuneRing.rotation.x = Math.PI * 0.5;
  forestDais.add(outerRuneRing);

  // Golden Sun Crest Ring
  const sunRingGeo = new THREE.RingGeometry(2.2, 2.35, 32);
  const sunRingMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });
  const sunRing = new THREE.Mesh(sunRingGeo, sunRingMat);
  sunRing.rotation.x = Math.PI * 0.5;
  forestDais.add(sunRing);

  // Center Clover Crest Ring
  const cloverGeo = new THREE.RingGeometry(1.1, 1.18, 24);
  const cloverMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const cloverRing = new THREE.Mesh(cloverGeo, cloverMat);
  cloverRing.rotation.x = Math.PI * 0.5;
  forestDais.add(cloverRing);

  // Celestial Canopy Sunbeam Light Shaft filtering down from top-left
  const sunbeamGeo = new THREE.CylinderGeometry(0.8, 3.5, 9.5, 24, 1, true);
  const sunbeamMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.045,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const sunbeam = new THREE.Mesh(sunbeamGeo, sunbeamMat);
  sunbeam.position.set(-1.2, 0.5, -0.5);
  sunbeam.rotation.z = -0.22;
  sunbeam.rotation.x = 0.12;
  group.add(sunbeam);

  // 100 Bioluminescent Golden & Chartreuse Fireflies
  const fireflyCount = 100;
  const fireflyPositions = new Float32Array(fireflyCount * 3);
  const fireflyBasePositions = new Float32Array(fireflyCount * 3);
  const fireflyColors = new Float32Array(fireflyCount * 3);

  const goldColor = new THREE.Color(0xfacc15);
  const chartreuseColor = new THREE.Color(0xa3e635);
  const emeraldColor = new THREE.Color(0x34d399);

  for (let i = 0; i < fireflyCount; i++) {
    const i3 = i * 3;
    const x = (Math.random() - 0.5) * 16;
    const y = -3.2 + Math.random() * 8.0;
    const z = (Math.random() - 0.5) * 14;

    fireflyPositions[i3] = x;
    fireflyPositions[i3 + 1] = y;
    fireflyPositions[i3 + 2] = z;

    fireflyBasePositions[i3] = x;
    fireflyBasePositions[i3 + 1] = y;
    fireflyBasePositions[i3 + 2] = z;

    const rVal = Math.random();
    const col = rVal > 0.5 ? goldColor : rVal > 0.2 ? chartreuseColor : emeraldColor;
    fireflyColors[i3] = col.r;
    fireflyColors[i3 + 1] = col.g;
    fireflyColors[i3 + 2] = col.b;
  }

  const fireflyGeo = new THREE.BufferGeometry();
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
  fireflyGeo.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));

  const fireflyMat = new THREE.PointsMaterial({
    size: 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
  group.add(fireflyPoints);

  // 3 Wandering Mystical Forest Wisps
  const wisps: THREE.Group[] = [];
  const wispColors = [0xfacc15, 0x34d399, 0xa3e635];

  wispColors.forEach((wc) => {
    const wispGroup = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({
        color: wc,
        emissive: wc,
        emissiveIntensity: 2.2,
      })
    );
    wispGroup.add(sphere);

    const wispLight = new THREE.PointLight(wc, 1.4, 6);
    wispGroup.add(wispLight);

    group.add(wispGroup);
    wisps.push(wispGroup);
  });

  // Soft Ambient Woodland Spores
  const sporeCount = 140;
  const sporePositions = new Float32Array(sporeCount * 3);
  for (let i = 0; i < sporeCount * 3; i += 3) {
    sporePositions[i] = (Math.random() - 0.5) * 20;
    sporePositions[i + 1] = -3.5 + Math.random() * 9.0;
    sporePositions[i + 2] = (Math.random() - 0.5) * 18;
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
  const sporeMat = new THREE.PointsMaterial({
    color: 0x86efac,
    size: 0.05,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
  });
  const sporePoints = new THREE.Points(sporeGeo, sporeMat);
  group.add(sporePoints);

  return {
    group,
    fireflyPoints,
    fireflyPositions,
    fireflyBasePositions,
    runeRings: [outerRuneRing, sunRing, cloverRing],
    sunbeam,
    wisps,
    sporePoints,
    sporePositions,
  };
}

// =============================================================================
// 4. VOLCANIC ENVIRONMENT BUILDER (Bonus)
// =============================================================================
export interface VolcanicObjects {
  group: THREE.Group;
  emberPoints: THREE.Points;
  emberPositions: Float32Array;
  magmaRings: THREE.Mesh[];
}

export function buildVolcanicEnvironment(): VolcanicObjects {
  const group = new THREE.Group();

  const volcDais = new THREE.Group();
  volcDais.position.y = -3.8;
  group.add(volcDais);

  // Molten Magma Outer Ring
  const magmaOuterGeo = new THREE.RingGeometry(3.5, 3.8, 48);
  const magmaOuterMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const magmaOuter = new THREE.Mesh(magmaOuterGeo, magmaOuterMat);
  magmaOuter.rotation.x = Math.PI * 0.5;
  volcDais.add(magmaOuter);

  // Inner Fiery Ring
  const innerFireGeo = new THREE.RingGeometry(2.1, 2.3, 36);
  const innerFireMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const innerFire = new THREE.Mesh(innerFireGeo, innerFireMat);
  innerFire.rotation.x = Math.PI * 0.5;
  volcDais.add(innerFire);

  // Core Molten Pit
  const corePitGeo = new THREE.CircleGeometry(1.2, 32);
  const corePitMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const corePit = new THREE.Mesh(corePitGeo, corePitMat);
  corePit.rotation.x = -Math.PI * 0.5;
  volcDais.add(corePit);

  // 160 Rising Molten Ember Sparks
  const emberCount = 160;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberColors = new Float32Array(emberCount * 3);

  const fireOrange = new THREE.Color(0xf97316);
  const fireYellow = new THREE.Color(0xfacc15);
  const fireRed = new THREE.Color(0xef4444);

  for (let i = 0; i < emberCount; i++) {
    const i3 = i * 3;
    const r = Math.random() * 4.5;
    const theta = Math.random() * Math.PI * 2;
    emberPositions[i3] = Math.cos(theta) * r;
    emberPositions[i3 + 1] = -3.8 + Math.random() * 8.5;
    emberPositions[i3 + 2] = Math.sin(theta) * r;

    const rnd = Math.random();
    const col = rnd > 0.6 ? fireYellow : rnd > 0.25 ? fireOrange : fireRed;
    emberColors[i3] = col.r;
    emberColors[i3 + 1] = col.g;
    emberColors[i3 + 2] = col.b;
  }

  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));

  const emberMat = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });
  const emberPoints = new THREE.Points(emberGeo, emberMat);
  group.add(emberPoints);

  return {
    group,
    emberPoints,
    emberPositions,
    magmaRings: [magmaOuter, innerFire],
  };
}
