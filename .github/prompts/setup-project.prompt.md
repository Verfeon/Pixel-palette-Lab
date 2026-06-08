---
description: "Scaffold the full Pixel Palette Lab project from scratch: Vite + React + TS + Tailwind + shadcn/ui + Zustand with folder structure"
name: "Setup Project"
argument-hint: "Project name (default: pixel-palette-lab)"
agent: "agent"
---

Scaffold the Pixel Palette Lab project from scratch in the current directory.

## Steps

### 1. Create the Vite project
Run `npm create vite@latest . -- --template react-ts` and let it complete.

### 2. Install dependencies
```bash
npm install
npm install zustand tailwindcss @tailwindcss/vite
```

### 3. Initialize shadcn/ui
Run `npx shadcn@latest init -d` to init with defaults.

Then add these components:
```bash
npx shadcn@latest add button card dialog dropdown-menu input label scroll-area select separator slider tabs tooltip -y
```

### 4. Set up Tailwind CSS with Vite
In `vite.config.ts`, add the `@tailwindcss/vite` plugin to the `vitePlugins` array.

### 5. Create the folder structure
```
src/
├── components/
│   ├── ui/             (already created by shadcn)
│   └── palette/        (create empty)
├── hooks/               (create empty)
├── stores/              (create empty)
├── lib/                 (create empty, add colorUtils.ts with a placeholder export)
├── types/               (create empty)
├── assets/              (create empty)
└── pages/               (create empty)
```

### 6. Configure CSS entry point
Ensure `src/index.css` (or `src/globals.css`) has the Tailwind directives:
```css
@import "tailwindcss";
```

### 7. Verify the build
Run `npm run build` and confirm it completes without errors.

## Project conventions to follow

- Refer to [AGENTS.md](../../AGENTS.md) for all code conventions, architecture rules, and data structures.
- Use TypeScript strict mode — avoid `any`, prefer `unknown` + narrowing.
- Use named exports for all components.
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes.
- The `src/lib/colorUtils.ts` placeholder export should return a string for now — it will be expanded later.

## Output

Report:
- Whether the build succeeded or failed.
- A list of all files and directories created.
- The version of each major dependency installed (React, Vite, TypeScript, Tailwind).
