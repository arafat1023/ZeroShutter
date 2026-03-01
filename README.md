# ZeroShutter

A powerful, privacy-first image editor that runs entirely in your browser. No uploads, no servers, no tracking — your images never leave your device.

Built with React 19, TypeScript, and the Canvas API.

## Features

**Core Editing**
- **Crop** — Interactive cropper with aspect ratio presets (1:1, 4:3, 16:9, social media sizes, and more)
- **Resize** — By pixels or percentage with aspect ratio lock
- **Rotate & Flip** — 90-degree increments, horizontal/vertical flip, custom rotation

**Adjustments**
- **Color Controls** — Brightness, contrast, saturation, hue, and sharpness sliders
- **Presets** — Grayscale, sepia, invert, warm, cool, high contrast, vintage
- **Watermark** — Text or image overlays with tiling, positioning, opacity, and rotation
- **Borders** — Solid color or blur borders with per-side controls

**Export**
- **Multiple Formats** — JPEG, PNG, WebP, AVIF
- **Quality Control** — Adjustable quality with file size estimation before export
- **Batch Processing** — Apply edits to multiple images and export as ZIP
- **Metadata Stripping** — EXIF data automatically removed on export for privacy

**Workflow**
- **Drag & Drop** — Drop files or entire folders
- **Clipboard Paste** — Paste images directly with Ctrl+V
- **Undo/Redo** — 20-step history with named snapshots
- **Before/After** — Compare slider to see changes side by side
- **EXIF Viewer** — View camera metadata with GPS privacy warnings

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Crop tool |
| `V` | Resize tool |
| `R` | Rotate tool |
| `E` | Export panel |
| `[` / `]` | Rotate -90 / +90 degrees |
| `H` | Flip horizontal |
| `F` | Flip vertical |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Export |
| `Esc` | Clear active tool |

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
