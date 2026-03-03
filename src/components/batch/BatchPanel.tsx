import { X, Check, CheckSquare, Square } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { formatFileSize } from '@/lib/format';

export function BatchPanel() {
  const { images, activeImageId, selectedImageIds, setActiveImage, removeImage, selectAll, deselectAll, toggleImageSelection } = useImageStore();
  const isMobile = useIsMobile();
  const allSelected = selectedImageIds.length === images.length;
  const someSelected = selectedImageIds.length > 0;

  if (isMobile) {
    return (
      <div className="bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider shrink-0">
            {images.length} images
          </span>
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
          >
            {allSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          {someSelected && (
            <span className="text-[10px] text-violet-400 shrink-0">{selectedImageIds.length} sel</span>
          )}
        </div>
        <div className="flex gap-1.5 px-2 pb-2 overflow-x-auto">
          {images.map((img) => {
            const isSelected = selectedImageIds.includes(img.id);
            return (
              <div
                key={img.id}
                onClick={() => setActiveImage(img.id)}
                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 shrink-0 transition-colors ${
                  activeImageId === img.id
                    ? 'border-violet-500'
                    : 'border-transparent'
                }`}
              >
                <img
                  src={img.originalUrl}
                  alt={img.name}
                  className="w-16 h-16 object-cover"
                />
                {isSelected && (
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-violet-600 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-48 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Images ({images.length})
          </h2>
          <button
            onClick={allSelected ? deselectAll : selectAll}
            title={allSelected ? 'Deselect All' : 'Select All'}
            className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        {someSelected && (
          <p className="text-[9px] text-violet-400 mt-0.5">
            {selectedImageIds.length} selected
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {images.map((img) => {
          const isSelected = selectedImageIds.includes(img.id);
          return (
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
              {/* Selection checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleImageSelection(img.id);
                }}
                className={`absolute top-1 left-1 w-5 h-5 rounded flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-violet-600 text-white'
                    : 'bg-black/50 text-zinc-400 opacity-0 group-hover:opacity-100'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </button>
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
          );
        })}
      </div>
    </div>
  );
}
