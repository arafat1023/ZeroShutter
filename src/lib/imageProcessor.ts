import type { ColorAdjustments, OutputFormat } from '@/types';
import { renderToBlob, type PipelineOptions } from '@/lib/pipeline';
import type { WorkerRequest, WorkerResponse } from '@/workers/imageWorker';

export type { PipelineOptions };

// ─── Decoding ────────────────────────────────────────────────

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = src;
  });
}

/**
 * Decodes to an ImageBitmap when possible so the pixels can be transferred to
 * the worker. Some sources (notably SVG in Safari) refuse `createImageBitmap`,
 * in which case we fall back to an `<img>` painted onto a canvas.
 */
async function decode(source: Blob): Promise<ImageBitmap | HTMLCanvasElement> {
  try {
    return await createImageBitmap(source);
  } catch {
    const url = URL.createObjectURL(source);
    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not acquire a 2D canvas context');
      ctx.drawImage(img, 0, 0);
      return canvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// ─── Worker plumbing ─────────────────────────────────────────

const canUseWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

let worker: Worker | null = null;
let nextRequestId = 1;
const pending = new Map<number, { resolve: (v: ProcessResult) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (!canUseWorker) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL('../workers/imageWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      if (message.ok) entry.resolve({ blob: message.blob, width: message.width, height: message.height });
      else entry.reject(new Error(message.error));
    };
    worker.onerror = () => {
      // Fail every in-flight request so callers fall back rather than hang.
      pending.forEach((entry) => entry.reject(new Error('Image worker crashed')));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export interface ProcessResult {
  blob: Blob;
  width: number;
  height: number;
}

// ─── Public pipeline API ─────────────────────────────────────

/**
 * Runs the full edit pipeline. Uses a Web Worker with OffscreenCanvas when the
 * browser supports it, and falls back to the main thread otherwise.
 */
export async function processImage(source: Blob, options: PipelineOptions): Promise<ProcessResult> {
  const decoded = await decode(source);

  if (isBitmap(decoded)) {
    const activeWorker = getWorker();
    if (activeWorker) {
      const bitmap = decoded;
      const id = nextRequestId++;
      const request: WorkerRequest = { id, bitmap, options };
      const result = new Promise<ProcessResult>((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
      // The bitmap is transferred, so the worker owns (and closes) it from here.
      activeWorker.postMessage(request, [bitmap]);

      try {
        return await result;
      } catch {
        // The worker died or refused the job. The bitmap went with it, so
        // decode again and finish on the main thread rather than failing.
        return processOnMainThread(source, options);
      }
    }

    try {
      return await renderToBlob(decoded, options);
    } finally {
      decoded.close();
    }
  }

  return renderToBlob(decoded, options);
}

async function processOnMainThread(source: Blob, options: PipelineOptions): Promise<ProcessResult> {
  const decoded = await decode(source);
  try {
    return await renderToBlob(decoded, options);
  } finally {
    if (isBitmap(decoded)) decoded.close();
  }
}

function isBitmap(value: ImageBitmap | HTMLCanvasElement): value is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap;
}

/**
 * Estimates the exported file size by running the real pipeline, so crop,
 * resize, border and colour changes are all reflected in the number shown.
 */
export async function estimateFileSize(source: Blob, options: PipelineOptions): Promise<number> {
  const { blob } = await processImage(source, options);
  return blob.size;
}

// ─── Format support detection ────────────────────────────────

let supportedFormatsPromise: Promise<Set<OutputFormat>> | null = null;

/**
 * Not every browser can *encode* every format — Chrome, for instance, silently
 * hands back a PNG when asked for AVIF. Probing keeps us from writing a PNG
 * into a file named `.avif`.
 */
export function getSupportedFormats(): Promise<Set<OutputFormat>> {
  if (supportedFormatsPromise) return supportedFormatsPromise;

  supportedFormatsPromise = (async () => {
    const candidates: OutputFormat[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const supported = new Set<OutputFormat>(['image/png']);
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    await Promise.all(
      candidates.map(
        (format) =>
          new Promise<void>((resolve) => {
            try {
              canvas.toBlob(
                (blob) => {
                  if (blob?.type === format) supported.add(format);
                  resolve();
                },
                format,
                0.8
              );
            } catch {
              resolve();
            }
          })
      )
    );

    return supported;
  })();

  return supportedFormatsPromise;
}

// ─── CSS filter string (real-time preview) ───────────────────

/**
 * Mirrors the order and semantics used by `applyColorAdjustments`, so the
 * on-canvas preview matches the exported pixels.
 */
export function colorToCssFilter(adj: ColorAdjustments): string {
  const parts: string[] = [];
  if (adj.brightness !== 0) parts.push(`brightness(${1 + adj.brightness / 100})`);
  if (adj.contrast !== 0) parts.push(`contrast(${1 + adj.contrast / 100})`);
  if (adj.saturation !== 0) parts.push(`saturate(${1 + adj.saturation / 100})`);
  if (adj.hue !== 0) parts.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.invert) parts.push('invert(1)');
  return parts.length > 0 ? parts.join(' ') : 'none';
}
