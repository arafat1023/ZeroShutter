import { useRef, useCallback, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Cropper, type CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { useImageStore } from '@/stores/useImageStore';
import { ASPECT_RATIO_PRESETS, SOCIAL_PRESETS } from '@/lib/constants';
import type { AspectRatioPreset } from '@/types';

export function CropperOverlay() {
  const cropperRef = useRef<CropperRef>(null);
  const activeImage = useImageStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const existingCrop = useImageStore((s) => s.editState.crop);
  const { setCrop, setActiveTool, pushHistory } = useImageStore();

  const [selectedPreset, setSelectedPreset] = useState('Free');
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [liveSize, setLiveSize] = useState<{ width: number; height: number } | null>(
    existingCrop ? { width: existingCrop.width, height: existingCrop.height } : null
  );

  const handleChange = useCallback((cropper: CropperRef) => {
    const coords = cropper.getCoordinates();
    if (coords) setLiveSize({ width: Math.round(coords.width), height: Math.round(coords.height) });
  }, []);

  const applyCrop = useCallback(() => {
    const coords = cropperRef.current?.getCoordinates();
    if (!coords) return;
    const crop = {
      x: Math.max(0, Math.round(coords.left)),
      y: Math.max(0, Math.round(coords.top)),
      width: Math.max(1, Math.round(coords.width)),
      height: Math.max(1, Math.round(coords.height)),
    };
    setCrop(crop);
    pushHistory(`Crop ${crop.width}×${crop.height}`);
    setActiveTool(null);
  }, [setCrop, pushHistory, setActiveTool]);

  const applyPreset = useCallback((preset: AspectRatioPreset) => {
    setSelectedPreset(preset.label);
    setAspectRatio(preset.ratio ?? undefined);
  }, []);

  if (!activeImage) return null;

  const presetButton = (preset: AspectRatioPreset) => (
    <button
      key={preset.label}
      onClick={() => applyPreset(preset)}
      aria-pressed={selectedPreset === preset.label}
      className={`shrink-0 rounded px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        selectedPreset === preset.label ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
      }`}
    >
      {preset.label}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <span className="mr-1 shrink-0 text-[10px] uppercase tracking-wider text-zinc-500">Ratio</span>
        {ASPECT_RATIO_PRESETS.map(presetButton)}
        <div className="mx-1 h-4 w-px shrink-0 bg-zinc-700" />
        {SOCIAL_PRESETS.map(presetButton)}
      </div>

      <div className="relative min-h-0 flex-1 bg-zinc-950">
        <Cropper
          ref={cropperRef}
          src={activeImage.originalUrl}
          onChange={handleChange}
          defaultCoordinates={
            existingCrop
              ? { left: existingCrop.x, top: existingCrop.y, width: existingCrop.width, height: existingCrop.height }
              : undefined
          }
          stencilProps={{ aspectRatio, movable: true, resizable: true }}
          className="h-full"
          backgroundClassName="bg-zinc-950"
        />
        {liveSize && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/75 px-2.5 py-1 text-xs tabular-nums text-zinc-100">
            {liveSize.width} × {liveSize.height}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <button
          onClick={() => {
            setCrop(null);
            pushHistory('Clear crop');
            setActiveTool(null);
          }}
          className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Clear crop
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={applyCrop}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <Check className="h-4 w-4" />
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}
