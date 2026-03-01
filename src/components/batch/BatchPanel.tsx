import { X } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { formatFileSize } from '@/lib/format';

export function BatchPanel() {
  const { images, activeImageId, setActiveImage, removeImage } = useImageStore();

  return (
    <div className="w-48 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-800">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Images ({images.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {images.map((img) => (
          <div
            key={img.id}
            onClick={() => setActiveImage(img.id)}
            className={`group relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
              activeImageId === img.id
                ? 'border-violet-500'
                : 'border-transparent hover:border-zinc-700'
            }`}
          >
            <img
              src={img.originalUrl}
              alt={img.name}
              className="w-full h-24 object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeImage(img.id);
              }}
              className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-md text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-1">
              <p className="text-[9px] text-zinc-300 truncate">{img.name}</p>
              <p className="text-[8px] text-zinc-500">{formatFileSize(img.size)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
