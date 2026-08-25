import { create } from 'zustand';
import type {
  ImageFile, EditState, ActiveTool, CropData, OutputFormat,
  ColorAdjustments, ColorPreset, WatermarkData,
  BorderData, HistoryEntry, Notification, NotificationKind,
} from '@/types';
import { generateId } from '@/lib/format';
import { forgetWatermarkArtwork } from '@/lib/imageProcessor';
import { DEFAULT_QUALITY, MAX_HISTORY_ENTRIES } from '@/lib/constants';

// ─── Defaults ────────────────────────────────────────────────

function defaultColor(): ColorAdjustments {
  return { brightness: 0, contrast: 0, saturation: 0, hue: 0, sharpness: 0, invert: false, preset: null };
}

function createDefaultEditState(): EditState {
  return {
    crop: null,
    resize: null,
    rotate: { angle: 0, flipH: false, flipV: false },
    colorAdjustments: defaultColor(),
    watermark: null,
    border: null,
    exportSettings: { format: 'image/jpeg', quality: DEFAULT_QUALITY },
  };
}

/** Every image starts with a baseline entry so the very first edit is undoable. */
function createBaselineHistory(editState: EditState): HistoryEntry[] {
  return [{ id: generateId(), label: 'Original', editState: structuredClone(editState), timestamp: Date.now() }];
}

/** Per-image edits, so switching images in batch mode never discards work. */
interface EditSession {
  editState: EditState;
  history: HistoryEntry[];
  historyIndex: number;
}

function createSession(exportSettings?: EditState['exportSettings']): EditSession {
  const editState = createDefaultEditState();
  // Export format/quality are a global preference, not a per-image edit.
  if (exportSettings) editState.exportSettings = { ...exportSettings };
  return { editState, history: createBaselineHistory(editState), historyIndex: 0 };
}

// ─── Helpers ─────────────────────────────────────────────────

function loadImageDimensions(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load: ${file.name}`));
    };
    img.src = url;
  });
}

// ─── Store Interface ─────────────────────────────────────────

interface ImageStore {
  images: ImageFile[];
  activeImageId: string | null;
  mode: 'single' | 'batch';
  editState: EditState;
  activeTool: ActiveTool;
  isLoadingImages: boolean;

  /** Saved edits for every image except the active one. */
  sessions: Record<string, EditSession>;

  history: HistoryEntry[];
  historyIndex: number;

  showCompare: boolean;
  notifications: Notification[];

  /**
   * Blob URLs for uploaded watermark artwork. Held for the whole session
   * because undo/redo snapshots reference them; revoked when images are cleared.
   */
  watermarkAssets: string[];

  // Notifications
  notify: (kind: NotificationKind, message: string) => void;
  dismissNotification: (id: string) => void;

  // Image actions
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setActiveImage: (id: string | null) => void;
  setMode: (mode: 'single' | 'batch') => void;
  setActiveTool: (tool: ActiveTool) => void;

  // Geometry
  setCrop: (crop: CropData | null) => void;
  setResize: (width: number, height: number, maintainAspectRatio?: boolean) => void;
  clearResize: () => void;
  setRotation: (angle: number) => void;
  setFlipH: (flip: boolean) => void;
  setFlipV: (flip: boolean) => void;
  setFormat: (format: OutputFormat) => void;
  setQuality: (quality: number) => void;
  resetEdits: () => void;

  // Colour
  setColorAdjustment: (key: keyof Omit<ColorAdjustments, 'preset' | 'invert'>, value: number) => void;
  toggleInvert: () => void;
  setColorPreset: (preset: ColorPreset | null) => void;
  resetColor: () => void;

  // Watermark
  setWatermark: (wm: WatermarkData | null) => void;
  updateWatermark: (partial: Partial<WatermarkData>) => void;
  setWatermarkImage: (asset: WatermarkAsset | null) => void;

  // Border
  setBorder: (border: BorderData | null) => void;
  updateBorder: (partial: Partial<BorderData>) => void;

  // History
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Compare
  toggleCompare: () => void;

  // Computed
  activeImage: () => ImageFile | undefined;
  hasEdits: () => boolean;
}

const PRESET_VALUES: Record<ColorPreset, Partial<ColorAdjustments>> = {
  grayscale: { saturation: -100 },
  sepia: { brightness: 4, contrast: 8, saturation: -70, hue: 22 },
  invert: { invert: true },
  warm: { brightness: 4, contrast: 6, saturation: 18, hue: 8 },
  cool: { contrast: 6, saturation: 12, hue: -12 },
  highContrast: { contrast: 45, saturation: 15, sharpness: 20 },
  vintage: { brightness: -4, contrast: -12, saturation: -35, hue: 14 },
};

export interface WatermarkAsset {
  url: string;
  name: string;
  width: number;
  height: number;
}

// ─── Store ───────────────────────────────────────────────────

export const useImageStore = create<ImageStore>((set, get) => {
  /** Applies a change to editState and keeps it out of history until pushHistory. */
  const patchEdit = (updater: (state: EditState) => EditState) =>
    set((s) => ({ editState: updater(s.editState) }));

  return {
    images: [],
    activeImageId: null,
    mode: 'single',
    editState: createDefaultEditState(),
    activeTool: null,
    isLoadingImages: false,
    sessions: {},
    history: [],
    historyIndex: -1,
    showCompare: false,
    notifications: [],
    watermarkAssets: [],

    // ── Notifications ────────────────────────────

    notify: (kind, message) =>
      set((s) => {
        // Collapse duplicates so a batch of identical failures reads as one line.
        if (s.notifications.some((n) => n.message === message && n.kind === kind)) return s;
        return { notifications: [...s.notifications, { id: generateId(), kind, message }].slice(-4) };
      }),

    dismissNotification: (id) =>
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

    // ── Image Management ─────────────────────────

    addImages: async (files: File[]) => {
      if (files.length === 0) return;
      set({ isLoadingImages: true });

      const newImages: ImageFile[] = [];
      const failed: string[] = [];

      for (const file of files) {
        try {
          const { url, width, height } = await loadImageDimensions(file);
          newImages.push({
            id: generateId(), file, originalUrl: url, previewUrl: url,
            width, height, name: file.name, size: file.size,
          });
        } catch {
          failed.push(file.name);
        }
      }

      set((state) => {
        const allImages = [...state.images, ...newImages];
        const sessions = { ...state.sessions };
        const isFirst = state.activeImageId === null;
        const nextActiveId = state.activeImageId ?? newImages[0]?.id ?? null;

        // Seed a session for every new image, carrying over the export settings.
        for (const img of newImages) {
          if (img.id !== nextActiveId) sessions[img.id] = createSession(state.editState.exportSettings);
        }

        const activeSession = isFirst && nextActiveId
          ? createSession(state.editState.exportSettings)
          : null;

        return {
          images: allImages,
          activeImageId: nextActiveId,
          sessions,
          mode: allImages.length > 1 ? 'batch' : state.mode,
          isLoadingImages: false,
          ...(activeSession
            ? {
                editState: activeSession.editState,
                history: activeSession.history,
                historyIndex: activeSession.historyIndex,
              }
            : {}),
        };
      });

      if (failed.length > 0) {
        get().notify(
          'error',
          failed.length === 1
            ? `Could not read "${failed[0]}" — the file may be corrupt or unsupported.`
            : `Could not read ${failed.length} files — they may be corrupt or unsupported.`
        );
      }
      if (newImages.length > 0) {
        get().notify(
          'success',
          newImages.length === 1 ? `Added ${newImages[0].name}` : `Added ${newImages.length} images`
        );
      }
    },

    removeImage: (id: string) => {
      set((state) => {
        const img = state.images.find((i) => i.id === id);
        if (img) URL.revokeObjectURL(img.originalUrl);

        const remaining = state.images.filter((i) => i.id !== id);
        const sessions = { ...state.sessions };
        delete sessions[id];

        if (state.activeImageId !== id) {
          return { images: remaining, sessions, mode: remaining.length <= 1 ? 'single' : state.mode };
        }

        // The active image went away — promote the next one and load its session.
        const nextId = remaining[0]?.id ?? null;
        const next = nextId
          ? sessions[nextId] ?? createSession(state.editState.exportSettings)
          : createSession(state.editState.exportSettings);
        if (nextId) delete sessions[nextId];

        return {
          images: remaining,
          sessions,
          activeImageId: nextId,
          editState: next.editState,
          history: next.history,
          historyIndex: next.historyIndex,
          showCompare: false,
          mode: remaining.length <= 1 ? 'single' : state.mode,
        };
      });
    },

    clearImages: () => {
      get().images.forEach((img) => URL.revokeObjectURL(img.originalUrl));
      get().watermarkAssets.forEach((url) => {
        forgetWatermarkArtwork(url);
        URL.revokeObjectURL(url);
      });
      const fresh = createSession(get().editState.exportSettings);
      set({
        images: [], activeImageId: null, sessions: {},
        editState: fresh.editState, history: [], historyIndex: -1,
        activeTool: null, mode: 'single', showCompare: false, watermarkAssets: [],
      });
    },

    setActiveImage: (id) =>
      set((state) => {
        if (id === state.activeImageId) return state;

        const sessions = { ...state.sessions };
        // Park the current image's work before switching away from it.
        if (state.activeImageId) {
          sessions[state.activeImageId] = {
            editState: state.editState,
            history: state.history,
            historyIndex: state.historyIndex,
          };
        }

        const next = (id && sessions[id]) || createSession(state.editState.exportSettings);
        if (id) delete sessions[id];

        return {
          activeImageId: id,
          sessions,
          editState: next.editState,
          history: next.history,
          historyIndex: next.historyIndex,
          showCompare: false,
        };
      }),

    setMode: (mode) => set({ mode }),
    setActiveTool: (tool) => set({ activeTool: tool }),

    // ── Geometry ─────────────────────────────────

    setCrop: (crop) => patchEdit((s) => ({ ...s, crop })),

    setResize: (width, height, maintainAspectRatio = true) =>
      patchEdit((s) => ({
        ...s,
        resize: { width, height, maintainAspectRatio, mode: 'pixels' },
      })),

    clearResize: () => patchEdit((s) => ({ ...s, resize: null })),

    setRotation: (angle) => patchEdit((s) => ({ ...s, rotate: { ...s.rotate, angle } })),
    setFlipH: (flipH) => patchEdit((s) => ({ ...s, rotate: { ...s.rotate, flipH } })),
    setFlipV: (flipV) => patchEdit((s) => ({ ...s, rotate: { ...s.rotate, flipV } })),

    // Export settings are shared across images, so mirror them into every session.
    setFormat: (format) =>
      set((s) => ({
        editState: { ...s.editState, exportSettings: { ...s.editState.exportSettings, format } },
        sessions: mapSessions(s.sessions, (e) => ({ ...e, exportSettings: { ...e.exportSettings, format } })),
      })),

    setQuality: (quality) =>
      set((s) => ({
        editState: { ...s.editState, exportSettings: { ...s.editState.exportSettings, quality } },
        sessions: mapSessions(s.sessions, (e) => ({ ...e, exportSettings: { ...e.exportSettings, quality } })),
      })),

    // Reverts every edit but stays on the history timeline, so a mis-click on
    // "reset" is itself undoable.
    resetEdits: () => {
      const exportSettings = get().editState.exportSettings;
      const cleared = createDefaultEditState();
      cleared.exportSettings = { ...exportSettings };
      set({ editState: cleared });
      get().pushHistory('Reset all edits');
    },

    // ── Colour ───────────────────────────────────

    setColorAdjustment: (key, value) =>
      patchEdit((s) => ({
        ...s,
        colorAdjustments: { ...s.colorAdjustments, [key]: value, preset: null },
      })),

    toggleInvert: () =>
      patchEdit((s) => ({
        ...s,
        colorAdjustments: { ...s.colorAdjustments, invert: !s.colorAdjustments.invert, preset: null },
      })),

    setColorPreset: (preset) =>
      patchEdit((s) => ({
        ...s,
        colorAdjustments: preset
          ? { ...defaultColor(), ...PRESET_VALUES[preset], preset }
          : defaultColor(),
      })),

    resetColor: () => patchEdit((s) => ({ ...s, colorAdjustments: defaultColor() })),

    // ── Watermark ────────────────────────────────

    setWatermark: (wm) => patchEdit((s) => ({ ...s, watermark: wm })),

    updateWatermark: (partial) =>
      patchEdit((s) => ({
        ...s,
        watermark: s.watermark ? { ...s.watermark, ...partial } : null,
      })),

    setWatermarkImage: (asset) =>
      set((state) => {
        if (!state.editState.watermark) return state;
        return {
          editState: {
            ...state.editState,
            watermark: {
              ...state.editState.watermark,
              type: asset ? 'image' : state.editState.watermark.type,
              imageUrl: asset?.url ?? null,
              imageName: asset?.name ?? null,
              imageWidth: asset?.width ?? null,
              imageHeight: asset?.height ?? null,
            },
          },
          watermarkAssets: asset ? [...state.watermarkAssets, asset.url] : state.watermarkAssets,
        };
      }),

    // ── Border ───────────────────────────────────

    setBorder: (border) => patchEdit((s) => ({ ...s, border })),

    updateBorder: (partial) =>
      patchEdit((s) => ({
        ...s,
        border: s.border ? { ...s.border, ...partial } : null,
      })),

    // ── History ──────────────────────────────────

    pushHistory: (label) => {
      const { editState, history, historyIndex } = get();
      const current = history[historyIndex];
      // Skip no-op pushes (e.g. a slider dragged back to where it started).
      if (current && JSON.stringify(current.editState) === JSON.stringify(editState)) return;

      const truncated = history.slice(0, historyIndex + 1);
      const entry: HistoryEntry = {
        id: generateId(),
        label,
        editState: structuredClone(editState),
        timestamp: Date.now(),
      };
      const newHistory = [...truncated, entry].slice(-MAX_HISTORY_ENTRIES);
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },

    undo: () => get().jumpToHistory(get().historyIndex - 1),
    redo: () => get().jumpToHistory(get().historyIndex + 1),

    jumpToHistory: (index) => {
      const { history } = get();
      const entry = history[index];
      if (!entry) return;
      set({ editState: structuredClone(entry.editState), historyIndex: index });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    // ── Compare ──────────────────────────────────

    toggleCompare: () => set((s) => ({ showCompare: !s.showCompare })),

    // ── Computed ─────────────────────────────────

    activeImage: () => {
      const { images, activeImageId } = get();
      return images.find((i) => i.id === activeImageId);
    },

    hasEdits: () => {
      const { editState: e } = get();
      return Boolean(
        e.crop ||
        e.resize ||
        e.rotate.angle !== 0 || e.rotate.flipH || e.rotate.flipV ||
        e.watermark || e.border ||
        e.colorAdjustments.brightness !== 0 || e.colorAdjustments.contrast !== 0 ||
        e.colorAdjustments.saturation !== 0 || e.colorAdjustments.hue !== 0 ||
        e.colorAdjustments.sharpness !== 0 || e.colorAdjustments.invert
      );
    },
  };
});

function mapSessions(
  sessions: Record<string, EditSession>,
  updater: (editState: EditState) => EditState
): Record<string, EditSession> {
  const out: Record<string, EditSession> = {};
  for (const [id, session] of Object.entries(sessions)) {
    out[id] = { ...session, editState: updater(session.editState) };
  }
  return out;
}
