import type { EditState, HistoryEntry } from '@/types';

/**
 * Blob URLs die with the page, so a restored session carries new ones. Every
 * reference to an old URL — in the live edit state and in every history
 * snapshot — has to be pointed at its replacement.
 */
export function remapWatermarkUrls(editState: EditState, urlMap: Map<string, string>): EditState {
  const watermark = editState.watermark;
  if (!watermark?.imageUrl) return editState;
  const replacement = urlMap.get(watermark.imageUrl);
  if (!replacement) {
    // The artwork did not survive; drop the reference rather than render a broken image.
    return { ...editState, watermark: { ...watermark, imageUrl: null, type: 'text' } };
  }
  return { ...editState, watermark: { ...watermark, imageUrl: replacement } };
}

export function remapHistory(history: HistoryEntry[], urlMap: Map<string, string>): HistoryEntry[] {
  return history.map((entry) => ({ ...entry, editState: remapWatermarkUrls(entry.editState, urlMap) }));
}
