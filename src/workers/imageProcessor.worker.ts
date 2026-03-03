/**
 * Web Worker for off-main-thread image processing.
 * Uses OffscreenCanvas for all operations.
 */

import { applyColorToImageData, applySharpenToImageData, drawTextWatermark } from '../lib/imageProcessingCore';
import type { WorkerRequest, WorkerResponse, ProcessOptions } from '../types/worker';
import type { CropData, RotateData, ColorAdjustments, BorderData, WatermarkData } from '../types/index';

function sendProgress(id: string, progress: number): void {
  const msg: WorkerResponse = { id, type: 'progress', progress };
  self.postMessage(msg);
}

function sendResult(id: string, blob: Blob, width: number, height: number): void {
  const msg: WorkerResponse = { id, type: 'result', blob, width, height };
  self.postMessage(msg);
}

function sendError(id: string, error: string): void {
  const msg: WorkerResponse = { id, type: 'error', error };
  self.postMessage(msg);
}

// ─── Pipeline Steps ─────────────────────────────────────────

function cropCanvas(
  source: OffscreenCanvas,
  crop: CropData
): OffscreenCanvas {
  const canvas = new OffscreenCanvas(crop.width, crop.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas;
}

function rotateCanvas(
  source: OffscreenCanvas,
  rotate: RotateData
): OffscreenCanvas {
  const sw = source.width;
  const sh = source.height;
  const rad = (rotate.angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const nw = Math.round(sw * cos + sh * sin);
  const nh = Math.round(sw * sin + sh * cos);

  const canvas = new OffscreenCanvas(nw, nh);
  const ctx = canvas.getContext('2d')!;

  // Fill background
  const bg = (rotate as RotateData & { backgroundColor?: string }).backgroundColor;
  if (bg && bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, nw, nh);
  }

  ctx.translate(nw / 2, nh / 2);
  ctx.rotate(rad);
  if (rotate.flipH) ctx.scale(-1, 1);
  if (rotate.flipV) ctx.scale(1, -1);
  ctx.drawImage(source, -sw / 2, -sh / 2);
  return canvas;
}

function resizeCanvas(
  source: OffscreenCanvas,
  targetWidth: number,
  targetHeight: number
): OffscreenCanvas {
  let currentSource: OffscreenCanvas = source;
  let cw = source.width;
  let ch = source.height;

  // Step-down for quality
  while (cw / 2 > targetWidth && ch / 2 > targetHeight) {
    const step = new OffscreenCanvas(Math.round(cw / 2), Math.round(ch / 2));
    step.getContext('2d')!.drawImage(currentSource, 0, 0, step.width, step.height);
    currentSource = step;
    cw = step.width;
    ch = step.height;
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);
  return canvas;
}

function applyColor(
  source: OffscreenCanvas,
  adj: ColorAdjustments
): OffscreenCanvas {
  const ctx = source.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, source.width, source.height);
  const processed = applyColorToImageData(imageData, adj);
  ctx.putImageData(processed, 0, 0);

  if (adj.sharpness > 0) {
    const srcData = ctx.getImageData(0, 0, source.width, source.height);
    const sharpened = applySharpenToImageData(srcData, adj.sharpness / 100);
    ctx.putImageData(sharpened, 0, 0);
  }

  return source;
}

function applyBorderToCanvas(
  source: OffscreenCanvas,
  border: BorderData
): OffscreenCanvas {
  const sw = source.width;
  const sh = source.height;
  const nw = sw + border.left + border.right;
  const nh = sh + border.top + border.bottom;

  const canvas = new OffscreenCanvas(nw, nh);
  const ctx = canvas.getContext('2d')!;

  if (border.mode === 'blur') {
    ctx.filter = 'blur(30px)';
    ctx.drawImage(source, 0, 0, nw, nh);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, nw, nh);
  } else {
    ctx.fillStyle = border.color;
    ctx.fillRect(0, 0, nw, nh);
  }

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

function applyWatermarkToCanvas(
  source: OffscreenCanvas,
  wm: WatermarkData,
  watermarkBitmap?: ImageBitmap | null
): OffscreenCanvas {
  const ctx = source.getContext('2d')!;
  drawTextWatermark(ctx, wm, source.width, source.height, watermarkBitmap);
  return source;
}

function bitmapToCanvas(bitmap: ImageBitmap): OffscreenCanvas {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

// ─── Main Pipeline ──────────────────────────────────────────

async function processImage(
  id: string,
  imageBitmap: ImageBitmap,
  options: ProcessOptions,
  watermarkBitmap?: ImageBitmap | null
): Promise<void> {
  let canvas = bitmapToCanvas(imageBitmap);
  imageBitmap.close();

  // 1. Crop
  if (options.crop) {
    canvas = cropCanvas(canvas, options.crop);
  }
  sendProgress(id, 0.15);

  // 2. Rotate/flip
  if (options.rotate && (options.rotate.angle !== 0 || options.rotate.flipH || options.rotate.flipV)) {
    canvas = rotateCanvas(canvas, options.rotate);
  }
  sendProgress(id, 0.30);

  // 3. Resize
  if (options.resizeWidth && options.resizeHeight) {
    canvas = resizeCanvas(canvas, options.resizeWidth, options.resizeHeight);
  }
  sendProgress(id, 0.45);

  // 4. Color adjustments
  if (options.colorAdjustments) {
    const a = options.colorAdjustments;
    const hasChanges = a.brightness !== 0 || a.contrast !== 0 || a.saturation !== 0 || a.hue !== 0 || a.sharpness !== 0;
    if (hasChanges) {
      canvas = applyColor(canvas, a);
    }
  }
  sendProgress(id, 0.60);

  // 5. Border/padding
  if (options.border) {
    canvas = applyBorderToCanvas(canvas, options.border);
  }
  sendProgress(id, 0.75);

  // 6. Watermark
  if (options.watermark) {
    canvas = applyWatermarkToCanvas(canvas, options.watermark, watermarkBitmap);
  }
  sendProgress(id, 0.85);

  // 7. Encode to blob
  const blob = await canvas.convertToBlob({
    type: options.format,
    quality: options.quality,
  });
  sendResult(id, blob, canvas.width, canvas.height);
}

// ─── Message Handler ────────────────────────────────────────

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, type, imageBitmap, watermarkBitmap, options } = e.data;

  if (type === 'process') {
    try {
      await processImage(id, imageBitmap, options, watermarkBitmap);
    } catch (err) {
      sendError(id, err instanceof Error ? err.message : 'Unknown worker error');
    }
  }
};
