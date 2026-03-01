import { useState, useEffect, useCallback } from 'react';
import { Download, Loader2, Archive, Check, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useImageStore } from '@/stores/useImageStore';
import { FORMAT_OPTIONS } from '@/lib/constants';
import { processImage, estimateFileSize } from '@/lib/imageProcessor';
import { formatFileSize, stripExtension, getExtensionForFormat } from '@/lib/format';
import type { OutputFormat } from '@/types';

interface BatchStatus {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export function ExportPanel() {
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const images = useImageStore((s) => s.images);
  const mode = useImageStore((s) => s.mode);
  const { editState, setFormat, setQuality } = useImageStore();
  const { format, quality } = editState.exportSettings;

  const [customFilename, setCustomFilename] = useState(() =>
    activeImage ? stripExtension(activeImage.name) : ''
  );
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatuses, setBatchStatuses] = useState<BatchStatus[]>([]);
  const [isEstimating, setIsEstimating] = useState(false);
  const activeImageId = activeImage?.id;

  // Reset custom filename when active image changes
  useEffect(() => {
    if (activeImage) {
      setCustomFilename(stripExtension(activeImage.name)); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [activeImageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const estimate = useCallback(async () => {
    if (!activeImage) return;
    setIsEstimating(true);
    try {
      const size = await estimateFileSize(activeImage.originalUrl, format, quality);
      setEstimatedSize(size);
    } catch {
      setEstimatedSize(null);
    }
    setIsEstimating(false);
  }, [activeImage, format, quality]);

  useEffect(() => {
    const timer = setTimeout(estimate, 300);
    return () => clearTimeout(timer);
  }, [estimate]);

  if (!activeImage) return null;

  const ext = getExtensionForFormat(format);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { blob } = await processImage(activeImage.originalUrl, {
        crop: editState.crop,
        resizeWidth: editState.resize?.width,
        resizeHeight: editState.resize?.height,
        rotate: editState.rotate,
        colorAdjustments: editState.colorAdjustments,
        watermark: editState.watermark,
        border: editState.border,
        format,
        quality,
      });

      const fileName = `${customFilename || stripExtension(activeImage.name)}.${ext}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setIsExporting(false);
  };

  const handleBatchExport = async () => {
    setIsBatchExporting(true);
    setBatchProgress(0);

    const statuses: BatchStatus[] = images.map((img) => ({
      id: img.id, name: img.name, status: 'pending',
    }));
    setBatchStatuses(statuses);

    const zip = new JSZip();

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      statuses[i] = { ...statuses[i], status: 'processing' };
      setBatchStatuses([...statuses]);

      try {
        // Batch applies: format, quality, resize (uniform settings)
        // Does NOT apply: crop, rotate/flip (per-image operations)
        const { blob } = await processImage(img.originalUrl, {
          resizeWidth: editState.resize?.width,
          resizeHeight: editState.resize?.height,
          format,
          quality,
        });
        const fileName = `${stripExtension(img.name)}.${ext}`;
        zip.file(fileName, blob);
        statuses[i] = { ...statuses[i], status: 'done' };
      } catch (err) {
        console.error(`Failed to process ${img.name}:`, err);
        statuses[i] = { ...statuses[i], status: 'error' };
      }
      setBatchStatuses([...statuses]);
      setBatchProgress(Math.round(((i + 1) / images.length) * 100));
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'zeroshutter-export.zip');
    } catch (err) {
      console.error('ZIP generation failed:', err);
    }
    setIsBatchExporting(false);
  };

  const isLossy = FORMAT_OPTIONS.find((f) => f.value === format)?.lossy ?? false;
  const savings =
    estimatedSize !== null
      ? Math.round((1 - estimatedSize / activeImage.size) * 100)
      : null;

  return (
    <div className="space-y-5">
      {/* Format */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Format
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFormat(opt.value as OutputFormat)}
              className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                format === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      {isLossy && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Quality
            </h3>
            <span className="text-xs text-zinc-300 font-medium">
              {Math.round(quality * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(parseInt(e.target.value) / 100)}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
            <span>Smallest</span>
            <span>Best quality</span>
          </div>
        </div>
      )}

      {/* File size estimate */}
      <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Original</span>
          <span className="text-zinc-300">{formatFileSize(activeImage.size)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Estimated</span>
          <span className="text-zinc-300">
            {isEstimating ? (
              <Loader2 className="w-3 h-3 animate-spin inline" />
            ) : estimatedSize !== null ? (
              formatFileSize(estimatedSize)
            ) : (
              '—'
            )}
          </span>
        </div>
        {savings !== null && !isEstimating && (
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Savings</span>
            <span className={savings > 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {savings > 0 ? `${savings}% smaller` : `${Math.abs(savings)}% larger`}
            </span>
          </div>
        )}
      </div>

      {/* Custom filename */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Filename
        </h3>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder={stripExtension(activeImage.name)}
            className="flex-1 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
          />
          <span className="text-xs text-zinc-500">.{ext}</span>
        </div>
      </div>

      {/* Single download */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download
          </>
        )}
      </button>

      {/* Batch ZIP export */}
      {images.length > 1 && mode === 'batch' && (
        <div className="space-y-3">
          <div className="h-px bg-zinc-800" />
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
              Batch Export ({images.length} images)
            </p>
            <p className="text-[10px] text-zinc-600">
              Applies format, quality{editState.resize ? ', resize' : ''} to all images.
              Per-image crop and rotate are not applied in batch.
            </p>
          </div>

          <button
            onClick={handleBatchExport}
            disabled={isBatchExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
          >
            {isBatchExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing {batchProgress}%
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Download All as ZIP
              </>
            )}
          </button>

          {/* Progress bar */}
          {isBatchExporting && (
            <>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${batchProgress}%` }}
                />
              </div>
              {/* Per-image status */}
              <div className="max-h-32 overflow-y-auto space-y-1">
                {batchStatuses.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-[10px]">
                    {s.status === 'done' && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    {s.status === 'processing' && <Loader2 className="w-3 h-3 text-violet-400 animate-spin shrink-0" />}
                    {s.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />}
                    {s.status === 'pending' && <div className="w-3 h-3 rounded-full border border-zinc-700 shrink-0" />}
                    <span className={`truncate ${s.status === 'error' ? 'text-red-400' : 'text-zinc-400'}`}>
                      {s.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
