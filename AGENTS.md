# MarkText

## Project Overview

MarkText is a WYSIWYG markdown editor built on Electron + Vue 3. It supports CommonMark, GitHub Flavored Markdown, math (KaTeX), Mermaid diagrams, PlantUML, and multiple editing modes (focus, typewriter, source-code).

- **Version**: see `package.json`
- **License**: MIT
- **Repository**: https://github.com/marktext/marktext

## Module boundaries

Use `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` for the current
toolchain and package versions. The root owns shared tooling and CI scripts.

- `packages/desktop/` owns the Electron app, Vue renderer, Pinia state, and
  desktop tests. Root scripts delegate to this package.
- `packages/muyajs/` is the JavaScript editor engine consumed by the desktop
  app through the `muya` alias and `@marktext/muyajs` workspace dependency.
  It avoids Electron APIs; PlantUML encoding uses Node's `zlib`.
- `packages/muya/` is the separate TypeScript rewrite. Preserve the current
  caller boundary until an approved migration connects it to the desktop app.
  Use its package scripts for lint and specification tests, and the
  `packages/muya/e2e/` package scripts for browser checks.
- `packages/website/` has a separate toolchain. Desktop checks do not prove
  website behavior.
- `packages/desktop/src/shared/types/ipc.ts` owns the typed IPC contract.
  The renderer stays sandboxed and uses the typed preload bridge for Node/IPC.

For architecture and public interfaces, use the relevant documents under
`packages/website/content/docs/dev/`. For a package change, inspect that
package's configuration and callers.

## Development Workflow

All commands run from the repo root. The root `package.json` proxies every
desktop-specific script to `packages/desktop` via `pnpm --filter marktext`,
so the names and behavior are unchanged from the pre-monorepo layout.

```bash
# Install dependencies (runs scripts/postinstall.ts automatically — patches
# native-keymap, downloads Electron, rebuilds native modules, minifies locales)
pnpm install

# Run in development mode
# Renderer hot-reloads automatically. Pressing Ctrl+R in the dev window reloads
# the renderer (which re-runs the preload script); changes to the main process
# require restarting `pnpm run dev`.
pnpm run dev

# Preview the last electron-vite build (no rebuild). PERF_TESTING=true is set automatically.
pnpm run start

# Build without packaging — fast path for verifying the renderer/main compile
pnpm run build:unpack

# Repository-wide formatting command. Use targeted formatting during scoped work.
pnpm run format

# Minify locale files (required for production builds, skip during dev)
pnpm run minify-locales

# Performance debugging — exposes a Node inspector on :5858 against the previewed build
pnpm run perf:inspect       # attach when ready
pnpm run perf:inspect-brk   # break on first line

# Website (not yet wired into CI)
pnpm --filter marktext-website dev      # Vite dev server
pnpm --filter marktext-website build    # static build → packages/website/build/
```

If you need to invoke a script directly inside a package, use
`pnpm --filter <name> <script>` or `pnpm -C packages/<name> <script>`.

## Build Commands

```bash
pnpm run build:win    # Windows x64 — NSIS installer + zip
pnpm run build:mac    # macOS x64 + arm64 — DMG + zip
pnpm run build:linux  # Linux — AppImage, snap, deb, rpm, tar.gz
```

All platform build scripts automatically run `minify-locales` and `electron-rebuild` before packaging.

## Testing

Choose the desktop, engine, or website checks that exercise the changed code.
Complete requested app execution and inspection, fix failures caused by the
change, and rerun affected checks without asking at each step. Keep CI gates
for PRs. Prose-only edits need document checks; do not package every platform.

```bash
pnpm run test          # All unit tests (Vitest)
pnpm run test:unit     # Unit tests only
pnpm run test:e2e      # End-to-end tests (Playwright)
pnpm run lint          # ESLint (run before committing; CI enforces)
pnpm run typecheck     # vue-tsc --noEmit (CI enforces)

# Run a single spec — paths are relative to packages/desktop. Use `-C` so
# pnpm resolves the spec path inside the desktop package's vitest config.
pnpm -C packages/desktop exec vitest run test/unit/specs/markdown-basic.spec.ts
pnpm -C packages/desktop exec vitest run -t 'partial test name'

# Single Playwright spec (playwright.config.ts lives in test/e2e/)
pnpm -C packages/desktop exec playwright test test/e2e/launch.spec.ts
pnpm -C packages/desktop exec playwright test -g 'partial test name'
```

## Code Style

ESLint and Prettier define style. For code changes, run the applicable lint and
type checks before committing. Keep formatting confined to the requested files.

- 2-space indentation
- No semicolons
- Single quotes
- TypeScript with `strict: true`; see `packages/website/content/docs/dev/TYPESCRIPT.md`
- Cross-process types live in `packages/desktop/src/shared/types/`; ambient declarations in `packages/desktop/src/types/`
- IPC channels are typed via the contract in `packages/desktop/src/shared/types/ipc.ts`
- The renderer is fully sandboxed — every IPC and Node access goes through `window.electron.*` / `window.fileUtils.*` etc. (typed in `packages/desktop/src/types/global.d.ts`)

## Process ownership

- Main owns file I/O, native dialogs, windows, updates, and spell checking.
- Preload owns the typed bridge between main and the sandboxed renderer.
- Renderer owns Vue UI and editor interaction through the approved bridge.
- Main and preload compile to CommonJS. Renderer compiles to ES modules.

For security-sensitive changes, verify the actual BrowserWindow and preload
configuration as well as the relevant architecture documentation.

## IPC Conventions

Most IPC channels between main and renderer use the `mt::` prefix (e.g. `mt::open-new-tab`, `mt::file-saved`). Some internal channels do not follow this convention (e.g. `language-changed`).

See `packages/website/content/docs/dev/IPC.md` for conventions and examples.

## Further Reading

`packages/website/content/docs/dev/` contains the deeper developer documentation referenced by this guide. Same files are published as the developer docs section on https://marktext.me/docs/dev/overview:

- `ARCHITECTURE.md` — process/module layering beyond the summary above
- `BUILD.md` — full platform build prerequisites (including the Arch Linux deps added recently)
- `DEBUGGING.md` — attaching debuggers to main/renderer processes
- `INTERFACE.md` — Muya and renderer public interfaces
- `IPC.md` — full IPC channel catalog and `mt::` conventions
- `LINUX_DEV.md` — Linux-specific dev environment setup
- `PERFORMANCE.md` — perf measurement workflow (pairs with `pnpm run perf:inspect`)
- `RELEASE.md` / `RELEASE_HOTFIX.md` — release process

## Important Build Notes

- **CommonJS vs ESM**: `main` and `preload` compile to CommonJS; `renderer` is ESM-only. Do not use `require()` in renderer code.
- **Minify locales**: `pnpm run minify-locales` must run before production builds. It is included in `build:win/mac/linux` but not in `dev`.
- **Native modules**: After changing Electron version, run `pnpm run rebuild-native` (`electron-rebuild -f`).
- **Hot reload**: The renderer hot-reloads via Vite HMR. `Ctrl+R` in the dev window reloads the renderer and re-runs the preload script. Changes to `main/` source are NOT picked up by a window reload — restart `pnpm run dev` to pick them up.
- **electron-builder output**: `directories.output` in `packages/desktop/electron-builder.yml` is set to `../../dist` so installers land in the repo-root `dist/` (where CI artifact globs look for them). `out/` from electron-vite stays inside `packages/desktop/`.
- **Path aliases** (defined in `packages/desktop/electron.vite.config.ts`, mirrored in `vitest.config.ts` and `tsconfig.base.json`):
  - `@` → `packages/desktop/src/renderer/src`
  - `common` → `packages/desktop/src/common`
  - `@shared` → `packages/desktop/src/shared`
  - `muya` → `../muyajs` (i.e. `packages/muyajs`). Renderer-side imports therefore look like `muya/lib/...` (the alias) — the workspace dep `@marktext/muyajs` is declared in `packages/desktop/package.json` so module resolution stays inside the workspace.
- **Workspace deps**: muya's own npm runtime deps (`github-markdown-css`, `katex`, `dompurify`, `snabbdom`, …) are declared in `packages/muyajs/package.json` so Node module resolution from `packages/muyajs/lib/*.js` finds them inside the workspace rather than walking out to a parent directory.
- **Patches**: `patch-package` patches live at `packages/desktop/patches/`. The root `postinstall` calls patch-package with `cwd=packages/desktop` so the path resolves correctly.

## Contribution

- Submit PRs to the **`develop`** branch (not `main`).
- Reference the related issue in the PR description.
- Run `pnpm run lint` before submitting.
- All PRs must pass CI before merge.
- See `.github/CONTRIBUTING.md` for the full contributing guide.
