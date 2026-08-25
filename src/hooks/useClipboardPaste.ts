import { useEffect } from 'react';
import { useImageStore } from '@/stores/useImageStore';

/**
 * Ctrl/Cmd+V anywhere on the page. The listener lives on the window rather
 * than a focusable drop target, so pasting works without clicking first.
 */
export function useClipboardPaste() {
  useEffect(() => {
    const handler = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Let text fields keep their own paste behaviour.
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const items = event.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (const item of items) {
        if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
        const file = item.getAsFile();
        if (!file) continue;
        // Clipboard images arrive unnamed; give them something recognisable.
        files.push(
          file.name && file.name !== 'image.png'
            ? file
            : new File([file], `pasted-${files.length + 1}.${file.type.split('/')[1] || 'png'}`, { type: file.type })
        );
      }

      if (files.length > 0) {
        event.preventDefault();
        void useImageStore.getState().addImages(files);
      }
    };

    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, []);
}
