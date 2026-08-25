import type { EditState, ImageFile } from '@/types';
import type { PipelineOptions } from '@/lib/pipeline';

/** Everything the pipeline needs to reproduce what the canvas is previewing. */
export function buildExportOptions(editState: EditState): PipelineOptions {
  return {
    crop: editState.crop,
    resizeWidth: editState.resize?.width,
    resizeHeight: editState.resize?.height,
    resizeFit: editState.resize?.fit,
    resizeBackground: editState.resize?.background,
    rotate: editState.rotate,
    colorAdjustments: editState.colorAdjustments,
    watermark: editState.watermark,
    border: editState.border,
    format: editState.exportSettings.format,
    quality: editState.exportSettings.quality,
  };
}

/**
 * "Uniform" batch mode reuses the active image's look but drops crop and
 * resize: both are measured against one specific image and mean nothing on the
 * next one.
 */
export function buildUniformBatchOptions(editState: EditState): PipelineOptions {
  const base = { ...buildExportOptions(editState), crop: null };
  // A stretch resize sized for one image distorts the rest. `contain` and
  // `cover` keep the aspect ratio, so a shared target size is safe there.
  if (editState.resize && editState.resize.fit !== 'stretch') return base;
  return { ...base, resizeWidth: undefined, resizeHeight: undefined };
}

/** Lists the edits that uniform batch export carries over, for display in the UI. */
export function describeBatchEdits(editState: EditState): string[] {
  const applied: string[] = ['format', 'quality'];
  if (editState.resize && editState.resize.fit !== 'stretch') {
    applied.push(`resize (${editState.resize.fit})`);
  }
  const { rotate, colorAdjustments: c } = editState;
  if (rotate.angle !== 0 || rotate.flipH || rotate.flipV) applied.push('rotate/flip');
  if (c.brightness || c.contrast || c.saturation || c.hue || c.sharpness || c.invert) applied.push('colour');
  if (editState.watermark) applied.push(editState.watermark.type === 'image' ? 'logo' : 'watermark');
  if (editState.border) applied.push('border');
  return applied;
}

/**
 * Triggers a download. The anchor has to be in the document for Firefox, and
 * the object URL must outlive the click, so revoking is deferred.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 2000);
}

/** Strips characters that break downloads across operating systems. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'image';
}

/** Predicts the exported dimensions without doing any pixel work. */
export function predictOutputSize(image: ImageFile, editState: EditState): { width: number; height: number } {
  let width = editState.crop?.width ?? image.width;
  let height = editState.crop?.height ?? image.height;

  const { angle, } = editState.rotate;
  if (angle !== 0) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const rotatedW = Math.round(width * cos + height * sin);
    const rotatedH = Math.round(width * sin + height * cos);
    width = rotatedW;
    height = rotatedH;
  }

  if (editState.resize) {
    width = editState.resize.width;
    height = editState.resize.height;
  }

  if (editState.border) {
    width += editState.border.left + editState.border.right;
    height += editState.border.top + editState.border.bottom;
  }

  return { width, height };
}
