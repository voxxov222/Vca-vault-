import QRCode from 'qrcode';
import { CardItem, SlabConfig, LabelColor } from '../types/pokemon.ts';

// Color themes for label
export const LABEL_THEMES: Record<
  LabelColor,
  {
    name: string;
    border: string;
    primary: string;
    glow: string;
    bgGrad1: string;
    bgGrad2: string;
    circuit: string;
    accent: string;
  }
> = {
  cyber_cyan: {
    name: 'Cyber Cyan (Default)',
    border: '#ef4444', // Red outer bezel matching reference image!
    primary: '#00f2fe',
    glow: 'rgba(0, 242, 254, 0.8)',
    bgGrad1: '#050b14',
    bgGrad2: '#0b192c',
    circuit: 'rgba(0, 242, 254, 0.4)',
    accent: '#38bdf8',
  },
  crimson_red: {
    name: 'Crimson Flame',
    border: '#dc2626',
    primary: '#f87171',
    glow: 'rgba(239, 68, 68, 0.8)',
    bgGrad1: '#140505',
    bgGrad2: '#2c0b0b',
    circuit: 'rgba(248, 113, 113, 0.4)',
    accent: '#ef4444',
  },
  electric_yellow: {
    name: 'Pikachu Volt Gold',
    border: '#eab308',
    primary: '#facc15',
    glow: 'rgba(250, 204, 21, 0.8)',
    bgGrad1: '#141205',
    bgGrad2: '#2c250b',
    circuit: 'rgba(250, 204, 21, 0.4)',
    accent: '#f59e0b',
  },
  master_purple: {
    name: 'Master Ball Purple',
    border: '#9333ea',
    primary: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.8)',
    bgGrad1: '#100514',
    bgGrad2: '#240b2c',
    circuit: 'rgba(192, 132, 252, 0.4)',
    accent: '#a855f7',
  },
  emerald_rayquaza: {
    name: 'Rayquaza Emerald',
    border: '#059669',
    primary: '#34d399',
    glow: 'rgba(52, 211, 153, 0.8)',
    bgGrad1: '#05140b',
    bgGrad2: '#0b2c17',
    circuit: 'rgba(52, 211, 153, 0.4)',
    accent: '#10b981',
  },
  holo_iridescent: {
    name: 'Holo Iridescent',
    border: '#ec4899',
    primary: '#38bdf8',
    glow: 'rgba(236, 72, 153, 0.8)',
    bgGrad1: '#090d16',
    bgGrad2: '#16122c',
    circuit: 'rgba(56, 189, 248, 0.5)',
    accent: '#e879f9',
  },
};

export async function renderVcaFrontLabel(card: CardItem, config: SlabConfig): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const theme = LABEL_THEMES[config.labelColor] || LABEL_THEMES.cyber_cyan;
  const serial = config.serialNumber || card.certNumber || 'VCA-26-0101';
  const grade = config.grade || '#10 GRADE';
  const subGrade = config.subGrade || 'GEM MINT';

  // 1. Outer Accent Border (matches the red/accent border from the image)
  ctx.fillStyle = theme.border;
  ctx.fillRect(0, 0, 1200, 360);

  // 2. High-Tech Cyber Inner Plate
  const inset = 10;
  const innerW = 1200 - inset * 2;
  const innerH = 360 - inset * 2;

  const bgGrad = ctx.createLinearGradient(0, inset, 1200, 360);
  bgGrad.addColorStop(0, theme.bgGrad1);
  bgGrad.addColorStop(0.5, theme.bgGrad2);
  bgGrad.addColorStop(1, theme.bgGrad1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(inset, inset, innerW, innerH);

  // 3. Cybernetic Circuit Traces and Tech Grid
  ctx.strokeStyle = theme.circuit;
  ctx.lineWidth = 1.5;

  // Horizontal guide rails
  ctx.beginPath();
  ctx.moveTo(inset + 20, inset + 30);
  ctx.lineTo(1200 - inset - 20, inset + 30);
  ctx.moveTo(inset + 20, 360 - inset - 30);
  ctx.lineTo(1200 - inset - 20, 360 - inset - 30);
  ctx.stroke();

  // Corner tech bracket lines
  const drawCornerBrackets = (x: number, y: number, w: number, h: number) => {
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    const len = 35;
    // Top Left
    ctx.beginPath();
    ctx.moveTo(x, y + len);
    ctx.lineTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
    // Top Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + len);
    ctx.stroke();
    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - len);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + len, y + h);
    ctx.stroke();
    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(x + w - len, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - len);
    ctx.stroke();
  };
  drawCornerBrackets(inset + 12, inset + 12, innerW - 24, innerH - 24);

  // Microcircuit bus traces across background
  ctx.strokeStyle = theme.circuit;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Trace 1
  ctx.moveTo(280, inset + 30);
  ctx.lineTo(320, inset + 80);
  ctx.lineTo(400, inset + 80);
  // Trace 2
  ctx.moveTo(1200 - inset - 280, inset + 30);
  ctx.lineTo(1200 - inset - 320, inset + 80);
  ctx.lineTo(1200 - inset - 380, inset + 80);
  // Trace 3
  ctx.moveTo(340, 360 - inset - 30);
  ctx.lineTo(380, 360 - inset - 80);
  ctx.lineTo(440, 360 - inset - 80);
  ctx.stroke();

  // Circuit node pads (dots)
  const drawNodePad = (px: number, py: number) => {
    ctx.fillStyle = theme.primary;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };
  drawNodePad(400, inset + 80);
  drawNodePad(1200 - inset - 380, inset + 80);
  drawNodePad(440, 360 - inset - 80);

  // ----------------------------------------------------
  // SECTION 1 (LEFT): Digital Padlock Icon & VCA Branding
  // ----------------------------------------------------
  const lockX = 85;
  const lockY = 160;

  // Digital Shield / Lock Shape
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(lockX, lockY - 20, 18, Math.PI, 0); // Lock shackle
  ctx.lineTo(lockX + 18, lockY + 28);
  ctx.lineTo(lockX, lockY + 44); // Shield bottom point
  ctx.lineTo(lockX - 18, lockY + 28);
  ctx.closePath();
  ctx.stroke();

  // Glowing Keyhole
  ctx.fillStyle = theme.primary;
  ctx.beginPath();
  ctx.arc(lockX, lockY + 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(lockX - 2.5, lockY + 6, 5, 14);

  // "VCA" Title with 3D gradient matching image
  const authorityText = (config.customAuthorityText || 'VCA').trim();
  const authoritySubtext = (config.customAuthoritySubtext || 'VERIFIED CARD AUTHORITY').trim();
  const authFontSize = authorityText.length <= 3 ? 86 : authorityText.length <= 5 ? 64 : 46;
  const vcaGrad = ctx.createLinearGradient(125, 0, 310, 0);
  vcaGrad.addColorStop(0, '#ffffff');
  vcaGrad.addColorStop(0.4, theme.primary);
  vcaGrad.addColorStop(1, '#ffffff');
  ctx.fillStyle = vcaGrad;
  ctx.font = `900 ${authFontSize}px "Arial Black", sans-serif`;
  ctx.fillText(authorityText, 125, authFontSize <= 64 ? 185 : 195);

  // Subtitle
  ctx.fillStyle = '#94a3b8';
  const subFontSize = authoritySubtext.length > 25 ? 15 : 19;
  ctx.font = `bold ${subFontSize}px "Courier New", monospace`;
  ctx.letterSpacing = '1px';
  ctx.fillText(authoritySubtext, 65, 245);

  // Vertical Tech Divider 1
  ctx.strokeStyle = theme.circuit;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(385, inset + 40);
  ctx.lineTo(385, 360 - inset - 40);
  ctx.stroke();

  // ----------------------------------------------------
  // SECTION 2 (CENTER): Grade, Subgrade & Serial
  // ----------------------------------------------------
  // Grade Header (e.g. #10 GRADE)
  ctx.fillStyle = theme.primary;
  const gradeFontSize = grade.length > 14 ? 36 : grade.length > 9 ? 44 : 52;
  ctx.font = `900 ${gradeFontSize}px "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;
  ctx.fillText(grade, 610, 135);
  ctx.shadowBlur = 0; // reset shadow

  // Horizontal Node Line under Grade
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(435, 160);
  ctx.lineTo(785, 160);
  ctx.stroke();
  drawNodePad(435, 160);
  drawNodePad(785, 160);

  // Subgrade (e.g. GEM MINT)
  ctx.fillStyle = '#f8fafc';
  const subGradeFontSize = subGrade.length > 16 ? 20 : 26;
  ctx.font = `bold ${subGradeFontSize}px "Arial", sans-serif`;
  ctx.letterSpacing = '2px';
  ctx.fillText(subGrade, 610, 205);

  // Serial Number: SERIAL: VCA-26-0101 (or custom >= 0101)
  ctx.fillStyle = theme.primary;
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.letterSpacing = '1px';
  ctx.fillText(`SERIAL: ${serial}`, 610, 245);

  // Card Name and Set microtext at the bottom
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 17px "Arial", sans-serif';
  const titlePart = (config.customCardTitle || card.name).trim();
  const subPart = (config.customSubtitle || `#${card.number} • ${card.variant}`).trim();
  const cardSummary = `${titlePart} • ${subPart}`;
  ctx.fillText(cardSummary.length > 50 ? cardSummary.substring(0, 50) + '...' : cardSummary, 610, 280);

  // Reset text alignment
  ctx.textAlign = 'left';

  // Vertical Tech Divider 2
  ctx.strokeStyle = theme.circuit;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(835, inset + 40);
  ctx.lineTo(835, 360 - inset - 40);
  ctx.stroke();

  // ----------------------------------------------------
  // SECTION 3 (RIGHT): NFC Chip & QR Code
  // ----------------------------------------------------
  const rightX = 860;

  if (config.qrEnabled) {
    // Generate actual QR Code onto temporary canvas
    try {
      const qrCanvas = document.createElement('canvas');
      const verifyUrl = `https://pokevault.vca/verify/${serial}?card=${encodeURIComponent(card.name)}&grade=10`;
      await QRCode.toCanvas(qrCanvas, verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      // Draw white backdrop for QR code
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rightX + 160, 105, 150, 150);
      ctx.drawImage(qrCanvas, rightX + 165, 110, 140, 140);

      // Microtext below QR code
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('SCAN VERIFY', rightX + 195, 275);
    } catch (err) {
      console.warn('QR code generation error:', err);
    }
  }

  // NFC Technology Section
  ctx.fillStyle = theme.primary;
  ctx.font = '900 38px "Arial Black", sans-serif';
  ctx.fillText('NFC', rightX + 15, 155);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText('TAP TO', rightX + 15, 185);
  ctx.fillText('AUTHENTICATE', rightX + 15, 205);

  // Glowing Radio Waves (matching image)
  const waveCenterX = rightX + 125;
  const waveCenterY = 175;
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 4;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 8;

  // Wave 1
  ctx.beginPath();
  ctx.arc(waveCenterX, waveCenterY, 18, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  // Wave 2
  ctx.beginPath();
  ctx.arc(waveCenterX, waveCenterY, 32, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  // Wave 3
  ctx.beginPath();
  ctx.arc(waveCenterX, waveCenterY, 46, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Microchip pinouts / circuit lines
  ctx.fillStyle = theme.primary;
  for (let p = 0; p < 4; p++) {
    ctx.fillRect(rightX + 15 + p * 16, 222, 10, 4);
  }

  // Top iridescent rainbow shimmer strip (signature holographic feature)
  const holoStrip = ctx.createLinearGradient(0, 0, 1200, 0);
  holoStrip.addColorStop(0, 'rgba(236, 72, 153, 0.7)');
  holoStrip.addColorStop(0.2, 'rgba(139, 92, 246, 0.7)');
  holoStrip.addColorStop(0.4, 'rgba(6, 182, 212, 0.7)');
  holoStrip.addColorStop(0.6, 'rgba(16, 185, 129, 0.7)');
  holoStrip.addColorStop(0.8, 'rgba(245, 158, 11, 0.7)');
  holoStrip.addColorStop(1, 'rgba(239, 68, 68, 0.7)');
  ctx.fillStyle = holoStrip;
  ctx.fillRect(inset, inset, innerW, 6);

  return canvas;
}

export async function renderVcaBackLabel(card: CardItem, config: SlabConfig): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const theme = LABEL_THEMES[config.labelColor] || LABEL_THEMES.cyber_cyan;
  const serial = config.serialNumber || card.certNumber || 'VCA-26-0101';

  // Outer border
  ctx.fillStyle = theme.border;
  ctx.fillRect(0, 0, 1200, 360);

  const inset = 10;
  const innerW = 1200 - inset * 2;
  const innerH = 360 - inset * 2;

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 360);
  bgGrad.addColorStop(0, theme.bgGrad1);
  bgGrad.addColorStop(1, theme.bgGrad2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(inset, inset, innerW, innerH);

  // Subgrades Box (Centering / Corners / Edges / Surface)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Arial Black", sans-serif';
  ctx.fillText('VCA OFFICIAL DIGITAL REGISTRY', 60, 70);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px monospace';
  ctx.fillText(`SECURITY IDENTIFIER: ${serial}`, 60, 105);

  // Subgrade breakdown
  const subgrades = [
    { label: 'CENTERING', score: config.centeringScore || '10.0' },
    { label: 'CORNERS', score: config.cornersScore || '10.0' },
    { label: 'EDGES', score: config.edgesScore || '9.5' },
    { label: 'SURFACE', score: config.surfaceScore || '10.0' },
  ];

  subgrades.forEach((sg, idx) => {
    const boxX = 60 + idx * 170;
    const boxY = 130;
    ctx.strokeStyle = theme.circuit;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX, boxY, 150, 75);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(sg.label, boxX + 15, boxY + 28);

    ctx.fillStyle = theme.primary;
    ctx.font = '900 28px monospace';
    ctx.fillText(sg.score, boxX + 15, boxY + 62);
  });

  // Authentic Barcode lines across bottom
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px monospace';
  ctx.fillText(`AUTHENTICATED BY VERIFIED CARD AUTHORITY • VCA GLOBAL NETWORK`, 60, 245);

  ctx.fillStyle = '#e2e8f0';
  for (let b = 60; b < 780; b += 10) {
    const barW = (b % 4 === 0) ? 5 : (b % 6 === 0 ? 3 : 2);
    ctx.fillRect(b, 260, barW, 55);
  }

  // QR Code on the right side
  try {
    const qrCanvas = document.createElement('canvas');
    const verifyUrl = `https://pokevault.vca/verify/${serial}?cert=official`;
    await QRCode.toCanvas(qrCanvas, verifyUrl, {
      width: 170,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(880, 70, 190, 190);
    ctx.drawImage(qrCanvas, 890, 80, 170, 170);

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 14px monospace';
    ctx.fillText('DIGITAL CERTIFICATE', 885, 290);
  } catch (err) {
    console.warn('Back label QR error:', err);
  }

  return canvas;
}
