import { useEffect, useState, useCallback } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { initTheme } from '@/stores/useThemeStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { Header } from '@/components/layout/Header';
import { LandingPage } from '@/components/landing/LandingPage';
import { Toolbar } from '@/components/editor/Toolbar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { SettingsPanel } from '@/components/editor/SettingsPanel';
import { BatchPanel } from '@/components/batch/BatchPanel';
import { ShortcutCheatSheet } from '@/components/shared/ShortcutCheatSheet';

// Initialize theme on app load
initTheme();

export function App() {
  const { images, mode, undo, redo, setActiveTool, activeTool, activeImageId, removeImage } = useImageStore();
  const { setRotation, setFlipH, setFlipV, editState } = useImageStore();
  const hasImages = images.length > 0;
  const isMobile = useIsMobile();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const closeShortcuts = useCallback(() => setShowShortcuts(false), []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Undo: Ctrl+Z
      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((isCtrl && e.key === 'z' && e.shiftKey) || (isCtrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      // Export: Ctrl+S
      if (isCtrl && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        setActiveTool('export');
        return;
      }
      // Batch export: Ctrl+Shift+S — click the batch export button programmatically
      if (isCtrl && e.key === 'S' && e.shiftKey) {
        e.preventDefault();
        const batchBtn = document.querySelector('[data-batch-export]') as HTMLButtonElement | null;
        if (batchBtn) batchBtn.click();
        return;
      }

      if (isCtrl) return; // Don't hijack other Ctrl combos

      // Cheat sheet: ?
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Delete/Backspace: remove active image
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeImageId) {
          e.preventDefault();
          removeImage(activeImageId);
        }
        return;
      }

      // Tool shortcuts (single key, no modifier)
      switch (e.key.toLowerCase()) {
        case 'c': setActiveTool(activeTool === 'crop' ? null : 'crop'); break;
        case 'v': setActiveTool(activeTool === 'resize' ? null : 'resize'); break;
        case 'r': setActiveTool(activeTool === 'rotate' ? null : 'rotate'); break;
        case 'e': setActiveTool(activeTool === 'export' ? null : 'export'); break;
        case 'escape': setActiveTool(null); break;
        // Quick rotate/flip
        case '[': {
          e.preventDefault();
          const angle = (editState.rotate.angle - 90 + 360) % 360;
          setRotation(angle);
          break;
        }
        case ']': {
          e.preventDefault();
          const angle = (editState.rotate.angle + 90) % 360;
          setRotation(angle);
          break;
        }
        case 'h': setFlipH(!editState.rotate.flipH); break;
        case 'f': setFlipV(!editState.rotate.flipV); break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, setActiveTool, activeTool, setRotation, setFlipH, setFlipV, editState.rotate, activeImageId, removeImage]);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100">
      <Header />

      {!hasImages ? (
        <LandingPage />
      ) : isMobile ? (
        /* Mobile layout: stacked vertically with bottom toolbar */
        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'batch' && images.length > 1 && <BatchPanel />}
          <EditorCanvas />
          {activeTool && <SettingsPanel />}
          <Toolbar />
        </div>
      ) : (
        /* Desktop layout: horizontal panels */
        <div className="flex-1 flex overflow-hidden">
          {mode === 'batch' && images.length > 1 && <BatchPanel />}
          <Toolbar />
          <EditorCanvas />
          <SettingsPanel />
        </div>
      )}

      <ShortcutCheatSheet open={showShortcuts} onClose={closeShortcuts} />
    </div>
  );
}
