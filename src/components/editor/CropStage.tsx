import { useEffect } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { useViewStore } from '@/stores/useViewStore';
import { colorToCssFilter } from '@/lib/imageProcessor';
import { fullFrameCrop, cropForAspect } from '@/lib/cropGeometry';
import { CropOverlay } from '@/components/editor/CropOverlay';
import type { CropData, ImageFile } from '@/types';

interface CropStageProps {
  image: ImageFile;
  scale: number;
  sharpenFilterId?: string;
}

/** True when the rect covers the whole image, i.e. it is not really a crop. */
function isFullFrame(crop: CropData, image: ImageFile): boolean {
  return (
    crop.x === 0 && crop.y === 0 &&
    crop.width >= image.width && crop.height >= image.height
  );
}

/**
 * The crop view. Shows the uncropped image — crop runs before rotation and
 * border in the pipeline, so those are set aside while the region is chosen —
 * with the same zoom, canvas and toolbar as every other tool.
 */
export function CropStage({ image, scale, sharpenFilterId }: CropStageProps) {
  const crop = useImageStore((s) => s.editState.crop);
  const colorAdjustments = useImageStore((s) => s.editState.colorAdjustments);
  const { setCrop, pushHistory } = useImageStore();
  const ratio = useViewStore((s) => s.cropRatio);

  // Snap to the chosen ratio when the user picks one.
  useEffect(() => {
    if (ratio) setCrop(cropForAspect(image.width, image.height, ratio));
  }, [ratio, image.width, image.height, setCrop]);

  // Handles show the full frame until the user actually crops something.
  const active = crop ?? fullFrameCrop(image.width, image.height);
  const colorFilter = colorToCssFilter(colorAdjustments);
  const filters = [colorFilter === 'none' ? null : colorFilter, sharpenFilterId ? `url(#${sharpenFilterId})` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="checkerboard relative shrink-0 shadow-2xl shadow-black/40"
      style={{ width: image.width * scale, height: image.height * scale }}
    >
      <img
        src={image.originalUrl}
        alt={image.name}
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ filter: filters || undefined }}
      />
      <CropOverlay
        crop={active}
        imageWidth={image.width}
        imageHeight={image.height}
        scale={scale}
        ratio={ratio ?? undefined}
        onChange={setCrop}
        onCommit={() => {
          const current = useImageStore.getState().editState.crop;
          if (!current) return;
          // A full-frame rect means "no crop" — keep the badges honest.
          if (isFullFrame(current, image)) setCrop(null);
          else pushHistory(`Crop ${current.width}×${current.height}`);
        }}
      />
    </div>
  );
}
