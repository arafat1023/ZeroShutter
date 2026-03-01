/**
 * DOM-free image processing functions that operate on ImageData.
 * Shared between main thread and Web Workers.
 */

import type { ColorAdjustments, WatermarkData } from '@/types';

// ─── Color Adjustments ──────────────────────────────────────

export function applyColorToImageData(imageData: ImageData, adj: ColorAdjustments): ImageData {
  const data = imageData.data;
  const br = adj.brightness / 100;
  const co = adj.contrast / 100;
  const contrastFactor = (1 + co) / (1 - Math.min(co, 0.99));
  const sa = adj.saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;

    // Brightness
    r += br;
    g += br;
    b += br;

    // Contrast
    r = (r - 0.5) * contrastFactor + 0.5;
    g = (g - 0.5) * contrastFactor + 0.5;
    b = (b - 0.5) * contrastFactor + 0.5;

    // Saturation
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * (1 + sa);
    g = gray + (g - gray) * (1 + sa);
    b = gray + (b - gray) * (1 + sa);

    // Hue rotation
    if (adj.hue !== 0) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [nr, ng, nb] = hslToRgb((h + adj.hue / 360) % 1, s, l);
      r = nr; g = ng; b = nb;
    }

    data[i] = Math.round(clamp01(r) * 255);
    data[i + 1] = Math.round(clamp01(g) * 255);
    data[i + 2] = Math.round(clamp01(b) * 255);
  }

  return imageData;
}

// ─── Sharpen (3x3 unsharp mask) ─────────────────────────────

export function applySharpenToImageData(
  src: ImageData,
  amount: number
): ImageData {
  const w = src.width;
  const h = src.height;
  const sd = src.data;
  const dst = new ImageData(w, h);
  const dd = dst.data;
  const a = amount * 2;

  // Copy edge pixels
  for (let i = 0; i < sd.length; i++) {
    dd[i] = sd[i];
  }

  // 3x3 sharpen kernel: [0, -a, 0, -a, 1+4a, -a, 0, -a, 0]
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const v =
          sd[idx + c] * (1 + 4 * a) -
          sd[((y - 1) * w + x) * 4 + c] * a -
          sd[((y + 1) * w + x) * 4 + c] * a -
          sd[(y * w + x - 1) * 4 + c] * a -
          sd[(y * w + x + 1) * 4 + c] * a;
        dd[idx + c] = Math.round(Math.min(255, Math.max(0, v)));
      }
      dd[idx + 3] = sd[idx + 3];
    }
  }

  return dst;
}

// ─── Watermark Drawing (works on any 2D context) ────────────

export function drawTextWatermark(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  wm: WatermarkData,
  canvasW: number,
  canvasH: number,
  watermarkImage?: ImageBitmap | HTMLImageElement | null
): void {
  if (wm.type === 'image' && watermarkImage) {
    drawImageWatermarkOnCtx(ctx, wm, canvasW, canvasH, watermarkImage);
    return;
  }

  if (wm.tiling) {
    drawTiledText(ctx, wm, canvasW, canvasH);
  } else {
    drawSingleText(ctx, wm, canvasW, canvasH);
  }
}

function drawSingleText(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  wm: WatermarkData,
  canvasW: number,
  canvasH: number
): void {
  ctx.save();
  const pos = getPositionCoords(wm.position, canvasW, canvasH, wm.fontSize);
  const style = `${wm.italic ? 'italic ' : ''}${wm.bold ? 'bold ' : ''}${wm.fontSize}px ${wm.fontFamily}`;
  ctx.font = style;
  ctx.fillStyle = wm.fontColor;
  ctx.globalAlpha = wm.fontOpacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (wm.rotation !== 0) {
    ctx.translate(pos.x, pos.y);
    ctx.rotate((wm.rotation * Math.PI) / 180);
    ctx.fillText(wm.text, 0, 0);
  } else {
    ctx.fillText(wm.text, pos.x, pos.y);
  }
  ctx.restore();
}

function drawTiledText(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  wm: WatermarkData,
  canvasW: number,
  canvasH: number
): void {
  ctx.save();
  const style = `${wm.italic ? 'italic ' : ''}${wm.bold ? 'bold ' : ''}${wm.fontSize}px ${wm.fontFamily}`;
  ctx.font = style;
  ctx.fillStyle = wm.fontColor;
  ctx.globalAlpha = wm.fontOpacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const spacing = wm.tileSpacing || 200;
  const diagAngle = (wm.rotation || -30) * Math.PI / 180;
  const margin = Math.max(canvasW, canvasH);

  for (let y = -margin; y < canvasH + margin; y += spacing) {
    for (let x = -margin; x < canvasW + margin; x += spacing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(diagAngle);
      ctx.fillText(wm.text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawImageWatermarkOnCtx(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  wm: WatermarkData,
  canvasW: number,
  canvasH: number,
  image: ImageBitmap | HTMLImageElement
): void {
  const imgW = 'naturalWidth' in image ? image.naturalWidth : image.width;
  const imgH = 'naturalHeight' in image ? image.naturalHeight : image.height;
  const targetW = (wm.scale / 100) * canvasW;
  const ratio = targetW / imgW;
  const targetH = imgH * ratio;

  ctx.save();
  ctx.globalAlpha = wm.imageOpacity;

  if (wm.tiling) {
    const spacing = wm.tileSpacing || 200;
    const diagAngle = (wm.rotation || 0) * Math.PI / 180;
    const margin = Math.max(canvasW, canvasH);

    for (let y = -margin; y < canvasH + margin; y += spacing) {
      for (let x = -margin; x < canvasW + margin; x += spacing) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(diagAngle);
        ctx.drawImage(image, -targetW / 2, -targetH / 2, targetW, targetH);
        ctx.restore();
      }
    }
  } else {
    const pos = getPositionCoords(wm.position, canvasW, canvasH, Math.max(targetW, targetH) / 2);
    if (wm.rotation !== 0) {
      ctx.translate(pos.x, pos.y);
      ctx.rotate((wm.rotation * Math.PI) / 180);
      ctx.drawImage(image, -targetW / 2, -targetH / 2, targetW, targetH);
    } else {
      ctx.drawImage(image, pos.x - targetW / 2, pos.y - targetH / 2, targetW, targetH);
    }
  }

  ctx.restore();
}

// ─── Shared Helpers ─────────────────────────────────────────

export function getPositionCoords(
  pos: string,
  w: number,
  h: number,
  margin: number
): { x: number; y: number } {
  const m = margin * 0.8;
  const positions: Record<string, { x: number; y: number }> = {
    'top-left': { x: m, y: m },
    'top-center': { x: w / 2, y: m },
    'top-right': { x: w - m, y: m },
    'center-left': { x: m, y: h / 2 },
    'center': { x: w / 2, y: h / 2 },
    'center-right': { x: w - m, y: h / 2 },
    'bottom-left': { x: m, y: h - m },
    'bottom-center': { x: w / 2, y: h - m },
    'bottom-right': { x: w - m, y: h - m },
  };
  return positions[pos] ?? positions['center'];
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}
