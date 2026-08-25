import { ImageIcon, Layers, Trash2, Plus, Keyboard } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { useViewStore } from '@/stores/useViewStore';

interface HeaderProps {
  onOpenFiles: () => void;
}

export function Header({ onOpenFiles }: HeaderProps) {
  const images = useImageStore((s) => s.images);
  const mode = useImageStore((s) => s.mode);
  const setMode = useImageStore((s) => s.setMode);
  const clearImages = useImageStore((s) => s.clearImages);
  const toggleShortcuts = useViewStore((s) => s.toggleShortcuts);

  const hasImages = images.length > 0;

  const handleClear = () => {
    // Losing several images plus their edits to a stray click is a bad trade.
    if (images.length > 1 && !window.confirm(`Remove all ${images.length} images and discard every edit?`)) return;
    clearImages();
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <ImageIcon className="h-4 w-4 text-white" />
        </div>
        <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">ZeroShutter</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {images.length > 1 && (
          <div className="flex rounded-lg bg-zinc-800 p-0.5" role="group" aria-label="Editing mode">
            <button
              onClick={() => setMode('single')}
              aria-pressed={mode === 'single'}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:px-3 ${
                mode === 'single' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Single</span>
            </button>
            <button
              onClick={() => setMode('batch')}
              aria-pressed={mode === 'batch'}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:px-3 ${
                mode === 'batch' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Batch</span>
              <span className="rounded-full bg-zinc-600 px-1.5 text-xs tabular-nums">{images.length}</span>
            </button>
          </div>
        )}

        {hasImages && (
          <>
            <button
              onClick={onOpenFiles}
              title="Add images (Ctrl+O)"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-violet-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:px-3"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button
              onClick={handleClear}
              title="Remove every image"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:px-3"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}

        <button
          onClick={toggleShortcuts}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <Keyboard className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
