import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { useViewStore } from '@/stores/useViewStore';
import { formatFileSize } from '@/lib/format';
import { predictOutputSize } from '@/lib/exportOptions';
import { CompareSlider } from '@/components/shared/CompareSlider';
import { CropperOverlay } from '@/components/editor/CropperOverlay';
import { PreviewStage } from '@/components/editor/PreviewStage';
import { composedSize, rotatedSize } from '@/lib/previewGeometry';
import { SharpenFilter } from '@/components/editor/SharpenFilter';
import { CanvasToolbar } from '@/components/editor/CanvasToolbar';
import { EditBadges } from '@/components/editor/EditBadges';

const VIEWPORT_PADDING = 48;
const SHARPEN_FILTER_ID = 'zeroshutter-sharpen';

export function EditorCanvas() {
  const activeImage = useImageStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const editState = useImageStore((s) => s.editState);
  const activeTool = useImageStore((s) => s.activeTool);
  const showCompare = useImageStore((s) => s.showCompare);
  const zoom = useViewStore((s) => s.zoom);
  const setFittedZoom = useViewStore((s) => s.setFittedZoom);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTool, showCompare]);

  const composed = activeImage ? composedSize(activeImage, editState) : null;
  const bounds = composed ? rotatedSize(composed.width, composed.height, editState.rotate.angle) : null;

  // Fit mode never enlarges past 100%, so small images stay crisp.
  const fitScale =
    bounds && viewport.width > 0 && bounds.width > 0
      ? Math.min(
          1,
          (viewport.width - VIEWPORT_PADDING) / bounds.width,
          (viewport.height - VIEWPORT_PADDING) / bounds.height
        )
      : 1;
  const safeFitScale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1;
  const scale = zoom ?? safeFitScale;

  useEffect(() => {
    setFittedZoom(safeFitScale);
  }, [safeFitScale, setFittedZoom]);

  if (!activeImage) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-600">
        No image selected
      </div>
    );
  }

  const output = predictOutputSize(activeImage, editState);
  const sharpness = editState.colorAdjustments.sharpness;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <SharpenFilter id={SHARPEN_FILTER_ID} amount={sharpness} />

      {/* Info bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs text-zinc-400">
        <span className="max-w-[220px] truncate font-medium text-zinc-200" title={activeImage.name}>
          {activeImage.name}
        </span>
        <span className="tabular-nums">
          {activeImage.width} × {activeImage.height}
          {(output.width !== activeImage.width || output.height !== activeImage.height) && (
            <span className="text-violet-400"> → {output.width} × {output.height}</span>
          )}
        </span>
        <span className="tabular-nums">{formatFileSize(activeImage.size)}</span>
        <EditBadges editState={editState} />
      </div>

      {/* Canvas viewport */}
      {activeTool === 'crop' ? (
        <CropperOverlay />
      ) : (
        <div ref={viewportRef} className="flex flex-1 items-center justify-center overflow-auto bg-zinc-950/60 p-6">
          {showCompare ? (
            <CompareSlider image={activeImage} editState={editState} scale={scale} sharpenFilterId={sharpness > 0 ? SHARPEN_FILTER_ID : undefined} />
          ) : (
            <div
              className="checkerboard shrink-0 rounded-sm shadow-2xl shadow-black/40"
              style={{ width: (bounds?.width ?? 0) * scale, height: (bounds?.height ?? 0) * scale }}
            >
              <div className="flex h-full w-full items-center justify-center">
                <PreviewStage
                  image={activeImage}
                  editState={editState}
                  scale={scale}
                  sharpenFilterId={sharpness > 0 ? SHARPEN_FILTER_ID : undefined}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <CanvasToolbar displayZoom={scale} />
    </div>
  );
}
