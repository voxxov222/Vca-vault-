import QRCode from 'qrcode';
import { CardItem, SlabConfig, LabelColor } from '../types/pokemon.ts';

// Color themes for label
export const LABEL_THEMES: Record<
  LabelColor,
  {
    name: string;
    outerBezel: string;
    borderGlow: string;
    primary: string;
    secondary: string;
    glow: string;
    bgGrad1: string;
    bgGrad2: string;
    bgGrad3: string;
    circuit: string;
    circuitGlow: string;
    accent: string;
    pillBg: string;
    chipGold: string;
  }
> = {
  cyber_cyan: {
    name: 'VCA Cyber Cyan (Official)',
    outerBezel: '#0a192f',
    borderGlow: '#00f2fe',
    primary: '#38bdf8',
    secondary: '#0284c7',
    glow: 'rgba(0, 242, 254, 0.85)',
    bgGrad1: '#030712',
    bgGrad2: '#0b192c',
    bgGrad3: '#020617',
    circuit: 'rgba(56, 189, 248, 0.55)',
    circuitGlow: 'rgba(0, 242, 254, 0.75)',
    accent: '#00f2fe',
    pillBg: '#04101e',
    chipGold: '#f59e0b',
  },
  crimson_red: {
    name: 'Crimson Flame',
    outerBezel: '#2a0a0a',
    borderGlow: '#ef4444',
    primary: '#f87171',
    secondary: '#b91c1c',
    glow: 'rgba(239, 68, 68, 0.85)',
    bgGrad1: '#0a0202',
    bgGrad2: '#2c0b0b',
    bgGrad3: '#050101',
    circuit: 'rgba(248, 113, 113, 0.55)',
    circuitGlow: 'rgba(239, 68, 68, 0.75)',
    accent: '#ef4444',
    pillBg: '#1a0505',
    chipGold: '#fbbf24',
  },
  electric_yellow: {
    name: 'Pikachu Volt Gold',
    outerBezel: '#2a220a',
    borderGlow: '#eab308',
    primary: '#facc15',
    secondary: '#ca8a04',
    glow: 'rgba(250, 204, 21, 0.85)',
    bgGrad1: '#0a0902',
    bgGrad2: '#2c250b',
    bgGrad3: '#060501',
    circuit: 'rgba(250, 204, 21, 0.55)',
    circuitGlow: 'rgba(234, 179, 8, 0.75)',
    accent: '#f59e0b',
    pillBg: '#1c1704',
    chipGold: '#eab308',
  },
  master_purple: {
    name: 'Master Ball Purple',
    outerBezel: '#1e0a2a',
    borderGlow: '#a855f7',
    primary: '#c084fc',
    secondary: '#7e22ce',
    glow: 'rgba(192, 132, 252, 0.85)',
    bgGrad1: '#09020d',
    bgGrad2: '#240b2c',
    bgGrad3: '#040106',
    circuit: 'rgba(192, 132, 252, 0.55)',
    circuitGlow: 'rgba(168, 85, 247, 0.75)',
    accent: '#a855f7',
    pillBg: '#15051e',
    chipGold: '#fbbf24',
  },
  emerald_rayquaza: {
    name: 'Rayquaza Emerald',
    outerBezel: '#0a2418',
    borderGlow: '#10b981',
    primary: '#34d399',
    secondary: '#047857',
    glow: 'rgba(52, 211, 153, 0.85)',
    bgGrad1: '#020d07',
    bgGrad2: '#0b2c17',
    bgGrad3: '#010603',
    circuit: 'rgba(52, 211, 153, 0.55)',
    circuitGlow: 'rgba(16, 185, 129, 0.75)',
    accent: '#10b981',
    pillBg: '#05180f',
    chipGold: '#facc15',
  },
  holo_iridescent: {
    name: 'Holo Iridescent',
    outerBezel: '#1a1028',
    borderGlow: '#ec4899',
    primary: '#38bdf8',
    secondary: '#8b5cf6',
    glow: 'rgba(236, 72, 153, 0.85)',
    bgGrad1: '#090d16',
    bgGrad2: '#16122c',
    bgGrad3: '#04070f',
    circuit: 'rgba(56, 189, 248, 0.55)',
    circuitGlow: 'rgba(236, 72, 153, 0.75)',
    accent: '#e879f9',
    pillBg: '#100c22',
    chipGold: '#fbbf24',
  },
};

/**
 * Renders the High-Definition Realistic VCA Slab Front Label
 * Matches the official reference image (Screenshot_20260811_145658_Gallery.jpg)
 * and the physical slab compartment proportions (68.00mm x 20.00mm).
 */
export async function renderVcaFrontLabel(card: CardItem, config: SlabConfig): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  // High-density 2400 x 706 canvas (proportional to 68mm x 20mm blueprint, 3.4 : 1 aspect ratio)
  canvas.width = 2400;
  canvas.height = 706;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const W = 2400;
  const H = 706;
  const theme = LABEL_THEMES[config.labelColor] || LABEL_THEMES.cyber_cyan;

  // Format serial: default to VCA-000-000-001 or format nicely
  let rawSerial = (config.serialNumber || card.certNumber || 'VCA-000-000-001').trim();
  if (!rawSerial.toUpperCase().startsWith('VCA')) {
    rawSerial = `VCA-${rawSerial}`;
  }
  const serial = rawSerial;

  // Grade & Subgrade formatting
  const grade = (config.grade || '#10 GRADE').trim();
  const subGrade = (config.subGrade || 'GEM MINT').trim().toUpperCase();
  const authorityText = (config.customAuthorityText || 'VCA').trim();
  const authoritySubtext = (config.customAuthoritySubtext || 'VERIFIED CARD AUTHORITY').trim();

  // ----------------------------------------------------
  // 1. OUTER BEZEL WITH 45-DEGREE CHAMFERED CORNERS
  // ----------------------------------------------------
  const chamfer = 60;
  const drawChamferedRect = (x: number, y: number, w: number, h: number, c: number) => {
    ctx.beginPath();
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y);
    ctx.lineTo(x + w, y + c);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h);
    ctx.lineTo(x, y + h - c);
    ctx.lineTo(x, y + c);
    ctx.closePath();
  };

  // Base background clear
  ctx.clearRect(0, 0, W, H);

  // Outer Gunmetal / Cyber Chamfer Frame
  ctx.save();
  drawChamferedRect(0, 0, W, H, chamfer);
  const outerGrad = ctx.createLinearGradient(0, 0, W, H);
  outerGrad.addColorStop(0, '#0c1626');
  outerGrad.addColorStop(0.3, '#1e293b');
  outerGrad.addColorStop(0.5, '#0f172a');
  outerGrad.addColorStop(0.7, '#1e293b');
  outerGrad.addColorStop(1, '#0b1320');
  ctx.fillStyle = outerGrad;
  ctx.fill();

  // Outer high-tech bevel stroke
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#334155';
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // 2. INNER OBSIDIAN CYBER PLATE (Recessed)
  // ----------------------------------------------------
  const inset = 16;
  const innerW = W - inset * 2;
  const innerH = H - inset * 2;
  const innerChamfer = chamfer - 8;

  ctx.save();
  drawChamferedRect(inset, inset, innerW, innerH, innerChamfer);
  ctx.clip();

  // Deep dark obsidian / carbon backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bgGrad1);
  bgGrad.addColorStop(0.2, theme.bgGrad2);
  bgGrad.addColorStop(0.5, theme.bgGrad3);
  bgGrad.addColorStop(0.8, theme.bgGrad2);
  bgGrad.addColorStop(1, theme.bgGrad1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Micro tech grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let gx = 0; gx < W; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  // ----------------------------------------------------
  // 3. CYBERNETIC CIRCUIT TRACES & MOTHERBOARD BUS LINES
  // ----------------------------------------------------
  ctx.save();
  ctx.strokeStyle = theme.circuit;
  ctx.lineWidth = 3.5;
  ctx.shadowColor = theme.circuitGlow;
  ctx.shadowBlur = 8;

  // Circuit trace helper
  const drawTrace = (points: [number, number][]) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
  };

  const drawSolderPad = (x: number, y: number, r = 7) => {
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Top rail circuit traces
  drawTrace([
    [inset + 80, inset + 45],
    [520, inset + 45],
    [580, inset + 90],
    [850, inset + 90],
  ]);
  drawSolderPad(850, inset + 90, 6);

  drawTrace([
    [1550, inset + 90],
    [1720, inset + 90],
    [1780, inset + 45],
    [W - inset - 80, inset + 45],
  ]);
  drawSolderPad(1550, inset + 90, 6);

  // Bottom rail circuit traces
  drawTrace([
    [inset + 80, H - inset - 45],
    [540, H - inset - 45],
    [600, H - inset - 90],
    [820, H - inset - 90],
  ]);
  drawSolderPad(820, H - inset - 90, 6);

  drawTrace([
    [1580, H - inset - 90],
    [1740, H - inset - 90],
    [1800, H - inset - 45],
    [W - inset - 80, H - inset - 45],
  ]);
  drawSolderPad(1580, H - inset - 90, 6);

  // Intricate multi-bus routes feeding into the NFC module
  const nfcBusX = 1680;
  drawTrace([[nfcBusX - 120, 220], [nfcBusX - 60, 220], [nfcBusX, 260], [nfcBusX + 40, 260]]);
  drawTrace([[nfcBusX - 140, 260], [nfcBusX - 80, 260], [nfcBusX, 310], [nfcBusX + 40, 310]]);
  drawTrace([[nfcBusX - 160, 300], [nfcBusX - 100, 300], [nfcBusX, 360], [nfcBusX + 40, 360]]);
  drawTrace([[nfcBusX - 140, 440], [nfcBusX - 80, 440], [nfcBusX, 390], [nfcBusX + 40, 390]]);
  drawTrace([[nfcBusX - 120, 480], [nfcBusX - 60, 480], [nfcBusX, 440], [nfcBusX + 40, 440]]);

  drawSolderPad(nfcBusX - 120, 220, 5);
  drawSolderPad(nfcBusX - 140, 260, 5);
  drawSolderPad(nfcBusX - 160, 300, 5);
  drawSolderPad(nfcBusX - 140, 440, 5);
  drawSolderPad(nfcBusX - 120, 480, 5);

  ctx.restore();

  // ----------------------------------------------------
  // 4. INNER BEVELED ACCENT FRAME & CORNER BRACKETS
  // ----------------------------------------------------
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = theme.borderGlow;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 14;
  drawChamferedRect(inset + 10, inset + 10, innerW - 20, innerH - 20, innerChamfer - 6);
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // SECTION A (LEFT): HEXAGON LOCK BADGE & 3D METALLIC VCA
  // ----------------------------------------------------
  const hexCenterX = 230;
  const hexCenterY = 353;
  const hexRadius = 90;

  // Draw Glowing Hexagon
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const hx = hexCenterX + hexRadius * Math.cos(angle);
    const hy = hexCenterY + hexRadius * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fillStyle = '#051329';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Circuit pins on hexagon vertices
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const hx = hexCenterX + hexRadius * Math.cos(angle);
    const hy = hexCenterY + hexRadius * Math.sin(angle);
    const outX = hexCenterX + (hexRadius + 30) * Math.cos(angle);
    const outY = hexCenterY + (hexRadius + 30) * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(outX, outY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.accent;
    ctx.stroke();
    drawSolderPad(outX, outY, 5);
  }

  // Draw 3D Padlock inside Hexagon
  const padW = 44;
  const padH = 40;
  const padY = hexCenterY + 4;

  // Shackle
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#e2e8f0';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(hexCenterX, padY - 14, 20, Math.PI, 0, false);
  ctx.lineTo(hexCenterX + 20, padY);
  ctx.lineTo(hexCenterX - 20, padY);
  ctx.stroke();

  // Padlock Body
  const padGrad = ctx.createLinearGradient(hexCenterX - padW / 2, padY, hexCenterX + padW / 2, padY + padH);
  padGrad.addColorStop(0, '#38bdf8');
  padGrad.addColorStop(0.5, '#0284c7');
  padGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = padGrad;
  ctx.beginPath();
  ctx.roundRect(hexCenterX - padW / 2, padY - 4, padW, padH, 8);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(hexCenterX, padY + 12, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hexCenterX - 2.5, padY + 12, 5, 12);
  ctx.restore();

  // ----------------------------------------------------
  // 3D FACETED CRYSTAL "VCA" LOGO (Matching Reference Image)
  // ----------------------------------------------------
  const vcaStartX = 390;
  const vcaBaseline = 400;

  // Draw stylized 3D faceted metallic VCA letters
  ctx.save();
  ctx.font = '900 180px "Montserrat", "Arial Black", sans-serif';
  ctx.letterSpacing = '8px';

  // Base metallic gradient
  const vcaGrad = ctx.createLinearGradient(vcaStartX, 240, vcaStartX + 360, 420);
  vcaGrad.addColorStop(0, '#ffffff');
  vcaGrad.addColorStop(0.2, '#bae6fd');
  vcaGrad.addColorStop(0.45, '#38bdf8');
  vcaGrad.addColorStop(0.7, '#0284c7');
  vcaGrad.addColorStop(0.9, '#0369a1');
  vcaGrad.addColorStop(1, '#ffffff');

  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 24;
  ctx.fillStyle = vcaGrad;
  ctx.fillText(authorityText, vcaStartX, vcaBaseline);

  // 3D Top Facet Highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 0;
  ctx.strokeText(authorityText, vcaStartX, vcaBaseline);
  ctx.restore();

  // Subtitle: VERIFIED CARD AUTHORITY
  ctx.save();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 28px "Arial", sans-serif';
  ctx.letterSpacing = '8px';
  ctx.shadowColor = 'rgba(0, 242, 254, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(authoritySubtext, vcaStartX - 30, 475);
  ctx.restore();

  // ----------------------------------------------------
  // SECTION B (CENTER): GRADE, SUBGRADE & SERIAL CONSOLE
  // ----------------------------------------------------
  const centerX = 1200;

  // 1. Grade Title: e.g. "#10 GRADE"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '900 108px "Montserrat", "Arial Black", sans-serif';
  ctx.letterSpacing = '4px';

  const gradeGrad = ctx.createLinearGradient(centerX - 240, 230, centerX + 240, 310);
  gradeGrad.addColorStop(0, '#ffffff');
  gradeGrad.addColorStop(0.3, theme.accent);
  gradeGrad.addColorStop(0.7, '#38bdf8');
  gradeGrad.addColorStop(1, '#ffffff');

  ctx.fillStyle = gradeGrad;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 22;
  ctx.fillText(grade, centerX, 290);
  ctx.restore();

  // 2. Subgrade: "— GEM MINT —"
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '800 40px "Arial", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillStyle = '#e0f2fe';
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 10;
  ctx.fillText(subGrade, centerX, 365);

  // Horizontal Accent Wings on both sides of subgrade
  const subTextWidth = ctx.measureText(subGrade).width;
  const wingY = 353;
  const wingGap = 28;
  const wingLen = 140;

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  // Left wing
  ctx.beginPath();
  ctx.moveTo(centerX - subTextWidth / 2 - wingGap - wingLen, wingY);
  ctx.lineTo(centerX - subTextWidth / 2 - wingGap, wingY);
  ctx.stroke();
  drawSolderPad(centerX - subTextWidth / 2 - wingGap - wingLen, wingY, 4.5);

  // Right wing
  ctx.beginPath();
  ctx.moveTo(centerX + subTextWidth / 2 + wingGap, wingY);
  ctx.lineTo(centerX + subTextWidth / 2 + wingGap + wingLen, wingY);
  ctx.stroke();
  drawSolderPad(centerX + subTextWidth / 2 + wingGap + wingLen, wingY, 4.5);
  ctx.restore();

  // 3. Serial Number Bezel Pill: SERIAL: VCA-000-000-001
  const pillW = 580;
  const pillH = 74;
  const pillX = centerX - pillW / 2;
  const pillY = 415;

  ctx.save();
  // Pill background container
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 37);
  ctx.fillStyle = theme.pillBg;
  ctx.fill();

  // Beveled border with cyan glow
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = theme.borderGlow;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 14;
  ctx.stroke();

  // Serial Text
  ctx.textAlign = 'center';
  ctx.font = '800 32px "Courier New", monospace';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 8;
  ctx.fillText(`SERIAL: ${serial}`, centerX, pillY + 48);
  ctx.restore();

  // ----------------------------------------------------
  // SECTION C (RIGHT): NFC MODULE & SILICON IC MICROCHIP
  // ----------------------------------------------------
  const nfcBoxX = 1750;
  const nfcBoxY = 160;
  const nfcBoxW = 490;
  const nfcBoxH = 390;
  const nfcChamfer = 34;

  ctx.save();
  // High-Tech Beveled NFC Box Container
  drawChamferedRect(nfcBoxX, nfcBoxY, nfcBoxW, nfcBoxH, nfcChamfer);
  const nfcBoxGrad = ctx.createLinearGradient(nfcBoxX, nfcBoxY, nfcBoxX + nfcBoxW, nfcBoxY + nfcBoxH);
  nfcBoxGrad.addColorStop(0, '#041527');
  nfcBoxGrad.addColorStop(0.5, '#0a233f');
  nfcBoxGrad.addColorStop(1, '#031020');
  ctx.fillStyle = nfcBoxGrad;
  ctx.fill();

  // Glowing Cyan Neon Bezel
  ctx.lineWidth = 4;
  ctx.strokeStyle = theme.borderGlow;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 18;
  ctx.stroke();

  // "NFC" Main Header
  ctx.textAlign = 'left';
  ctx.font = '900 78px "Montserrat", "Arial Black", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillStyle = theme.accent;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 18;
  ctx.fillText('NFC', nfcBoxX + 45, nfcBoxY + 115);

  // "TAP TO" / "AUTHENTICATE"
  ctx.font = '800 24px "Arial", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 6;
  ctx.fillText('TAP TO', nfcBoxX + 45, nfcBoxY + 165);
  ctx.fillText('AUTHENTICATE', nfcBoxX + 45, nfcBoxY + 198);

  // Glowing Wireless Broadcast Radio Waves
  const waveOriginX = nfcBoxX + 270;
  const waveOriginY = nfcBoxY + 160;
  ctx.lineWidth = 6;
  ctx.strokeStyle = theme.accent;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 14;

  // Arc 1
  ctx.beginPath();
  ctx.arc(waveOriginX, waveOriginY, 32, -Math.PI * 0.38, Math.PI * 0.38);
  ctx.stroke();

  // Arc 2
  ctx.beginPath();
  ctx.arc(waveOriginX, waveOriginY, 56, -Math.PI * 0.38, Math.PI * 0.38);
  ctx.stroke();

  // Arc 3
  ctx.beginPath();
  ctx.arc(waveOriginX, waveOriginY, 80, -Math.PI * 0.38, Math.PI * 0.38);
  ctx.stroke();

  // ----------------------------------------------------
  // SILICON MICROCHIP IC DIE (Far Right of NFC Box)
  // ----------------------------------------------------
  const chipX = nfcBoxX + 375;
  const chipY = nfcBoxY + 115;
  const chipSize = 75;

  // Microchip Package Body
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipSize, chipSize, 8);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = theme.borderGlow;
  ctx.stroke();

  // Microchip Center Silicon Die
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(chipX + 16, chipY + 16, chipSize - 32, chipSize - 32);

  // Microchip Internal Circuit Core
  ctx.strokeStyle = theme.chipGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(chipX + 22, chipY + 22, chipSize - 44, chipSize - 44);

  // Microchip Gold/Cyan Lead Pins (Top, Bottom, Left, Right)
  const drawPins = () => {
    ctx.fillStyle = theme.chipGold;
    // Top & Bottom Pins
    for (let p = 0; p < 4; p++) {
      const pinOffset = chipX + 14 + p * 14;
      ctx.fillRect(pinOffset, chipY - 8, 7, 8); // Top
      ctx.fillRect(pinOffset, chipY + chipSize, 7, 8); // Bottom
    }
    // Left & Right Pins
    for (let p = 0; p < 4; p++) {
      const pinOffset = chipY + 14 + p * 14;
      ctx.fillRect(chipX - 8, pinOffset, 8, 7); // Left
      ctx.fillRect(chipX + chipSize, pinOffset, 8, 7); // Right
    }
  };
  drawPins();

  ctx.restore();

  // ----------------------------------------------------
  // 5. TOP & BOTTOM OPTICAL PRISM LIGHT RAIL REFLECTIONS
  // ----------------------------------------------------
  ctx.save();
  const prismGrad = ctx.createLinearGradient(0, 0, W, 0);
  prismGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
  prismGrad.addColorStop(0.2, 'rgba(168, 85, 247, 0.9)');
  prismGrad.addColorStop(0.4, 'rgba(236, 72, 153, 0.9)');
  prismGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.9)');
  prismGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.9)');
  prismGrad.addColorStop(1, 'rgba(56, 189, 248, 0.9)');

  ctx.fillStyle = prismGrad;
  ctx.fillRect(inset + 40, inset + 4, innerW - 80, 5);
  ctx.fillRect(inset + 40, H - inset - 9, innerW - 80, 5);

  // Specular corner glares
  const drawGlint = (gx: number, gy: number) => {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawGlint(inset + innerChamfer, inset + 4);
  drawGlint(W - inset - innerChamfer, inset + 4);
  drawGlint(inset + innerChamfer, H - inset - 4);
  drawGlint(W - inset - innerChamfer, H - inset - 4);

  ctx.restore();

  // If custom QR is enabled, add official encrypted QR verification code
  if (config.qrEnabled) {
    try {
      const qrCanvas = document.createElement('canvas');
      const verifyUrl = `https://pokevault.vca/verify/${serial}?grade=${encodeURIComponent(grade)}&card=${encodeURIComponent(card.name)}`;
      await QRCode.toCanvas(qrCanvas, verifyUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#030712',
          light: '#ffffff',
        },
      });
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(nfcBoxX + 16, nfcBoxY + 230, 140, 140, 10);
      ctx.fill();
      ctx.drawImage(qrCanvas, nfcBoxX + 21, nfcBoxY + 235, 130, 130);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 18px monospace';
      ctx.fillText('SCAN VERIFY', nfcBoxX + 175, nfcBoxY + 295);

      ctx.fillStyle = theme.accent;
      ctx.font = '600 16px "Arial", sans-serif';
      const cardTitle = `${card.name} #${card.number}`;
      ctx.fillText(cardTitle.length > 25 ? cardTitle.substring(0, 25) + '...' : cardTitle, nfcBoxX + 175, nfcBoxY + 325);
      ctx.restore();
    } catch (err) {
      console.warn('QR render error:', err);
    }
  }

  return canvas;
}

/**
 * Renders the High-Definition Official VCA Back Security Registry Label
 */
export async function renderVcaBackLabel(card: CardItem, config: SlabConfig): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 706;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const W = 2400;
  const H = 706;
  const theme = LABEL_THEMES[config.labelColor] || LABEL_THEMES.cyber_cyan;

  let rawSerial = (config.serialNumber || card.certNumber || 'VCA-000-000-001').trim();
  if (!rawSerial.toUpperCase().startsWith('VCA')) {
    rawSerial = `VCA-${rawSerial}`;
  }
  const serial = rawSerial;

  const chamfer = 60;
  const drawChamferedRect = (x: number, y: number, w: number, h: number, c: number) => {
    ctx.beginPath();
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y);
    ctx.lineTo(x + w, y + c);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h);
    ctx.lineTo(x, y + h - c);
    ctx.lineTo(x, y + c);
    ctx.closePath();
  };

  // Base background clear
  ctx.clearRect(0, 0, W, H);

  // Outer Gunmetal Frame
  ctx.save();
  drawChamferedRect(0, 0, W, H, chamfer);
  const outerGrad = ctx.createLinearGradient(0, 0, W, H);
  outerGrad.addColorStop(0, '#0c1626');
  outerGrad.addColorStop(0.5, '#0f172a');
  outerGrad.addColorStop(1, '#0b1320');
  ctx.fillStyle = outerGrad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#334155';
  ctx.stroke();
  ctx.restore();

  // Inner Plate
  const inset = 16;
  const innerW = W - inset * 2;
  const innerH = H - inset * 2;
  const innerChamfer = chamfer - 8;

  ctx.save();
  drawChamferedRect(inset, inset, innerW, innerH, innerChamfer);
  ctx.clip();

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, theme.bgGrad1);
  bgGrad.addColorStop(0.5, theme.bgGrad2);
  bgGrad.addColorStop(1, theme.bgGrad1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Cyber Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < W; gx += 24) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, H);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Montserrat", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('VCA OFFICIAL DIGITAL REGISTRY', 100, 130);

  ctx.fillStyle = theme.accent;
  ctx.font = '700 28px "Courier New", monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText(`SECURITY CERTIFICATE IDENTIFIER: ${serial}`, 100, 195);

  // 4 Subgrades Precision Cards
  const subgrades = [
    { label: 'CENTERING', score: config.centeringScore || '10.0', desc: '50/50 Dual Axis Optical Ratio' },
    { label: 'CORNERS', score: config.cornersScore || '10.0', desc: 'Microscopic 500x Edge Integrity' },
    { label: 'EDGES', score: config.edgesScore || '9.5', desc: 'Zero Silvering & Factory Cut' },
    { label: 'SURFACE', score: config.surfaceScore || '10.0', desc: 'UV Spectral Hologram Check' },
  ];

  subgrades.forEach((sg, idx) => {
    const boxX = 100 + idx * 370;
    const boxY = 240;
    const boxW = 340;
    const boxH = 170;

    // Subgrade Box
    ctx.save();
    ctx.fillStyle = '#061324';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.circuit;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 22px "Arial", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(sg.label, boxX + 24, boxY + 45);

    // Score
    ctx.fillStyle = theme.accent;
    ctx.font = '900 56px "Courier New", monospace';
    ctx.fillText(sg.score, boxX + 24, boxY + 115);

    // Micro desc
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px "Arial", sans-serif';
    ctx.fillText(sg.desc, boxX + 24, boxY + 148);
    ctx.restore();
  });

  // Authentic Linear Barcode & Tamper-Evident Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 22px "Courier New", monospace';
  ctx.fillText(`ENCRYPTED AUTHENTICATION PROTOCOL • ISO/IEC 14443-A ENCAPSULATION • VERIFIED CARD AUTHORITY`, 100, 480);

  // High precision barcode bars
  ctx.fillStyle = '#e2e8f0';
  for (let b = 100; b < 1550; b += 14) {
    const barW = b % 5 === 0 ? 8 : b % 3 === 0 ? 5 : 3;
    ctx.fillRect(b, 515, barW, 110);
  }

  // QR Code on right side
  try {
    const qrCanvas = document.createElement('canvas');
    const verifyUrl = `https://pokevault.vca/verify/${serial}?card=${encodeURIComponent(card.name)}&grade=10`;
    await QRCode.toCanvas(qrCanvas, verifyUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    });
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(1720, 120, 360, 360, 20);
    ctx.fill();
    ctx.drawImage(qrCanvas, 1740, 140, 320, 320);

    ctx.fillStyle = theme.accent;
    ctx.font = '800 26px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL REGISTRY QR', 1900, 535);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 18px "Arial", sans-serif';
    ctx.fillText('INSTANT SMARTPHONE LOOKUP', 1900, 570);
  } catch (err) {
    console.warn('Back label QR error:', err);
  }

  ctx.restore();
  return canvas;
}
