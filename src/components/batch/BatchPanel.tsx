import { X, Pencil } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { formatFileSize } from '@/lib/format';

/**
 * Vertical list on desktop, horizontal filmstrip on small screens. Images that
 * carry saved edits are marked so nothing is silently forgotten.
 */
export function BatchPanel() {
  const { images, activeImageId, sessions, setActiveImage, removeImage } = useImageStore();

  const hasEdits = (id: string) => {
    const session = sessions[id];
    if (!session) return false;
    return session.history.length > 1;
  };

  return (
    <aside
      aria-label="Loaded images"
      className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-zinc-800 bg-zinc-900 p-2 lg:w-48 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-r lg:border-b-0"
    >
      <h2 className="hidden shrink-0 px-1 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 lg:block">
        Images ({images.length})
      </h2>

      {images.map((image) => {
        const isActive = activeImageId === image.id;
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
              <img src={image.originalUrl} alt="" className="h-20 w-full object-cover lg:h-24" />
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-1 text-left">
                <p className="truncate text-[11px] text-zinc-200">{image.name}</p>
                <p className="text-[8px] text-zinc-400">{formatFileSize(image.size)}</p>
              </div>
            </button>

            {!isActive && hasEdits(image.id) && (
              <span
                title="This image has unsaved edits"
                className="absolute top-1 left-1 rounded bg-violet-600/90 p-0.5 text-white"
              >
                <Pencil className="h-2.5 w-2.5" />
              </span>
            )}

            <button
              onClick={() => removeImage(image.id)}
              aria-label={`Remove ${image.name}`}
              className="absolute top-1 right-1 rounded-md bg-black/70 p-0.5 text-zinc-300 opacity-0 transition-opacity hover:text-red-400 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
