import type { WatermarkData } from '@/types';

export const MAX_WATERMARK_BYTES = 10 * 1024 * 1024;

export function createDefaultWatermark(): WatermarkData {
  return {
    type: 'text',
    text: 'ZeroShutter',
    fontFamily: 'Arial',
    fontSize: 48,
    fontColor: '#ffffff',
    fontOpacity: 0.5,
    bold: false,
    italic: false,
    rotation: 0,
    imageUrl: null,
    imageName: null,
    imageWidth: null,
    imageHeight: null,
    imageOpacity: 0.5,
    position: 'bottom-right',
    tiling: false,
    tileSpacing: 200,
    scale: 20,
  };
}

/** Reads an uploaded logo, returning a blob URL plus its natural dimensions. */
export function loadWatermarkAsset(
  file: File
): Promise<{ url: string; name: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () =>
      resolve({ url, name: file.name, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    image.src = url;
  });
}
