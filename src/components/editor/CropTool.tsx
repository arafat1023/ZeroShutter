import { useImageStore } from '@/stores/useImageStore';
import { formatFileSize } from '@/lib/format';

export function CropTool() {
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const { editState, setCrop } = useImageStore();

  if (!activeImage) return null;

  return (
    <div className="space-y-5">
      {/* Instructions */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
        <p className="text-xs text-violet-300 leading-relaxed">
          Use the interactive cropper on the canvas. Select an aspect ratio from the top bar, drag to adjust, then click <strong>Apply Crop</strong>.
        </p>
      </div>

      {/* Image info */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Original Image
        </h3>
        <div className="space-y-1 text-xs text-zinc-400">
          <div className="flex justify-between">
            <span>Dimensions</span>
            <span className="text-zinc-300">{activeImage.width} × {activeImage.height}</span>
          </div>
          <div className="flex justify-between">
            <span>Size</span>
            <span className="text-zinc-300">{formatFileSize(activeImage.size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Aspect Ratio</span>
            <span className="text-zinc-300">
              {(activeImage.width / activeImage.height).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Current crop info */}
      {editState.crop && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Current Crop
          </h3>
          <div className="space-y-1 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Size</span>
              <span className="text-emerald-400">{editState.crop.width} × {editState.crop.height}</span>
            </div>
            <div className="flex justify-between">
              <span>Position</span>
              <span className="text-zinc-300">({editState.crop.x}, {editState.crop.y})</span>
            </div>
            <div className="flex justify-between">
              <span>Area</span>
              <span className="text-zinc-300">
                {Math.round((editState.crop.width * editState.crop.height) / (activeImage.width * activeImage.height) * 100)}% of original
              </span>
            </div>
          </div>
          <button
            onClick={() => setCrop(null)}
            className="w-full mt-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-colors"
          >
            Clear Crop
          </button>
        </div>
      )}

      {!editState.crop && (
        <p className="text-[10px] text-zinc-600 text-center">
          No crop applied yet
        </p>
      )}
    </div>
  );
}
