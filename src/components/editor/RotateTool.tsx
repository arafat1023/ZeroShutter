import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

export function RotateTool() {
  const { editState, setRotation, setFlipH, setFlipV, pushHistory } = useImageStore();
  const { angle, flipH, flipV } = editState.rotate;

  const rotateTo = (next: number, label: string) => {
    setRotation(((next % 360) + 360) % 360);
    pushHistory(label);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Rotate
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => rotateTo(angle - 90, 'Rotate -90°')}
            className="flex flex-col items-center gap-1 p-3 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px]">-90°</span>
          </button>
          <button
            onClick={() => rotateTo(angle + 90, 'Rotate +90°')}
            className="flex flex-col items-center gap-1 p-3 bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCw className="w-5 h-5" />
            <span className="text-[10px]">+90°</span>
          </button>
          <button
            onClick={() => rotateTo(angle + 180, 'Rotate 180°')}
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
          onPointerUp={() => pushHistory(`Rotate ${angle}°`)}
          onKeyUp={() => pushHistory(`Rotate ${angle}°`)}
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
          onChange={(e) => setRotation(((parseInt(e.target.value) || 0) % 360 + 360) % 360)}
          onBlur={() => pushHistory(`Rotate ${angle}°`)}
          min={0}
          max={359}
          className="w-full mt-2 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
        />
      </div>

      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Flip
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setFlipH(!flipH);
              pushHistory('Flip horizontal');
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
              pushHistory('Flip vertical');
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
