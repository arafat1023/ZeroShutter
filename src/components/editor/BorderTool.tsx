import { useImageStore } from '@/stores/useImageStore';

export function BorderTool() {
  const { editState, setBorder, updateBorder, pushHistory } = useImageStore();
  const border = editState.border;

  const enableBorder = () => {
    setBorder({ top: 50, right: 50, bottom: 50, left: 50, color: '#000000', mode: 'solid', uniform: true });
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
