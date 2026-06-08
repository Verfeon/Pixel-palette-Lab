---
description: "Run the build, diagnose any errors (TypeScript, CSS, missing deps, config), and fix them iteratively until the build passes"
name: "Fix Build Errors"
agent: "agent"
---

Run the build and fix whatever errors appear. Repeat until the build passes cleanly.

## Process

### 1. Run the build
```bash
npm run build
```

### 2. Read the error output
Examine every error message carefully. Group errors by category:
- **TypeScript errors** (`TS2307`, `TS5101`, etc.) — missing types, wrong imports, deprecated options
- **CSS errors** (`CssSyntaxError`, missing `{`, etc.) — malformed CSS, Tailwind v4 issues
- **Missing dependency errors** — modules not found in `node_modules`
- **Config errors** — `tsconfig.json`, `vite.config.ts`, path aliases

### 3. Fix one category at a time
For each error category:
- Read the affected file(s)
- Fix the root cause (not just the symptom)
- Re-run `npm run build`
- Repeat until that category is clean

### 4. Common fixes reference

| Error Pattern | Likely Fix |
|---|---|
| `TS2307: Cannot find module 'X'` | Install missing package: `npm install X` or `npm install -D X` |
| `TS5101: Option 'baseUrl' is deprecated` | Add `"ignoreDeprecations": "6.0"` to `compilerOptions` in `tsconfig*.json` |
| `CssSyntaxError: Missing opening {` | Check for orphan CSS properties outside any selector block, or unclosed `{` |
| `Cannot find module '@/...'` | Verify path aliases in `tsconfig*.json` (`@/*` → `./src/*`) and `vite.config.ts` |
| `Module '"X"' has no exported member 'Y'` | Check the actual exports of the dependency; may need a different import path |
| Tailwind v4 build failures | Ensure `@import "tailwindcss"` is in the CSS file, and `@tailwindcss/vite` plugin is in `vite.config.ts` |

### 5. Verify clean build
Once all errors are resolved, confirm `npm run build` exits with code 0.

## Conventions

- Do not silence errors with `// @ts-ignore` or `// @ts-expect-error` unless absolutely unavoidable and documented with a reason.
- Fix the root cause, not the symptom.
- If a dependency is missing, install it — do not remove the import.
- If the fix is unclear after two attempts, ask the user for guidance instead of making risky changes.

## Output

Report:
- What errors were found (grouped by category).
- What fixes were applied and to which files.
- Whether the build now passes.
