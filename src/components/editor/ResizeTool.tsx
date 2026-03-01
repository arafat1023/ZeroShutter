import { useState, useEffect } from 'react';
import { Link, Unlink, AlertTriangle } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

type ResizeMode = 'pixels' | 'percentage' | 'fit';

export function ResizeTool() {
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const { editState, setResize } = useImageStore();
  const pushHistory = useImageStore((s) => s.pushHistory);

  const origW = activeImage?.width ?? 0;
  const origH = activeImage?.height ?? 0;
  const aspectRatio = origW / (origH || 1);

  const activeId = activeImage?.id ?? '';
  const [mode, setMode] = useState<ResizeMode>('pixels');
  const [width, setWidth] = useState(editState.resize?.width ?? origW);
  const [height, setHeight] = useState(editState.resize?.height ?? origH);
  const [locked, setLocked] = useState(true);
  const [percentage, setPercentage] = useState(100);
  const [maxW, setMaxW] = useState(1920);
  const [maxH, setMaxH] = useState(1080);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWidth(origW);
    setHeight(origH);
    setPercentage(100);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeImage) return null;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (locked) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (locked) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handlePercentage = (pct: number) => {
    setPercentage(pct);
    setWidth(Math.round(origW * (pct / 100)));
    setHeight(Math.round(origH * (pct / 100)));
  };

  const handleFitWithin = () => {
    // Only scale down, never up
    if (origW <= maxW && origH <= maxH) {
      setWidth(origW);
      setHeight(origH);
      return;
    }
    const scale = Math.min(maxW / origW, maxH / origH);
    setWidth(Math.round(origW * scale));
    setHeight(Math.round(origH * scale));
  };

  const applyResize = () => {
    if (width > 0 && height > 0) {
      setResize(width, height, locked);
      pushHistory(`Resize ${width}×${height}`);
    }
  };

  const isChanged = width !== origW || height !== origH;

  // Stretch warning: aspect ratio differs by >1%
  const newRatio = width / (height || 1);
  const ratioDiff = Math.abs(newRatio - aspectRatio) / aspectRatio;
  const showStretchWarning = !locked && isChanged && ratioDiff > 0.01;

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-1 bg-zinc-800/50 rounded-lg p-0.5">
        {([
          { id: 'pixels' as const, label: 'Pixels' },
          { id: 'percentage' as const, label: 'Percent' },
          { id: 'fit' as const, label: 'Fit Within' },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === m.id
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Pixels mode */}
      {mode === 'pixels' && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Dimensions (px)
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 mb-0.5 block">Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              onClick={() => setLocked(!locked)}
              className={`mt-4 p-2 rounded-lg transition-colors ${
                locked ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-500 hover:text-zinc-400'
              }`}
              title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            >
              {locked ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 mb-0.5 block">Height</label>
              <input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Percentage mode */}
      {mode === 'percentage' && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Scale (%)
          </h3>
          <div className="flex gap-2">
            {[25, 50, 75, 100, 150, 200].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentage(pct)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  percentage === pct
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <input
            type="range"
            min={10}
            max={300}
            value={percentage}
            onChange={(e) => handlePercentage(parseInt(e.target.value))}
            className="w-full mt-2 accent-violet-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>10%</span>
            <span className="text-zinc-300">{percentage}%</span>
            <span>300%</span>
          </div>
        </div>
      )}

      {/* Fit within mode */}
      {mode === 'fit' && (
        <div className="space-y-3">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
            <p className="text-xs text-violet-300 leading-relaxed">
              Image will be scaled down to fit within the specified maximum dimensions. Images smaller than the limits are not scaled up.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 mb-0.5 block">Max Width</label>
              <input
                type="number"
                value={maxW}
                onChange={(e) => setMaxW(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-zinc-500 mb-0.5 block">Max Height</label>
              <input
                type="number"
                value={maxH}
                onChange={(e) => setMaxH(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <button
            onClick={handleFitWithin}
            className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
          >
            Calculate Fit
          </button>
        </div>
      )}

      {/* Stretch warning */}
      {showStretchWarning && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300">
            Aspect ratio changed — image will be stretched/distorted.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Original: {origW} × {origH}</span>
        {isChanged && (
          <span className="text-violet-400">→ {width} × {height}</span>
        )}
      </div>

      <button
        onClick={applyResize}
        disabled={!isChanged}
        className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          isChanged
            ? 'bg-violet-600 hover:bg-violet-700 text-white'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
      >
        Apply Resize
      </button>

      {editState.resize && (
        <button
          onClick={() => {
            setWidth(origW);
            setHeight(origH);
            setPercentage(100);
            setResize(origW, origH);
          }}
          className="w-full text-xs text-red-400 hover:text-red-300"
        >
          Reset to original
        </button>
      )}
    </div>
  );
}
