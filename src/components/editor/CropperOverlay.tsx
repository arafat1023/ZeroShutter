import { useRef, useCallback, useState, useEffect } from 'react';
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
  const [customRatioInput, setCustomRatioInput] = useState('');
  const [cropW, setCropW] = useState<number>(0);
  const [cropH, setCropH] = useState<number>(0);

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

  // Parse custom ratio input (e.g. "5:7")
  const handleCustomRatio = useCallback((input: string) => {
    setCustomRatioInput(input);
    const match = input.match(/^(\d+)\s*:\s*(\d+)$/);
    if (match) {
      const w = parseInt(match[1]);
      const h = parseInt(match[2]);
      if (w > 0 && h > 0) {
        setAspectRatio(w / h);
        setSelectedPreset('Custom');
      }
    }
  }, []);

  // Keyboard nudge: arrow keys move crop 1px, shift+arrow 10px
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const cropper = cropperRef.current;
      if (!cropper) return;

      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      if (!isArrowKey) return;

      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const coords = cropper.getCoordinates();
      if (!coords) return;

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      cropper.setCoordinates({
        left: coords.left + dx,
        top: coords.top + dy,
        width: coords.width,
        height: coords.height,
      });
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Track crop dimensions from cropper changes
  const handleCropChange = useCallback((cropper: CropperRef) => {
    const coords = cropper.getCoordinates();
    if (coords) {
      setCropW(Math.round(coords.width));
      setCropH(Math.round(coords.height));
    }
  }, []);

  // Apply exact pixel dimensions to cropper
  const handleExactWidth = useCallback((val: number) => {
    setCropW(val);
    const cropper = cropperRef.current;
    if (!cropper || val <= 0) return;
    const coords = cropper.getCoordinates();
    if (!coords) return;
    const newHeight = aspectRatio ? Math.round(val / aspectRatio) : coords.height;
    cropper.setCoordinates({ left: coords.left, top: coords.top, width: val, height: newHeight });
  }, [aspectRatio]);

  const handleExactHeight = useCallback((val: number) => {
    setCropH(val);
    const cropper = cropperRef.current;
    if (!cropper || val <= 0) return;
    const coords = cropper.getCoordinates();
    if (!coords) return;
    const newWidth = aspectRatio ? Math.round(val * aspectRatio) : coords.width;
    cropper.setCoordinates({ left: coords.left, top: coords.top, width: newWidth, height: val });
  }, [aspectRatio]);

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
        <div className="w-px h-4 bg-zinc-700 mx-1 shrink-0" />
        {/* Custom ratio input */}
        <input
          type="text"
          value={customRatioInput}
          onChange={(e) => handleCustomRatio(e.target.value)}
          placeholder="W:H"
          className={`w-16 px-2 py-1 rounded text-[11px] bg-zinc-800 text-zinc-300 border shrink-0 focus:outline-none ${
            selectedPreset === 'Custom' ? 'border-violet-500' : 'border-zinc-700 focus:border-violet-500'
          }`}
        />
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
          onChange={handleCropChange}
          className="h-full"
          backgroundClassName="bg-zinc-950"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCrop(null);
              setSelectedPreset('Free');
              setAspectRatio(undefined);
              setCustomRatioInput('');
            }}
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear Crop
          </button>
          {/* Exact pixel dimensions */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={cropW || ''}
              onChange={(e) => handleExactWidth(parseInt(e.target.value) || 0)}
              placeholder="W"
              min={1}
              className="w-16 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700 focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-zinc-500">×</span>
            <input
              type="number"
              value={cropH || ''}
              onChange={(e) => handleExactHeight(parseInt(e.target.value) || 0)}
              placeholder="H"
              min={1}
              className="w-16 px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700 focus:outline-none focus:border-violet-500"
            />
            <span className="text-[10px] text-zinc-500">px</span>
          </div>
        </div>
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
