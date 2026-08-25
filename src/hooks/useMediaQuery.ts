import { useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query. Used to mount the settings panel *either*
 * docked or as a sheet — rendering both would run every panel's side effects
 * (EXIF parsing, export estimates) twice.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false // server/prerender default
  );
}
