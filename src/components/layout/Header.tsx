import { ImageIcon, Layers, Trash2, Plus } from 'lucide-react';
import { useRef } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { ACCEPTED_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';

export function Header() {
  const { images, mode, setMode, clearImages, addImages } = useImageStore();
  const hasImages = images.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (valid.length > 0) addImages(valid);
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight">ZeroShutter</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {hasImages && images.length > 1 && (
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Single
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'batch'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Batch
              <span className="text-xs bg-zinc-600 px-1.5 rounded-full">{images.length}</span>
            </button>
          </div>
        )}

        {hasImages && (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}

        {hasImages && (
          <button
            onClick={clearImages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </header>
  );
}
