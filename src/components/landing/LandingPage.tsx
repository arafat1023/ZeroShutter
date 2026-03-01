import { useRef } from 'react';
import {
  Crop,
  Palette,
  Stamp,
  Layers,
  FileOutput,
  FileSearch,
  ShieldCheck,
  EyeOff,
  DatabaseZap,
} from 'lucide-react';
import { DropZone } from '@/components/upload/DropZone';

const FEATURES = [
  { icon: Crop, title: 'Crop & Resize', description: 'Freeform or aspect-ratio crop with precise pixel resizing.' },
  { icon: Palette, title: 'Color Adjustments', description: 'Brightness, contrast, saturation, and more — all in real time.' },
  { icon: Stamp, title: 'Watermark', description: 'Add text or image watermarks with full position and opacity control.' },
  { icon: Layers, title: 'Batch Processing', description: 'Apply edits to dozens of images at once and export as a ZIP.' },
  { icon: FileOutput, title: 'Format Conversion', description: 'Convert between JPEG, PNG, WebP, AVIF, and other formats instantly.' },
  { icon: FileSearch, title: 'EXIF Metadata', description: 'View, preserve, or strip metadata from your photos.' },
] as const;

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'No Uploads', description: 'Your images never leave your device. All processing happens locally in the browser.' },
  { icon: EyeOff, title: 'No Tracking', description: 'Zero analytics, zero cookies, zero third-party scripts. Your data stays yours.' },
  { icon: DatabaseZap, title: 'No Storage', description: 'Nothing is saved to any server. Close the tab and your data is gone.' },
] as const;

export function LandingPage() {
  const uploadRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="flex-1 overflow-y-auto">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32">
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          ZeroShutter
        </h1>
        <p className="mt-4 max-w-xl text-lg sm:text-xl text-zinc-400">
          Crop, resize, convert, watermark, and batch-edit images — entirely in your browser.
          No uploads. No servers. No sign-up required.
        </p>
        <button
          onClick={scrollToUpload}
          className="mt-8 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Start Editing
        </button>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-12">
          Everything you need, right in the browser
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-12">
          Your privacy, guaranteed
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <Icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upload */}
      <section ref={uploadRef} id="upload" className="px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-100 mb-8">
          Ready? Drop your images below.
        </h2>
        <DropZone />
      </section>

      {/* Footer */}
      <footer className="text-center text-zinc-600 text-sm py-8 border-t border-zinc-800/50">
        ZeroShutter — 100% client-side image editing. No data ever leaves your browser.
      </footer>
    </main>
  );
}
