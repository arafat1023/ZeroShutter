import type { CropData, RotateData, OutputFormat, ColorAdjustments, WatermarkData, BorderData } from '@/types';

// ─── Image Loading ───────────────────────────────────────────

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function getSourceDimensions(source: HTMLImageElement | HTMLCanvasElement): { w: number; h: number } {
  if ('naturalWidth' in source) return { w: source.naturalWidth, h: source.naturalHeight };
  return { w: source.width, h: source.height };
}

function toCanvas(source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  if (source instanceof HTMLCanvasElement) return source;
  const canvas = document.createElement('canvas');
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);
  return canvas;
}

// ─── Crop ────────────────────────────────────────────────────

export function cropImage(
  source: HTMLImageElement | HTMLCanvasElement,
  crop: CropData
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas;
}

// ─── Resize ──────────────────────────────────────────────────

export function resizeImage(
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  let currentSource: HTMLImageElement | HTMLCanvasElement = source;
  let { w: cw, h: ch } = getSourceDimensions(source);

  while (cw / 2 > targetWidth && ch / 2 > targetHeight) {
    const step = document.createElement('canvas');
    step.width = Math.round(cw / 2);
    step.height = Math.round(ch / 2);
    step.getContext('2d')!.drawImage(currentSource, 0, 0, step.width, step.height);
    currentSource = step;
    cw = step.width;
    ch = step.height;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);
  return canvas;
}

// ─── Rotate / Flip ───────────────────────────────────────────

export function rotateAndFlipImage(
  source: HTMLImageElement | HTMLCanvasElement,
  rotate: RotateData
): HTMLCanvasElement {
  const { w: sw, h: sh } = getSourceDimensions(source);
  const rad = (rotate.angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const nw = Math.round(sw * cos + sh * sin);
  const nh = Math.round(sw * sin + sh * cos);

  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d')!;

  // Fill background color for rotated gaps
  if (rotate.backgroundColor && rotate.backgroundColor !== 'transparent') {
    ctx.fillStyle = rotate.backgroundColor;
    ctx.fillRect(0, 0, nw, nh);
  }

  ctx.translate(nw / 2, nh / 2);
  ctx.rotate(rad);
  if (rotate.flipH) ctx.scale(-1, 1);
  if (rotate.flipV) ctx.scale(1, -1);
  ctx.drawImage(source, -sw / 2, -sh / 2);
  return canvas;
}

// ─── Color Adjustments (Pixel Manipulation) ──────────────────

export function applyColorAdjustments(
  source: HTMLImageElement | HTMLCanvasElement,
  adj: ColorAdjustments
): HTMLCanvasElement {
  const canvas = toCanvas(source);
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const br = adj.brightness / 100;
  const co = adj.contrast / 100;
  const sa = adj.saturation / 100;
  const contrastFactor = (1 + co) / (1 - Math.min(co, 0.99));

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

    // Hue rotation (simplified via HSL)
    if (adj.hue !== 0) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [nr, ng, nb] = hslToRgb((h + adj.hue / 360) % 1, s, l);
      r = nr; g = ng; b = nb;
    }

    data[i] = Math.round(clamp01(r) * 255);
    data[i + 1] = Math.round(clamp01(g) * 255);
    data[i + 2] = Math.round(clamp01(b) * 255);
  }

  ctx.putImageData(imageData, 0, 0);

  // Sharpness via unsharp mask
  if (adj.sharpness > 0) {
    return applySharpen(canvas, adj.sharpness / 100);
  }

  return canvas;
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

function applySharpen(canvas: HTMLCanvasElement, amount: number): HTMLCanvasElement {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  const sd = src.data, dd = dst.data;
  const a = amount * 2;

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

  const result = document.createElement('canvas');
  result.width = w;
  result.height = h;
  result.getContext('2d')!.putImageData(dst, 0, 0);
  return result;
}

// ─── CSS Filter String (for real-time preview) ───────────────

export function colorToCssFilter(adj: ColorAdjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 0) parts.push(`brightness(${1 + adj.brightness / 100})`);
  if (adj.contrast !== 0) parts.push(`contrast(${1 + adj.contrast / 100})`);
  if (adj.saturation !== 0) parts.push(`saturate(${1 + adj.saturation / 100})`);
  if (adj.hue !== 0) parts.push(`hue-rotate(${adj.hue}deg)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

// ─── Watermark Rendering ─────────────────────────────────────

export function applyWatermark(
  source: HTMLImageElement | HTMLCanvasElement,
  wm: WatermarkData
): HTMLCanvasElement {
  const canvas = toCanvas(source);
  const ctx = canvas.getContext('2d')!;
  const { w, h } = { w: canvas.width, h: canvas.height };

  if (wm.tiling) {
    drawTiledWatermark(ctx, wm, w, h);
  } else {
    drawSingleWatermark(ctx, wm, w, h);
  }

  return canvas;
}

function drawSingleWatermark(
  ctx: CanvasRenderingContext2D,
  wm: WatermarkData,
  canvasW: number,
  canvasH: number
) {
  ctx.save();
  const pos = getPositionCoords(wm.position, canvasW, canvasH, wm.fontSize);

  if (wm.type === 'text') {
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
  }

  ctx.restore();
}

function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  wm: WatermarkData,
  canvasW: number,
  canvasH: number
) {
  ctx.save();
  const style = `${wm.italic ? 'italic ' : ''}${wm.bold ? 'bold ' : ''}${wm.fontSize}px ${wm.fontFamily}`;
  ctx.font = style;
  ctx.fillStyle = wm.fontColor;
  ctx.globalAlpha = wm.fontOpacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const spacing = wm.tileSpacing || 200;
  const diagAngle = (wm.rotation || -30) * Math.PI / 180;

  // Extend beyond canvas bounds to cover rotation
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

function getPositionCoords(
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

// ─── Border / Padding ────────────────────────────────────────

export function applyBorder(
  source: HTMLImageElement | HTMLCanvasElement,
  border: BorderData
): HTMLCanvasElement {
  const { w: sw, h: sh } = getSourceDimensions(source);
  const nw = sw + border.left + border.right;
  const nh = sh + border.top + border.bottom;

  const canvas = document.createElement('canvas');
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext('2d')!;

  if (border.mode === 'blur') {
    // Draw blurred stretched version as background
    ctx.filter = 'blur(30px)';
    ctx.drawImage(source, 0, 0, nw, nh);
    ctx.filter = 'none';
    // Darken slightly for contrast
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, nw, nh);
  } else {
    ctx.fillStyle = border.color;
    ctx.fillRect(0, 0, nw, nh);
  }

  // Draw original on top
  ctx.drawImage(source, border.left, border.top, sw, sh);

  // Draw stroke if enabled
  if (border.stroke?.enabled && border.stroke.width > 0) {
    ctx.strokeStyle = border.stroke.color;
    ctx.lineWidth = border.stroke.width;
    const offset = border.stroke.width / 2;
    ctx.strokeRect(
      border.left - offset,
      border.top - offset,
      sw + border.stroke.width,
      sh + border.stroke.width
    );
  }

  return canvas;
}

// ─── Blob Conversion ─────────────────────────────────────────

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      },
      format,
      quality
    );
  });
}

// ─── Full Pipeline ───────────────────────────────────────────

export async function processImage(
  imageUrl: string,
  options: {
    crop?: CropData | null;
    resizeWidth?: number;
    resizeHeight?: number;
    rotate?: RotateData;
    colorAdjustments?: ColorAdjustments;
    watermark?: WatermarkData | null;
    border?: BorderData | null;
    format: OutputFormat;
    quality: number;
  }
): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImage(imageUrl);
  let result: HTMLImageElement | HTMLCanvasElement = img;

  // 1. Crop
  if (options.crop) {
    result = cropImage(result, options.crop);
  }

  // 2. Rotate/flip
  if (options.rotate && (options.rotate.angle !== 0 || options.rotate.flipH || options.rotate.flipV)) {
    result = rotateAndFlipImage(result, options.rotate);
  }

  // 3. Resize
  if (options.resizeWidth && options.resizeHeight) {
    result = resizeImage(result, options.resizeWidth, options.resizeHeight);
  }

  // 4. Color adjustments
  if (options.colorAdjustments) {
    const a = options.colorAdjustments;
    const hasChanges = a.brightness !== 0 || a.contrast !== 0 || a.saturation !== 0 || a.hue !== 0 || a.sharpness !== 0;
    if (hasChanges) {
      result = applyColorAdjustments(result, a);
    }
  }

  // 5. Border/padding
  if (options.border) {
    result = applyBorder(result, options.border);
  }

  // 6. Watermark (last, so it appears on top)
  if (options.watermark) {
    result = applyWatermark(result, options.watermark);
  }

  // Ensure we have a canvas
  if (result instanceof HTMLImageElement) {
    result = toCanvas(result);
  }

  const blob = await canvasToBlob(result, options.format, options.quality);
  return { blob, width: result.width, height: result.height };
}

export async function estimateFileSize(
  imageUrl: string,
  format: OutputFormat,
  quality: number
): Promise<number> {
  const img = await loadImage(imageUrl);
  const canvas = toCanvas(img);
  const blob = await canvasToBlob(canvas, format, quality);
  return blob.size;
}
