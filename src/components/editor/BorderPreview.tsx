import { useRef, useState, useEffect } from 'react';
import type { BorderData } from '@/types';
import type { ReactNode } from 'react';

interface BorderPreviewProps {
  border: BorderData | null;
  imageWidth: number;
  imageSrc: string;
  children: ReactNode;
}

export function BorderPreview({ border, imageWidth, imageSrc, children }: BorderPreviewProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (!innerRef.current || !imageWidth) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setScale(entry.contentRect.width / imageWidth);
      }
    });
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, [imageWidth]);

  if (!border) {
    return <div ref={innerRef}>{children}</div>;
  }

  const pad = scale > 0 ? {
    top: Math.round(border.top * scale),
    right: Math.round(border.right * scale),
    bottom: Math.round(border.bottom * scale),
    left: Math.round(border.left * scale),
  } : { top: 0, right: 0, bottom: 0, left: 0 };

  return (
    <div
      className="relative"
      style={{
        padding: `${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px`,
        backgroundColor: border.mode === 'solid' ? border.color : undefined,
      }}
    >
      {border.mode === 'blur' && (
        <>
          <img
            src={imageSrc}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(30px)' }}
            alt=""
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/20" />
        </>
      )}
      <div ref={innerRef} className="relative z-10">
        {children}
      </div>
    </div>
  );
}
