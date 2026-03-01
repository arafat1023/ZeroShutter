import { useState, useEffect, useRef } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { formatFileSize } from '@/lib/format';
import { colorToCssFilter } from '@/lib/imageProcessor';
import { processImageViaWorker } from '@/lib/workerBridge';
import { CompareSlider } from '@/components/shared/CompareSlider';
import { CropperOverlay } from '@/components/editor/CropperOverlay';
import { BorderPreview } from '@/components/editor/BorderPreview';
import { WatermarkPreview } from '@/components/editor/WatermarkPreview';
import { SplitSquareHorizontal, Undo2, Redo2, Loader2 } from 'lucide-react';
import type { RotateData, CropData } from '@/types';

function buildTransform(rotate: RotateData): string | undefined {
  const parts: string[] = [];
  if (rotate.angle !== 0) parts.push(`rotate(${rotate.angle}deg)`);
  if (rotate.flipH) parts.push('scaleX(-1)');
  if (rotate.flipV) parts.push('scaleY(-1)');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/** Shows a dashed rectangle over the image to indicate the crop region */
function CropIndicator({ crop, imageWidth, imageHeight }: {
  crop: CropData;
  imageWidth: number;
  imageHeight: number;
}) {
  const left = (crop.x / imageWidth) * 100;
  const top = (crop.y / imageHeight) * 100;
  const width = (crop.width / imageWidth) * 100;
  const height = (crop.height / imageHeight) * 100;

  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: 'inherit' }}>
        <div className="absolute left-0 right-0 top-0 bg-black/40" style={{ height: `${top}%` }} />
        <div className="absolute left-0 right-0 bottom-0 bg-black/40" style={{ height: `${100 - top - height}%` }} />
        <div className="absolute left-0 bg-black/40" style={{ top: `${top}%`, height: `${height}%`, width: `${left}%` }} />
        <div className="absolute right-0 bg-black/40" style={{ top: `${top}%`, height: `${height}%`, width: `${100 - left - width}%` }} />
      </div>
      <div
        className="absolute border-2 border-dashed border-violet-400/70 pointer-events-none"
        style={{
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
        }}
      />
    </>
  );
}

export function EditorCanvas() {
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const { editState, activeTool, showCompare, toggleCompare, undo, redo, canUndo, canRedo } = useImageStore();
  const colorAdj = editState.colorAdjustments;
  const filterStyle = colorToCssFilter(colorAdj);

  // Processed preview for compare mode
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  // Generate processed preview when compare mode is active
  useEffect(() => {
    if (!showCompare || !activeImage) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const { blob } = await processImageViaWorker(activeImage.originalUrl, {
          crop: editState.crop,
          resizeWidth: editState.resize?.width,
          resizeHeight: editState.resize?.height,
          rotate: editState.rotate,
          colorAdjustments: editState.colorAdjustments,
          watermark: editState.watermark,
          border: editState.border,
          format: 'image/png',
          quality: 1,
        });
        if (!cancelled) {
          // Revoke previous URL
          if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
          const url = URL.createObjectURL(blob);
          prevUrlRef.current = url;
          setProcessedUrl(url);
        }
      } catch (err) {
        console.error('Compare preview failed:', err);
      }
      if (!cancelled) setIsProcessing(false);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showCompare, activeImage, editState]);

  // Cleanup processed URL on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  if (!activeImage) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600">
        No image selected
      </div>
    );
  }

  // Build status badges
  const badges: string[] = [];
  if (editState.crop) badges.push('Cropped');
  if (editState.resize) badges.push(`${editState.resize.width}×${editState.resize.height}`);
  if (editState.rotate.angle !== 0) badges.push(`${editState.rotate.angle}°`);
  if (editState.rotate.flipH) badges.push('FlipH');
  if (editState.rotate.flipV) badges.push('FlipV');
  if (colorAdj.preset) badges.push(colorAdj.preset);
  else if (colorAdj.brightness !== 0 || colorAdj.contrast !== 0 || colorAdj.saturation !== 0) badges.push('Color adjusted');
  if (editState.watermark) badges.push('Watermark');
  if (editState.border) badges.push(`Border ${editState.border.mode}`);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top info bar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400">
        <span className="text-zinc-300 font-medium truncate max-w-[200px]">{activeImage.name}</span>
        <span>{activeImage.width} × {activeImage.height}</span>
        <span>{formatFileSize(activeImage.size)}</span>
        {badges.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {badges.map((b, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[10px]">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Canvas area */}
      {activeTool === 'crop' ? (
        <CropperOverlay />
      ) : (
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-zinc-950/50">
        <div className="relative">
          {/* Checkerboard background */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
                linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
                linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          />

          {showCompare ? (
            <>
              {isProcessing && !processedUrl && (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              )}
              {processedUrl && (
                <CompareSlider
                  leftSrc={activeImage.originalUrl}
                  rightSrc={processedUrl}
                  leftLabel="Original"
                  rightLabel="Edited"
                  alt={activeImage.name}
                />
              )}
            </>
          ) : (
            <div
              className="relative inline-block transition-transform duration-200"
              style={{ transform: buildTransform(editState.rotate) }}
            >
              <BorderPreview
                border={editState.border}
                imageWidth={activeImage.width}
                imageSrc={activeImage.originalUrl}
              >
                <img
                  src={activeImage.originalUrl}
                  alt={activeImage.name}
                  className="relative max-w-full max-h-[calc(100vh-260px)] object-contain rounded-lg"
                  style={{
                    filter: filterStyle !== 'none' ? filterStyle : undefined,
                    imageRendering: 'auto',
                  }}
                />
              </BorderPreview>
              {editState.watermark && (
                <WatermarkPreview
                  watermark={editState.watermark}
                  sourceWidth={activeImage.width + (editState.border?.left ?? 0) + (editState.border?.right ?? 0)}
                />
              )}
              {/* Grid overlay for straighten alignment */}
              {activeTool === 'rotate' && editState.rotate.angle % 90 !== 0 && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(139,92,246,0.5) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(139,92,246,0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />
              )}
              {/* Crop region indicator */}
              {editState.crop && (
                <CropIndicator
                  crop={editState.crop}
                  imageWidth={activeImage.width}
                  imageHeight={activeImage.height}
                />
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-t border-zinc-800">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded-md transition-colors ${
              canUndo() ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-700'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
            className={`p-1.5 rounded-md transition-colors ${
              canRedo() ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-700'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Compare toggle */}
        <button
          onClick={toggleCompare}
          title="Before / After comparison"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
            showCompare
              ? 'bg-violet-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          {isProcessing && showCompare && <Loader2 className="w-3 h-3 animate-spin" />}
          <SplitSquareHorizontal className="w-3.5 h-3.5" />
          Compare
        </button>

        {/* Format indicator */}
        <div className="text-[10px] text-zinc-500">
          {editState.exportSettings.format.replace('image/', '').toUpperCase()} · {Math.round(editState.exportSettings.quality * 100)}%
        </div>
      </div>
    </div>
  );
}
