import { useRef, useState } from 'react';
import { Loader2, Target } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { fitToTargetSize } from '@/lib/targetSize';
import { buildExportOptions, predictOutputSize } from '@/lib/exportOptions';
import { formatFileSize } from '@/lib/format';
import { TARGET_SIZE_PRESETS } from '@/lib/constants';
import type { ImageFile } from '@/types';

export function TargetSizePanel({ image }: { image: ImageFile }) {
  const editState = useImageStore((s) => s.editState);
  const { setQuality, setResize, pushHistory, notify } = useImageStore();

  const [targetKb, setTargetKb] = useState(500);
  const [isSearching, setIsSearching] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const cancelled = useRef(false);

  const run = async () => {
    const targetBytes = Math.round(targetKb * 1024);
    if (!Number.isFinite(targetBytes) || targetBytes < 1024) {
      notify('error', 'Pick a target of at least 1 KB.');
      return;
    }

    setIsSearching(true);
    setAttempt(0);
    cancelled.current = false;

    try {
      const result = await fitToTargetSize(
        image.file,
        buildExportOptions(editState),
        targetBytes,
        {
          onAttempt: (n) => setAttempt(n),
          isCancelled: () => cancelled.current,
        }
      );

      if (cancelled.current) return;

      if (!result) {
        notify(
          'error',
          `Could not reach ${formatFileSize(targetBytes)} even at the lowest quality and a heavy downscale. Try a larger target or a different format.`
        );
        return;
      }

      // Apply what the search found so the normal Download button reproduces it.
      setQuality(result.quality);
      if (result.scale !== 1) setResize(result.width, result.height, true);
      pushHistory(`Fit to ${formatFileSize(targetBytes)}`);

      const scaledNote =
        result.scale !== 1 ? ` and resized to ${result.width}×${result.height}` : '';
      notify(
        'success',
        `Landed at ${formatFileSize(result.bytes)} — quality ${Math.round(result.quality * 100)}%${scaledNote}.`
      );
    } catch {
      notify('error', 'Something went wrong while compressing.');
    } finally {
      setIsSearching(false);
    }
  };

  const output = predictOutputSize(image, editState);

  return (
    <div className="space-y-2.5 rounded-lg border border-zinc-800 p-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Fit to a size</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
          Searches for the best quality that still fits, dropping the dimensions
          only if quality alone can't get there.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {TARGET_SIZE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => setTargetKb(preset.bytes / 1024)}
            aria-pressed={Math.round(targetKb * 1024) === preset.bytes}
            className={`rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              Math.round(targetKb * 1024) === preset.bytes
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="target-size" className="mb-0.5 block text-[11px] text-zinc-400">
            Target
          </label>
          <div className="flex items-center gap-1">
            <input
              id="target-size"
              type="number"
              min={1}
              value={targetKb}
              onChange={(e) => setTargetKb(parseInt(e.target.value) || 0)}
              className="w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm tabular-nums text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
            <span className="shrink-0 text-[11px] text-zinc-400">KB</span>
          </div>
        </div>
        <button
          onClick={isSearching ? () => { cancelled.current = true; } : run}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
            isSearching
              ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {isSearching ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Cancel ({attempt})
            </>
          ) : (
            <>
              <Target className="h-3.5 w-3.5" />
              Fit
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-zinc-400">
        Currently {output.width} × {output.height} at {Math.round(editState.exportSettings.quality * 100)}% quality.
      </p>
    </div>
  );
}
