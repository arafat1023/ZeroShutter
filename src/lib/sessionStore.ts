import type { EditState, HistoryEntry } from '@/types';

const DB_NAME = 'zeroshutter';
const DB_VERSION = 1;
const STORE = 'session';
const KEY = 'current';

export interface PersistedImage {
  id: string;
  name: string;
  size: number;
  width: number;
  height: number;
  /** Files are structured-cloneable, so the original bytes round-trip intact. */
  file: File;
}

export interface PersistedWatermarkAsset {
  /** The blob URL used when the session was saved, for remapping on restore. */
  url: string;
  blob: Blob;
}

export interface PersistedSession {
  savedAt: number;
  activeImageId: string | null;
  mode: 'single' | 'batch';
  images: PersistedImage[];
  editState: EditState;
  history: HistoryEntry[];
  historyIndex: number;
  sessions: Record<string, { editState: EditState; history: HistoryEntry[]; historyIndex: number }>;
  watermarkAssets: PersistedWatermarkAsset[];
  selectedImageIds?: string[];
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      // Private browsing modes can throw outright.
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | null> {
  return openDatabase().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction(STORE, mode);
          const request = run(tx.objectStore(STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(null);
          tx.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

/**
 * Persistence is best-effort: storage can be full, blocked, or unavailable in
 * private mode, and none of that should interrupt editing.
 */
export async function saveSession(session: PersistedSession): Promise<void> {
  await transact('readwrite', (store) => store.put(session, KEY));
}

export async function loadSession(): Promise<PersistedSession | null> {
  const result = await transact<PersistedSession | undefined>('readonly', (store) => store.get(KEY));
  return result ?? null;
}

export async function clearSession(): Promise<void> {
  await transact('readwrite', (store) => store.delete(KEY));
}
