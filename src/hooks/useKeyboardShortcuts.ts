import { useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import type { ActiveTool } from '@/types';

const TOOL_KEYS: Record<string, ActiveTool> = {
  c: 'crop',
  v: 'resize',
  r: 'rotate',
  a: 'color',
  w: 'watermark',
  b: 'border',
  i: 'metadata',
  y: 'history',
  e: 'export',
};

interface Handlers {
  onOpenFiles: () => void;
  onToggleHelp: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomActual: () => void;
  onEscape: () => void;
}

/** True while the user is typing, so single-letter shortcuts stay out of the way. */
function isTextEntry(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    element.isContentEditable === true
  );
}

export function useKeyboardShortcuts(handlers: Handlers) {
  // Kept in a ref so the window listener is attached exactly once, no matter
  // how often the caller re-renders with fresh callbacks.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const handlers = handlersRef.current;
      const isModified = event.ctrlKey || event.metaKey;
      const store = useImageStore.getState();

      // Escape is the one key that still works while typing.
      if (event.key === 'Escape') {
        handlers.onEscape();
        return;
      }

      if (isTextEntry(event.target)) return;

      if (isModified) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) store.redo();
            else store.undo();
            return;
          case 'y':
            event.preventDefault();
            store.redo();
            return;
          case 's':
            event.preventDefault();
            store.setActiveTool('export');
            return;
          case 'o':
            event.preventDefault();
            handlers.onOpenFiles();
            return;
          default:
            return; // leave every other Ctrl/Cmd combo to the browser
        }
      }

      if (event.altKey) return;

      const key = event.key.toLowerCase();

      if (event.key === '?') {
        event.preventDefault();
        handlers.onToggleHelp();
        return;
      }

      if (!store.activeImageId) return;

      const tool = TOOL_KEYS[key];
      if (tool) {
        event.preventDefault();
        store.setActiveTool(store.activeTool === tool ? null : tool);
        return;
      }

      switch (event.key) {
        case '[': {
          event.preventDefault();
          store.setRotation((store.editState.rotate.angle - 90 + 360) % 360);
          store.pushHistory('Rotate -90°');
          break;
        }
        case ']': {
          event.preventDefault();
          store.setRotation((store.editState.rotate.angle + 90) % 360);
          store.pushHistory('Rotate +90°');
          break;
        }
        case '+':
        case '=':
          event.preventDefault();
          handlers.onZoomIn();
          break;
        case '-':
        case '_':
          event.preventDefault();
          handlers.onZoomOut();
          break;
        case '0':
          event.preventDefault();
          handlers.onZoomFit();
          break;
        case '1':
          event.preventDefault();
          handlers.onZoomActual();
          break;
        default:
          if (key === 'h') {
            event.preventDefault();
            store.setFlipH(!store.editState.rotate.flipH);
            store.pushHistory('Flip horizontal');
          } else if (key === 'f') {
            event.preventDefault();
            store.setFlipV(!store.editState.rotate.flipV);
            store.pushHistory('Flip vertical');
          } else if (key === 'x') {
            event.preventDefault();
            store.toggleCompare();
          }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
