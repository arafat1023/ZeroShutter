import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import type { ColorPreset } from '@/types';

const PRESETS: { label: string; value: ColorPreset }[] = [
  { label: 'Grayscale', value: 'grayscale' },
  { label: 'Sepia', value: 'sepia' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cool', value: 'cool' },
  { label: 'High Contrast', value: 'highContrast' },
  { label: 'Vintage', value: 'vintage' },
];

interface SliderRow {
  label: string;
  key: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'sharpness';
  min: number;
  max: number;
  unit: string;
}

const SLIDERS: SliderRow[] = [
  { label: 'Brightness', key: 'brightness', min: -100, max: 100, unit: '' },
  { label: 'Contrast', key: 'contrast', min: -100, max: 100, unit: '' },
  { label: 'Saturation', key: 'saturation', min: -100, max: 100, unit: '' },
  // Signed range: rotating "a bit warmer" reads far better than 0-360.
  { label: 'Hue shift', key: 'hue', min: -180, max: 180, unit: '°' },
  { label: 'Sharpness', key: 'sharpness', min: 0, max: 100, unit: '' },
];

export function ColorTool() {
  const editState = useImageStore((s) => s.editState);
  const { setColorAdjustment, setColorPreset, toggleInvert, resetColor, pushHistory } = useImageStore();
  const adj = editState.colorAdjustments;

  // Commit one history entry per gesture, not per pixel of slider movement.
  const gestureStart = useRef<number | null>(null);

  const hasChanges =
    adj.brightness !== 0 || adj.contrast !== 0 || adj.saturation !== 0 ||
    adj.hue !== 0 || adj.sharpness !== 0 || adj.invert;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Presets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => {
                const next = adj.preset === preset.value ? null : preset.value;
                setColorPreset(next);
                pushHistory(next ? `Colour: ${preset.label}` : 'Clear colour preset');
              }}
              aria-pressed={adj.preset === preset.value}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                adj.preset === preset.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="color-invert" className="text-xs text-zinc-400">
          Invert colours
        </label>
        <button
          id="color-invert"
          onClick={() => {
            toggleInvert();
            pushHistory(adj.invert ? 'Remove invert' : 'Invert colours');
          }}
          role="switch"
          aria-checked={adj.invert}
          className={`relative h-5 w-10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            adj.invert ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              adj.invert ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Adjustments</h3>
        {SLIDERS.map((slider) => (
          <div key={slider.key}>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor={`color-${slider.key}`} className="text-xs text-zinc-400">
                {slider.label}
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium tabular-nums text-zinc-200">
                  {adj[slider.key]}{slider.unit}
                </span>
                {adj[slider.key] !== 0 && (
                  <button
                    onClick={() => {
                      setColorAdjustment(slider.key, 0);
                      pushHistory(`Reset ${slider.label.toLowerCase()}`);
                    }}
                    aria-label={`Reset ${slider.label}`}
                    className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-200"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <input
              id={`color-${slider.key}`}
              type="range"
              min={slider.min}
              max={slider.max}
              value={adj[slider.key]}
              onPointerDown={() => {
                gestureStart.current = adj[slider.key];
              }}
              onChange={(e) => setColorAdjustment(slider.key, parseInt(e.target.value))}
              onPointerUp={() => {
                if (gestureStart.current !== adj[slider.key]) pushHistory(`Adjust ${slider.label.toLowerCase()}`);
                gestureStart.current = null;
              }}
              onKeyUp={() => pushHistory(`Adjust ${slider.label.toLowerCase()}`)}
              className="w-full accent-violet-500"
            />
          </div>
        ))}
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Sharpness runs an unsharp mask; the preview and the exported file use the same kernel.
        </p>
      </div>

      {hasChanges && (
        <button
          onClick={() => {
            resetColor();
            pushHistory('Reset colour');
          }}
          className="w-full rounded-lg border border-zinc-800 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/40 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Reset all adjustments
        </button>
      )}
    </div>
  );
}
