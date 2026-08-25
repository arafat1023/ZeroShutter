import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, ImageIcon, FolderOpen, Loader2 } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { useImageDrop } from '@/hooks/useImageDrop';
import { ACCEPTED_EXTENSIONS } from '@/lib/constants';
import { dragHasFiles } from '@/lib/files';

interface DropZoneProps {
  /** Renders a shorter panel when the zone sits inside the hero. */
  compact?: boolean;
}

export function DropZone({ compact = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const isLoading = useImageStore((s) => s.isLoadingImages);
  const { acceptFiles, acceptDataTransfer } = useImageDrop();

  // `webkitdirectory` is not in React's prop types, so it is set imperatively.
  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      void acceptDataTransfer(event.dataTransfer);
    },
    [acceptDataTransfer]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    if (!dragHasFiles(event.dataTransfer)) return;
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Ignore transitions between child elements of the drop zone.
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Add images by dropping them here or clicking to browse"
      className={`mx-auto w-full max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        compact ? 'p-8 sm:p-10' : 'p-10 sm:p-16'
      } ${
        isDragging
          ? 'scale-[1.01] border-violet-500 bg-violet-500/10'
          : 'border-zinc-700 hover:border-violet-500/60 hover:bg-zinc-900/60'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
            isDragging ? 'bg-violet-500/20' : 'bg-zinc-800'
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
          ) : isDragging ? (
            <Upload className="h-7 w-7 text-violet-400" />
          ) : (
            <ImageIcon className="h-7 w-7 text-zinc-400" />
          )}
        </div>

        <div>
          <p className="text-base font-medium text-zinc-100 sm:text-lg">
            {isLoading ? 'Reading images…' : isDragging ? 'Drop to add them' : 'Drop images, or click to browse'}
          </p>
          <p className="mt-1 text-sm text-zinc-500">JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG</p>
          <p className="mt-2 text-xs text-zinc-600">
            or paste from the clipboard with{' '}
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 font-mono text-[10px] text-zinc-400">
              Ctrl+V
            </kbd>
          </p>
        </div>

        <button
          onClick={(event) => {
            event.stopPropagation();
            folderInputRef.current?.click();
          }}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <FolderOpen className="h-4 w-4" />
          Choose a folder
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        onChange={(event) => {
          if (event.target.files) void acceptFiles(event.target.files);
          event.target.value = ''; // allow re-picking the same file
        }}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        onChange={(event) => {
          if (event.target.files) void acceptFiles(event.target.files);
          event.target.value = '';
        }}
        className="hidden"
      />
    </div>
  );
}
