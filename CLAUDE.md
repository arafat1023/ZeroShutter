# ZeroShutter

Browser-based all-in-one image tool. Fully client-side — no server, no uploads, no AI. Pure Canvas API + Web Workers.

## Commands

```bash
pnpm dev          # start dev server
pnpm build        # typecheck + production build
pnpm preview      # preview production build
pnpm lint         # run ESLint
pnpm typecheck    # tsc --noEmit
```

## Stack

- Vite + React 19 + TypeScript (strict)
- Tailwind CSS v4 (via @tailwindcss/vite plugin — no config file, use CSS @theme)
- Zustand for state management
- react-advanced-cropper for interactive crop UI
- JSZip + file-saver for batch ZIP export
- lucide-react for icons

## Architecture

- All image processing runs in Web Workers via OffscreenCanvas (fallback to main-thread Canvas)
- State lives in Zustand stores under `src/stores/`
- Components organized by feature: `src/components/{upload,editor,batch,export,layout,shared}`
- Processing utilities in `src/lib/` — pure functions, no React
- Worker scripts in `src/workers/`
- Types co-located in `src/types/`

## Code Style

- Functional components only — no class components
- Named exports only — no default exports (except lazy-loaded routes)
- TypeScript strict — no `any`, no `as` casts unless unavoidable with comment
- Prefer `interface` over `type` for object shapes
- Components under 150 lines — extract hooks/utils when growing
- Destructured imports: `import { useState } from 'react'` — never `import React`

## Naming

- Components: PascalCase (`DropZone.tsx`, `CropTool.tsx`)
- Hooks/utils: camelCase (`useImageStore.ts`, `processImage.ts`)
- Constants: UPPER_SNAKE_CASE in `src/lib/constants.ts`

## IMPORTANT Rules

- NEVER add server-side code, API calls, or AI/ML models
- NEVER store full image data in Zustand — store Blob URLs or object references
- NEVER block main thread with image processing — always use workers
- ALWAYS revoke Blob URLs after use to prevent memory leaks
- ALWAYS use React refs instead of document.querySelector
- ALWAYS handle CORS with crossOrigin="anonymous" on external images
- Display file sizes in human-readable format (KB/MB)
