import { useState, useEffect } from 'react';
import { estimateFileSize } from '@/lib/imageProcessor';
import { buildExportOptions } from '@/lib/exportOptions';
import type { EditState, ImageFile } from '@/types';

const DEBOUNCE_MS = 400;

/**
 * Runs the real export pipeline (in the worker) to report the size the user
 * will actually get, re-running whenever the edits or export settings change.
 */
export function useExportEstimate(image: ImageFile | undefined, editState: EditState) {
  const [size, setSize] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Serialising the options keeps the effect from re-firing on identical edits.
  const optionsKey = image ? `${image.id}|${JSON.stringify(buildExportOptions(editState))}` : '';

  useEffect(() => {
    if (!image) {
      setSize(null);
      return;
    }

    let cancelled = false;
    setIsEstimating(true);

    const timer = setTimeout(async () => {
      try {
        const bytes = await estimateFileSize(image.file, buildExportOptions(editState));
        if (!cancelled) setSize(bytes);
      } catch {
        if (!cancelled) setSize(null);
      } finally {
        if (!cancelled) setIsEstimating(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  return { size, isEstimating };
}
