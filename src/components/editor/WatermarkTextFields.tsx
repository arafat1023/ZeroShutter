import { useImageStore } from '@/stores/useImageStore';
import type { WatermarkData } from '@/types';

const FONTS = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana', 'Impact'];

export function WatermarkTextFields({ watermark }: { watermark: WatermarkData }) {
  const { updateWatermark, pushHistory } = useImageStore();

  return (
    <>
      <div>
        <label htmlFor="wm-text" className="mb-1 block text-xs text-zinc-400">Text</label>
        <input
          id="wm-text"
          type="text"
          value={watermark.text}
          onChange={(e) => updateWatermark({ text: e.target.value })}
          onBlur={() => pushHistory('Edit watermark text')}
          placeholder="Watermark text"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="wm-font" className="mb-1 block text-xs text-zinc-400">Font</label>
        <select
          id="wm-font"
          value={watermark.fontFamily}
          onChange={(e) => {
            updateWatermark({ fontFamily: e.target.value });
            pushHistory('Change watermark font');
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
        >
          {FONTS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex justify-between">
          <label htmlFor="wm-size" className="text-xs text-zinc-400">Size</label>
          <span className="text-xs tabular-nums text-zinc-200">{watermark.fontSize}px</span>
        </div>
        <input
          id="wm-size"
          type="range" min={12} max={400} value={watermark.fontSize}
          onChange={(e) => updateWatermark({ fontSize: parseInt(e.target.value) })}
          onPointerUp={() => pushHistory('Resize watermark')}
          className="w-full accent-violet-500"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="wm-color" className="mb-1 block text-xs text-zinc-400">Colour</label>
          <input
            id="wm-color"
            type="color"
            value={watermark.fontColor}
            onChange={(e) => updateWatermark({ fontColor: e.target.value })}
            onBlur={() => pushHistory('Change watermark colour')}
            className="h-9 w-full cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800"
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex justify-between">
            <label htmlFor="wm-opacity" className="text-xs text-zinc-400">Opacity</label>
            <span className="text-xs tabular-nums text-zinc-200">{Math.round(watermark.fontOpacity * 100)}%</span>
          </div>
          <input
            id="wm-opacity"
            type="range" min={5} max={100} value={Math.round(watermark.fontOpacity * 100)}
            onChange={(e) => updateWatermark({ fontOpacity: parseInt(e.target.value) / 100 })}
            onPointerUp={() => pushHistory('Adjust watermark opacity')}
            className="mt-2 w-full accent-violet-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            updateWatermark({ bold: !watermark.bold });
            pushHistory('Toggle bold');
          }}
          aria-pressed={watermark.bold}
          className={`flex-1 rounded-md py-1.5 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            watermark.bold ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          B
        </button>
        <button
          onClick={() => {
            updateWatermark({ italic: !watermark.italic });
            pushHistory('Toggle italic');
          }}
          aria-pressed={watermark.italic}
          className={`flex-1 rounded-md py-1.5 text-sm italic transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            watermark.italic ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          I
        </button>
      </div>
    </>
  );
}
