/**
 * Promise-based bridge between main thread and worker pool.
 * Handles ImageBitmap creation and falls back to main-thread processing
 * when OffscreenCanvas is not available.
 */

import { supportsOffscreenCanvas, getWorkerPool } from './workerPool';
import { processImage as processImageMainThread, estimateFileSize as estimateMainThread } from './imageProcessor';
import type { ProcessOptions } from '@/types/worker';

export async function processImageViaWorker(
  imageUrl: string,
  options: ProcessOptions,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; width: number; height: number }> {
  if (!supportsOffscreenCanvas) {
    // Fallback to main-thread processing
    return processImageMainThread(imageUrl, {
      crop: options.crop ?? undefined,
      resizeWidth: options.resizeWidth,
      resizeHeight: options.resizeHeight,
      rotate: options.rotate,
      colorAdjustments: options.colorAdjustments,
      watermark: options.watermark ?? undefined,
      border: options.border ?? undefined,
      format: options.format,
      quality: options.quality,
    });
  }

  // Load image as ImageBitmap for zero-copy transfer
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  // Load watermark image if needed
  let watermarkBitmap: ImageBitmap | null = null;
  if (options.watermark?.type === 'image' && options.watermark.imageUrl) {
    const wmResponse = await fetch(options.watermark.imageUrl);
    const wmBlob = await wmResponse.blob();
    watermarkBitmap = await createImageBitmap(wmBlob);
  }

  const pool = getWorkerPool();
  return pool.process(imageBitmap, options, onProgress, watermarkBitmap);
}

export async function estimateFileSizeViaWorker(
  imageUrl: string,
  format: ProcessOptions['format'],
  quality: number
): Promise<number> {
  if (!supportsOffscreenCanvas) {
    return estimateMainThread(imageUrl, format, quality);
  }

  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const pool = getWorkerPool();
  const result = await pool.process(imageBitmap, { format, quality });
  return result.blob.size;
}
