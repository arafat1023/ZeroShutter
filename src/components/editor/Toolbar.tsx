import {
  Crop, Maximize, RotateCw, Download,
  Palette, Droplets, Square, Info, History,
} from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import type { ActiveTool } from '@/types';

interface ToolItem {
  id: ActiveTool;
  label: string;
  icon: React.ReactNode;
  separator?: boolean;
}

const TOOLS: ToolItem[] = [
  { id: 'crop', label: 'Crop', icon: <Crop className="w-5 h-5" /> },
  { id: 'resize', label: 'Resize', icon: <Maximize className="w-5 h-5" /> },
  { id: 'rotate', label: 'Rotate', icon: <RotateCw className="w-5 h-5" /> },
  { id: 'color', label: 'Color', icon: <Palette className="w-5 h-5" />, separator: true },
  { id: 'watermark', label: 'Watermark', icon: <Droplets className="w-5 h-5" /> },
  { id: 'border', label: 'Border', icon: <Square className="w-5 h-5" /> },
  { id: 'export', label: 'Export', icon: <Download className="w-5 h-5" />, separator: true },
];

const TOOL_SHORTCUTS: Record<string, string> = {
  crop: 'C',
  resize: 'V',
  rotate: 'R',
  export: 'E',
};

// Extra non-tool items shown at bottom
const BOTTOM_TOOLS: ToolItem[] = [
  { id: 'metadata' as ActiveTool, label: 'Info', icon: <Info className="w-5 h-5" /> },
  { id: 'history' as ActiveTool, label: 'History', icon: <History className="w-5 h-5" /> },
];

export function Toolbar() {
  const { activeTool, setActiveTool } = useImageStore();

  return (
    <div className="flex flex-col justify-between p-2 bg-zinc-900 border-r border-zinc-800 w-16">
      <div className="flex flex-col gap-1">
        {TOOLS.map((tool) => (
          <div key={tool.id}>
            {tool.separator && <div className="h-px bg-zinc-800 my-1.5" />}
            <button
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
              title={`${tool.label}${TOOL_SHORTCUTS[tool.id ?? ''] ? ` (${TOOL_SHORTCUTS[tool.id ?? '']})` : ''}`}
              className={`w-full flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTool === tool.id
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {tool.icon}
              <span className="text-[10px]">{tool.label}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {BOTTOM_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
            title={tool.label}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors ${
              activeTool === tool.id
                ? 'bg-violet-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {tool.icon}
            <span className="text-[10px]">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
