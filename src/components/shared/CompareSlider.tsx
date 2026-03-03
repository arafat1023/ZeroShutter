import { useState, useRef, useCallback } from 'react';

interface CompareSliderProps {
  leftSrc: string;
  rightSrc: string;
  leftLabel?: string;
  rightLabel?: string;
  alt?: string;
}

export function CompareSlider({
  leftSrc,
  rightSrc,
  leftLabel = 'Original',
  rightLabel = 'Edited',
  alt = 'Comparison',
}: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    const onMove = (e: MouseEvent) => {
      if (isDragging.current) updatePosition(e.clientX);
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [updatePosition]);

  const handleTouchStart = useCallback(() => {
    isDragging.current = true;
    const onMove = (e: TouchEvent) => {
      if (isDragging.current && e.touches[0]) updatePosition(e.touches[0].clientX);
    };
    const onEnd = () => {
      isDragging.current = false;
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative select-none cursor-col-resize overflow-hidden rounded-lg"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Right image (full width, behind clip) */}
      <img
        src={rightSrc}
        alt={`${alt} - ${rightLabel}`}
        className="block max-w-full max-h-[calc(100vh-220px)] object-contain"
        draggable={false}
      />

      {/* Left image (clipped to left side of divider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={leftSrc}
          alt={`${alt} - ${leftLabel}`}
          className="block max-w-none max-h-[calc(100vh-220px)] object-contain"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-zinc-400 rounded-full" />
            <div className="w-0.5 h-3 bg-zinc-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
        {leftLabel}
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium">
        {rightLabel}
      </div>
    </div>
  );
}
