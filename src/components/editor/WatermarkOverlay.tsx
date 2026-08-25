import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { WatermarkData } from '@/types';
import { watermarkTilePositions } from '@/lib/pipeline';

interface WatermarkOverlayProps {
  watermark: WatermarkData;
  /** Displayed pixels per source pixel. */
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
}

const MAX_PREVIEW_TILES = 1200;

/**
 * DOM mirror of the canvas watermark renderer. Both anchor text by its centre
 * and rotate around that centre, so the preview lines up with the export.
 */
export function WatermarkOverlay({ watermark, scale, canvasWidth, canvasHeight }: WatermarkOverlayProps) {
  const text = watermark.text.trim();

  const textStyle: CSSProperties = {
    fontFamily: watermark.fontFamily,
    fontSize: watermark.fontSize * scale,
    fontWeight: watermark.bold ? 'bold' : 'normal',
    fontStyle: watermark.italic ? 'italic' : 'normal',
    lineHeight: 1,
    color: watermark.fontColor,
    opacity: watermark.fontOpacity,
    whiteSpace: 'nowrap',
    position: 'absolute',
  };

  const tiles = useMemo(() => {
    if (!watermark.tiling) return [];
    const spacing = Math.max(20, watermark.tileSpacing || 200);
    const overflow = Math.max(canvasWidth, canvasHeight) * 0.5;
    const positions = watermarkTilePositions(spacing, overflow, canvasWidth, canvasHeight);
    // A dense grid on a huge image would create thousands of DOM nodes; the
    // preview thins out beyond a point while the export stays exact.
    if (positions.length <= MAX_PREVIEW_TILES) return positions;
    const stride = Math.ceil(positions.length / MAX_PREVIEW_TILES);
    return positions.filter((_, index) => index % stride === 0);
  }, [watermark.tiling, watermark.tileSpacing, canvasWidth, canvasHeight]);

  if (!text) return null;

  if (watermark.tiling) {
    const angle = watermark.rotation || -30;
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {tiles.map((tile, index) => (
          <span
            key={index}
            style={{
              ...textStyle,
              left: tile.x * scale,
              top: tile.y * scale,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            }}
          >
            {text}
          </span>
        ))}
      </div>
    );
  }

  const margin = watermark.fontSize * 0.8 * scale;
  const position = watermark.position;
  const centredX = !position.endsWith('-left') && !position.endsWith('-right');
  const centredY = !position.startsWith('top') && !position.startsWith('bottom');

  const anchor: CSSProperties = {
    ...(position.endsWith('-left') ? { left: margin } : {}),
    ...(position.endsWith('-right') ? { right: margin } : {}),
    ...(centredX ? { left: '50%' } : {}),
    ...(position.startsWith('top') ? { top: margin } : {}),
    ...(position.startsWith('bottom') ? { bottom: margin } : {}),
    ...(centredY ? { top: '50%' } : {}),
    // `translate` is separate from `transform` so the rotation still pivots
    // around the text's own centre, exactly like the canvas renderer.
    translate: `${centredX ? '-50%' : '0'} ${centredY ? '-50%' : '0'}`,
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        style={{
          ...textStyle,
          ...anchor,
          transform: watermark.rotation !== 0 ? `rotate(${watermark.rotation}deg)` : undefined,
        }}
      >
        {text}
      </span>
    </div>
  );
}
