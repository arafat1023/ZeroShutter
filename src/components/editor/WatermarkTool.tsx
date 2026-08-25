import { Type, ImageIcon } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { createDefaultWatermark } from '@/lib/watermark';
import { WatermarkTextFields } from '@/components/editor/WatermarkTextFields';
import { WatermarkImageFields } from '@/components/editor/WatermarkImageFields';
import { WatermarkPlacement } from '@/components/editor/WatermarkPlacement';

export function WatermarkTool() {
  const watermark = useImageStore((s) => s.editState.watermark);
  const { setWatermark, updateWatermark, pushHistory } = useImageStore();

  if (!watermark) {
    return (
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-zinc-500">
          Overlay text or your own logo. Everything stays on your device.
        </p>
        <button
          onClick={() => {
            setWatermark(createDefaultWatermark());
            pushHistory('Add watermark');
          }}
          className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          Add watermark
        </button>
      </div>
    );
  }

  const typeButton = (type: 'text' | 'image', label: string, Icon: typeof Type) => (
    <button
      onClick={() => {
        updateWatermark({ type });
        pushHistory(`Watermark: ${label.toLowerCase()}`);
      }}
      aria-pressed={watermark.type === type}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        watermark.type === type ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg bg-zinc-800 p-0.5" role="group" aria-label="Watermark type">
        {typeButton('text', 'Text', Type)}
        {typeButton('image', 'Logo', ImageIcon)}
      </div>

      {watermark.type === 'text' ? (
        <WatermarkTextFields watermark={watermark} />
      ) : (
        <WatermarkImageFields watermark={watermark} />
      )}

      <WatermarkPlacement watermark={watermark} />

      <button
        onClick={() => {
          setWatermark(null);
          pushHistory('Remove watermark');
        }}
        className="w-full rounded-lg border border-zinc-800 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500/40 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        Remove watermark
      </button>
    </div>
  );
}
