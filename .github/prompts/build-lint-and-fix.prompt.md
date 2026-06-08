---
description: "Run build + lint, diagnose all errors (TypeScript, CSS, ESLint, missing deps, config), fix them iteratively, and verify both pass"
name: "Build, Lint & Fix"
agent: "agent"
---

Run the build and linter, diagnose all failures, fix them, and repeat until everything passes cleanly.

## Process

### 1. Run both checks
```bash
npm run build
npm run lint
```

### 2. Read all error output
Examine every error from both commands. Group by category:

| Category | Tool | Examples |
|---|---|---|
| **TypeScript** | `tsc` in build | `TS2307`, `TS5101`, type mismatches |
| **CSS** | `vite` in build | `CssSyntaxError`, `Missing opening {` |
| **Config** | build | `tsconfig.json`, `vite.config.ts`, path aliases |
| **Dependencies** | build or lint | missing modules in `node_modules` |
| **ESLint** | `npm run lint` | unused variables, missing hooks deps, import order |

### 3. Fix one category at a time

#### TypeScript / CSS / Config / Deps
Follow the same approach as `fix-build-errors` — read the affected file, fix the root cause, rebuild.

#### ESLint errors
1. First try auto-fix: `npx eslint . --fix`
2. Re-lint and check remaining errors
3. For remaining errors, read the affected files and fix each one:
   - **Unused variables/imports** — remove them
   - **React hooks dependency arrays** — add missing deps
   - **Prefer `const` over `let`** — change to `const`
   - **Naming conventions** — rename to match the rule
4. Run `npm run lint` again to verify

### 4. Common ESLint fixes

| Error Pattern | Likely Fix |
|---|---|
| `'X' is defined but never used` | Remove the unused variable or import |
| `React Hook useX has a missing dependency` | Add the missing variable to the dependency array |
| `'X' is assigned a value but never used` | Remove the assignment or use the variable |
| `Unexpected any. Specify a different type` | Replace `any` with `unknown` + narrowing or a proper type |
| `Missing 'X' in eslint config` | Install the plugin or extend the config |

### 5. Final verification
```bash
npm run build    # must exit 0
npm run lint     # must exit 0
```

## Conventions

- Do not silence errors with `// @ts-ignore`, `// @ts-expect-error`, or `// eslint-disable-next-line` unless unavoidable and documented with a reason.
- Fix the root cause — do not remove valid code to make a linter happy (e.g., keep a legit import, refactor around it).
- If a dependency is missing, install it — do not remove the import.
- If the fix is unclear after two attempts, ask the user for guidance.

## Output

Report:
- What errors were found (grouped by category).
- What fixes were applied and to which files.
- Whether both build and lint now pass.
