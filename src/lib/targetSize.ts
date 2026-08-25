import { processImage } from '@/lib/imageProcessor';
import type { PipelineOptions } from '@/lib/pipeline';
import { FORMAT_OPTIONS } from '@/lib/constants';

const MIN_QUALITY = 0.05;
const MAX_QUALITY = 0.98;
const QUALITY_STEPS = 7;
/** Backstop so a hopeless target can never grind through dozens of renders. */
const MAX_ATTEMPTS = 20;
/** Progressively smaller dimensions to fall back on when quality alone can't get there. */
const SCALE_STEPS = [0.85, 0.7, 0.55, 0.4, 0.28, 0.18];

export interface TargetSizeResult {
  /** Quality that met the target, or 1 for lossless formats. */
  quality: number;
  /** Fraction of the natural output dimensions, 1 when unscaled. */
  scale: number;
  width: number;
  height: number;
  bytes: number;
  attempts: number;
}

export interface TargetSizeHooks {
  onAttempt?: (attempt: number, bytes: number) => void;
  isCancelled?: () => boolean;
}

class Cancelled extends Error {}

/**
 * Finds the highest-quality settings whose encoded size fits within
 * `targetBytes`. Quality is searched first; only if the format's floor is
 * still too large do the dimensions come down, because losing pixels is a
 * bigger concession than losing precision.
 */
export async function fitToTargetSize(
  source: Blob,
  options: PipelineOptions,
  targetBytes: number,
  hooks: TargetSizeHooks = {}
): Promise<TargetSizeResult | null> {
  const lossy = FORMAT_OPTIONS.find((f) => f.value === options.format)?.lossy ?? false;
  let attempts = 0;

  const check = () => {
    if (hooks.isCancelled?.()) throw new Cancelled();
  };

  const render = async (quality: number, scale: number, baseW: number, baseH: number) => {
    check();
    const scaled =
      scale === 1
        ? {}
        : {
            resizeWidth: Math.max(1, Math.round(baseW * scale)),
            resizeHeight: Math.max(1, Math.round(baseH * scale)),
          };
    const result = await processImage(source, { ...options, quality, ...scaled });
    attempts++;
    hooks.onAttempt?.(attempts, result.blob.size);
    return result;
  };

  try {
    // First pass doubles as a probe for the natural output dimensions.
    const probe = await render(lossy ? MAX_QUALITY : options.quality, 1, 0, 0);
    const baseW = probe.width;
    const baseH = probe.height;

    if (probe.blob.size <= targetBytes) {
      return {
        quality: lossy ? MAX_QUALITY : 1,
        scale: 1,
        width: baseW,
        height: baseH,
        bytes: probe.blob.size,
        attempts,
      };
    }

    /** Highest quality at this scale that fits, or null. */
    const searchQuality = async (scale: number): Promise<TargetSizeResult | null> => {
      // Probe the floor first. If even the worst quality overshoots, a binary
      // search here is seven wasted renders — move on to a smaller scale.
      const floor = await render(MIN_QUALITY, scale, baseW, baseH);
      if (floor.blob.size > targetBytes) return null;

      let low = MIN_QUALITY;
      let high = MAX_QUALITY;
      let best: TargetSizeResult = {
        quality: MIN_QUALITY,
        scale,
        width: floor.width,
        height: floor.height,
        bytes: floor.blob.size,
        attempts,
      };

      for (let i = 0; i < QUALITY_STEPS; i++) {
        if (attempts >= MAX_ATTEMPTS) break;
        const mid = (low + high) / 2;
        const result = await render(mid, scale, baseW, baseH);
        if (result.blob.size <= targetBytes) {
          best = {
            quality: mid,
            scale,
            width: result.width,
            height: result.height,
            bytes: result.blob.size,
            attempts,
          };
          low = mid; // room to spend on quality
        } else {
          high = mid;
        }
      }
      return best;
    };

    if (lossy) {
      const found = await searchQuality(1);
      if (found) return { ...found, attempts };
    }

    // Quality alone was not enough (or the format is lossless): shrink.
    for (const scale of SCALE_STEPS) {
      if (attempts >= MAX_ATTEMPTS) break;
      if (lossy) {
        const found = await searchQuality(scale);
        if (found) return { ...found, attempts };
      } else {
        const result = await render(options.quality, scale, baseW, baseH);
        if (result.blob.size <= targetBytes) {
          return {
            quality: 1,
            scale,
            width: result.width,
            height: result.height,
            bytes: result.blob.size,
            attempts,
          };
        }
      }
    }

    return null;
  } catch (error) {
    if (error instanceof Cancelled) return null;
    throw error;
  }
}
