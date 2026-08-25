import type { CSSProperties } from 'react';
import type { EditState, ImageFile } from '@/types';
import { colorToCssFilter } from '@/lib/imageProcessor';
import { WatermarkOverlay } from '@/components/editor/WatermarkOverlay';
import { composedSize } from '@/lib/previewGeometry';

interface PreviewStageProps {
  image: ImageFile;
  editState: EditState;
  /** Displayed pixels per source pixel. */
  scale: number;
  /** Id of the SVG sharpen filter to chain after the CSS colour filters. */
  sharpenFilterId?: string;
}

/**
 * Renders the edit stack the same way the export pipeline does — crop, then
 * border, then watermark, with rotation and colour applied on top — so what
 * the canvas shows is what gets downloaded.
 */
export function PreviewStage({ image, editState, scale, sharpenFilterId }: PreviewStageProps) {
  const { width, height, cropW, cropH } = composedSize(image, editState);
  const { rotate, border, crop, watermark } = editState;

  const colorFilter = colorToCssFilter(editState.colorAdjustments);
  const filters = [colorFilter === 'none' ? null : colorFilter, sharpenFilterId ? `url(#${sharpenFilterId})` : null]
    .filter(Boolean)
    .join(' ');

  const transforms = [
    rotate.angle !== 0 ? `rotate(${rotate.angle}deg)` : null,
    rotate.flipH ? 'scaleX(-1)' : null,
    rotate.flipV ? 'scaleY(-1)' : null,
  ].filter(Boolean);

  const composedStyle: CSSProperties = {
    width: width * scale,
    height: height * scale,
    transform: transforms.length > 0 ? transforms.join(' ') : undefined,
    backgroundColor: border?.mode === 'solid' ? border.color : undefined,
    paddingTop: (border?.top ?? 0) * scale,
    paddingRight: (border?.right ?? 0) * scale,
    paddingBottom: (border?.bottom ?? 0) * scale,
    paddingLeft: (border?.left ?? 0) * scale,
  };

  return (
    <div className="relative shrink-0" style={composedStyle}>
      {/* Blurred backdrop for blur-mode borders */}
      {border?.mode === 'blur' && (
        <>
          <img
            src={image.originalUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: `blur(${Math.max(8, Math.round(Math.min(width, height) * 0.04)) * scale}px)` }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}

      {/* Crop window: the image is oversized and offset so only the kept region shows. */}
      <div
        className="relative overflow-hidden"
        style={{ width: cropW * scale, height: cropH * scale }}
      >
        <img
          src={image.originalUrl}
          alt={image.name}
          draggable={false}
          className="max-w-none select-none"
          style={{
            position: 'absolute',
            width: image.width * scale,
            height: image.height * scale,
            left: -(crop?.x ?? 0) * scale,
            top: -(crop?.y ?? 0) * scale,
            filter: filters || undefined,
          }}
        />
      </div>

      {watermark && (
        <WatermarkOverlay
          watermark={watermark}
          scale={scale}
          canvasWidth={width}
          canvasHeight={height}
        />
      )}
    </div>
  );
}
