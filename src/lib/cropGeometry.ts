import type { CropData } from '@/types';

export type CropHandle =
  | 'move'
  | 'n' | 's' | 'e' | 'w'
  | 'nw' | 'ne' | 'sw' | 'se';

const MIN_CROP = 16;

export function fullFrameCrop(width: number, height: number): CropData {
  return { x: 0, y: 0, width, height };
}

/** Largest centred rect with the given ratio that fits inside the image. */
export function cropForAspect(imageW: number, imageH: number, ratio: number): CropData {
  let width = imageW;
  let height = width / ratio;
  if (height > imageH) {
    height = imageH;
    width = height * ratio;
  }
  return {
    x: Math.round((imageW - width) / 2),
    y: Math.round((imageH - height) / 2),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function clampRect(crop: CropData, imageW: number, imageH: number): CropData {
  const width = Math.min(Math.max(MIN_CROP, crop.width), imageW);
  const height = Math.min(Math.max(MIN_CROP, crop.height), imageH);
  return {
    width: Math.round(width),
    height: Math.round(height),
    x: Math.round(Math.min(Math.max(0, crop.x), imageW - width)),
    y: Math.round(Math.min(Math.max(0, crop.y), imageH - height)),
  };
}

interface ResizeArgs {
  start: CropData;
  handle: CropHandle;
  /** Pointer delta since the gesture began, in source pixels. */
  dx: number;
  dy: number;
  imageW: number;
  imageH: number;
  /** Locked aspect ratio (width / height), if any. */
  ratio?: number;
}

/**
 * Applies a drag to the crop rect. Edges move independently unless a ratio is
 * locked, in which case the dragged edge drives and the opposite corner stays put.
 */
export function resizeCrop({ start, handle, dx, dy, imageW, imageH, ratio }: ResizeArgs): CropData {
  if (handle === 'move') {
    return clampRect({ ...start, x: start.x + dx, y: start.y + dy }, imageW, imageH);
  }

  let { x, y, width, height } = start;
  const right = start.x + start.width;
  const bottom = start.y + start.height;

  if (handle.includes('w')) {
    x = Math.min(start.x + dx, right - MIN_CROP);
    width = right - x;
  }
  if (handle.includes('e')) {
    width = Math.max(MIN_CROP, start.width + dx);
  }
  if (handle.includes('n')) {
    y = Math.min(start.y + dy, bottom - MIN_CROP);
    height = bottom - y;
  }
  if (handle.includes('s')) {
    height = Math.max(MIN_CROP, start.height + dy);
  }

  if (ratio) {
    // Drive the ratio from whichever axis the handle actually controls.
    const drivenByWidth = handle === 'e' || handle === 'w' || handle.length === 2;
    if (drivenByWidth) height = width / ratio;
    else width = height * ratio;

    // Keep the anchored edges anchored after the ratio correction.
    if (handle.includes('w')) x = right - width;
    if (handle.includes('n')) y = bottom - height;
  }

  // Trim rather than shift when the rect runs past an edge, so the anchored
  // side stays where the user put it.
  if (x < 0) { width += x; x = 0; }
  if (y < 0) { height += y; y = 0; }
  if (x + width > imageW) width = imageW - x;
  if (y + height > imageH) height = imageH - y;

  if (ratio) {
    if (width / height > ratio) width = height * ratio;
    else height = width / ratio;
    if (handle.includes('w')) x = Math.max(0, right - width);
    if (handle.includes('n')) y = Math.max(0, bottom - height);
  }

  return clampRect({ x, y, width, height }, imageW, imageH);
}

export const HANDLE_CURSORS: Record<CropHandle, string> = {
  move: 'move',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};
