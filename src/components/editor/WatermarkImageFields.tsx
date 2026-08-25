import { useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { formatFileSize } from '@/lib/format';
import { isSupportedImage } from '@/lib/files';
import { loadWatermarkAsset, MAX_WATERMARK_BYTES } from '@/lib/watermark';
import { ACCEPTED_EXTENSIONS } from '@/lib/constants';
import type { WatermarkData } from '@/types';

export function WatermarkImageFields({ watermark }: { watermark: WatermarkData }) {
  const { updateWatermark, setWatermarkImage, pushHistory, notify } = useImageStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isSupportedImage(file)) {
      notify('error', `"${file.name}" isn't a supported image format.`);
      return;
    }
    if (file.size > MAX_WATERMARK_BYTES) {
      notify('error', `Watermark images must be under ${formatFileSize(MAX_WATERMARK_BYTES)}.`);
      return;
    }

    setIsLoading(true);
    try {
      const asset = await loadWatermarkAsset(file);
      setWatermarkImage(asset);
      pushHistory('Set watermark image');
    } catch {
      notify('error', `Could not read "${file.name}".`);
    }
    setIsLoading(false);
  };

  const hasImage = Boolean(watermark.imageUrl);

  return (
    <>
      <div>
        <span className="mb-1 block text-xs text-zinc-400">Logo</span>
        {hasImage ? (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-2">
            <div className="checkerboard flex h-10 w-10 shrink-0 items-center justify-center rounded">
              <img
                src={watermark.imageUrl ?? undefined}
                alt=""
                className="max-h-10 max-w-10 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-zinc-200" title={watermark.imageName ?? ''}>
                {watermark.imageName}
              </p>
              <p className="text-[11px] tabular-nums text-zinc-400">
                {watermark.imageWidth} × {watermark.imageHeight}
              </p>
            </div>
            <button
              onClick={() => {
                setWatermarkImage(null);
                pushHistory('Remove watermark image');
              }}
              aria-label="Remove watermark image"
              className="shrink-0 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-3 py-4 text-sm text-zinc-400 transition-colors hover:border-violet-500/60 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isLoading ? 'Reading…' : 'Choose a logo'}
          </button>
        )}
        <p className="mt-1 text-[11px] text-zinc-400">
          PNG with transparency works best. Nothing is uploaded.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {hasImage && (
        <>
          <div>
            <div className="mb-1 flex justify-between">
              <label htmlFor="wm-scale" className="text-xs text-zinc-400">Size</label>
              <span className="text-xs tabular-nums text-zinc-200">{watermark.scale}% of width</span>
            </div>
            <input
              id="wm-scale"
              type="range" min={2} max={100} value={watermark.scale}
              onChange={(e) => updateWatermark({ scale: parseInt(e.target.value) })}
              onPointerUp={() => pushHistory('Resize watermark')}
              className="w-full accent-violet-500"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <label htmlFor="wm-image-opacity" className="text-xs text-zinc-400">Opacity</label>
              <span className="text-xs tabular-nums text-zinc-200">
                {Math.round(watermark.imageOpacity * 100)}%
              </span>
            </div>
            <input
              id="wm-image-opacity"
              type="range" min={5} max={100} value={Math.round(watermark.imageOpacity * 100)}
              onChange={(e) => updateWatermark({ imageOpacity: parseInt(e.target.value) / 100 })}
              onPointerUp={() => pushHistory('Adjust watermark opacity')}
              className="w-full accent-violet-500"
            />
          </div>
        </>
      )}
    </>
  );
}
