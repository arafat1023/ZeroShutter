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

const TITLES: Record<string, string> = {
  crop: 'Crop',
  resize: 'Resize',
  rotate: 'Rotate & Flip',
  color: 'Color Adjustments',
  watermark: 'Watermark',
  border: 'Border & Padding',
  metadata: 'Image Metadata',
  history: 'Edit History',
  export: 'Export Settings',
};

export function SettingsPanel() {
  const { activeTool } = useImageStore();

  if (!activeTool) {
    return (
      <div className="w-72 bg-zinc-900 border-l border-zinc-800 p-4 flex items-center justify-center">
        <p className="text-xs text-zinc-600 text-center">
          Select a tool from the toolbar to get started
        </p>
      </div>
    );
  }

  return (
    <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">
          {TITLES[activeTool] ?? ''}
        </h2>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
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
    </div>
  );
}
