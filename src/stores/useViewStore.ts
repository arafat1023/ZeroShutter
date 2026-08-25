import { create } from 'zustand';
import { MAX_ZOOM, MIN_ZOOM } from '@/lib/constants';
import { clamp } from '@/lib/format';

const ZOOM_STEP = 1.25;

interface ViewStore {
  /** Explicit zoom factor, or null while the canvas is auto-fitting. */
  zoom: number | null;
  /** Zoom the canvas last reported while fitting, used as the base for +/−. */
  fittedZoom: number;
  showShortcuts: boolean;

  setFittedZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
  fitToScreen: () => void;
  actualSize: () => void;
  setShowShortcuts: (show: boolean) => void;
  toggleShortcuts: () => void;
}

export const useViewStore = create<ViewStore>((set, get) => ({
  zoom: null,
  fittedZoom: 1,
  showShortcuts: false,

  setFittedZoom: (zoom) => set((s) => (s.fittedZoom === zoom ? s : { fittedZoom: zoom })),

  zoomIn: () => set({ zoom: clamp((get().zoom ?? get().fittedZoom) * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM) }),
  zoomOut: () => set({ zoom: clamp((get().zoom ?? get().fittedZoom) / ZOOM_STEP, MIN_ZOOM, MAX_ZOOM) }),
  zoomTo: (zoom) => set({ zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM) }),

  fitToScreen: () => set({ zoom: null }),
  actualSize: () => set({ zoom: 1 }),

  setShowShortcuts: (showShortcuts) => set({ showShortcuts }),
  toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),
}));
