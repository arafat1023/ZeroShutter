import { useState, useEffect } from 'react';
import { Link, Unlink } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

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
  const [width, setWidth] = useState(editState.resize?.width ?? origW);
  const [height, setHeight] = useState(editState.resize?.height ?? origH);
  const [locked, setLocked] = useState(true);
  const [percentage, setPercentage] = useState(100);

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

  const applyResize = () => {
    if (width > 0 && height > 0) {
      setResize(width, height, locked);
      pushHistory(`Resize ${width}×${height}`);
    }
  };

  const isChanged = width !== origW || height !== origH;

  return (
    <div className="space-y-5">
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
