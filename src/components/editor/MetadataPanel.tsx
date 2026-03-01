import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Camera, Loader2, Trash2, Download, Shield } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import { processImageViaWorker } from '@/lib/workerBridge';
import { stripExtension, getExtensionForFormat } from '@/lib/format';
import type { ExifData } from '@/types';

// Dynamic import to keep exifr lazy-loaded
async function readExif(file: File): Promise<ExifData | null> {
  try {
    const exifr = await import('exifr');
    const data = await exifr.default.parse(file, true);
    return data ?? null;
  } catch {
    return null;
  }
}

interface MetadataEntry {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export function MetadataPanel() {
  const activeImage = useImageStore((s) => {
    const { images, activeImageId } = s;
    return images.find((i) => i.id === activeImageId);
  });
  const { editState } = useImageStore();

  const [exif, setExif] = useState<ExifData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGps, setHasGps] = useState(false);
  const [stripping, setStripping] = useState(false);
  const [stripMode, setStripMode] = useState<'all' | 'gps-only' | 'preserve-color'>('all');

  useEffect(() => {
    if (!activeImage) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setExif(null);
    readExif(activeImage.file).then((data) => {
      setExif(data);
      setHasGps(
        !!(data?.latitude || data?.longitude || data?.GPSLatitude || data?.GPSLongitude)
      );
      setLoading(false);
    });
  }, [activeImage]);

  if (!activeImage) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Reading metadata...
      </div>
    );
  }

  if (!exif) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-zinc-500">No metadata found in this image.</p>
        <p className="text-[10px] text-zinc-600 mt-1">
          PNG and WebP files often don't contain EXIF data.
        </p>
      </div>
    );
  }

  const entries: MetadataEntry[] = [];

  if (exif.Make || exif.Model) {
    entries.push({
      label: 'Camera',
      value: [exif.Make, exif.Model].filter(Boolean).join(' '),
      icon: <Camera className="w-3 h-3" />,
    });
  }
  if (exif.LensModel) {
    entries.push({ label: 'Lens', value: String(exif.LensModel) });
  }
  if (exif.FocalLength) {
    entries.push({ label: 'Focal Length', value: `${exif.FocalLength}mm` });
  }
  if (exif.FNumber) {
    entries.push({ label: 'Aperture', value: `f/${exif.FNumber}` });
  }
  if (exif.ExposureTime) {
    const et = exif.ExposureTime;
    entries.push({
      label: 'Shutter',
      value: et < 1 ? `1/${Math.round(1 / et)}s` : `${et}s`,
    });
  }
  if (exif.ISO) {
    entries.push({ label: 'ISO', value: String(exif.ISO) });
  }
  if (exif.DateTimeOriginal) {
    entries.push({
      label: 'Date',
      value: typeof exif.DateTimeOriginal === 'string'
        ? exif.DateTimeOriginal
        : new Date(exif.DateTimeOriginal as string).toLocaleDateString(),
    });
  }
  if (exif.Software) {
    entries.push({ label: 'Software', value: String(exif.Software) });
  }
  if (exif.ImageWidth && exif.ImageHeight) {
    entries.push({ label: 'Dimensions', value: `${exif.ImageWidth} × ${exif.ImageHeight}` });
  }

  return (
    <div className="space-y-4">
      {/* GPS Warning */}
      {hasGps && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-amber-300 font-medium">GPS Data Detected</p>
            <p className="text-[10px] text-amber-400/70 mt-0.5">
              This image contains location data. Exporting will strip all metadata by default (Canvas re-encoding).
            </p>
            {(exif.latitude && exif.longitude) && (
              <p className="text-[10px] text-amber-400/50 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {exif.latitude.toFixed(4)}, {exif.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Metadata Table */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Image Metadata
        </h3>
        <div className="space-y-1">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-zinc-800/50">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                {entry.icon}
                {entry.label}
              </span>
              <span className="text-xs text-zinc-300 font-medium text-right max-w-[140px] truncate">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-zinc-500 text-center">No standard EXIF fields found.</p>
      )}

      {/* Strip Options */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Metadata Stripping
        </h3>
        <div className="space-y-1.5">
          {([
            { value: 'all' as const, label: 'Strip everything', desc: 'Removes all EXIF, GPS, and embedded data' },
            { value: 'gps-only' as const, label: 'Strip GPS only', desc: 'Removes location data, keeps camera info' },
            { value: 'preserve-color' as const, label: 'Preserve color profile', desc: 'Strips all except ICC color profile' },
          ]).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                stripMode === opt.value ? 'bg-violet-500/10 border border-violet-500/20' : 'hover:bg-zinc-800/50'
              }`}
            >
              <input
                type="radio"
                name="stripMode"
                value={opt.value}
                checked={stripMode === opt.value}
                onChange={() => setStripMode(opt.value)}
                className="mt-0.5 accent-violet-500"
              />
              <div>
                <span className="text-xs text-zinc-300">{opt.label}</span>
                <p className="text-[10px] text-zinc-500">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-[9px] text-zinc-600 mt-2">
          Canvas re-encoding strips all metadata by default. Selective preservation requires future implementation.
        </p>
      </div>

      {/* Strip & Download button */}
      <button
        onClick={async () => {
          if (!activeImage) return;
          setStripping(true);
          try {
            const { format, quality } = editState.exportSettings;
            const { blob } = await processImageViaWorker(activeImage.originalUrl, { format, quality });
            const ext = getExtensionForFormat(format);
            const fileName = `${stripExtension(activeImage.name)}_clean.${ext}`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error('Metadata strip export failed:', err);
          }
          setStripping(false);
        }}
        disabled={stripping}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {stripping ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Stripping...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Clean Copy
          </>
        )}
      </button>

      {/* Info */}
      <div className="p-3 bg-zinc-800/50 rounded-lg">
        <div className="flex items-start gap-2">
          <Trash2 className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-zinc-500">
            All metadata is automatically stripped when you export. Canvas re-encoding removes EXIF, GPS, and all embedded data for privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
