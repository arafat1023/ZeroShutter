import type { EditState, ImageFile } from '@/types';

/** The unrotated composed size: crop (or full image) plus any border. */
export function composedSize(image: ImageFile, editState: EditState) {
  const cropW = editState.crop?.width ?? image.width;
  const cropH = editState.crop?.height ?? image.height;
  const border = editState.border;
  return {
    width: cropW + (border?.left ?? 0) + (border?.right ?? 0),
    height: cropH + (border?.top ?? 0) + (border?.bottom ?? 0),
    cropW,
    cropH,
  };
}

/** Bounding box after rotation — what the viewport actually has to make room for. */
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
