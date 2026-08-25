# ZeroShutter

A powerful, privacy-first image editor that runs entirely in your browser. No uploads, no servers, no tracking — your images never leave your device. Your working session is kept in the browser's own storage so a refresh doesn't lose it, and clearing your images wipes it.

Built with React 19, TypeScript, and the Canvas API.

## Features

**Core Editing**
- **Crop** — Interactive cropper with aspect ratio presets (1:1, 4:3, 16:9, social media sizes, and more)
- **Resize** — By pixels or percentage with aspect ratio lock
- **Rotate & Flip** — 90-degree increments, horizontal/vertical flip, custom rotation

**Adjustments**
- **Color Controls** — Brightness, contrast, saturation, hue, and sharpness sliders
- **Presets** — Grayscale, sepia, warm, cool, high contrast, vintage, plus an invert toggle
- **Watermark** — Text or image/logo overlays with tiling, positioning, opacity, and rotation
- **Borders** — Solid color or blur borders with per-side controls

**Export**
- **Multiple Formats** — JPEG, PNG, WebP, and AVIF where the browser can encode it (unsupported formats are disabled rather than silently falling back)
- **Quality Control** — Adjustable quality, with the size estimate produced by the real export pipeline
- **Fit to a Size** — Give it a target ("under 500 KB") and it searches for the best quality that fits, only reducing dimensions if quality alone can't get there
- **Batch Processing** — Tick which images to export, then either export each with its own edits or push the current image's look onto the rest; ZIP output
- **Metadata Stripping** — EXIF data automatically removed on export for privacy

**Workflow**
- **Drag & Drop** — Drop files or entire folders
- **Clipboard Paste** — Paste images directly with Ctrl+V
- **Undo/Redo** — 20-step named history, kept separately per image, with click-to-jump
- **Session Restore** — Images and edits survive a refresh via IndexedDB, all on-device
- **Before/After** — Compare slider showing the same framing with and without colour edits
- **EXIF Viewer** — View camera metadata with GPS privacy warnings

## Keyboard Shortcuts

Press `?` anywhere in the app for this list.

| Key | Action |
|-----|--------|
| `C` | Crop |
| Arrows | Move the crop region (Shift for 10px) |
| Alt+Arrows | Resize the crop region (Shift for 10px) |
| `V` | Resize |
| `R` | Rotate & flip |
| `A` | Colour adjustments |
| `W` | Watermark |
| `B` | Border & padding |
| `I` | Image info (EXIF) |
| `Y` | Edit history |
| `E` | Export |
| `[` / `]` | Rotate -90° / +90° |
| `H` / `F` | Flip horizontal / vertical |
| `X` | Toggle before/after compare |
| `+` / `-` | Zoom in / out |
| `0` / `1` | Fit to screen / actual size |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+O` | Open images |
| `Ctrl+V` | Paste image from clipboard |
| `Ctrl+S` | Export |
| `?` | Show the shortcut sheet |
| `Esc` | Close panel / overlay |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

### Installation

```bash
git clone https://github.com/your-username/zeroshutter.git
cd zeroshutter
pnpm install
```

### Development

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Type-check + production build
pnpm preview      # Preview production build
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Vite](https://vite.dev/) | Build tool & dev server |
| [React 19](https://react.dev/) | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety (strict mode) |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Zustand](https://zustand.docs.pmnd.rs/) | State management |
| [react-advanced-cropper](https://advanced-cropper.github.io/react-advanced-cropper/) | Interactive crop UI |
| [JSZip](https://stuk.github.io/jszip/) | Batch ZIP export |
| [exifr](https://github.com/MikeKovarik/exifr) | EXIF metadata parsing |

## Project Structure

```
src/
├── components/
│   ├── batch/        # Multi-image management
│   ├── editor/       # Editing tools & canvas
│   ├── export/       # Export settings & download
│   ├── layout/       # App header & navigation
│   ├── shared/       # Reusable UI (compare slider)
│   └── upload/       # File upload (drop zone)
├── lib/              # Pure utility functions
│   ├── constants.ts  # Format options, presets, limits
│   ├── format.ts     # File size formatting, ID generation
│   └── imageProcessor.ts  # Canvas-based image processing
├── stores/           # Zustand state management
├── types/            # TypeScript interfaces
└── workers/          # Web Worker scripts
```

## Privacy

ZeroShutter is designed with privacy as a core principle:

- **100% client-side** — All processing happens in your browser
- **No uploads** — Images are never sent to any server
- **No tracking** — No analytics, cookies, or telemetry
- **Metadata stripping** — EXIF data (including GPS location) is removed on export
- **No persistence** — Nothing is stored after you close the tab

## License

MIT
