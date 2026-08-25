import { X } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { CropTool } from '@/components/editor/CropTool';
import { ResizeTool } from '@/components/editor/ResizeTool';
import { RotateTool } from '@/components/editor/RotateTool';
import { ColorTool } from '@/components/editor/ColorTool';
import { WatermarkTool } from '@/components/editor/WatermarkTool';
import { BorderTool } from '@/components/editor/BorderTool';
import { MetadataPanel } from '@/components/editor/MetadataPanel';
import { HistoryPanel } from '@/components/editor/HistoryPanel';
import { ExportPanel } from '@/components/export/ExportPanel';
import type { ActiveTool } from '@/types';

const TITLES: Record<Exclude<ActiveTool, null>, string> = {
  crop: 'Crop',
  resize: 'Resize',
  rotate: 'Rotate & Flip',
  color: 'Colour Adjustments',
  watermark: 'Watermark',
  border: 'Border & Padding',
  metadata: 'Image Metadata',
  history: 'Edit History',
  export: 'Export Settings',
};

const HINTS: Record<Exclude<ActiveTool, null>, string> = {
  crop: 'Drag on the canvas to set the region, then apply.',
  resize: 'Change the output dimensions. The preview keeps its shape.',
  rotate: 'Rotate in 90° steps or set any angle.',
  color: 'Every change previews live on the canvas.',
  watermark: 'Overlay text or a logo, then position, tile, and rotate it.',
  border: 'Add solid or blurred padding around the image.',
  metadata: 'EXIF read from the original file.',
  history: 'Jump back to any point in this session.',
  export: 'Pick a format and download — nothing is uploaded.',
};

interface SettingsPanelProps {
  onClose?: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const activeTool = useImageStore((s) => s.activeTool);
  const setActiveTool = useImageStore((s) => s.setActiveTool);

  if (!activeTool) {
    return (
      <aside className="hidden w-72 shrink-0 items-center justify-center border-l border-zinc-800 bg-zinc-900 p-6 lg:flex">
        <p className="text-center text-xs leading-relaxed text-zinc-600">
          Pick a tool from the left to start editing.
          <br />
          <span className="mt-2 inline-block">
            Press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-400">?</kbd> for shortcuts.
          </span>
        </p>
      </aside>
    );
  }

  const close = () => {
    setActiveTool(null);
    onClose?.();
  };

  return (
    <aside className="flex w-full shrink-0 flex-col bg-zinc-900 lg:w-72 lg:border-l lg:border-zinc-800">
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-zinc-100">{TITLES[activeTool]}</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{HINTS[activeTool]}</p>
        </div>
        <button
          onClick={close}
          aria-label={`Close ${TITLES[activeTool]}`}
          className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTool === 'crop' && <CropTool />}
        {activeTool === 'resize' && <ResizeTool />}
        {activeTool === 'rotate' && <RotateTool />}
        {activeTool === 'color' && <ColorTool />}
        {activeTool === 'watermark' && <WatermarkTool />}
        {activeTool === 'border' && <BorderTool />}
        {activeTool === 'metadata' && <MetadataPanel />}
        {activeTool === 'history' && <HistoryPanel />}
        {activeTool === 'export' && <ExportPanel />}
      </div>
    </aside>
  );
}
