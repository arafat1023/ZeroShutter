import { useState } from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

export function RotateTool() {
  const { editState, setRotation, setFlipH, setFlipV, pushHistory } = useImageStore();
  const { angle, flipH, flipV, backgroundColor } = editState.rotate;
  const [straighten, setStraighten] = useState(0);
  const [isTransparent, setIsTransparent] = useState(false);

  const setBackgroundColor = (color: string) => {
    useImageStore.setState((s) => ({
      editState: {
        ...s.editState,
        rotate: { ...s.editState.rotate, backgroundColor: color },
      },
    }));
  };

  const handleStraighten = (val: number) => {
    setStraighten(val);
    // Straighten adds to the base angle (nearest 90° multiple or 0)
    const baseAngle = Math.round(angle - straighten); // remove old straighten
    const newAngle = ((baseAngle + val) % 360 + 360) % 360;
    setRotation(newAngle);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Rotate
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              setRotation((angle - 90 + 360) % 360);
              pushHistory('Rotate -90°');
            }}
            className="flex flex-col items-center gap-1 p-3 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px]">-90°</span>
          </button>
          <button
            onClick={() => {
              setRotation((angle + 90) % 360);
              pushHistory('Rotate +90°');
            }}
            className="flex flex-col items-center gap-1 p-3 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[10px]">+90°</span>
          </button>
          <button
            onClick={() => {
              setRotation((angle + 180) % 360);
              pushHistory('Rotate 180°');
            }}
            className="flex flex-col items-center gap-1 p-3 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[10px]">180°</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Custom Angle
        </h3>
        <input
          type="range"
          min={0}
          max={359}
          value={angle}
          onChange={(e) => setRotation(parseInt(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
          <span>0°</span>
          <span className="text-zinc-300 text-xs font-medium">{angle}°</span>
          <span>359°</span>
        </div>
        <input
          type="number"
          value={angle}
          onChange={(e) => setRotation(((parseInt(e.target.value) || 0) + 360) % 360)}
          min={0}
          max={359}
          className="w-full mt-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Straighten */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Straighten
        </h3>
        <input
          type="range"
          min={-100}
          max={100}
          value={Math.round(straighten * 10)}
          onChange={(e) => handleStraighten(parseInt(e.target.value) / 10)}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
          <span>-10°</span>
          <span className="text-zinc-300 text-xs font-medium">{straighten.toFixed(1)}°</span>
          <span>+10°</span>
        </div>
      </div>

      {/* Background Fill Color */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Background Fill
        </h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={isTransparent}
              onChange={(e) => {
                setIsTransparent(e.target.checked);
                setBackgroundColor(e.target.checked ? 'transparent' : '#ffffff');
              }}
              className="accent-violet-500"
            />
            Transparent
          </label>
          {!isTransparent && (
            <input
              type="color"
              value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-10 h-8 bg-zinc-800 rounded border border-zinc-700 cursor-pointer"
            />
          )}
        </div>
        <p className="text-[10px] text-zinc-600 mt-1">
          Fill color for areas exposed by rotation. Transparent only works with PNG/WebP export.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Flip
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setFlipH(!flipH);
              pushHistory(flipH ? 'Unflip H' : 'Flip H');
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
              flipH
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
            Horizontal
          </button>
          <button
            onClick={() => {
              setFlipV(!flipV);
              pushHistory(flipV ? 'Unflip V' : 'Flip V');
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
              flipV
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
            }`}
          >
            <FlipVertical className="w-4 h-4" />
            Vertical
          </button>
        </div>
      </div>

      {(angle !== 0 || flipH || flipV) && (
        <button
          onClick={() => {
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
            setStraighten(0);
            pushHistory('Reset rotation');
          }}
          className="w-full text-xs text-red-400 hover:text-red-300"
        >
          Reset rotation & flip
        </button>
      )}
    </div>
  );
}
