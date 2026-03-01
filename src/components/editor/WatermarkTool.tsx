import { useImageStore } from '@/stores/useImageStore';
import type { WatermarkPosition } from '@/types';

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

const FONTS = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana', 'Impact'];

export function WatermarkTool() {
  const { editState, setWatermark, updateWatermark, pushHistory } = useImageStore();
  const wm = editState.watermark;

  const enableWatermark = () => {
    setWatermark({
      type: 'text',
      text: 'ZeroShutter',
      fontFamily: 'Arial',
      fontSize: 48,
      fontColor: '#ffffff',
      fontOpacity: 0.5,
      bold: false,
      italic: false,
      rotation: 0,
      imageUrl: null,
      imageOpacity: 0.5,
      position: 'bottom-right',
      tiling: false,
      tileSpacing: 200,
      scale: 20,
    });
    pushHistory('Add watermark');
  };

  if (!wm) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">Add a text watermark to protect your image.</p>
        <button
          onClick={enableWatermark}
          className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Add Watermark
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Text</label>
        <input
          type="text"
          value={wm.text}
          onChange={(e) => updateWatermark({ text: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
          placeholder="Watermark text"
        />
      </div>

      {/* Font */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Font</label>
        <select
          value={wm.fontFamily}
          onChange={(e) => updateWatermark({ fontFamily: e.target.value })}
          className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-xs text-zinc-400">Size</label>
          <span className="text-xs text-zinc-300">{wm.fontSize}px</span>
        </div>
        <input
          type="range" min={12} max={200} value={wm.fontSize}
          onChange={(e) => updateWatermark({ fontSize: parseInt(e.target.value) })}
          className="w-full accent-violet-500"
        />
      </div>

      {/* Color + Opacity */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-zinc-400 block mb-1">Color</label>
          <input
            type="color"
            value={wm.fontColor}
            onChange={(e) => updateWatermark({ fontColor: e.target.value })}
            className="w-full h-9 bg-zinc-800 rounded-lg border border-zinc-700 cursor-pointer"
          />
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-400">Opacity</label>
            <span className="text-xs text-zinc-300">{Math.round(wm.fontOpacity * 100)}%</span>
          </div>
          <input
            type="range" min={5} max={100} value={Math.round(wm.fontOpacity * 100)}
            onChange={(e) => updateWatermark({ fontOpacity: parseInt(e.target.value) / 100 })}
            className="w-full accent-violet-500"
          />
        </div>
      </div>

      {/* Bold / Italic */}
      <div className="flex gap-2">
        <button
          onClick={() => updateWatermark({ bold: !wm.bold })}
          className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${
            wm.bold ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          B
        </button>
        <button
          onClick={() => updateWatermark({ italic: !wm.italic })}
          className={`flex-1 py-1.5 rounded-md text-sm italic transition-colors ${
            wm.italic ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          I
        </button>
      </div>

      {/* Position Grid */}
      <div>
        <label className="text-xs text-zinc-400 block mb-1">Position</label>
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => updateWatermark({ position: p.value })}
              className={`p-2 rounded-md text-sm transition-colors ${
                wm.position === p.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-xs text-zinc-400">Rotation</label>
          <span className="text-xs text-zinc-300">{wm.rotation}°</span>
        </div>
        <input
          type="range" min={-180} max={180} value={wm.rotation}
          onChange={(e) => updateWatermark({ rotation: parseInt(e.target.value) })}
          className="w-full accent-violet-500"
        />
      </div>

      {/* Tiling */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-400">Tile / Repeat</label>
        <button
          onClick={() => updateWatermark({ tiling: !wm.tiling })}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            wm.tiling ? 'bg-violet-600' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              wm.tiling ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {wm.tiling && (
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-400">Tile spacing</label>
            <span className="text-xs text-zinc-300">{wm.tileSpacing}px</span>
          </div>
          <input
            type="range" min={50} max={500} value={wm.tileSpacing}
            onChange={(e) => updateWatermark({ tileSpacing: parseInt(e.target.value) })}
            className="w-full accent-violet-500"
          />
        </div>
      )}

      {/* Remove */}
      <button
        onClick={() => {
          setWatermark(null);
          pushHistory('Remove watermark');
        }}
        className="w-full text-xs text-red-400 hover:text-red-300"
      >
        Remove watermark
      </button>
    </div>
  );
}
