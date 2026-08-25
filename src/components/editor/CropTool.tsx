import { useImageStore } from '@/stores/useImageStore';
import { useViewStore } from '@/stores/useViewStore';
import { ASPECT_RATIO_PRESETS, SOCIAL_PRESETS } from '@/lib/constants';
import { cropForAspect } from '@/lib/cropGeometry';
import type { AspectRatioPreset } from '@/types';

export function CropTool() {
  const activeImage = useImageStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const crop = useImageStore((s) => s.editState.crop);
  const rotate = useImageStore((s) => s.editState.rotate);
  const { setCrop, pushHistory } = useImageStore();
  const { cropRatioLabel, setCropRatio } = useViewStore();

  if (!activeImage) return null;

  const applyPreset = (preset: AspectRatioPreset) => {
    setCropRatio(preset.label, preset.ratio);
    if (preset.ratio) {
      const next = cropForAspect(activeImage.width, activeImage.height, preset.ratio);
      setCrop(next);
      pushHistory(`Crop ${preset.label}`);
    }
  };

  const presetButton = (preset: AspectRatioPreset) => (
    <button
      key={preset.label}
      onClick={() => applyPreset(preset)}
      aria-pressed={cropRatioLabel === preset.label}
      className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        cropRatioLabel === preset.label
          ? 'bg-violet-600 text-white'
          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
      }`}
    >
      {preset.label}
    </button>
  );

  const areaPercent = crop
    ? Math.round(((crop.width * crop.height) / (activeImage.width * activeImage.height)) * 100)
    : 100;

  return (
    <div className="space-y-5">
      {(rotate.angle !== 0 || rotate.flipH || rotate.flipV) && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] leading-relaxed text-amber-200">
          Cropping happens before rotation, so the canvas shows the unrotated
          image while this tool is open.
        </p>
      )}

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Aspect ratio</h3>
        <div className="grid grid-cols-4 gap-1.5">{ASPECT_RATIO_PRESETS.map(presetButton)}</div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Social sizes</h3>
        <div className="grid grid-cols-2 gap-1.5">{SOCIAL_PRESETS.map(presetButton)}</div>
      </div>

      <dl className="space-y-1 rounded-lg bg-zinc-800/50 p-3 text-xs">
        <div className="flex justify-between">
          <dt className="text-zinc-400">Original</dt>
          <dd className="tabular-nums text-zinc-200">{activeImage.width} × {activeImage.height}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-400">Crop</dt>
          <dd className="tabular-nums text-emerald-400">
            {crop ? `${crop.width} × ${crop.height}` : 'Full frame'}
          </dd>
        </div>
        {crop && (
          <>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Position</dt>
              <dd className="tabular-nums text-zinc-200">{crop.x}, {crop.y}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Area kept</dt>
              <dd className="tabular-nums text-zinc-200">{areaPercent}%</dd>
            </div>
          </>
        )}
      </dl>

      <button
        onClick={() => {
          setCropRatio('Free', null);
          setCrop(null);
          pushHistory('Reset crop');
        }}
        disabled={!crop}
        className={`w-full rounded-lg border py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
          crop
            ? 'border-red-500/20 text-red-400 hover:border-red-500/40 hover:text-red-300'
            : 'cursor-not-allowed border-zinc-800 text-zinc-600'
        }`}
      >
        Reset to full frame
      </button>
    </div>
  );
}
