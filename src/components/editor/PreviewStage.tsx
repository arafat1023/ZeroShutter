import type { CSSProperties } from 'react';
import type { EditState, ImageFile } from '@/types';
import { colorToCssFilter } from '@/lib/imageProcessor';
import { WatermarkOverlay } from '@/components/editor/WatermarkOverlay';
import { previewGeometry } from '@/lib/previewGeometry';

interface PreviewStageProps {
  image: ImageFile;
  editState: EditState;
  /** Displayed pixels per source pixel. */
  scale: number;
  /** Id of the SVG sharpen filter to chain after the CSS colour filters. */
  sharpenFilterId?: string;
}

/**
 * Renders the edit stack in the same order the export pipeline does — crop,
 * rotate, resize/fit, colour, border, watermark — so what the canvas shows is
 * what gets downloaded.
 */
export function PreviewStage({ image, editState, scale, sharpenFilterId }: PreviewStageProps) {
  const geometry = previewGeometry(image, editState);
  const { border, crop, watermark, rotate, resize } = editState;

  const colorFilter = colorToCssFilter(editState.colorAdjustments);
  const filters = [colorFilter === 'none' ? null : colorFilter, sharpenFilterId ? `url(#${sharpenFilterId})` : null]
    .filter(Boolean)
    .join(' ');

  const rotateTransforms = [
    rotate.angle !== 0 ? `rotate(${rotate.angle}deg)` : null,
    rotate.flipH ? 'scaleX(-1)' : null,
    rotate.flipV ? 'scaleY(-1)' : null,
  ].filter(Boolean);

  const needsFitScale = geometry.fitScaleX !== 1 || geometry.fitScaleY !== 1;
  const letterbox =
    resize && resize.fit === 'contain' && resize.background !== 'transparent'
      ? resize.background
      : undefined;

  const composedStyle: CSSProperties = {
    width: geometry.composedW * scale,
    height: geometry.composedH * scale,
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
            style={{
              filter: `blur(${Math.max(8, Math.round(Math.min(geometry.composedW, geometry.composedH) * 0.04)) * scale}px)`,
            }}
          />
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}

      {/* The resize target. `cover` overflows it and is clipped; `contain`
          leaves padding that the background colour fills. */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: geometry.frameW * scale,
          height: geometry.frameH * scale,
          backgroundColor: letterbox,
        }}
      >
        <div
          className="shrink-0"
          style={{
            width: geometry.rotatedW * scale,
            height: geometry.rotatedH * scale,
            transform: needsFitScale ? `scale(${geometry.fitScaleX}, ${geometry.fitScaleY})` : undefined,
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            {/* Crop window: the image is oversized and offset so only the kept region shows. */}
            <div
              className="relative shrink-0 overflow-hidden"
              style={{
                width: geometry.cropW * scale,
                height: geometry.cropH * scale,
                transform: rotateTransforms.length > 0 ? rotateTransforms.join(' ') : undefined,
              }}
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
          </div>
        </div>
      </div>

      {watermark && (
        <WatermarkOverlay
          watermark={watermark}
          scale={scale}
          canvasWidth={geometry.composedW}
          canvasHeight={geometry.composedH}
        />
      )}
    </div>
  );
}
