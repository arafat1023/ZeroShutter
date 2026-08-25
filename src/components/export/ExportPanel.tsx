import { useState, useEffect } from 'react';
import { Download, Loader2, Info } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { FORMAT_OPTIONS, EXPORT_PRESETS } from '@/lib/constants';
import { processImage } from '@/lib/imageProcessor';
import { formatFileSize, stripExtension, getExtensionForFormat } from '@/lib/format';
import { buildExportOptions, downloadBlob, sanitizeFileName, predictOutputSize } from '@/lib/exportOptions';
import { useExportEstimate } from '@/components/export/useExportEstimate';
import { useSupportedFormats } from '@/components/export/useSupportedFormats';
import { BatchExport } from '@/components/export/BatchExport';

export function ExportPanel() {
  const activeImage = useImageStore((s) => s.images.find((i) => i.id === s.activeImageId));
  const images = useImageStore((s) => s.images);
  const mode = useImageStore((s) => s.mode);
  const editState = useImageStore((s) => s.editState);
  const { setFormat, setQuality, setResize, notify, pushHistory } = useImageStore();
  const { format, quality } = editState.exportSettings;

  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const supportedFormats = useSupportedFormats();
  const { size: estimatedSize, isEstimating } = useExportEstimate(activeImage, editState);

  const activeImageId = activeImage?.id;
  useEffect(() => {
    setCustomFilename(''); // eslint-disable-line react-hooks/set-state-in-effect
  }, [activeImageId]);

  // If the browser cannot encode the selected format, fall back rather than
  // handing the user a PNG wearing an .avif extension.
  useEffect(() => {
    if (!supportedFormats.has(format)) {
      setFormat('image/png');
      notify('info', `${format.replace('image/', '').toUpperCase()} export isn't supported by this browser — switched to PNG.`);
    }
  }, [supportedFormats, format, setFormat, notify]);

  if (!activeImage) return null;

  const ext = getExtensionForFormat(format);
  const defaultName = stripExtension(activeImage.name);
  const output = predictOutputSize(activeImage, editState);
  const isLossy = FORMAT_OPTIONS.find((f) => f.value === format)?.lossy ?? false;
  const savings = estimatedSize !== null ? Math.round((1 - estimatedSize / activeImage.size) * 100) : null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { blob } = await processImage(activeImage.file, buildExportOptions(editState));
      const name = sanitizeFileName(customFilename.trim() || defaultName);
      downloadBlob(blob, `${name}.${ext}`);
      notify('success', `Saved ${name}.${ext} (${formatFileSize(blob.size)})`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Export failed.');
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Presets</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {EXPORT_PRESETS.filter((p) => supportedFormats.has(p.format)).map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setResize(preset.width, preset.height, false);
                setFormat(preset.format);
                setQuality(preset.quality);
                pushHistory(`Preset: ${preset.label}`);
              }}
              className="px-2 py-1.5 rounded-md text-[11px] font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              title={`${preset.width} × ${preset.height} · ${preset.format.replace('image/', '').toUpperCase()}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Format</h3>
        <div className="grid grid-cols-4 gap-1.5">
          {FORMAT_OPTIONS.map((opt) => {
            const supported = supportedFormats.has(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                disabled={!supported}
                title={supported ? opt.label : `${opt.label} encoding isn't available in this browser`}
                className={`px-2 py-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  format === opt.value
                    ? 'bg-violet-600 text-white'
                    : supported
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300'
                    : 'bg-zinc-900 text-zinc-700 cursor-not-allowed line-through'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality */}
      {isLossy && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="export-quality" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Quality
            </label>
            <span className="text-xs text-zinc-300 font-medium tabular-nums">{Math.round(quality * 100)}%</span>
          </div>
          <input
            id="export-quality"
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

      {/* Size summary */}
      <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Output size</span>
          <span className="text-zinc-300 tabular-nums">{output.width} × {output.height}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Original file</span>
          <span className="text-zinc-300 tabular-nums">{formatFileSize(activeImage.size)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Estimated file</span>
          <span className="text-zinc-300 tabular-nums">
            {isEstimating ? (
              <Loader2 className="w-3 h-3 animate-spin inline" aria-label="Estimating" />
            ) : estimatedSize !== null ? (
              formatFileSize(estimatedSize)
            ) : (
              '—'
            )}
          </span>
        </div>
        {savings !== null && !isEstimating && (
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Change</span>
            <span className={savings > 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {savings > 0 ? `${savings}% smaller` : `${Math.abs(savings)}% larger`}
            </span>
          </div>
        )}
      </div>

      {/* Filename */}
      <div>
        <label htmlFor="export-filename" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
          Filename
        </label>
        <div className="flex items-center gap-1">
          <input
            id="export-filename"
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            placeholder={defaultName}
            className="flex-1 min-w-0 px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 border border-zinc-700 focus:outline-none focus:border-violet-500"
          />
          <span className="text-xs text-zinc-500 shrink-0">.{ext}</span>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting…
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download
          </>
        )}
      </button>

      <p className="flex items-start gap-1.5 text-[10px] text-zinc-500">
        <Info className="w-3 h-3 mt-px shrink-0" />
        EXIF and GPS metadata are stripped on export.
      </p>

      {images.length > 1 && mode === 'batch' && <BatchExport />}
    </div>
  );
}
