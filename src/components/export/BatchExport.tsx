import { useState } from 'react';
import { Loader2, Archive, Check, AlertCircle, CopyPlus } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useImageStore } from '@/stores/useImageStore';
import { processImage } from '@/lib/imageProcessor';
import {
  buildExportOptions, buildUniformBatchOptions, describeBatchEdits, sanitizeFileName,
} from '@/lib/exportOptions';
import { stripExtension, getExtensionForFormat } from '@/lib/format';

type BatchMode = 'per-image' | 'uniform';

interface BatchStatus {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export function BatchExport() {
  const images = useImageStore((s) => s.images);
  const selectedImageIds = useImageStore((s) => s.selectedImageIds);
  const activeImageId = useImageStore((s) => s.activeImageId);
  const editState = useImageStore((s) => s.editState);
  const { notify, editStateFor, copyEditsToImages } = useImageStore();

  const [batchMode, setBatchMode] = useState<BatchMode>('per-image');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statuses, setStatuses] = useState<BatchStatus[]>([]);

  const selected = images.filter((image) => selectedImageIds.includes(image.id));
  const activeImage = images.find((i) => i.id === activeImageId);

  const handleCopyEdits = () => {
    if (!activeImageId) return;
    const targets = selectedImageIds.filter((id) => id !== activeImageId);
    const applied = copyEditsToImages(activeImageId, targets);
    notify(
      applied > 0 ? 'success' : 'info',
      applied > 0
        ? `Copied edits to ${applied} image${applied === 1 ? '' : 's'}.`
        : 'Select at least one other image first.'
    );
  };

  const handleBatchExport = async () => {
    if (selected.length === 0) {
      notify('info', 'Tick at least one image to export.');
      return;
    }

    setIsExporting(true);
    setProgress(0);

    const next: BatchStatus[] = selected.map((img) => ({ id: img.id, name: img.name, status: 'pending' }));
    setStatuses(next);

    const zip = new JSZip();
    const usedNames = new Set<string>();
    let failures = 0;

    for (let i = 0; i < selected.length; i++) {
      const image = selected[i];
      next[i] = { ...next[i], status: 'processing' };
      setStatuses([...next]);

      // Per-image mode honours each image's own edits, including its own crop.
      const options =
        batchMode === 'per-image'
          ? buildExportOptions(editStateFor(image.id))
          : buildUniformBatchOptions(editState);
      const ext = getExtensionForFormat(options.format);

      try {
        const { blob } = await processImage(image.file, options);

        // Two source files can collapse onto one name once the extension
        // changes (photo.png + photo.jpg -> photo.webp), so de-duplicate.
        const base = sanitizeFileName(stripExtension(image.name));
        let fileName = `${base}.${ext}`;
        let suffix = 1;
        while (usedNames.has(fileName)) fileName = `${base}-${++suffix}.${ext}`;
        usedNames.add(fileName);

        zip.file(fileName, blob);
        next[i] = { ...next[i], status: 'done' };
      } catch {
        failures++;
        next[i] = { ...next[i], status: 'error' };
      }
      setStatuses([...next]);
      setProgress(Math.round(((i + 1) / selected.length) * 100));
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'zeroshutter-export.zip');
      const exported = selected.length - failures;
      notify(
        failures > 0 ? 'info' : 'success',
        failures > 0
          ? `Exported ${exported} of ${selected.length} images — ${failures} failed.`
          : `Exported ${exported} image${exported === 1 ? '' : 's'} as ZIP.`
      );
    } catch {
      notify('error', 'Could not build the ZIP archive.');
    }

    setIsExporting(false);
  };

  const modeButton = (mode: BatchMode, label: string) => (
    <button
      onClick={() => setBatchMode(mode)}
      aria-pressed={batchMode === mode}
      className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        batchMode === mode ? 'bg-violet-600 text-white' : 'text-zinc-300 hover:text-zinc-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="h-px bg-zinc-800" />

      <div>
        <p className="mb-1 text-[11px] uppercase tracking-wider text-zinc-400">
          Batch export — {selected.length} of {images.length} selected
        </p>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Tick images in the list to choose what gets exported.
        </p>
      </div>

      <div className="flex rounded-lg bg-zinc-800 p-0.5" role="group" aria-label="Batch mode">
        {modeButton('per-image', "Each image's edits")}
        {modeButton('uniform', 'This image for all')}
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-400">
        {batchMode === 'per-image' ? (
          <>Every image exports with its own edits, including its own crop.</>
        ) : (
          <>
            Applies <span className="text-zinc-200">{describeBatchEdits(editState).join(', ')}</span> from{' '}
            <span className="text-zinc-200">{activeImage?.name ?? 'this image'}</span> to all selected.
            Crop is skipped — its coordinates belong to one image.
            {editState.resize?.fit === 'stretch' && (
              <>
                {' '}A stretch resize is skipped too, since it would distort images of
                other shapes — switch it to Contain or Cover to apply one size to all.
              </>
            )}
          </>
        )}
      </p>

      {batchMode === 'per-image' && images.length > 1 && (
        <button
          onClick={handleCopyEdits}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-500/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <CopyPlus className="h-3.5 w-3.5" />
          Copy these edits to selected
        </button>
      )}

      <button
        onClick={handleBatchExport}
        disabled={isExporting || selected.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing {progress}%
          </>
        ) : (
          <>
            <Archive className="h-4 w-4" />
            Export {selected.length} as ZIP
          </>
        )}
      </button>

      {isExporting && (
        <>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-[11px]">
                {s.status === 'done' && <Check className="h-3 w-3 shrink-0 text-emerald-400" />}
                {s.status === 'processing' && <Loader2 className="h-3 w-3 shrink-0 animate-spin text-violet-400" />}
                {s.status === 'error' && <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />}
                {s.status === 'pending' && <div className="h-3 w-3 shrink-0 rounded-full border border-zinc-600" />}
                <span className={`truncate ${s.status === 'error' ? 'text-red-400' : 'text-zinc-300'}`}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
