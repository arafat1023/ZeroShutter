/**
 * Canvas-agnostic image pipeline.
 *
 * Every function here works with both `OffscreenCanvas` (inside the worker) and
 * `HTMLCanvasElement` (main-thread fallback), so the exact same code path
 * produces the exported bytes regardless of where it runs.
 */
import type { CropData, RotateData, OutputFormat, ColorAdjustments, WatermarkData, BorderData, ResizeFit } from '@/types';

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
export type AnyCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
export type PipelineSource = ImageBitmap | AnyCanvas;

export interface PipelineOptions {
  crop?: CropData | null;
  resizeWidth?: number;
  resizeHeight?: number;
  resizeFit?: ResizeFit;
  resizeBackground?: string;
  rotate?: RotateData;
  colorAdjustments?: ColorAdjustments;
  watermark?: WatermarkData | null;
  /**
   * Decoded watermark artwork. Workers have no `Image`, and blob URLs would
   * have to be re-fetched per call, so the caller decodes once and transfers.
   */
  watermarkImage?: ImageBitmap | null;
  border?: BorderData | null;
  format: OutputFormat;
  quality: number;
}

// ─── Canvas helpers ──────────────────────────────────────────

export function createCanvas(width: number, height: number): AnyCanvas {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function ctx2d(canvas: AnyCanvas): AnyCtx {
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) throw new Error('Could not acquire a 2D canvas context');
  return ctx as AnyCtx;
}

function isCanvas(source: PipelineSource): source is AnyCanvas {
  return typeof (source as AnyCanvas).getContext === 'function';
}

/** Both ImageBitmap and canvases expose `width`/`height`, so this is uniform. */
function dimensions(source: PipelineSource): { w: number; h: number } {
  return { w: source.width, h: source.height };
}

/** Returns the source itself when it is already a canvas, otherwise paints it into one. */
function toCanvas(source: PipelineSource): AnyCanvas {
  if (isCanvas(source)) return source;
  const canvas = createCanvas(source.width, source.height);
  ctx2d(canvas).drawImage(source, 0, 0);
  return canvas;
}

export function canvasToBlob(canvas: AnyCanvas, format: OutputFormat, quality: number): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: format, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      format,
      quality
    );
  });
}

// ─── Crop ────────────────────────────────────────────────────

export function cropImage(source: PipelineSource, crop: CropData): AnyCanvas {
  const { w, h } = dimensions(source);
  // Clamp so a stale crop (e.g. left over from a larger image) can never
  // produce a zero-sized or out-of-bounds canvas.
  const x = Math.max(0, Math.min(Math.round(crop.x), w - 1));
  const y = Math.max(0, Math.min(Math.round(crop.y), h - 1));
  const cw = Math.max(1, Math.min(Math.round(crop.width), w - x));
  const ch = Math.max(1, Math.min(Math.round(crop.height), h - y));

  const canvas = createCanvas(cw, ch);
  ctx2d(canvas).drawImage(source, x, y, cw, ch, 0, 0, cw, ch);
  return canvas;
}

// ─── Resize ──────────────────────────────────────────────────

export function resizeImage(source: PipelineSource, targetWidth: number, targetHeight: number): AnyCanvas {
  const tw = Math.max(1, Math.round(targetWidth));
  const th = Math.max(1, Math.round(targetHeight));

  let current: PipelineSource = source;
  let { w: cw, h: ch } = dimensions(source);

  // Halve repeatedly before the final draw so large downscales stay sharp.
  // `||` (not `&&`) so non-matching aspect ratios still get stepped down.
  while (cw / 2 >= tw || ch / 2 >= th) {
    const nextW = Math.max(tw, Math.round(cw / 2));
    const nextH = Math.max(th, Math.round(ch / 2));
    if (nextW === cw && nextH === ch) break;
    const step = createCanvas(nextW, nextH);
    const stepCtx = ctx2d(step);
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(current, 0, 0, nextW, nextH);
    current = step;
    cw = nextW;
    ch = nextH;
  }

  const canvas = createCanvas(tw, th);
  const ctx = ctx2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, 0, 0, tw, th);
  return canvas;
}

/**
 * Places the source inside a target box. `contain` and `cover` preserve the
 * aspect ratio, which is what makes a single target size safe to apply across
 * images of differing shapes.
 */
export function fitImage(
  source: PipelineSource,
  targetWidth: number,
  targetHeight: number,
  fit: ResizeFit,
  background: string
): AnyCanvas {
  const tw = Math.max(1, Math.round(targetWidth));
  const th = Math.max(1, Math.round(targetHeight));
  if (fit === 'stretch') return resizeImage(source, tw, th);

  const { w: sw, h: sh } = dimensions(source);
  const ratio = fit === 'cover' ? Math.max(tw / sw, th / sh) : Math.min(tw / sw, th / sh);
  const dw = Math.max(1, Math.round(sw * ratio));
  const dh = Math.max(1, Math.round(sh * ratio));

  // Route through resizeImage so the step-down quality path still applies.
  const scaled = resizeImage(source, dw, dh);

  const canvas = createCanvas(tw, th);
  const ctx = ctx2d(canvas);
  if (background && background !== 'transparent') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, tw, th);
  }
  ctx.drawImage(scaled, Math.round((tw - dw) / 2), Math.round((th - dh) / 2));
  return canvas;
}

// ─── Rotate / Flip ───────────────────────────────────────────

export function rotateAndFlipImage(source: PipelineSource, rotate: RotateData): AnyCanvas {
  const { w: sw, h: sh } = dimensions(source);
  const rad = (rotate.angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const nw = Math.round(sw * cos + sh * sin);
  const nh = Math.round(sw * sin + sh * cos);

  const canvas = createCanvas(nw, nh);
  const ctx = ctx2d(canvas);
  ctx.translate(nw / 2, nh / 2);
  ctx.rotate(rad);
  if (rotate.flipH) ctx.scale(-1, 1);
  if (rotate.flipV) ctx.scale(1, -1);
  ctx.drawImage(source, -sw / 2, -sh / 2);
  return canvas;
}

// ─── Colour maths ────────────────────────────────────────────
//
// The canvas maths below deliberately mirrors the CSS filter spec so that the
// live preview (`colorToCssFilter`) and the exported pixels agree.

type Mat3 = [number, number, number, number, number, number, number, number, number];

/** `saturate()` from the Filter Effects spec. */
function saturateMatrix(s: number): Mat3 {
  return [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
  ];
}

/** `hue-rotate()` from the Filter Effects spec. */
function hueRotateMatrix(degrees: number): Mat3 {
  const rad = (degrees * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ];
}

/**
 * Applies the CSS filter chain one stage at a time, clamping to 0-255 between
 * stages. Browsers clamp between filter functions too, so collapsing this into
 * a single matrix would drift from the live preview wherever an intermediate
 * value overshoots (verified: up to 53/255 on a bright, high-contrast image).
 */
function applyColorMatrix(data: Uint8ClampedArray, adj: ColorAdjustments): void {
  const brightness = 1 + adj.brightness / 100;
  const contrast = 1 + adj.contrast / 100;
  const contrastBias = 127.5 * (1 - contrast);

  const saturation = adj.saturation !== 0 ? saturateMatrix(1 + adj.saturation / 100) : null;
  const hue = adj.hue !== 0 ? hueRotateMatrix(adj.hue) : null;

  const useBrightness = adj.brightness !== 0;
  const useContrast = adj.contrast !== 0;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (useBrightness) {
      r = clamp255(r * brightness);
      g = clamp255(g * brightness);
      b = clamp255(b * brightness);
    }

    if (useContrast) {
      r = clamp255(r * contrast + contrastBias);
      g = clamp255(g * contrast + contrastBias);
      b = clamp255(b * contrast + contrastBias);
    }

    if (saturation) {
      const nr = clamp255(saturation[0] * r + saturation[1] * g + saturation[2] * b);
      const ng = clamp255(saturation[3] * r + saturation[4] * g + saturation[5] * b);
      const nb = clamp255(saturation[6] * r + saturation[7] * g + saturation[8] * b);
      r = nr; g = ng; b = nb;
    }

    if (hue) {
      const nr = clamp255(hue[0] * r + hue[1] * g + hue[2] * b);
      const ng = clamp255(hue[3] * r + hue[4] * g + hue[5] * b);
      const nb = clamp255(hue[6] * r + hue[7] * g + hue[8] * b);
      r = nr; g = ng; b = nb;
    }

    if (adj.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

export function hasColorChanges(adj: ColorAdjustments): boolean {
  return (
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.hue !== 0 ||
    adj.sharpness !== 0 ||
    adj.invert
  );
}

export function applyColorAdjustments(source: PipelineSource, adj: ColorAdjustments): AnyCanvas {
  let canvas = toCanvas(source);

  const needsColorPass =
    adj.brightness !== 0 || adj.contrast !== 0 || adj.saturation !== 0 || adj.hue !== 0 || adj.invert;

  if (needsColorPass) {
    const ctx = ctx2d(canvas);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyColorMatrix(imageData.data, adj);
    ctx.putImageData(imageData, 0, 0);
  }

  if (adj.sharpness > 0) {
    canvas = applySharpen(canvas, adj.sharpness / 100);
  }

  return canvas;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** Unsharp mask with the 3x3 kernel [0,-a,0, -a,1+4a,-a, 0,-a,0]. */
function applySharpen(canvas: AnyCanvas, amount: number): AnyCanvas {
  const w = canvas.width;
  const h = canvas.height;
  if (w < 3 || h < 3) return canvas;

  const ctx = ctx2d(canvas);
  const src = ctx.getImageData(0, 0, w, h);
  const sd = src.data;
  const dd = new Uint8ClampedArray(sd); // start from a copy so the border pixels survive
  const a = amount * 2;
  const centre = 1 + 4 * a;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const up = idx - w * 4;
      const down = idx + w * 4;
      for (let c = 0; c < 3; c++) {
        dd[idx + c] = clamp255(
          sd[idx + c] * centre - (sd[up + c] + sd[down + c] + sd[idx - 4 + c] + sd[idx + 4 + c]) * a
        );
      }
    }
  }

  const result = createCanvas(w, h);
  ctx2d(result).putImageData(new ImageData(dd, w, h), 0, 0);
  return result;
}

// ─── Watermark ───────────────────────────────────────────────

export function applyWatermark(
  source: PipelineSource,
  wm: WatermarkData,
  artwork?: ImageBitmap | null
): AnyCanvas {
  if (wm.type === 'text' && !wm.text.trim()) return toCanvas(source);
  if (wm.type === 'image' && !artwork) return toCanvas(source);

  const canvas = toCanvas(source);
  const ctx = ctx2d(canvas);

  if (wm.type === 'image' && artwork) {
    drawImageWatermark(ctx, wm, artwork, canvas.width, canvas.height);
  } else if (wm.tiling) {
    drawTiledWatermark(ctx, wm, canvas.width, canvas.height);
  } else {
    drawSingleWatermark(ctx, wm, canvas.width, canvas.height);
  }

  return canvas;
}

function watermarkFont(wm: WatermarkData): string {
  return `${wm.italic ? 'italic ' : ''}${wm.bold ? 'bold ' : ''}${wm.fontSize}px ${wm.fontFamily}`;
}

function drawSingleWatermark(ctx: AnyCtx, wm: WatermarkData, canvasW: number, canvasH: number) {
  ctx.save();
  ctx.font = watermarkFont(wm);
  ctx.fillStyle = wm.fontColor;
  ctx.globalAlpha = wm.fontOpacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const { x, y } = watermarkCentre(wm, ctx.measureText(wm.text).width, wm.fontSize, canvasW, canvasH);

  // Rotating around the text's own centre is both what users expect and what
  // the DOM preview does, which keeps the two in step.
  ctx.translate(x, y);
  if (wm.rotation !== 0) ctx.rotate((wm.rotation * Math.PI) / 180);
  ctx.fillText(wm.text, 0, 0);
  ctx.restore();
}

function drawTiledWatermark(ctx: AnyCtx, wm: WatermarkData, canvasW: number, canvasH: number) {
  ctx.save();
  ctx.font = watermarkFont(wm);
  ctx.fillStyle = wm.fontColor;
  ctx.globalAlpha = wm.fontOpacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const angle = ((wm.rotation || -30) * Math.PI) / 180;

  for (const { x, y } of watermarkTilePositions(wm, canvasW, canvasH)) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(wm.text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawImageWatermark(
  ctx: AnyCtx,
  wm: WatermarkData,
  artwork: ImageBitmap,
  canvasW: number,
  canvasH: number
) {
  const size = watermarkImageSize(wm, artwork.width, artwork.height, canvasW);
  ctx.save();
  ctx.globalAlpha = wm.imageOpacity;

  const draw = (x: number, y: number, angleDeg: number) => {
    ctx.save();
    ctx.translate(x, y);
    if (angleDeg !== 0) ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.drawImage(artwork, -size.width / 2, -size.height / 2, size.width, size.height);
    ctx.restore();
  };

  if (wm.tiling) {
    const angle = wm.rotation || -30;
    for (const { x, y } of watermarkTilePositions(wm, canvasW, canvasH)) draw(x, y, angle);
  } else {
    const { x, y } = watermarkImageCentre(wm, size, canvasW, canvasH);
    draw(x, y, wm.rotation);
  }

  ctx.restore();
}

// ─── Watermark geometry (shared with the live preview) ───────

/** Inset from the canvas edge, in source pixels. */
function watermarkMargin(wm: WatermarkData, canvasW: number, canvasH: number): number {
  return wm.type === 'image'
    ? Math.min(canvasW, canvasH) * 0.03
    : wm.fontSize * 0.8;
}

/** Rendered size of an image watermark, scaled as a percentage of canvas width. */
export function watermarkImageSize(
  wm: WatermarkData,
  naturalWidth: number,
  naturalHeight: number,
  canvasW: number
): { width: number; height: number } {
  const width = Math.max(1, (canvasW * wm.scale) / 100);
  const aspect = naturalWidth > 0 && naturalHeight > 0 ? naturalWidth / naturalHeight : 1;
  return { width, height: width / aspect };
}

/** Centre point of an image watermark, in source pixels. */
export function watermarkImageCentre(
  wm: WatermarkData,
  size: { width: number; height: number },
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  return anchorCentre(wm, size.width, size.height, canvasW, canvasH);
}

/** Centre point of a text watermark, in source pixels. */
function watermarkCentre(
  wm: WatermarkData,
  textWidth: number,
  textHeight: number,
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  return anchorCentre(wm, textWidth, textHeight, canvasW, canvasH);
}

function anchorCentre(
  wm: WatermarkData,
  width: number,
  height: number,
  canvasW: number,
  canvasH: number
): { x: number; y: number } {
  const margin = watermarkMargin(wm, canvasW, canvasH);
  const pos = wm.position;

  const x = pos.endsWith('-left')
    ? margin + width / 2
    : pos.endsWith('-right')
    ? canvasW - margin - width / 2
    : canvasW / 2;

  const y = pos.startsWith('top')
    ? margin + height / 2
    : pos.startsWith('bottom')
    ? canvasH - margin - height / 2
    : canvasH / 2;

  return { x, y };
}

/** Grid anchors for a tiled watermark, in source pixels. */
export function watermarkTilePositions(
  wm: WatermarkData,
  canvasW: number,
  canvasH: number
): { x: number; y: number }[] {
  const spacing = Math.max(20, wm.tileSpacing || 200);
  const overflow = Math.max(canvasW, canvasH) * 0.5;
  const positions: { x: number; y: number }[] = [];
  for (let y = -overflow; y < canvasH + overflow; y += spacing) {
    for (let x = -overflow; x < canvasW + overflow; x += spacing) {
      positions.push({ x, y });
    }
  }
  return positions;
}

// ─── Border / Padding ────────────────────────────────────────

export function applyBorder(source: PipelineSource, border: BorderData): AnyCanvas {
  const { w: sw, h: sh } = dimensions(source);
  const nw = sw + border.left + border.right;
  const nh = sh + border.top + border.bottom;

  const canvas = createCanvas(nw, nh);
  const ctx = ctx2d(canvas);

  if (border.mode === 'blur') {
    // Cover-fit the source so the blurred backdrop never letterboxes.
    const scale = Math.max(nw / sw, nh / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.filter = `blur(${Math.max(8, Math.round(Math.min(nw, nh) * 0.04))}px)`;
    ctx.drawImage(source, (nw - dw) / 2, (nh - dh) / 2, dw, dh);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, nw, nh);
  } else {
    ctx.fillStyle = border.color;
    ctx.fillRect(0, 0, nw, nh);
  }

  ctx.drawImage(source, border.left, border.top, sw, sh);
  return canvas;
}

// ─── Full pipeline ───────────────────────────────────────────

export function runPipeline(source: PipelineSource, options: PipelineOptions): AnyCanvas {
  let result: PipelineSource = source;

  if (options.crop) result = cropImage(result, options.crop);

  if (options.rotate && (options.rotate.angle !== 0 || options.rotate.flipH || options.rotate.flipV)) {
    result = rotateAndFlipImage(result, options.rotate);
  }

  if (options.resizeWidth && options.resizeHeight) {
    result = fitImage(
      result,
      options.resizeWidth,
      options.resizeHeight,
      options.resizeFit ?? 'stretch',
      options.resizeBackground ?? '#ffffff'
    );
  }

  if (options.colorAdjustments && hasColorChanges(options.colorAdjustments)) {
    result = applyColorAdjustments(result, options.colorAdjustments);
  }

  if (options.border) result = applyBorder(result, options.border);

  // Watermark last so it sits on top of the border too.
  if (options.watermark) result = applyWatermark(result, options.watermark, options.watermarkImage);

  return toCanvas(result);
}

export async function renderToBlob(
  source: PipelineSource,
  options: PipelineOptions
): Promise<{ blob: Blob; width: number; height: number }> {
  const canvas = runPipeline(source, options);
  const blob = await canvasToBlob(canvas, options.format, options.quality);
  return { blob, width: canvas.width, height: canvas.height };
}
