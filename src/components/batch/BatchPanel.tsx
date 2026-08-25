import { X, Pencil, Check } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { formatFileSize } from '@/lib/format';

/**
 * Vertical list on desktop, horizontal filmstrip on small screens. Each image
 * can be ticked for batch export, and carries a marker when it has its own edits.
 */
export function BatchPanel() {
  const { images, activeImageId, sessions, selectedImageIds, setActiveImage, removeImage } = useImageStore();
  const { toggleImageSelected, setAllImagesSelected } = useImageStore();

  const selectedCount = selectedImageIds.length;
  const allSelected = selectedCount === images.length && images.length > 0;

  const hasEdits = (id: string) => (sessions[id]?.history.length ?? 0) > 1;

  return (
    <aside
      aria-label="Loaded images"
      className="flex shrink-0 flex-col border-b border-zinc-800 bg-zinc-900 lg:w-52 lg:border-r lg:border-b-0"
    >
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 lg:px-3 lg:py-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          <span className="hidden lg:inline">Images </span>
          {selectedCount}/{images.length}
        </h2>
        <button
          onClick={() => setAllImagesSelected(!allSelected)}
          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {allSelected ? 'None' : 'All'}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto p-2 pt-0 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
        {images.map((image) => {
          const isActive = activeImageId === image.id;
          const isSelected = selectedImageIds.includes(image.id);
          return (
            <div
              key={image.id}
              className={`group relative w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-colors lg:w-full ${
                isActive ? 'border-violet-500' : 'border-transparent hover:border-zinc-600'
              }`}
            >
              <button
                onClick={() => setActiveImage(image.id)}
                aria-current={isActive}
                className="block w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400"
                title={image.name}
              >
                <img
                  src={image.originalUrl}
                  alt=""
                  className={`h-20 w-full object-cover transition-opacity lg:h-24 ${
                    isSelected ? '' : 'opacity-40'
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1.5 py-1 text-left">
                  <p className="truncate text-[11px] text-zinc-100">{image.name}</p>
                  <p className="text-[11px] text-zinc-300">{formatFileSize(image.size)}</p>
                </div>
              </button>

              {/* Include in batch export */}
              <button
                onClick={() => toggleImageSelected(image.id)}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`Include ${image.name} in batch export`}
                className={`absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  isSelected
                    ? 'border-violet-400 bg-violet-600 text-white'
                    : 'border-zinc-400 bg-black/60 text-transparent hover:border-zinc-200'
                }`}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </button>

              {hasEdits(image.id) && !isActive && (
                <span
                  title="This image has its own edits"
                  className="absolute top-1 left-6 rounded bg-violet-600/90 p-0.5 text-white"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </span>
              )}

              <button
                onClick={() => removeImage(image.id)}
                aria-label={`Remove ${image.name}`}
                className="absolute top-1 right-1 rounded-md bg-black/70 p-0.5 text-zinc-200 opacity-0 transition-opacity hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
