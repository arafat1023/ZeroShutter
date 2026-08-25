import type { ReactNode } from 'react';
import {
  Crop, Maximize, RotateCw, Download,
  Palette, Droplets, Square, Info, History,
} from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import type { ActiveTool } from '@/types';

interface ToolItem {
  id: Exclude<ActiveTool, null>;
  label: string;
  shortcut: string;
  icon: ReactNode;
}

const EDIT_TOOLS: ToolItem[] = [
  { id: 'crop', label: 'Crop', shortcut: 'C', icon: <Crop className="h-5 w-5" /> },
  { id: 'resize', label: 'Resize', shortcut: 'V', icon: <Maximize className="h-5 w-5" /> },
  { id: 'rotate', label: 'Rotate', shortcut: 'R', icon: <RotateCw className="h-5 w-5" /> },
  { id: 'color', label: 'Colour', shortcut: 'A', icon: <Palette className="h-5 w-5" /> },
  { id: 'watermark', label: 'Mark', shortcut: 'W', icon: <Droplets className="h-5 w-5" /> },
  { id: 'border', label: 'Border', shortcut: 'B', icon: <Square className="h-5 w-5" /> },
];

const UTILITY_TOOLS: ToolItem[] = [
  { id: 'metadata', label: 'Info', shortcut: 'I', icon: <Info className="h-5 w-5" /> },
  { id: 'history', label: 'History', shortcut: 'Y', icon: <History className="h-5 w-5" /> },
];

const EXPORT_TOOL: ToolItem = {
  id: 'export', label: 'Export', shortcut: 'E', icon: <Download className="h-5 w-5" />,
};

interface ToolbarProps {
  onSelect: (tool: ActiveTool) => void;
}

export function Toolbar({ onSelect }: ToolbarProps) {
  const activeTool = useImageStore((s) => s.activeTool);

  const button = (tool: ToolItem, extraClasses = '') => {
    const isActive = activeTool === tool.id;
    return (
      <button
        key={tool.id}
        onClick={() => onSelect(isActive ? null : tool.id)}
        title={`${tool.label} (${tool.shortcut})`}
        aria-pressed={isActive}
        className={`flex shrink-0 flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 lg:w-full ${
          isActive ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        } ${extraClasses}`}
      >
        {tool.icon}
        <span className="text-[11px]">{tool.label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Editing tools"
      className="order-last flex shrink-0 items-center gap-1 overflow-x-auto border-t border-zinc-800 bg-zinc-900 px-2 py-1.5 lg:order-none lg:w-16 lg:flex-col lg:justify-between lg:overflow-visible lg:border-t-0 lg:border-r lg:px-2 lg:py-2"
    >
      <div className="flex items-center gap-1 lg:w-full lg:flex-col">
        {EDIT_TOOLS.map((tool) => button(tool))}
        <div className="hidden h-px w-full bg-zinc-800 lg:my-1.5 lg:block" />
        {button(EXPORT_TOOL, 'lg:hidden')}
        {UTILITY_TOOLS.map((tool) => button(tool, 'lg:hidden'))}
      </div>

      <div className="hidden lg:flex lg:w-full lg:flex-col lg:gap-1">
        {button(EXPORT_TOOL)}
        <div className="my-1.5 h-px w-full bg-zinc-800" />
        {UTILITY_TOOLS.map((tool) => button(tool))}
      </div>
    </nav>
  );
}
