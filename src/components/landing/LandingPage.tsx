import {
  Crop, Palette, Stamp, Layers, FileOutput, FileSearch,
  ShieldCheck, EyeOff, DatabaseZap,
} from 'lucide-react';
import { DropZone } from '@/components/upload/DropZone';

const FEATURES = [
  { icon: Crop, title: 'Crop & Resize', description: 'Freeform or aspect-ratio crop with precise pixel resizing.' },
  { icon: Palette, title: 'Colour Adjustments', description: 'Brightness, contrast, saturation, and more — all in real time.' },
  { icon: Stamp, title: 'Watermark', description: 'Text or your own logo, with position, tiling, rotation and opacity.' },
  { icon: Layers, title: 'Batch Processing', description: 'Apply edits to dozens of images at once and export as a ZIP.' },
  { icon: FileOutput, title: 'Format Conversion', description: 'Convert between JPEG, PNG, WebP, and AVIF where supported.' },
  { icon: FileSearch, title: 'EXIF Metadata', description: 'Inspect camera data — and strip it automatically on export.' },
] as const;

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'No Uploads', description: 'Your images never leave your device. All processing happens locally in the browser.' },
  { icon: EyeOff, title: 'No Tracking', description: 'No cookies, no personal data collected. Your images and edits stay entirely yours.' },
  { icon: DatabaseZap, title: 'Stays On Your Device', description: 'Work is kept in this browser so a refresh does not lose it — and Clear wipes it.' },
] as const;

export function LandingPage() {
  return (
    <main className="flex-1 overflow-y-auto">
      {/* Hero — the drop zone sits here so nobody has to scroll to start. */}
      <section className="px-6 pt-14 pb-10 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Edit images without uploading them
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400 sm:text-lg">
            Crop, resize, convert, watermark, and batch-edit — entirely in your browser.
            No servers, no sign-up, nothing leaves your device.
          </p>
        </div>
        <div className="mt-10">
          <DropZone />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="mb-10 text-center text-2xl font-bold text-zinc-100 sm:text-3xl">
          Everything you need, right in the browser
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15">
                <Icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-10 text-center text-2xl font-bold text-zinc-100 sm:text-3xl">
          Your privacy, guaranteed
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                <Icon className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800/50 py-8 text-center text-sm text-zinc-400">
        ZeroShutter — 100% client-side image editing. No data ever leaves your browser.
      </footer>
    </main>
  );
}
