import { useImageStore } from '@/stores/useImageStore';

export function CropTool() {
  const activeImage = useImageStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const crop = useImageStore((s) => s.editState.crop);
  const { setCrop, pushHistory } = useImageStore();

  if (!activeImage) return null;

  const areaPercent = crop
    ? Math.round(((crop.width * crop.height) / (activeImage.width * activeImage.height)) * 100)
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
        <p className="text-xs leading-relaxed text-violet-200">
          Drag the handles on the canvas to set the region. Pick a ratio from the bar above it, then
          choose <strong>Apply crop</strong>.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Original</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-zinc-400">Dimensions</dt>
            <dd className="tabular-nums text-zinc-200">{activeImage.width} × {activeImage.height}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-400">Aspect ratio</dt>
            <dd className="tabular-nums text-zinc-200">{(activeImage.width / activeImage.height).toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      {crop ? (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Applied crop</h3>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-zinc-400">Size</dt>
              <dd className="tabular-nums text-emerald-400">{crop.width} × {crop.height}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Position</dt>
              <dd className="tabular-nums text-zinc-200">{crop.x}, {crop.y}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">Area kept</dt>
              <dd className="tabular-nums text-zinc-200">{areaPercent}%</dd>
            </div>
          </dl>
          <button
            onClick={() => {
              setCrop(null);
              pushHistory('Clear crop');
            }}
            className="mt-3 w-full rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 transition-colors hover:border-red-500/40 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Clear crop
          </button>
        </div>
      ) : (
        <p className="text-center text-[10px] text-zinc-600">No crop applied yet</p>
      )}
    </div>
  );
}
