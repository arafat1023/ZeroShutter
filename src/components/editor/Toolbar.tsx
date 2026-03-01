import {
  Crop, Maximize, RotateCw, Download,
  Palette, Droplets, Square, Info, History,
} from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Tooltip } from '@/components/shared/Tooltip';
import type { ActiveTool } from '@/types';

interface ToolItem {
  id: ActiveTool;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  separator?: boolean;
}

const TOOLS: ToolItem[] = [
  { id: 'crop', label: 'Crop', icon: <Crop className="w-5 h-5" />, shortcut: 'C' },
  { id: 'resize', label: 'Resize', icon: <Maximize className="w-5 h-5" />, shortcut: 'V' },
  { id: 'rotate', label: 'Rotate', icon: <RotateCw className="w-5 h-5" />, shortcut: 'R' },
  { id: 'color', label: 'Color', icon: <Palette className="w-5 h-5" />, separator: true },
  { id: 'watermark', label: 'Watermark', icon: <Droplets className="w-5 h-5" /> },
  { id: 'border', label: 'Border', icon: <Square className="w-5 h-5" /> },
  { id: 'export', label: 'Export', icon: <Download className="w-5 h-5" />, shortcut: 'E', separator: true },
];

const BOTTOM_TOOLS: ToolItem[] = [
  { id: 'metadata' as ActiveTool, label: 'Info', icon: <Info className="w-5 h-5" /> },
  { id: 'history' as ActiveTool, label: 'History', icon: <History className="w-5 h-5" /> },
];

export function Toolbar() {
  const { activeTool, setActiveTool } = useImageStore();
  const isMobile = useIsMobile();
  const allTools = [...TOOLS, ...BOTTOM_TOOLS];

  const renderButton = (tool: ToolItem) => {
    const button = (
      <button
        onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-colors shrink-0 ${
          isMobile ? 'min-w-[3.5rem]' : 'w-full'
        } ${
          activeTool === tool.id
            ? 'bg-violet-600 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
        }`}
      >
        {tool.icon}
        <span className="text-[10px]">{tool.label}</span>
      </button>
    );

    if (isMobile) return button;

    return (
      <Tooltip
        content={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
        position="right"
      >
        {button}
      </Tooltip>
    );
  };

  if (isMobile) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-900 border-t border-zinc-800 overflow-x-auto">
        {allTools.map((tool) => (
          <div key={tool.id}>{renderButton(tool)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between p-2 bg-zinc-900 border-r border-zinc-800 w-16">
      <div className="flex flex-col gap-1">
        {TOOLS.map((tool) => (
          <div key={tool.id}>
            {tool.separator && <div className="h-px bg-zinc-800 my-1.5" />}
            {renderButton(tool)}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {BOTTOM_TOOLS.map((tool) => (
          <div key={tool.id}>{renderButton(tool)}</div>
        ))}
      </div>
    </div>
  );
}
