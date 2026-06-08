---
description: "Implement a single feature from the Pixel Palette Lab build order (Palette Editor, Shade Generation, Palette Generation, etc.) following all project conventions"
name: "Add Feature"
argument-hint: "Feature name or number (e.g., 'Palette Editor', '2', 'Shade Generation')"
agent: "agent"
---

Implement a single feature for Pixel Palette Lab based on the spec in [Pixel-Palette-Lab.md](../../Pixel-Palette-Lab.md) and conventions in [AGENTS.md](../../AGENTS.md).

## Feature reference

The build order (from AGENTS.md):
1. **Palette Editor** — Core CRUD for colors with HEX/RGB/HSL display
2. **Shade Generation** — Automatic shadow/highlight generation from a base color
3. **Palette Generation** — Random and style-based palette generators
4. **Import/Export** — JSON, PNG, GPL, CSS Variables, Tailwind Config
5. **Image Extraction** — Dominant color extraction from uploaded images
6. **Real-time Preview** — Sprite recoloring with demo sprites
7. **Palette Reduction** — Color merging and optimization
8. **Readability Verification** — Contrast and proximity analysis
9. **Project Management** — Save/load/history

## Process

### 1. Read the spec
Read [Pixel-Palette-Lab.md](../../Pixel-Palette-Lab.md) and find the section for the requested feature. Understand all sub-features and parameters.

### 2. Read existing code
Check which parts of the feature may already exist (stores, types, components, pages). Read relevant files to understand current state.

### 3. Plan the implementation
Identify which files need to be created or modified across these layers:
- **Types** (`src/types/`) — TypeScript interfaces and types
- **Store** (`src/stores/`) — Zustand store for state management
- **Lib** (`src/lib/`) — Utility functions (color manipulation, data processing)
- **Components** (`src/components/palette/`) — Feature-specific React components
- **Pages** (`src/pages/`) — Route/page component (if needed)
- **Hooks** (`src/hooks/`) — Custom React hooks (if needed for complex logic)

### 4. Implement layer by layer
Start from the bottom up: types → lib/store → hooks → components → page.

### 5. Wire up routing
If a new page is created, ensure react-router is set up with the route (install `react-router-dom` if not already installed).

### 6. Verify the build
Run `npm run build` and fix any TypeScript or build errors.

## Conventions to follow

- Refer to [AGENTS.md](../../AGENTS.md) for all code conventions.
- Colors should be stored as HSL internally — all conversion utilities go in `src/lib/colorUtils.ts`.
- Use Zustand stores for state — avoid prop drilling.
- Use named exports for all components.
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes.
- Prefix event handlers with `handle` (e.g., `handleColorChange`).
- Use PascalCase for component files, camelCase for utility files.
- All palette previews must use HTML Canvas API — no external image libraries.
- Demo sprites are pixel data arrays in TypeScript, not image files.
- App must work fully offline — no backend calls.

## Output

Report:
- Which feature was implemented.
- A list of all files created or modified.
- Whether the build succeeded.
- Any assumptions made or deviations from the spec.
