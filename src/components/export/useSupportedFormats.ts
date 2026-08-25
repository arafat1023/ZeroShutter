import { useState, useEffect } from 'react';
import { getSupportedFormats } from '@/lib/imageProcessor';
import type { OutputFormat } from '@/types';

/**
 * Browsers advertise no capability API for canvas encoding, so we probe once
 * and cache. Until the probe resolves, assume the universally-safe set.
 */
export function useSupportedFormats(): Set<OutputFormat> {
  const [formats, setFormats] = useState<Set<OutputFormat>>(
    () => new Set<OutputFormat>(['image/jpeg', 'image/png', 'image/webp'])
  );

  useEffect(() => {
    let cancelled = false;
    getSupportedFormats().then((supported) => {
      if (!cancelled) setFormats(supported);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return formats;
}
