import { useRef, useState, useEffect, useMemo } from 'react';
import type { WatermarkData, WatermarkPosition } from '@/types';

interface WatermarkPreviewProps {
  watermark: WatermarkData;
  sourceWidth: number;
}

const POSITION_STYLES: Record<WatermarkPosition, { alignItems: string; justifyContent: string }> = {
  'top-left':      { alignItems: 'flex-start', justifyContent: 'flex-start' },
  'top-center':    { alignItems: 'flex-start', justifyContent: 'center' },
  'top-right':     { alignItems: 'flex-start', justifyContent: 'flex-end' },
  'center-left':   { alignItems: 'center',     justifyContent: 'flex-start' },
  'center':        { alignItems: 'center',     justifyContent: 'center' },
  'center-right':  { alignItems: 'center',     justifyContent: 'flex-end' },
  'bottom-left':   { alignItems: 'flex-end',   justifyContent: 'flex-start' },
  'bottom-center': { alignItems: 'flex-end',   justifyContent: 'center' },
  'bottom-right':  { alignItems: 'flex-end',   justifyContent: 'flex-end' },
};

const MAX_TILES = 2500;

export function WatermarkPreview({ watermark, sourceWidth }: WatermarkPreviewProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!overlayRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDims({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(overlayRef.current);
    return () => observer.disconnect();
  }, []);

  if (watermark.type === 'text' && !watermark.text.trim()) return null;
  if (dims.width === 0) {
    return <div ref={overlayRef} className="absolute inset-0 pointer-events-none" />;
  }

  const scale = sourceWidth > 0 ? dims.width / sourceWidth : 1;
  const scaledFontSize = Math.max(watermark.fontSize * scale, 4);

  const textStyle: React.CSSProperties = {
    fontFamily: watermark.fontFamily,
    fontSize: `${scaledFontSize}px`,
    fontWeight: watermark.bold ? 'bold' : 'normal',
    fontStyle: watermark.italic ? 'italic' : 'normal',
    color: watermark.fontColor,
    opacity: watermark.fontOpacity,
    whiteSpace: 'nowrap',
  };

  return (
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {watermark.tiling ? (
        <TiledWatermarks
          watermark={watermark}
          textStyle={textStyle}
          scale={scale}
          containerWidth={dims.width}
          containerHeight={dims.height}
        />
      ) : (
        <SingleWatermark
          watermark={watermark}
          textStyle={textStyle}
          scaledFontSize={scaledFontSize}
        />
      )}
    </div>
  );
}

function SingleWatermark({ watermark, textStyle, scaledFontSize }: {
  watermark: WatermarkData;
  textStyle: React.CSSProperties;
  scaledFontSize: number;
}) {
  const pos = POSITION_STYLES[watermark.position];
  const margin = scaledFontSize * 0.8;

  return (
    <div
      className="absolute inset-0 flex"
      style={{
        alignItems: pos.alignItems,
        justifyContent: pos.justifyContent,
        padding: `${margin}px`,
      }}
    >
      <span style={{
        ...textStyle,
        transform: watermark.rotation !== 0 ? `rotate(${watermark.rotation}deg)` : undefined,
      }}>
        {watermark.text}
      </span>
    </div>
  );
}

function TiledWatermarks({ watermark, textStyle, scale, containerWidth, containerHeight }: {
  watermark: WatermarkData;
  textStyle: React.CSSProperties;
  scale: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const elements = useMemo(() => {
    let spacing = (watermark.tileSpacing || 200) * scale;
    const rotation = watermark.rotation || -30;
    const overflow = Math.max(containerWidth, containerHeight) * 0.5;

    // Prevent too many tiles
    const cols = Math.ceil((containerWidth + 2 * overflow) / spacing);
    const rows = Math.ceil((containerHeight + 2 * overflow) / spacing);
    if (cols * rows > MAX_TILES) {
      const ratio = Math.sqrt((cols * rows) / MAX_TILES);
      spacing *= ratio;
    }

    const adjCols = Math.ceil((containerWidth + 2 * overflow) / spacing);
    const adjRows = Math.ceil((containerHeight + 2 * overflow) / spacing);
    const tiles: React.ReactNode[] = [];

    for (let r = 0; r < adjRows; r++) {
      for (let c = 0; c < adjCols; c++) {
        tiles.push(
          <span
            key={`${r}-${c}`}
            className="absolute whitespace-nowrap"
            style={{
              ...textStyle,
              left: -overflow + c * spacing,
              top: -overflow + r * spacing,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {watermark.text}
          </span>
        );
      }
    }
    return tiles;
  }, [
    watermark.text, watermark.tileSpacing, watermark.rotation,
    watermark.fontFamily, watermark.fontSize, watermark.fontColor,
    watermark.fontOpacity, watermark.bold, watermark.italic,
    scale, containerWidth, containerHeight, textStyle,
  ]);

  return <>{elements}</>;
}
