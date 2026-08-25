import { useImageStore } from '@/stores/useImageStore';
import { fullFrameCrop } from '@/lib/cropGeometry';
import type { CropData, ImageFile } from '@/types';

type Field = 'x' | 'y' | 'width' | 'height';

const FIELDS: { key: Field; label: string }[] = [
  { key: 'x', label: 'X' },
  { key: 'y', label: 'Y' },
  { key: 'width', label: 'Width' },
  { key: 'height', label: 'Height' },
];

/** Clamps an edited value so the region always stays inside the image. */
function clampCrop(crop: CropData, image: ImageFile): CropData {
  const width = Math.min(Math.max(1, crop.width), image.width);
  const height = Math.min(Math.max(1, crop.height), image.height);
  return {
    width,
    height,
    x: Math.min(Math.max(0, crop.x), image.width - width),
    y: Math.min(Math.max(0, crop.y), image.height - height),
  };
}

/** Exact numeric entry, so the crop is usable without a pointer. */
export function CropFields({ image }: { image: ImageFile }) {
  const crop = useImageStore((s) => s.editState.crop);
  const { setCrop, pushHistory } = useImageStore();

  const current = crop ?? fullFrameCrop(image.width, image.height);

  const update = (key: Field, raw: number) => {
    const next = clampCrop({ ...current, [key]: Math.round(raw) || (key === 'x' || key === 'y' ? 0 : 1) }, image);
    setCrop(next);
  };

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Exact region (px)</h3>
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={`crop-${field.key}`} className="mb-0.5 block text-[11px] text-zinc-400">
              {field.label}
            </label>
            <input
              id={`crop-${field.key}`}
              type="number"
              value={current[field.key]}
              min={field.key === 'x' || field.key === 'y' ? 0 : 1}
              onChange={(e) => update(field.key, parseInt(e.target.value))}
              onBlur={() => pushHistory(`Crop ${current.width}×${current.height}`)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-sm tabular-nums text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
        On the canvas: arrows move the region, Alt+arrows resize it, Shift for
        10px steps.
      </p>
    </div>
  );
}
