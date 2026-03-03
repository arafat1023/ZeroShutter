import { create } from 'zustand';
import type {
  ImageFile, EditState, ActiveTool, CropData, OutputFormat,
  ColorAdjustments, ColorPreset, WatermarkData,
  BorderData, HistoryEntry,
} from '@/types';
import { generateId } from '@/lib/format';
import { DEFAULT_QUALITY, MAX_HISTORY_ENTRIES } from '@/lib/constants';

// ─── Defaults ────────────────────────────────────────────────

function defaultColor(): ColorAdjustments {
  return { brightness: 0, contrast: 0, saturation: 0, hue: 0, sharpness: 0, preset: null };
}

function createDefaultEditState(): EditState {
  return {
    crop: null,
    resize: null,
    rotate: { angle: 0, flipH: false, flipV: false, backgroundColor: '#ffffff' },
    colorAdjustments: defaultColor(),
    watermark: null,
    border: null,
    exportSettings: { format: 'image/jpeg', quality: DEFAULT_QUALITY },
  };
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
  selectedImageIds: string[];
  mode: 'single' | 'batch';
  editState: EditState;
  activeTool: ActiveTool;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Compare mode
  showCompare: boolean;

  // Image actions
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setActiveImage: (id: string | null) => void;
  setMode: (mode: 'single' | 'batch') => void;
  setActiveTool: (tool: ActiveTool) => void;

  // Batch selection
  selectAll: () => void;
  deselectAll: () => void;
  toggleImageSelection: (id: string) => void;

  // Phase 1 edit actions
  setCrop: (crop: CropData | null) => void;
  setResize: (width: number, height: number, maintainAspectRatio?: boolean) => void;
  setRotation: (angle: number) => void;
  setFlipH: (flip: boolean) => void;
  setFlipV: (flip: boolean) => void;
  setFormat: (format: OutputFormat) => void;
  setQuality: (quality: number) => void;
  resetEdits: () => void;

  // Phase 2: Color
  setColorAdjustment: (key: keyof Omit<ColorAdjustments, 'preset'>, value: number) => void;
  setColorPreset: (preset: ColorPreset | null) => void;
  resetColor: () => void;

  // Phase 2: Watermark
  setWatermark: (wm: WatermarkData | null) => void;
  updateWatermark: (partial: Partial<WatermarkData>) => void;

  // Phase 2: Border
  setBorder: (border: BorderData | null) => void;
  updateBorder: (partial: Partial<BorderData>) => void;

  // Phase 2: Undo/Redo
  pushHistory: (label: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  jumpToHistory: (index: number) => void;

  // Phase 2: Compare
  toggleCompare: () => void;

  // Computed
  activeImage: () => ImageFile | undefined;
}

// ─── Store ───────────────────────────────────────────────────

export const useImageStore = create<ImageStore>((set, get) => ({
  images: [],
  activeImageId: null,
  selectedImageIds: [],
  mode: 'single',
  editState: createDefaultEditState(),
  activeTool: null,
  history: [],
  historyIndex: -1,
  showCompare: false,

  // ── Image Management ─────────────────────────

  addImages: async (files: File[]) => {
    const newImages: ImageFile[] = [];
    for (const file of files) {
      try {
        const { url, width, height } = await loadImageDimensions(file);
        newImages.push({
          id: generateId(), file, originalUrl: url, previewUrl: url,
          width, height, name: file.name, size: file.size,
        });
      } catch (e) { console.error(e); }
    }
    set((state) => {
      const allImages = [...state.images, ...newImages];
      return {
        images: allImages,
        activeImageId: state.activeImageId ?? newImages[0]?.id ?? null,
        mode: allImages.length > 1 ? 'batch' : state.mode,
      };
    });
  },

  removeImage: (id: string) => {
    set((state) => {
      const img = state.images.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.originalUrl);
      const remaining = state.images.filter((i) => i.id !== id);
      return {
        images: remaining,
        activeImageId: state.activeImageId === id ? (remaining[0]?.id ?? null) : state.activeImageId,
        selectedImageIds: state.selectedImageIds.filter((i) => i !== id),
        mode: remaining.length <= 1 ? 'single' : state.mode,
      };
    });
  },

  clearImages: () => {
    get().images.forEach((img) => URL.revokeObjectURL(img.originalUrl));
    set({
      images: [], activeImageId: null, selectedImageIds: [], editState: createDefaultEditState(),
      activeTool: null, mode: 'single', history: [], historyIndex: -1, showCompare: false,
    });
  },

  setActiveImage: (id) => set({
    activeImageId: id, editState: createDefaultEditState(),
    activeTool: null, history: [], historyIndex: -1, showCompare: false,
  }),
  setMode: (mode) => set({ mode }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ── Batch Selection ────────────────────────────
  selectAll: () => set((s) => ({ selectedImageIds: s.images.map((i) => i.id) })),
  deselectAll: () => set({ selectedImageIds: [] }),
  toggleImageSelection: (id) => set((s) => ({
    selectedImageIds: s.selectedImageIds.includes(id)
      ? s.selectedImageIds.filter((i) => i !== id)
      : [...s.selectedImageIds, id],
  })),

  // ── Phase 1 Edit Actions ─────────────────────

  setCrop: (crop) =>
    set((s) => ({ editState: { ...s.editState, crop } })),

  setResize: (width, height, maintainAspectRatio = true) =>
    set((s) => ({
      editState: { ...s.editState, resize: { width, height, maintainAspectRatio, mode: 'pixels' } },
    })),

  setRotation: (angle) =>
    set((s) => ({
      editState: { ...s.editState, rotate: { ...s.editState.rotate, angle } },
    })),

  setFlipH: (flipH) =>
    set((s) => ({
      editState: { ...s.editState, rotate: { ...s.editState.rotate, flipH } },
    })),

  setFlipV: (flipV) =>
    set((s) => ({
      editState: { ...s.editState, rotate: { ...s.editState.rotate, flipV } },
    })),

  setFormat: (format) =>
    set((s) => ({
      editState: { ...s.editState, exportSettings: { ...s.editState.exportSettings, format } },
    })),

  setQuality: (quality) =>
    set((s) => ({
      editState: { ...s.editState, exportSettings: { ...s.editState.exportSettings, quality } },
    })),

  resetEdits: () => set({ editState: createDefaultEditState(), activeTool: null, history: [], historyIndex: -1 }),

  // ── Phase 2: Color Adjustments ───────────────

  setColorAdjustment: (key, value) =>
    set((s) => ({
      editState: {
        ...s.editState,
        colorAdjustments: { ...s.editState.colorAdjustments, [key]: value, preset: null },
      },
    })),

  setColorPreset: (preset) => {
    const presetValues: Record<ColorPreset, Partial<ColorAdjustments>> = {
      grayscale: { brightness: 0, contrast: 0, saturation: -100, hue: 0, sharpness: 0 },
      sepia: { brightness: 0, contrast: 10, saturation: -60, hue: 30, sharpness: 0 },
      invert: { brightness: 0, contrast: 0, saturation: 0, hue: 180, sharpness: 0 },
      warm: { brightness: 5, contrast: 5, saturation: 15, hue: 10, sharpness: 0 },
      cool: { brightness: 0, contrast: 5, saturation: 10, hue: 200, sharpness: 0 },
      highContrast: { brightness: 0, contrast: 50, saturation: 20, hue: 0, sharpness: 20 },
      vintage: { brightness: -5, contrast: -10, saturation: -30, hue: 15, sharpness: 0 },
    };
    if (!preset) {
      set((s) => ({ editState: { ...s.editState, colorAdjustments: defaultColor() } }));
      return;
    }
    const vals = presetValues[preset];
    set((s) => ({
      editState: {
        ...s.editState,
        colorAdjustments: { ...defaultColor(), ...vals, preset },
      },
    }));
  },

  resetColor: () =>
    set((s) => ({ editState: { ...s.editState, colorAdjustments: defaultColor() } })),

  // ── Phase 2: Watermark ───────────────────────

  setWatermark: (wm) =>
    set((s) => ({ editState: { ...s.editState, watermark: wm } })),

  updateWatermark: (partial) =>
    set((s) => ({
      editState: {
        ...s.editState,
        watermark: s.editState.watermark ? { ...s.editState.watermark, ...partial } : null,
      },
    })),

  // ── Phase 2: Border ──────────────────────────

  setBorder: (border) =>
    set((s) => ({ editState: { ...s.editState, border } })),

  updateBorder: (partial) =>
    set((s) => ({
      editState: {
        ...s.editState,
        border: s.editState.border ? { ...s.editState.border, ...partial } : null,
      },
    })),

  // ── Phase 2: Undo/Redo ───────────────────────

  pushHistory: (label) => {
    const { editState, history, historyIndex } = get();
    // Truncate any redo entries beyond current index
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

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const entry = history[prevIndex];
    if (entry) {
      set({ editState: structuredClone(entry.editState), historyIndex: prevIndex });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const entry = history[nextIndex];
    if (entry) {
      set({ editState: structuredClone(entry.editState), historyIndex: nextIndex });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  jumpToHistory: (index: number) => {
    const { history } = get();
    const entry = history[index];
    if (entry) {
      set({ editState: structuredClone(entry.editState), historyIndex: index });
    }
  },

  // ── Phase 2: Compare ─────────────────────────

  toggleCompare: () => set((s) => ({ showCompare: !s.showCompare })),

  // ── Computed ─────────────────────────────────

  activeImage: () => {
    const { images, activeImageId } = get();
    return images.find((i) => i.id === activeImageId);
  },
}));
