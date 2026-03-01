import { useState } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { ASPECT_RATIO_PRESETS } from '@/lib/constants';

export function BorderTool() {
  const { editState, setBorder, updateBorder, pushHistory } = useImageStore();
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const border = editState.border;
  const [targetRatio, setTargetRatio] = useState<number | null>(null);

  const enableBorder = () => {
    setBorder({ top: 50, right: 50, bottom: 50, left: 50, color: '#000000', mode: 'solid', uniform: true, stroke: { enabled: false, width: 2, color: '#ffffff' } });
    pushHistory('Add border');
  };

  if (!border) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">Add padding or a border around your image.</p>
        <button
          onClick={enableBorder}
          className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add Border / Padding
        </button>
      </div>
    );
  }

  const handleUniform = (val: number) => {
    updateBorder({ top: val, right: val, bottom: val, left: val });
  };

  return (
    <div className="space-y-4">
      {/* Mode */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mode</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(['solid', 'blur'] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateBorder({ mode: m })}
              className={`px-3 py-2 rounded-md text-xs font-medium capitalize transition-colors ${
                border.mode === m
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {m === 'solid' ? 'Solid Color' : 'Blurred BG'}
            </button>
          ))}
        </div>
      </div>

      {/* Color (only for solid) */}
      {border.mode === 'solid' && (
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={border.color}
              onChange={(e) => updateBorder({ color: e.target.value })}
              className="w-12 h-9 bg-zinc-800 rounded-lg border border-zinc-700 cursor-pointer"
            />
            <div className="flex gap-1">
              {['#000000', '#ffffff', '#18181b', '#f4f4f5', '#7c3aed'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateBorder({ color: c })}
                  className={`w-9 h-9 rounded-lg border-2 transition-colors ${
                    border.color === c ? 'border-violet-500' : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Uniform toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">Uniform padding</label>
        <button
          onClick={() => updateBorder({ uniform: !border.uniform })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            border.uniform ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              border.uniform ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Padding controls */}
      {border.uniform ? (
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-400">Padding</label>
            <span className="text-xs text-zinc-300">{border.top}px</span>
          </div>
          <input
            type="range" min={0} max={500} value={border.top}
            onChange={(e) => handleUniform(parseInt(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side}>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-zinc-400 capitalize">{side}</label>
                <span className="text-xs text-zinc-300">{border[side]}px</span>
              </div>
              <input
                type="range" min={0} max={500} value={border[side]}
                onChange={(e) => updateBorder({ [side]: parseInt(e.target.value) })}
                className="w-full accent-violet-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Quick presets */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Quick Presets</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Thin', val: 20 },
            { label: 'Medium', val: 80 },
            { label: 'Wide', val: 200 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => handleUniform(p.val)}
              className="px-2 py-1.5 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stroke</h3>
          <button
            onClick={() => updateBorder({ stroke: { ...border.stroke, enabled: !border.stroke.enabled } })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              border.stroke.enabled ? 'bg-violet-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                border.stroke.enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        {border.stroke.enabled && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-zinc-400">Width</label>
                <span className="text-xs text-zinc-300">{border.stroke.width}px</span>
              </div>
              <input
                type="range" min={1} max={20} value={border.stroke.width}
                onChange={(e) => updateBorder({ stroke: { ...border.stroke, width: parseInt(e.target.value) } })}
                className="w-full accent-violet-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Color</label>
              <input
                type="color"
                value={border.stroke.color}
                onChange={(e) => updateBorder({ stroke: { ...border.stroke, color: e.target.value } })}
                className="w-full h-9 bg-zinc-800 rounded-lg border border-zinc-700 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Extend to aspect ratio */}
      {activeImage && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Extend to Ratio</h3>
          <div className="flex gap-2">
            <select
              value={targetRatio ?? ''}
              onChange={(e) => setTargetRatio(e.target.value ? parseFloat(e.target.value) : null)}
              className="flex-1 px-2 py-1.5 bg-zinc-800 rounded-md text-xs text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
            >
              <option value="">Select ratio</option>
              {ASPECT_RATIO_PRESETS.filter((p) => p.ratio !== null).map((p) => (
                <option key={p.label} value={p.ratio!}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={() => {
                if (!targetRatio || !activeImage) return;
                const imgW = activeImage.width + border.left + border.right;
                const imgH = activeImage.height + border.top + border.bottom;
                const currentRatio = imgW / imgH;

                if (currentRatio < targetRatio) {
                  // Need wider — add horizontal padding
                  const newW = Math.round(imgH * targetRatio);
                  const extra = newW - imgW;
                  const side = Math.round(extra / 2);
                  updateBorder({ left: border.left + side, right: border.right + (extra - side) });
                } else if (currentRatio > targetRatio) {
                  // Need taller — add vertical padding
                  const newH = Math.round(imgW / targetRatio);
                  const extra = newH - imgH;
                  const side = Math.round(extra / 2);
                  updateBorder({ top: border.top + side, bottom: border.bottom + (extra - side) });
                }
                pushHistory(`Extend to ${ASPECT_RATIO_PRESETS.find((p) => p.ratio === targetRatio)?.label ?? targetRatio}`);
              }}
              disabled={!targetRatio}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                targetRatio
                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Remove */}
      <button
        onClick={() => {
          setBorder(null);
          pushHistory('Remove border');
        }}
        className="w-full text-xs text-red-400 hover:text-red-300"
      >
        Remove border
      </button>
    </div>
  );
}
