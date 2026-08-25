import { useRef, useCallback } from 'react';
import type { CropData } from '@/types';
import { resizeCrop, HANDLE_CURSORS, type CropHandle } from '@/lib/cropGeometry';

interface CropOverlayProps {
  crop: CropData;
  imageWidth: number;
  imageHeight: number;
  /** Displayed pixels per source pixel. */
  scale: number;
  ratio?: number;
  onChange: (crop: CropData) => void;
  onCommit: () => void;
}

const EDGE_HANDLES: CropHandle[] = ['n', 's', 'e', 'w'];
const CORNER_HANDLES: CropHandle[] = ['nw', 'ne', 'sw', 'se'];

/**
 * Drag handles rendered directly on the editor canvas, so cropping stays in
 * the same view as every other tool instead of swapping in a separate widget.
 */
export function CropOverlay({
  crop, imageWidth, imageHeight, scale, ratio, onChange, onCommit,
}: CropOverlayProps) {
  const gesture = useRef<{ handle: CropHandle; startX: number; startY: number; start: CropData } | null>(null);

  const beginDrag = useCallback(
    (handle: CropHandle) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      (event.target as Element).setPointerCapture(event.pointerId);
      gesture.current = { handle, startX: event.clientX, startY: event.clientY, start: crop };
    },
    [crop]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const active = gesture.current;
      if (!active || scale <= 0) return;
      onChange(
        resizeCrop({
          start: active.start,
          handle: active.handle,
          dx: (event.clientX - active.startX) / scale,
          dy: (event.clientY - active.startY) / scale,
          imageW: imageWidth,
          imageH: imageHeight,
          ratio,
        })
      );
    },
    [onChange, scale, imageWidth, imageHeight, ratio]
  );

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      if (!gesture.current) return;
      gesture.current = null;
      (event.target as Element).releasePointerCapture?.(event.pointerId);
      onCommit();
    },
    [onCommit]
  );

  const box = {
    left: crop.x * scale,
    top: crop.y * scale,
    width: crop.width * scale,
    height: crop.height * scale,
  };

  /** Absolute position of a handle, in display pixels, including the box offset. */
  const handlePosition = (handle: CropHandle) => ({
    left: box.left + (handle.includes('w') ? 0 : handle.includes('e') ? box.width : box.width / 2),
    top: box.top + (handle.includes('n') ? 0 : handle.includes('s') ? box.height : box.height / 2),
    cursor: HANDLE_CURSORS[handle],
  });

  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Dim everything outside the crop */}
      <div className="pointer-events-none absolute inset-0 bg-black/55" style={{
        clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${box.left}px ${box.top}px, ${box.left}px ${box.top + box.height}px, ${box.left + box.width}px ${box.top + box.height}px, ${box.left + box.width}px ${box.top}px, ${box.left}px ${box.top}px)`,
      }} />

      {/* The crop window itself */}
      <div
        className="absolute cursor-move border border-white/90"
        style={box}
        onPointerDown={beginDrag('move')}
      >
        {/* Rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0">
          {[33.333, 66.667].map((pct) => (
            <div key={`v${pct}`} className="absolute top-0 bottom-0 w-px bg-white/25" style={{ left: `${pct}%` }} />
          ))}
          {[33.333, 66.667].map((pct) => (
            <div key={`h${pct}`} className="absolute right-0 left-0 h-px bg-white/25" style={{ top: `${pct}%` }} />
          ))}
        </div>

        <span className="pointer-events-none absolute -top-6 left-0 rounded bg-black/75 px-1.5 py-0.5 text-[11px] tabular-nums text-white">
          {Math.round(crop.width)} × {Math.round(crop.height)}
        </span>
      </div>

      {/* Edge handles: thin bars centred on each side */}
      {EDGE_HANDLES.map((handle) => (
        <div
          key={handle}
          role="presentation"
          onPointerDown={beginDrag(handle)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${
            handle === 'n' || handle === 's' ? 'h-3 w-10' : 'h-10 w-3'
          }`}
          style={handlePosition(handle)}
        >
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow ${
            handle === 'n' || handle === 's' ? 'h-1 w-6' : 'h-6 w-1'
          }`} />
        </div>
      ))}

      {/* Corner handles */}
      {CORNER_HANDLES.map((handle) => (
        <div
          key={handle}
          role="presentation"
          onPointerDown={beginDrag(handle)}
          className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2"
          style={handlePosition(handle)}
        >
          <div className="absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white bg-violet-600 shadow" />
        </div>
      ))}
    </div>
  );
}
