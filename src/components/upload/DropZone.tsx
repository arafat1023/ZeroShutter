import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, ImageIcon, FolderOpen } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { ACCEPTED_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';

async function readEntriesRecursive(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file((f) => resolve([f]), () => resolve([]));
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
      reader.readEntries((e) => resolve(e), () => resolve([]));
    });
    const nested = await Promise.all(entries.map(readEntriesRecursive));
    return nested.flat();
  }
  return [];
}

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const addImages = useImageStore((s) => s.addImages);

  // Set webkitdirectory imperatively (not in React's type definitions)
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) =>
        ACCEPTED_IMAGE_TYPES.includes(f.type)
      );
      if (validFiles.length > 0) {
        addImages(validFiles);
      }
    },
    [addImages]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Try to read folders via DataTransferItem
      const items = e.dataTransfer.items;
      if (items?.length) {
        const allFiles: File[] = [];
        const promises: Promise<File[]>[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) {
            promises.push(readEntriesRecursive(entry));
          }
        }
        if (promises.length > 0) {
          const results = await Promise.all(promises);
          allFiles.push(...results.flat());
          if (allFiles.length > 0) {
            handleFiles(allFiles);
            return;
          }
        }
      }

      // Fallback to regular file list
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.files);
      if (files.length > 0) handleFiles(files);
    },
    [handleFiles]
  );

  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      onPaste={handlePaste}
      tabIndex={0}
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-2xl rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
              isDragging ? 'bg-violet-500/20' : 'bg-zinc-800'
            }`}
          >
            {isDragging ? (
              <Upload className="w-8 h-8 text-violet-400" />
            ) : (
              <ImageIcon className="w-8 h-8 text-zinc-400" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-zinc-200">
              {isDragging ? 'Drop images here' : 'Drop images or click to upload'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF, SVG — single or multiple files
            </p>
            <p className="text-xs text-zinc-600 mt-3">
              Paste from clipboard with Ctrl+V
            </p>
          </div>

          {/* Folder upload button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              folderInputRef.current?.click();
            }}
            className="flex items-center gap-2 px-4 py-2 mt-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Upload Folder
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}
