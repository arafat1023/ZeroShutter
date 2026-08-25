import type { EditState, ImageFile } from '@/types';

export interface PreviewGeometry {
  /** The kept region of the source, in source pixels. */
  cropW: number;
  cropH: number;
  /** Bounding box once rotation is applied. */
  rotatedW: number;
  rotatedH: number;
  /** The box the image is fitted into — the resize target, or the rotated box. */
  frameW: number;
  frameH: number;
  /** How the rotated box maps into the frame. Differs per axis only for stretch. */
  fitScaleX: number;
  fitScaleY: number;
  /** Frame plus border padding: the full extent of the preview. */
  composedW: number;
  composedH: number;
}

/** Bounding box after rotation — what the viewport has to make room for. */
export function rotatedSize(width: number, height: number, angle: number) {
  if (angle === 0) return { width, height };
  const rad = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

/**
 * Walks the same order as the export pipeline — crop, rotate, resize, border —
 * so the preview can lay out exactly what the exported file will contain.
 */
export function previewGeometry(image: ImageFile, editState: EditState): PreviewGeometry {
  const { crop, rotate, resize, border } = editState;

  const cropW = crop?.width ?? image.width;
  const cropH = crop?.height ?? image.height;

  const rotated = rotatedSize(cropW, cropH, rotate.angle);
  const rotatedW = rotated.width;
  const rotatedH = rotated.height;

  let frameW = rotatedW;
  let frameH = rotatedH;
  let fitScaleX = 1;
  let fitScaleY = 1;

  if (resize) {
    frameW = resize.width;
    frameH = resize.height;
    if (resize.fit === 'stretch') {
      fitScaleX = frameW / rotatedW;
      fitScaleY = frameH / rotatedH;
    } else {
      const ratio =
        resize.fit === 'cover'
          ? Math.max(frameW / rotatedW, frameH / rotatedH)
          : Math.min(frameW / rotatedW, frameH / rotatedH);
      fitScaleX = ratio;
      fitScaleY = ratio;
    }
  }

  return {
    cropW,
    cropH,
    rotatedW,
    rotatedH,
    frameW,
    frameH,
    fitScaleX,
    fitScaleY,
    composedW: frameW + (border?.left ?? 0) + (border?.right ?? 0),
    composedH: frameH + (border?.top ?? 0) + (border?.bottom ?? 0),
  };
}

/** Kept for callers that only need the outer extent. */
export function composedSize(image: ImageFile, editState: EditState) {
  const geometry = previewGeometry(image, editState);
  return {
    width: geometry.composedW,
    height: geometry.composedH,
    cropW: geometry.cropW,
    cropH: geometry.cropH,
  };
}
