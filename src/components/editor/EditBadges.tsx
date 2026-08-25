import type { EditState } from '@/types';

const PRESET_LABELS: Record<string, string> = {
  grayscale: 'Grayscale',
  sepia: 'Sepia',
  invert: 'Invert',
  warm: 'Warm',
  cool: 'Cool',
  highContrast: 'High contrast',
  vintage: 'Vintage',
};

/** Compact summary of what has been changed, shown next to the file info. */
export function EditBadges({ editState }: { editState: EditState }) {
  const { crop, resize, rotate, colorAdjustments: color, watermark, border } = editState;
  const badges: string[] = [];

  if (crop) badges.push(`Crop ${crop.width}×${crop.height}`);
  if (resize) badges.push(`Resize ${resize.width}×${resize.height}`);
  if (rotate.angle !== 0) badges.push(`${rotate.angle}°`);
  if (rotate.flipH) badges.push('Flip H');
  if (rotate.flipV) badges.push('Flip V');

  if (color.preset) badges.push(PRESET_LABELS[color.preset] ?? color.preset);
  else {
    if (color.invert) badges.push('Invert');
    if (color.brightness || color.contrast || color.saturation || color.hue) badges.push('Colour');
    if (color.sharpness) badges.push(`Sharpen ${color.sharpness}`);
  }

  if (watermark) badges.push('Watermark');
  if (border) badges.push(border.mode === 'blur' ? 'Blur border' : 'Border');

  if (badges.length === 0) return null;

  return (
    <div className="ml-auto flex flex-wrap justify-end gap-1">
      {badges.map((badge) => (
        <span key={badge} className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300">
          {badge}
        </span>
      ))}
    </div>
  );
}
