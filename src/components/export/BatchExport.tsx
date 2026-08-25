import { useState } from 'react';
import { Loader2, Archive, Check, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useImageStore } from '@/stores/useImageStore';
import { processImage } from '@/lib/imageProcessor';
import { buildBatchOptions, describeBatchEdits, sanitizeFileName } from '@/lib/exportOptions';
import { stripExtension, getExtensionForFormat } from '@/lib/format';

interface BatchStatus {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export function BatchExport() {
  const images = useImageStore((s) => s.images);
  const editState = useImageStore((s) => s.editState);
  const notify = useImageStore((s) => s.notify);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statuses, setStatuses] = useState<BatchStatus[]>([]);

  const ext = getExtensionForFormat(editState.exportSettings.format);
  const appliedEdits = describeBatchEdits(editState);

  const handleBatchExport = async () => {
    setIsExporting(true);
    setProgress(0);

    const next: BatchStatus[] = images.map((img) => ({ id: img.id, name: img.name, status: 'pending' }));
    setStatuses(next);

    const zip = new JSZip();
    const options = buildBatchOptions(editState);
    const usedNames = new Set<string>();
    let failures = 0;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      next[i] = { ...next[i], status: 'processing' };
      setStatuses([...next]);

      try {
        const { blob } = await processImage(img.file, options);

        // Two source files can collapse onto one name once the extension
        // changes (photo.png + photo.jpg -> photo.webp), so de-duplicate.
        let fileName = `${sanitizeFileName(stripExtension(img.name))}.${ext}`;
        let suffix = 1;
        while (usedNames.has(fileName)) {
          fileName = `${sanitizeFileName(stripExtension(img.name))}-${++suffix}.${ext}`;
        }
        usedNames.add(fileName);

        zip.file(fileName, blob);
        next[i] = { ...next[i], status: 'done' };
      } catch {
        failures++;
        next[i] = { ...next[i], status: 'error' };
      }
      setStatuses([...next]);
      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'zeroshutter-export.zip');
      const exported = images.length - failures;
      notify(
        failures > 0 ? 'info' : 'success',
        failures > 0
          ? `Exported ${exported} of ${images.length} images — ${failures} failed.`
          : `Exported ${exported} images as ZIP.`
      );
    } catch {
      notify('error', 'Could not build the ZIP archive.');
    }

    setIsExporting(false);
  };

  return (
    <div className="space-y-3">
      <div className="h-px bg-zinc-800" />
      <div>
        <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-1">
          Batch Export ({images.length} images)
        </p>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Applies <span className="text-zinc-300">{appliedEdits.join(', ')}</span> to every image.
        </p>
        {editState.crop && (
          <p className="text-[11px] text-amber-400/80 mt-1">
            Crop is skipped in batch — its coordinates only apply to the current image.
          </p>
        )}
      </div>

      <button
        onClick={handleBatchExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing {progress}%
          </>
        ) : (
          <>
            <Archive className="w-4 h-4" />
            Download All as ZIP
          </>
        )}
      </button>

      {isExporting && (
        <>
          <div
            className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {statuses.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-[11px]">
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
  );
}
