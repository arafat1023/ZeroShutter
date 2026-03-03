import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useImageStore } from '@/stores/useImageStore';
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
  if (watermark.type === 'image' && !watermark.imageUrl) return null;
  if (dims.width === 0) {
    return <div ref={overlayRef} className="absolute inset-0 pointer-events-none" />;
  }

  const scale = sourceWidth > 0 ? dims.width / sourceWidth : 1;
  const isDraggable = !watermark.tiling;

  if (watermark.type === 'image' && watermark.imageUrl) {
    return (
      <div ref={overlayRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {watermark.tiling ? (
          <TiledImageWatermark
            watermark={watermark}
            scale={scale}
            containerWidth={dims.width}
            containerHeight={dims.height}
          />
        ) : (
          <DraggableWrap isDraggable={isDraggable} containerRef={overlayRef}>
            <SingleImageWatermark watermark={watermark} containerWidth={dims.width} />
          </DraggableWrap>
        )}
      </div>
    );
  }

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
        <DraggableWrap isDraggable={isDraggable} containerRef={overlayRef}>
          <SingleWatermark
            watermark={watermark}
            textStyle={textStyle}
            scaledFontSize={scaledFontSize}
          />
        </DraggableWrap>
      )}
    </div>
  );
}

/** Wrapper that enables drag-to-position on the watermark */
function DraggableWrap({ children, isDraggable, containerRef }: {
  children: React.ReactNode;
  isDraggable: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const updateWatermark = useImageStore((s) => s.updateWatermark);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const wm = useImageStore.getState().editState.watermark;
    if (!wm) return;

    // Current position as percentage
    const currentX = wm.offsetX ?? 50;
    const currentY = wm.offsetY ?? 50;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      origX: (currentX / 100) * rect.width,
      origY: (currentY / 100) * rect.height,
    };
  }, [containerRef]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.min(rect.width, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(rect.height, dragRef.current.origY + dy));

    const pctX = (newX / rect.width) * 100;
    const pctY = (newY / rect.height) * 100;
    updateWatermark({ offsetX: pctX, offsetY: pctY });
  }, [containerRef, updateWatermark]);

  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
    const onMove = (ev: MouseEvent) => handleDragMove(ev.clientX, ev.clientY);
    const onUp = () => {
      handleDragEnd();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handleDragStart(touch.clientX, touch.clientY);
    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (t) handleDragMove(t.clientX, t.clientY);
    };
    const onEnd = () => {
      handleDragEnd();
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  if (!isDraggable) return <>{children}</>;

  return (
    <div
      className="absolute inset-0 pointer-events-auto cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {children}
    </div>
  );
}

function SingleWatermark({ watermark, textStyle, scaledFontSize }: {
  watermark: WatermarkData;
  textStyle: React.CSSProperties;
  scaledFontSize: number;
}) {
  const hasCustomOffset = watermark.offsetX !== null && watermark.offsetY !== null;

  if (hasCustomOffset) {
    return (
      <div className="absolute inset-0">
        <span style={{
          ...textStyle,
          position: 'absolute',
          left: `${watermark.offsetX}%`,
          top: `${watermark.offsetY}%`,
          transform: `translate(-50%, -50%)${watermark.rotation !== 0 ? ` rotate(${watermark.rotation}deg)` : ''}`,
        }}>
          {watermark.text}
        </span>
      </div>
    );
  }

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

function SingleImageWatermark({ watermark, containerWidth }: {
  watermark: WatermarkData;
  containerWidth: number;
}) {
  const hasCustomOffset = watermark.offsetX !== null && watermark.offsetY !== null;
  const imgWidth = (watermark.scale / 100) * containerWidth;

  if (hasCustomOffset) {
    return (
      <div className="absolute inset-0">
        <img
          src={watermark.imageUrl!}
          alt=""
          style={{
            position: 'absolute',
            width: `${imgWidth}px`,
            opacity: watermark.imageOpacity,
            left: `${watermark.offsetX}%`,
            top: `${watermark.offsetY}%`,
            transform: `translate(-50%, -50%)${watermark.rotation !== 0 ? ` rotate(${watermark.rotation}deg)` : ''}`,
          }}
          draggable={false}
        />
      </div>
    );
  }

  const pos = POSITION_STYLES[watermark.position];

  return (
    <div
      className="absolute inset-0 flex"
      style={{
        alignItems: pos.alignItems,
        justifyContent: pos.justifyContent,
        padding: `${imgWidth * 0.2}px`,
      }}
    >
      <img
        src={watermark.imageUrl!}
        alt=""
        style={{
          width: `${imgWidth}px`,
          opacity: watermark.imageOpacity,
          transform: watermark.rotation !== 0 ? `rotate(${watermark.rotation}deg)` : undefined,
        }}
        draggable={false}
      />
    </div>
  );
}

function TiledImageWatermark({ watermark, scale, containerWidth, containerHeight }: {
  watermark: WatermarkData;
  scale: number;
  containerWidth: number;
  containerHeight: number;
}) {
  const elements = useMemo(() => {
    let spacing = (watermark.tileSpacing || 200) * scale;
    const rotation = watermark.rotation || 0;
    const overflow = Math.max(containerWidth, containerHeight) * 0.5;
    const imgWidth = (watermark.scale / 100) * containerWidth;

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
          <img
            key={`${r}-${c}`}
            src={watermark.imageUrl!}
            alt=""
            className="absolute"
            style={{
              width: `${imgWidth}px`,
              opacity: watermark.imageOpacity,
              left: -overflow + c * spacing - imgWidth / 2,
              top: -overflow + r * spacing,
              transform: `rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        );
      }
    }
    return tiles;
  }, [
    watermark.imageUrl, watermark.tileSpacing, watermark.rotation,
    watermark.scale, watermark.imageOpacity,
    scale, containerWidth, containerHeight,
  ]);

  return <>{elements}</>;
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
    scale, containerWidth, containerHeight, textStyle,
  ]);

  return <>{elements}</>;
}
