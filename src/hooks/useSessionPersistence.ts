import { useEffect } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { saveSession, loadSession, clearSession, type PersistedSession } from '@/lib/sessionStore';

const SAVE_DEBOUNCE_MS = 1000;

async function snapshot(): Promise<PersistedSession> {
  const state = useImageStore.getState();

  // Watermark artwork lives behind blob URLs that die with the page, so the
  // bytes have to be stored alongside the URL that referenced them.
  const watermarkAssets = await Promise.all(
    state.watermarkAssets.map(async (url) => {
      try {
        return { url, blob: await (await fetch(url)).blob() };
      } catch {
        return null;
      }
    })
  );

  return {
    savedAt: Date.now(),
    activeImageId: state.activeImageId,
    mode: state.mode,
    images: state.images.map((image) => ({
      id: image.id,
      name: image.name,
      size: image.size,
      width: image.width,
      height: image.height,
      file: image.file,
    })),
    editState: state.editState,
    history: state.history,
    historyIndex: state.historyIndex,
    sessions: state.sessions,
    selectedImageIds: state.selectedImageIds,
    watermarkAssets: watermarkAssets.filter((asset) => asset !== null),
  };
}

let restoreStarted: Promise<void> | null = null;

function restoreOnce(): Promise<void> {
  if (restoreStarted) return restoreStarted;

  restoreStarted = (async () => {
    const saved = await loadSession();
    if (!saved?.images?.length) return;
    // Never clobber work already in progress in this tab.
    if (useImageStore.getState().images.length > 0) return;

    try {
      const count = useImageStore.getState().restoreSession(saved);
      useImageStore
        .getState()
        .notify('info', `Restored ${count} image${count === 1 ? '' : 's'} from your last session.`);
    } catch {
      await clearSession();
    }
  })();

  return restoreStarted;
}

/**
 * Keeps the working session in IndexedDB so a refresh or an accidental close
 * doesn't discard the work. Everything stays on the device.
 */
export function useSessionPersistence() {
  useEffect(() => {
    // Module-level, not a ref: StrictMode mounts effects twice, and a ref guard
    // would be claimed by the first mount whose cleanup then cancels the work,
    // leaving the second mount to skip it entirely.
    void restoreOnce();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;

    const unsubscribe = useImageStore.subscribe((state, previous) => {
      // Only persist things worth restoring; ignore transient UI state.
      if (
        state.images === previous.images &&
        state.editState === previous.editState &&
        state.sessions === previous.sessions &&
        state.activeImageId === previous.activeImageId &&
        state.history === previous.history
      ) {
        return;
      }

      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (inFlight) return;
        inFlight = true;
        try {
          if (useImageStore.getState().images.length === 0) await clearSession();
          else await saveSession(await snapshot());
        } catch {
          // Storage full or unavailable — editing continues regardless.
        }
        inFlight = false;
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}
