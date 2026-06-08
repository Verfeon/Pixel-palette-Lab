# Pixel Palette Lab 🎨

A web application for pixel artists and game developers to create, analyze, modify, and export color palettes optimized for pixel art.

Built with **React + TypeScript + Vite**, styled with **Tailwind CSS** and **shadcn/ui**.

[Specification](./Pixel-Palette-Lab.md) · [Project Guidelines](./AGENTS.md)

---

## Features

- **Palette Editor** — Add, remove, modify, and reorder colors with HEX, RGB, and HSL display
- **Shade Generation** — Generate shadows, midtones, and highlights from a base color with temperature control
- **Palette Generation** — Random palette generation and 11 style-based generators (Fantasy, Cyberpunk, Game Boy, PICO-8, and more)
- **Image Extraction** — Extract dominant colors from uploaded images
- **Palette Reduction** — Merge similar colors and reduce to a target color count
- **Real-time Preview** — Apply palettes to demo sprites (RPG character, tree, house, chest, monster)
- **Readability Verification** — Contrast analysis, duplicate detection, and color proximity warnings
- **Import / Export** — JSON, PNG, GPL (GIMP), CSS Variables, Tailwind Config, ASE
- **Project Management** — Local save/load, duplication, and modification history

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Icons | [Lucide React](https://lucide.dev/) |
| Graphics | HTML Canvas API |
| Persistence | LocalStorage / IndexedDB |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Verfeon/Pixel-palette-Lab.git
cd Pixel-palette-Lab

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check with `tsc` then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the codebase |

## Project Structure

```
src/
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components (button, card, dialog, etc.)
│   └── palette/          # Palette-specific components
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state stores
├── lib/                   # Utility functions
│   ├── utils.ts          # cn() helper for conditional Tailwind classes
│   └── colorUtils.ts     # Color conversion and manipulation utilities
├── types/                 # TypeScript type definitions
├── assets/                # Static assets (sprites, icons)
└── pages/                 # Route/page components
```

## Development

### Key Conventions

- **TypeScript strict mode** — avoid `any`, prefer `unknown` + narrowing
- **Named exports** for all components
- **PascalCase** for component files (`PaletteEditor.tsx`), **camelCase** for utilities (`colorUtils.ts`)
- **Event handlers** prefixed with `handle` — `handleColorChange`, `handleDelete`
- **Tailwind utility classes** + `cn()` helper — avoid raw CSS
- **Colors stored as HSL** internally for easier manipulation

### Palette Data Structure

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

### Shade Generation Algorithm

1. Start with a base color in HSL
2. Generate shadows by lowering lightness and shifting hue toward cool (blue) or warm (red) based on temperature setting
3. Generate highlights by raising lightness and shifting hue toward warm or cool
4. Apply intensity as a multiplier on lightness deltas

## Feature Roadmap

Features are implemented in dependency order:

- [x] Project scaffolding (Vite + React + TS + Tailwind + shadcn)
- [ ] Palette Editor — Core CRUD for colors
- [ ] Shade Generation — Automatic shadow/highlight generation
- [ ] Palette Generation — Random and style-based generators
- [ ] Import/Export — JSON, PNG, GPL, CSS Variables, Tailwind Config
- [ ] Image Extraction — Dominant colors from uploaded images
- [ ] Real-time Preview — Sprite recoloring with demo sprites
- [ ] Palette Reduction — Color merging and optimization
- [ ] Readability Verification — Contrast and proximity analysis
- [ ] Project Management — Save/load/history

## Key Constraints

- All palette previews and sprite recoloring use **HTML Canvas API** — no external image processing libraries
- Demo sprites are defined as **pixel data arrays in TypeScript** — not image files
- The app works **fully offline** — no backend required
- Export formats match the **exact spec** of target tools (GIMP GPL format, Tailwind config shape, etc.)

## License

MIT
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
