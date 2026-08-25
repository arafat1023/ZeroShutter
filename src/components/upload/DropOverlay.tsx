import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { dragHasFiles } from '@/lib/files';
import { useImageDrop } from '@/hooks/useImageDrop';

/**
 * Lets the user drop more images anywhere in the editor, not just on the
 * original upload panel.
 */
export function DropOverlay() {
  const [isDragging, setIsDragging] = useState(false);
  const { acceptDataTransfer } = useImageDrop();
  // Drag events fire for every child element, so count enters and leaves
  // instead of toggling on each one.
  const depth = useRef(0);

  useEffect(() => {
    const onDragEnter = (event: DragEvent) => {
      if (!dragHasFiles(event.dataTransfer)) return;
      depth.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!dragHasFiles(event.dataTransfer)) return;
      event.preventDefault();
    };
    const onDragLeave = () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!dragHasFiles(event.dataTransfer)) return;
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      if (event.dataTransfer) void acceptDataTransfer(event.dataTransfer);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [acceptDataTransfer]);

  if (!isDragging) return null;

  return (
    <div className="pointer-events-none fixed inset-4 z-50 flex items-center justify-center rounded-2xl border-2 border-dashed border-violet-500 bg-violet-950/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-violet-200">
        <Upload className="h-10 w-10" />
        <p className="text-lg font-medium">Drop to add images</p>
      </div>
    </div>
  );
}
