import { useImageStore } from '@/stores/useImageStore';
import type { ColorPreset } from '@/types';

const PRESETS: { label: string; value: ColorPreset }[] = [
  { label: 'Grayscale', value: 'grayscale' },
  { label: 'Sepia', value: 'sepia' },
  { label: 'Invert', value: 'invert' },
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
  { label: 'Hue', key: 'hue', min: 0, max: 360, unit: '°' },
  { label: 'Sharpness', key: 'sharpness', min: 0, max: 100, unit: '' },
];

export function ColorTool() {
  const { editState, setColorAdjustment, setColorPreset, resetColor, pushHistory } = useImageStore();
  const adj = editState.colorAdjustments;
  const hasChanges = adj.brightness !== 0 || adj.contrast !== 0 || adj.saturation !== 0 || adj.hue !== 0 || adj.sharpness !== 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Presets
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                setColorPreset(p.value);
                pushHistory(`Color: ${p.label}`);
              }}
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                adj.preset === p.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Adjustments
        </h3>
        {SLIDERS.map((s) => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-400">{s.label}</label>
              <span className="text-xs text-zinc-300 font-medium tabular-nums">
                {adj[s.key]}{s.unit}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              value={adj[s.key]}
              onChange={(e) => setColorAdjustment(s.key, parseInt(e.target.value))}
              onMouseUp={() => {
                if (hasChanges) pushHistory(`Adjust ${s.label}`);
              }}
              className="w-full accent-violet-500"
            />
          </div>
        ))}
      </div>

      {hasChanges && (
        <button
          onClick={() => {
            resetColor();
            pushHistory('Reset color');
          }}
          className="w-full text-xs text-red-400 hover:text-red-300"
        >
          Reset adjustments
        </button>
      )}
    </div>
  );
}
