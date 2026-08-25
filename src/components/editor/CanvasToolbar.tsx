import { Undo2, Redo2, SplitSquareHorizontal, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { useViewStore } from '@/stores/useViewStore';

interface CanvasToolbarProps {
  /** Effective zoom currently on screen, for the percentage readout. */
  displayZoom: number;
}

export function CanvasToolbar({ displayZoom }: CanvasToolbarProps) {
  const { undo, redo, canUndo, canRedo, showCompare, toggleCompare, resetEdits, hasEdits } = useImageStore();
  const { zoom, zoomIn, zoomOut, fitToScreen, actualSize } = useViewStore();

  const iconButton = (enabled: boolean) =>
    `p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
      enabled ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' : 'text-zinc-700 cursor-not-allowed'
    }`;

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <button onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)" aria-label="Undo" className={iconButton(canUndo())}>
        <Undo2 className="h-4 w-4" />
      </button>
      <button onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Shift+Z)" aria-label="Redo" className={iconButton(canRedo())}>
        <Redo2 className="h-4 w-4" />
      </button>

      <button
        onClick={resetEdits}
        disabled={!hasEdits()}
        title="Revert every edit on this image"
        aria-label="Reset all edits"
        className={iconButton(hasEdits())}
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      <div className="mx-1 h-4 w-px bg-zinc-800" />

      <button onClick={zoomOut} title="Zoom out (−)" aria-label="Zoom out" className={iconButton(true)}>
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={() => (zoom === null ? actualSize() : fitToScreen())}
        title={zoom === null ? 'Actual size (1)' : 'Fit to screen (0)'}
        className="min-w-[3.75rem] rounded-md px-1.5 py-1 text-center text-[11px] font-medium tabular-nums text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        {Math.round(displayZoom * 100)}%
      </button>
      <button onClick={zoomIn} title="Zoom in (+)" aria-label="Zoom in" className={iconButton(true)}>
        <ZoomIn className="h-4 w-4" />
      </button>
      <button onClick={fitToScreen} title="Fit to screen (0)" aria-label="Fit to screen" className={iconButton(true)}>
        <Maximize2 className="h-4 w-4" />
      </button>

      <button
        onClick={toggleCompare}
        title="Before / after comparison (X)"
        aria-pressed={showCompare}
        className={`ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          showCompare ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
        }`}
      >
        <SplitSquareHorizontal className="h-3.5 w-3.5" />
        Compare
      </button>
    </div>
  );
}
