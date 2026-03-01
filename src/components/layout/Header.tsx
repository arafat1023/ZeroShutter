import { ImageIcon, Layers, Trash2, Plus, Sun, Moon, Monitor } from 'lucide-react';
import { useRef } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Tooltip } from '@/components/shared/Tooltip';
import { ACCEPTED_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const THEME_CYCLE: Record<string, 'light' | 'dark' | 'system'> = {
  dark: 'light',
  light: 'system',
  system: 'dark',
};

export function Header() {
  const { images, mode, setMode, clearImages, addImages } = useImageStore();
  const { theme, setTheme } = useThemeStore();
  const hasImages = images.length > 0;
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type));
    if (valid.length > 0) addImages(valid);
  };

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <header className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-zinc-800 bg-zinc-950">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </div>
          {!isMobile && (
            <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">ZeroShutter</h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {hasImages && images.length > 1 && !isMobile && (
          <div className="flex bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'single'
                  ? 'bg-zinc-700 text-zinc-100'
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
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Batch
              <span className="text-xs bg-zinc-600 px-1.5 rounded-full">{images.length}</span>
            </button>
          </div>
        )}

        {/* Mobile: compact mode toggle */}
        {hasImages && images.length > 1 && isMobile && (
          <button
            onClick={() => setMode(mode === 'single' ? 'batch' : 'single')}
            className={`p-1.5 rounded-lg transition-colors ${
              mode === 'batch'
                ? 'bg-violet-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {hasImages && (
          <Tooltip content="Add more images" position="bottom">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 p-1.5 md:px-3 md:py-1.5 rounded-lg text-sm text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {!isMobile && 'Add'}
            </button>
          </Tooltip>
        )}

        {hasImages && (
          <Tooltip content="Clear all images" position="bottom">
            <button
              onClick={clearImages}
              className="flex items-center gap-1.5 p-1.5 md:px-3 md:py-1.5 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {!isMobile && 'Clear'}
            </button>
          </Tooltip>
        )}

        <div className="w-px h-5 md:h-6 bg-zinc-800 mx-0.5 md:mx-1" />

        <Tooltip content={`Theme: ${theme}`} position="bottom">
          <button
            onClick={() => setTheme(THEME_CYCLE[theme])}
            className="p-1.5 md:p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
        </Tooltip>

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
