import { useState, useEffect } from 'react';
import { Link, Unlink } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

const SCALE_STEPS = [25, 50, 75, 100, 150, 200];

export function ResizeTool() {
  const activeImage = useImageStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const editState = useImageStore((s) => s.editState);
  const { setResize, clearResize, pushHistory } = useImageStore();

  // Resizing happens after the crop, so the baseline is the cropped size.
  const baseWidth = editState.crop?.width ?? activeImage?.width ?? 0;
  const baseHeight = editState.crop?.height ?? activeImage?.height ?? 0;
  const aspectRatio = baseWidth / (baseHeight || 1);

  const [width, setWidth] = useState(baseWidth);
  const [height, setHeight] = useState(baseHeight);
  const [locked, setLocked] = useState(true);

  // Re-seed the inputs when the underlying source dimensions change.
  const baselineKey = `${activeImage?.id ?? ''}:${baseWidth}x${baseHeight}`;
  useEffect(() => {
    const resize = useImageStore.getState().editState.resize;
    setWidth(resize?.width ?? baseWidth);
    setHeight(resize?.height ?? baseHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineKey]);

  if (!activeImage) return null;

  const handleWidthChange = (value: number) => {
    setWidth(value);
    if (locked && value > 0) setHeight(Math.max(1, Math.round(value / aspectRatio)));
  };

  const handleHeightChange = (value: number) => {
    setHeight(value);
    if (locked && value > 0) setWidth(Math.max(1, Math.round(value * aspectRatio)));
  };

  const applyScale = (percent: number) => {
    const w = Math.max(1, Math.round(baseWidth * (percent / 100)));
    const h = Math.max(1, Math.round(baseHeight * (percent / 100)));
    setWidth(w);
    setHeight(h);
    setResize(w, h, locked);
    pushHistory(`Resize ${w}×${h}`);
  };

  const applyResize = () => {
    if (width < 1 || height < 1) return;
    setResize(width, height, locked);
    pushHistory(`Resize ${width}×${height}`);
  };

  const isValid = width >= 1 && height >= 1;
  const isChanged = width !== baseWidth || height !== baseHeight;
  const applied = editState.resize;
  const isApplied = applied?.width === width && applied?.height === height;
  const currentPercent = baseWidth > 0 ? Math.round((width / baseWidth) * 100) : 100;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Dimensions (px)</h3>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="resize-width" className="mb-0.5 block text-[10px] text-zinc-500">Width</label>
            <input
              id="resize-width"
              type="number"
              value={width}
              onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
              min={1}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setLocked(!locked)}
            aria-pressed={locked}
            className={`mb-1 rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              locked ? 'bg-violet-500/10 text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={locked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
          >
            {locked ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <label htmlFor="resize-height" className="mb-0.5 block text-[10px] text-zinc-500">Height</label>
            <input
              id="resize-height"
              type="number"
              value={height}
              onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
              min={1}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
        {!isValid && <p className="mt-1.5 text-[10px] text-red-400">Width and height must be at least 1 pixel.</p>}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Scale</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {SCALE_STEPS.map((percent) => (
            <button
              key={percent}
              onClick={() => applyScale(percent)}
              className={`rounded-md py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                currentPercent === percent
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 rounded-lg bg-zinc-800/50 p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-400">{editState.crop ? 'Cropped size' : 'Original size'}</span>
          <span className="tabular-nums text-zinc-200">{baseWidth} × {baseHeight}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Output</span>
          <span className={`tabular-nums ${isChanged ? 'text-violet-400' : 'text-zinc-200'}`}>
            {width} × {height} ({currentPercent}%)
          </span>
        </div>
      </div>

      <button
        onClick={applyResize}
        disabled={!isValid || isApplied}
        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
          isValid && !isApplied
            ? 'bg-violet-600 text-white hover:bg-violet-700'
            : 'cursor-not-allowed bg-zinc-800 text-zinc-600'
        }`}
      >
        {isApplied ? 'Resize applied' : 'Apply resize'}
      </button>

      {applied && (
        <button
          onClick={() => {
            clearResize();
            setWidth(baseWidth);
            setHeight(baseHeight);
            pushHistory('Clear resize');
          }}
          className="w-full text-xs text-red-400 transition-colors hover:text-red-300"
        >
          Reset to original size
        </button>
      )}
    </div>
  );
}
