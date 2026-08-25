import { useCallback, useState } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { useViewStore } from '@/stores/useViewStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { filterImageFiles, describeRejected, openFilePicker } from '@/lib/files';
import { Header } from '@/components/layout/Header';
import { LandingPage } from '@/components/landing/LandingPage';
import { Toolbar } from '@/components/editor/Toolbar';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { SettingsPanel } from '@/components/editor/SettingsPanel';
import { BatchPanel } from '@/components/batch/BatchPanel';
import { Toasts } from '@/components/shared/Toasts';
import { KeyboardHelp } from '@/components/shared/KeyboardHelp';
import { DropOverlay } from '@/components/upload/DropOverlay';

export function App() {
  const images = useImageStore((s) => s.images);
  const mode = useImageStore((s) => s.mode);
  const activeTool = useImageStore((s) => s.activeTool);
  const setActiveTool = useImageStore((s) => s.setActiveTool);
  const addImages = useImageStore((s) => s.addImages);
  const notify = useImageStore((s) => s.notify);

  const showShortcuts = useViewStore((s) => s.showShortcuts);
  const setShowShortcuts = useViewStore((s) => s.setShowShortcuts);
  const { zoomIn, zoomOut, fitToScreen, actualSize, toggleShortcuts } = useViewStore();

  const [showPanelOnMobile, setShowPanelOnMobile] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const hasImages = images.length > 0;

  useClipboardPaste();

  const handleOpenFiles = useCallback(async () => {
    const picked = await openFilePicker();
    if (picked.length === 0) return;
    const { accepted, rejected } = filterImageFiles(picked);
    if (rejected.length > 0) notify('error', describeRejected(rejected));
    if (accepted.length > 0) await addImages(accepted);
  }, [addImages, notify]);

  const handleEscape = useCallback(() => {
    if (useViewStore.getState().showShortcuts) {
      setShowShortcuts(false);
      return;
    }
    setActiveTool(null);
    setShowPanelOnMobile(false);
  }, [setActiveTool, setShowShortcuts]);

  useKeyboardShortcuts({
    onOpenFiles: handleOpenFiles,
    onToggleHelp: toggleShortcuts,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onZoomFit: fitToScreen,
    onZoomActual: actualSize,
    onEscape: handleEscape,
  });

  const openTool = useCallback(
    (tool: typeof activeTool) => {
      setActiveTool(tool);
      setShowPanelOnMobile(tool !== null);
    },
    [setActiveTool]
  );

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <Header onOpenFiles={handleOpenFiles} />

      {!hasImages ? (
        <LandingPage />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {mode === 'batch' && images.length > 1 && <BatchPanel />}

          {/* Tool rail: a left column on desktop, a scrollable bar on small screens */}
          <Toolbar onSelect={openTool} />

          <EditorCanvas />

          {/* Settings: docked column on desktop, slide-up sheet on small screens.
              Only ever one instance, so panel side effects don't run twice. */}
          {isDesktop ? (
            <SettingsPanel />
          ) : (
            activeTool &&
            showPanelOnMobile && (
              <div
                className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60"
                onClick={() => setShowPanelOnMobile(false)}
              >
                <div
                  className="flex max-h-[70vh] flex-col overflow-hidden rounded-t-2xl border-t border-zinc-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SettingsPanel onClose={() => setShowPanelOnMobile(false)} />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {hasImages && <DropOverlay />}
      <Toasts />
      {showShortcuts && <KeyboardHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
