import { useRef, useCallback, useState } from 'react';
import { Cropper, type CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { useImageStore } from '@/stores/useImageStore';
import { ASPECT_RATIO_PRESETS, SOCIAL_PRESETS } from '@/lib/constants';
import type { AspectRatioPreset } from '@/types';

export function CropperOverlay() {
  const cropperRef = useRef<CropperRef>(null);
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const { setCrop, pushHistory } = useImageStore();
  const [selectedPreset, setSelectedPreset] = useState<string>('Free');
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);

  const handleCropConfirm = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;

    const coords = cropper.getCoordinates();
    if (coords) {
      setCrop({
        x: Math.round(coords.left),
        y: Math.round(coords.top),
        width: Math.round(coords.width),
        height: Math.round(coords.height),
      });
      pushHistory(`Crop ${Math.round(coords.width)}×${Math.round(coords.height)}`);
    }
  }, [setCrop, pushHistory]);

  const applyPreset = useCallback((preset: AspectRatioPreset) => {
    setSelectedPreset(preset.label);
    if (preset.ratio === null) {
      setAspectRatio(undefined);
    } else {
      setAspectRatio(preset.ratio);
    }
  }, []);

  if (!activeImage) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Preset bar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-900 border-b border-zinc-800 overflow-x-auto">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-2 shrink-0">Ratio:</span>
        {ASPECT_RATIO_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 transition-colors ${
              selectedPreset === p.label
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />
        {SOCIAL_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 transition-colors ${
              selectedPreset === p.label
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Cropper canvas */}
      <div className="flex-1 relative bg-zinc-950">
        <Cropper
          ref={cropperRef}
          src={activeImage.originalUrl}
          stencilProps={{
            aspectRatio: aspectRatio,
            movable: true,
            resizable: true,
          }}
          className="h-full"
          backgroundClassName="bg-zinc-950"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-t border-zinc-800">
        <button
          onClick={() => {
            setCrop(null);
            setSelectedPreset('Free');
            setAspectRatio(undefined);
          }}
          className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Clear Crop
        </button>
        <button
          onClick={handleCropConfirm}
          className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
}
