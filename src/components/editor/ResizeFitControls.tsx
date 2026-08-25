import { useImageStore } from '@/stores/useImageStore';
import type { ResizeData, ResizeFit } from '@/types';

const FITS: { value: ResizeFit; label: string; hint: string }[] = [
  { value: 'stretch', label: 'Stretch', hint: 'Fills the box exactly, distorting if the shape differs.' },
  { value: 'contain', label: 'Contain', hint: 'Fits inside the box and pads the remainder.' },
  { value: 'cover', label: 'Cover', hint: 'Fills the box and crops whatever overflows.' },
];

const SWATCHES = ['#ffffff', '#000000', '#18181b', '#f4f4f5', 'transparent'];

export function ResizeFitControls({ resize }: { resize: ResizeData }) {
  const { setResizeFit, setResizeBackground, pushHistory } = useImageStore();
  const active = FITS.find((f) => f.value === resize.fit) ?? FITS[0];

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Fit</h3>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Resize fit mode">
        {FITS.map((fit) => (
          <button
            key={fit.value}
            onClick={() => {
              setResizeFit(fit.value);
              pushHistory(`Fit: ${fit.label.toLowerCase()}`);
            }}
            aria-pressed={resize.fit === fit.value}
            title={fit.hint}
            className={`rounded-md py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              resize.fit === fit.value
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
            }`}
          >
            {fit.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">{active.hint}</p>

      {resize.fit === 'contain' && (
        <div className="mt-3">
          <span className="mb-1 block text-[11px] text-zinc-400">Padding colour</span>
          <div className="flex gap-1.5">
            {SWATCHES.map((colour) => (
              <button
                key={colour}
                onClick={() => {
                  setResizeBackground(colour);
                  pushHistory('Change padding colour');
                }}
                aria-label={colour === 'transparent' ? 'Transparent padding' : `Padding ${colour}`}
                aria-pressed={resize.background === colour}
                className={`h-7 w-7 rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  resize.background === colour ? 'border-violet-500' : 'border-zinc-700'
                } ${colour === 'transparent' ? 'checkerboard' : ''}`}
                style={colour === 'transparent' ? undefined : { backgroundColor: colour }}
              />
            ))}
            <input
              type="color"
              value={resize.background === 'transparent' ? '#ffffff' : resize.background}
              onChange={(e) => setResizeBackground(e.target.value)}
              onBlur={() => pushHistory('Change padding colour')}
              aria-label="Custom padding colour"
              className="h-7 w-9 cursor-pointer rounded-md border border-zinc-700 bg-zinc-800"
            />
          </div>
          {resize.background === 'transparent' && (
            <p className="mt-1 text-[11px] leading-relaxed text-amber-300/90">
              JPEG has no alpha channel — transparent padding exports as black.
              Use PNG or WebP, or pick a colour.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
