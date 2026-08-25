interface SharpenFilterProps {
  id: string;
  /** 0-100, matching the sharpness slider. */
  amount: number;
}

/**
 * SVG mirror of the unsharp mask in the export pipeline, so the sharpness
 * slider previews instead of only showing up in the downloaded file.
 */
export function SharpenFilter({ id, amount }: SharpenFilterProps) {
  const a = (amount / 100) * 2;
  const kernel = [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0].map((v) => v.toFixed(4)).join(' ');

  return (
    <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feConvolveMatrix order="3" kernelMatrix={kernel} divisor="1" preserveAlpha="true" edgeMode="duplicate" />
        </filter>
      </defs>
    </svg>
  );
}
