import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { WatermarkData } from '@/types';
import { watermarkTilePositions, watermarkImageSize, watermarkImageCentre } from '@/lib/pipeline';

interface WatermarkOverlayProps {
  watermark: WatermarkData;
  /** Displayed pixels per source pixel. */
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
}

const MAX_PREVIEW_TILES = 1200;

/**
 * DOM mirror of the canvas watermark renderer. Placement comes from the same
 * helpers the pipeline uses, so the preview and the export cannot drift.
 */
export function WatermarkOverlay({ watermark, scale, canvasWidth, canvasHeight }: WatermarkOverlayProps) {
  const tiles = useMemo(() => {
    if (!watermark.tiling) return [];
    const positions = watermarkTilePositions(watermark, canvasWidth, canvasHeight);
    // A dense grid on a huge image would create thousands of DOM nodes; the
    // preview thins out beyond a point while the export stays exact.
    if (positions.length <= MAX_PREVIEW_TILES) return positions;
    const stride = Math.ceil(positions.length / MAX_PREVIEW_TILES);
    return positions.filter((_, index) => index % stride === 0);
  }, [watermark, canvasWidth, canvasHeight]);

  if (watermark.type === 'image') {
    return (
      <ImageWatermark
        watermark={watermark}
        scale={scale}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        tiles={tiles}
      />
    );
  }

  const text = watermark.text.trim();
  if (!text) return null;

  const textStyle: CSSProperties = {
    position: 'absolute',
    fontFamily: watermark.fontFamily,
    fontSize: watermark.fontSize * scale,
    fontWeight: watermark.bold ? 'bold' : 'normal',
    fontStyle: watermark.italic ? 'italic' : 'normal',
    lineHeight: 1,
    color: watermark.fontColor,
    opacity: watermark.fontOpacity,
    whiteSpace: 'nowrap',
  };

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

  // The rendered text width is unknown here, so anchor by edge + margin —
  // which lands in the same place as the centre-based canvas maths.
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

function ImageWatermark({
  watermark, scale, canvasWidth, canvasHeight, tiles,
}: WatermarkOverlayProps & { tiles: { x: number; y: number }[] }) {
  if (!watermark.imageUrl || !watermark.imageWidth || !watermark.imageHeight) return null;

  const size = watermarkImageSize(watermark, watermark.imageWidth, watermark.imageHeight, canvasWidth);
  const style: CSSProperties = {
    position: 'absolute',
    width: size.width * scale,
    height: size.height * scale,
    opacity: watermark.imageOpacity,
  };

  const angle = watermark.tiling ? watermark.rotation || -30 : watermark.rotation;

  const anchors = watermark.tiling
    ? tiles
    : [watermarkImageCentre(watermark, size, canvasWidth, canvasHeight)];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {anchors.map((anchor, index) => (
        <img
          key={index}
          src={watermark.imageUrl ?? undefined}
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            ...style,
            left: (anchor.x - size.width / 2) * scale,
            top: (anchor.y - size.height / 2) * scale,
            transform: angle !== 0 ? `rotate(${angle}deg)` : undefined,
          }}
        />
      ))}
    </div>
  );
}
