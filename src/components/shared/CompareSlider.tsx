import { useState, useRef, useCallback } from 'react';
import type { EditState, ImageFile } from '@/types';
import { PreviewStage } from '@/components/editor/PreviewStage';
import { composedSize, rotatedSize } from '@/lib/previewGeometry';

interface CompareSliderProps {
  image: ImageFile;
  editState: EditState;
  scale: number;
  sharpenFilterId?: string;
}

/**
 * Both halves share the same crop, rotation and border so the frames line up;
 * only the appearance edits (colour, sharpening, watermark) differ across the
 * divider.
 */
function withoutAppearanceEdits(editState: EditState): EditState {
  return {
    ...editState,
    colorAdjustments: {
      brightness: 0, contrast: 0, saturation: 0, hue: 0, sharpness: 0, invert: false, preset: null,
    },
    watermark: null,
  };
}

export function CompareSlider({ image, editState, scale, sharpenFilterId }: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const composed = composedSize(image, editState);
  const bounds = rotatedSize(composed.width, composed.height, editState.rotate.angle);
  const width = bounds.width * scale;
  const height = bounds.height * scale;

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setPosition(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      updateFromClientX(event.clientX);
    },
    [updateFromClientX]
  );

  const onDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromClientX(event.clientX);
    },
    [updateFromClientX]
  );

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2));
    else if (event.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2));
    else return;
    event.preventDefault();
  }, []);

  const stageWrapper = 'absolute inset-0 flex items-center justify-center';

  return (
    <div
      ref={containerRef}
      onPointerDown={startDrag}
      onPointerMove={onDrag}
      className="checkerboard relative shrink-0 cursor-ew-resize touch-none select-none rounded-sm shadow-2xl shadow-black/40"
      style={{ width, height }}
    >
      {/* Before */}
      <div className={stageWrapper}>
        <PreviewStage image={image} editState={withoutAppearanceEdits(editState)} scale={scale} />
      </div>

      {/* After, revealed from the divider rightwards */}
      <div className={stageWrapper} style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
        <PreviewStage image={image} editState={editState} scale={scale} sharpenFilterId={sharpenFilterId} />
      </div>

      {/* Divider */}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90" style={{ left: `${position}%` }}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Before and after comparison"
          aria-valuenow={Math.round(position)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={onKeyDown}
          className="pointer-events-auto absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[11px] font-bold text-zinc-900 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          ‹›
        </div>
      </div>

      <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
        Before
      </span>
      <span className="pointer-events-none absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
        After
      </span>
    </div>
  );
}
