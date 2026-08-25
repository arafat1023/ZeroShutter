import { useImageStore } from '@/stores/useImageStore';
import type { WatermarkData, WatermarkPosition } from '@/types';

const POSITIONS: { label: string; value: WatermarkPosition }[] = [
  { label: '↖', value: 'top-left' },
  { label: '↑', value: 'top-center' },
  { label: '↗', value: 'top-right' },
  { label: '←', value: 'center-left' },
  { label: '•', value: 'center' },
  { label: '→', value: 'center-right' },
  { label: '↙', value: 'bottom-left' },
  { label: '↓', value: 'bottom-center' },
  { label: '↘', value: 'bottom-right' },
];

export function WatermarkPlacement({ watermark }: { watermark: WatermarkData }) {
  const { updateWatermark, pushHistory } = useImageStore();

  return (
    <>
      <div>
        <span className="mb-1 block text-xs text-zinc-400">Position</span>
        <div className="grid grid-cols-3 gap-1" role="group" aria-label="Watermark position">
          {POSITIONS.map((position) => (
            <button
              key={position.value}
              onClick={() => {
                updateWatermark({ position: position.value });
                pushHistory('Move watermark');
              }}
              aria-label={position.value.replace('-', ' ')}
              aria-pressed={watermark.position === position.value}
              disabled={watermark.tiling}
              className={`rounded-md p-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                watermark.tiling
                  ? 'cursor-not-allowed bg-zinc-900 text-zinc-700'
                  : watermark.position === position.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {position.label}
            </button>
          ))}
        </div>
        {watermark.tiling && (
          <p className="mt-1 text-[11px] text-zinc-400">Position is ignored while tiling.</p>
        )}
      </div>

      <div>
        <div className="mb-1 flex justify-between">
          <label htmlFor="wm-rotation" className="text-xs text-zinc-400">Rotation</label>
          <span className="text-xs tabular-nums text-zinc-200">{watermark.rotation}°</span>
        </div>
        <input
          id="wm-rotation"
          type="range" min={-180} max={180} value={watermark.rotation}
          onChange={(e) => updateWatermark({ rotation: parseInt(e.target.value) })}
          onPointerUp={() => pushHistory('Rotate watermark')}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="wm-tiling" className="text-xs text-zinc-400">Tile / repeat</label>
        <button
          id="wm-tiling"
          role="switch"
          aria-checked={watermark.tiling}
          onClick={() => {
            updateWatermark({ tiling: !watermark.tiling });
            pushHistory(watermark.tiling ? 'Untile watermark' : 'Tile watermark');
          }}
          className={`relative h-5 w-10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            watermark.tiling ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              watermark.tiling ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {watermark.tiling && (
        <div>
          <div className="mb-1 flex justify-between">
            <label htmlFor="wm-spacing" className="text-xs text-zinc-400">Tile spacing</label>
            <span className="text-xs tabular-nums text-zinc-200">{watermark.tileSpacing}px</span>
          </div>
          <input
            id="wm-spacing"
            type="range" min={50} max={1000} value={watermark.tileSpacing}
            onChange={(e) => updateWatermark({ tileSpacing: parseInt(e.target.value) })}
            onPointerUp={() => pushHistory('Adjust tile spacing')}
            className="w-full accent-violet-500"
          />
        </div>
      )}
    </>
  );
}
