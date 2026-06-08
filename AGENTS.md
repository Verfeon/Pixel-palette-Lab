# Pixel Palette Lab — Project Guidelines

## Overview

Pixel Palette Lab is a web app for pixel artists and game developers to create, analyze, modify, and export color palettes optimized for pixel art. Built with React + TypeScript + Vite, styled with Tailwind CSS and shadcn/ui.

See [Pixel-Palette-Lab.md](./Pixel-Palette-Lab.md) for the full feature specification.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18+ with TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui components |
| State | Zustand |
| Graphics | HTML Canvas API |
| Persistence | LocalStorage / IndexedDB |

## Getting Started

```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Architecture

### Project structure convention

```
src/
├── components/          # Reusable UI components (shadcn + custom)
│   ├── ui/             # shadcn/ui components
│   └── palette/        # Palette-specific components
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
├── assets/              # Static assets (sprites, icons)
└── pages/               # Route/page components
```

### Route structure (react-router)

- `/` — Dashboard (palette list, recent palettes)
- `/editor/:id` — Palette editor (active palette, generation tools, color info)
- `/analyze` — Image color extraction
- `/preview` — Sprite preview gallery
- `/settings` — Export formats & user preferences

### State management

- Use Zustand stores organized by domain (palette store, UI store, project store)
- Avoid prop drilling; components read from stores directly
- Persist project data to LocalStorage via Zustand middleware

## Code Conventions

### General

- **Language**: TypeScript strict mode. Avoid `any` — prefer `unknown` + narrowing.
- **Components**: Functional components with hooks. Use named exports for components.
- **File naming**: PascalCase for components (`PaletteEditor.tsx`), camelCase for utilities (`colorUtils.ts`).
- **CSS**: Prefer Tailwind utility classes. Use shadcn's `cn()` helper for conditional classes. Avoid raw CSS files unless necessary.
- **Event handlers**: Prefix with `handle` — `handleColorChange`, `handleDelete`.

### Color handling

- Internally store colors as HSL for easier manipulation (shade generation, blending).
- Export/display in HEX, RGB, and HSL.
- All color manipulation utilities go in `src/lib/colorUtils.ts`.

### Shade generation algorithm

1. Start with a base color in HSL.
2. Generate shadows by lowering lightness and shifting hue toward cool (blue) or warm (red) based on temperature setting.
3. Generate highlights by raising lightness and shifting hue toward warm or cool.
4. Apply intensity as a multiplier on lightness deltas.

### Palette data structure

```typescript
interface Palette {
  id: string;
  name: string;
  colors: ColorEntry[];
  createdAt: number;
  updatedAt: number;
}

interface ColorEntry {
  id: string;
  hex: string;
  order: number;
}
```

## Feature Implementation Order

Start building features in this sequence, as each builds on the prior:

1. **Project scaffolding** — Vite + React + TS + Tailwind + shadcn
2. **Palette Editor** — Core CRUD for colors with HEX/RGB/HSL display
3. **Shade Generation** — Automatic shadow/highlight generation from a base color
4. **Palette Generation** — Random and style-based palette generators
5. **Import/Export** — JSON, PNG, GPL, CSS Variables, Tailwind Config
6. **Image Extraction** — Dominant color extraction from uploaded images
7. **Real-time Preview** — Sprite recoloring with demo sprites
8. **Palette Reduction** — Color merging and optimization
9. **Readability Verification** — Contrast and proximity analysis
10. **Project Management** — Save/load/history

## Key Constraints

- All palette previews and sprite recoloring must use HTML Canvas API (no external image processing libraries).
- Demo sprites are defined as pixel data arrays in TypeScript — not image files.
- The app must work fully offline (no backend required).
- Export formats must match the exact spec of target tools (GIMP GPL format, Tailwind config shape, etc.).
