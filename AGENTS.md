# AGENTS.md

Guidance for agents working in this MarkText repository.

## Active local work (read first)

This clone includes a fork effort to add **academic outline editing** (Roman → letter → number hierarchy with block-level Tab indent). Before touching editor code, read:

| Doc | Purpose |
|-----|---------|
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary — outline vs list item vs TOC, block-level indent |
| [`docs/OUTLINE-BLOCKS-PLAN.md`](./docs/OUTLINE-BLOCKS-PLAN.md) | Investigation results, UI trace, preprocessing checklist, open decisions |
| [`docs/HANDOFF.md`](./docs/HANDOFF.md) | Session handoff — where we left off and what to do next |

**Direction:** Implement in **`packages/muyajs`** first (production engine). Desktop aliases `muya` → `muyajs`. The TS rewrite in `packages/muya` is not wired into desktop yet.

**Nearest instruction file wins:** root `AGENTS.md` for repo-wide work; [`packages/muya/AGENTS.md`](./packages/muya/AGENTS.md) when working only inside the TS rewrite.

---

## Project overview

MarkText is a WYSIWYG markdown editor built on Electron + Vue 3. It supports CommonMark, GitHub Flavored Markdown, math (KaTeX), Mermaid diagrams, PlantUML, and multiple editing modes (focus, typewriter, source-code).

- **Version**: see `package.json`
- **License**: MIT
- **Repository**: https://github.com/marktext/marktext

## Tech stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9 (strict mode) — `packages/muyajs/` retained as JS via ambient shim |
| Desktop shell | Electron 42 |
| Build system | electron-vite 5 |
| Packaging | electron-builder 26 |
| Frontend framework | Vue 3 |
| State management | Pinia 3 |
| Routing | Vue Router 4 |
| UI library | Element Plus |
| Unit tests | Vitest 4 |
| E2E tests | Playwright |
| Package manager | pnpm >=10 workspace (`packageManager: pnpm@10.33.4`) |
| Repo layout | pnpm monorepo — see Directory Structure |
| Node.js minimum | >=20.19.0 (PR CI: Node 22.21.1 · release CI: Node 24.14.1) |

## Directory structure

This is a pnpm workspace. Three packages live under `packages/`, and the root holds only shared tooling and CI-facing scripts.

```
<repo-root>/
  package.json              Workspace orchestrator — every CI-facing script
                            proxies to packages/desktop via `pnpm --filter
                            marktext ...`. CI invocations are unchanged.
  pnpm-workspace.yaml       `packages: ['packages/*']` plus allowBuilds.
  pnpm-lock.yaml            Single lockfile, shared across all packages.
  eslint.config.js          Root ESLint v9 flat config (covers desktop +
                            muyajs; website has its own ESLint v8 config
                            and is ignored here).
  scripts/                  Workspace-level scripts. postinstall.ts,
                            minify-locales.ts, generateThirdPartyLicense.ts,
                            validateLicenses.ts, thirdPartyChecker.ts all
                            target packages/desktop internally.
  docs/                     Long-form developer docs + local fork plans.
  CONTEXT.md                Domain glossary for outline editing work.
  dist/                     Packaged installers from electron-builder
                            (git-ignored; electron-builder writes here via
                            `directories.output: ../../dist` so CI artifact
                            globs `dist/*` still apply).
  packages/
    desktop/                The Electron app (name: "marktext").
      package.json          Holds all Electron / Vue / build-time deps and
                            the dev/build/test/typecheck scripts. Depends on
                            @marktext/muyajs via workspace:*.
      electron.vite.config.ts
      electron-builder.yml  directories.output points at ../../dist.
      tsconfig.json / tsconfig.base.json
      vitest.config.ts
      patches/              pnpm patches consumed by patch-package.
      build/                electron-builder resources (icons, entitlements,
                            NSIS scripts).
      static/               Static assets bundled into the app
                            (icons, themes, locales).
      out/                  electron-vite output (git-ignored).
      test/
        unit/               Vitest specs → pnpm test / pnpm test:unit
        e2e/                Playwright specs + playwright.config.ts
                            → pnpm test:e2e
      src/
        common/             Pure Node.js utilities usable from main, preload,
                            and renderer.
        main/               Electron main process (IO, native dialogs, window
                            management, auto-updater).
        preload/            Electron preload scripts. The renderer runs
                            sandboxed (contextIsolation: true,
                            nodeIntegration: false, sandbox: true since
                            #4244) — all Node access flows through the typed
                            contextBridge surface in
                            packages/desktop/src/preload/index.ts.
        renderer/           Vue 3 application (editor UI, Pinia stores).
          src/
            components/     Vue single-file components.
            store/          Pinia stores (editor.ts, preferences.ts,
                            layout.ts, …).
            pages/          Top-level Vue pages / routes.
            router/         Vue Router configuration.
        shared/             Cross-process types (`shared/types/`) and the
                            IPC contract (`shared/types/ipc.ts`).
        types/              Ambient .d.ts declarations.
    muyajs/                 Legacy markdown editor engine
                            (name: "@marktext/muyajs"). Primarily JS + DOM,
                            avoids Electron APIs. **This is what the desktop
                            app consumes** via the `muya/` alias.
      lib/
        contentState/       Block structure, Tab/Enter handlers, transforms.
        parser/             Markdown parser.
        renderers/          WYSIWYG renderer.
        ui/                 Quick insert (@), front menu, toolbars.
        utils/              Import/export markdown, internal utilities.
      themes/               Editor themes (Prism + fonts).
    muya/                   TypeScript rewrite of muya
                            (name: "@muyajs/core"). Not yet wired into
                            desktop — see packages/muya/AGENTS.md.
      src/                  TS source. Public entrypoint src/index.ts.
      test/spec/            CommonMark 0.31 + GFM 0.29-gfm conformance.
      examples/             muya-examples — vite vanilla-TS dev demo.
      e2e/                  muya-e2e — Playwright suite.
    website/                marktext-website (Vite + React 18). Standalone
                            toolchain; not part of desktop CI today.
```

The root has no `src/`, `test/`, `static/`, or `build/` of its own — they all live in `packages/desktop/`.

## Development workflow

All commands run from the repo root. The root `package.json` proxies every desktop-specific script to `packages/desktop` via `pnpm --filter marktext`.

```bash
pnpm install          # postinstall patches, Electron, native rebuild, locales
pnpm run dev          # development mode; renderer hot-reloads
pnpm run start        # preview last build (PERF_TESTING=true)
pnpm run build:unpack # compile without packaging
pnpm run format       # Prettier write
pnpm run lint         # ESLint — run before commits
pnpm run typecheck    # vue-tsc --noEmit
pnpm run test         # unit tests
pnpm run test:e2e     # Playwright
```

If you need to invoke a script directly inside a package: `pnpm --filter <name> <script>` or `pnpm -C packages/<name> <script>`.

### Single test files

```bash
pnpm -C packages/desktop exec vitest run test/unit/specs/markdown-basic.spec.ts
pnpm -C packages/desktop exec vitest run -t 'partial test name'
pnpm -C packages/desktop exec playwright test test/e2e/launch.spec.ts
```

## Build commands

```bash
pnpm run build:win    # Windows x64
pnpm run build:mac    # macOS x64 + arm64
pnpm run build:linux  # Linux
```

Platform builds run `minify-locales` and `electron-rebuild` automatically.

## Code style

Enforced by ESLint + Prettier.

- 2-space indentation
- No semicolons
- Single quotes
- TypeScript `strict: true` — see `packages/website/content/docs/dev/TYPESCRIPT.md`
- Cross-process types: `packages/desktop/src/shared/types/`
- IPC contract: `packages/desktop/src/shared/types/ipc.ts`
- Renderer is sandboxed — Node access via `window.electron.*` (typed in `global.d.ts`)

**muyajs** (production editor): ES6 JavaScript, JSDoc on public methods, `createBlock(type, extras)` block tree.

**muya TS rewrite**: different conventions — see `packages/muya/AGENTS.md`.

## Architecture: three-process Electron model

```
main process  (packages/desktop/src/main/)
  ├── Full Node.js + Electron API access
  ├── IO, file system, native dialogs, auto-updater
  └── Controls editor windows via IPC

preload  (packages/desktop/src/preload/)
  └── Bridge between main and renderer

renderer  (packages/desktop/src/renderer/)
  ├── Vue 3 + Pinia — all UI state
  ├── Hosts Muya (WYSIWYG) and CodeMirror (source mode)
  └── One process per editor window

Muya  (packages/muyajs/)            ← @marktext/muyajs, aliased as muya/
  ├── Markdown parsing, block data structure, export, WYSIWYG render
  ├── Tab handler: packages/muyajs/lib/contentState/tabCtrl.js
  ├── Block transforms: packages/muyajs/lib/contentState/paragraphCtrl.js
  └── UI block creation: quickInsert + frontMenu → updateParagraph()
```

## IPC conventions

Most channels use the `mt::` prefix (e.g. `mt::open-new-tab`). See `packages/website/content/docs/dev/IPC.md`.

## Outline editing — key code paths (muyajs)

For the local fork work, these are the highest-leverage files:

| Concern | File |
|---------|------|
| Tab key | `packages/muyajs/lib/contentState/tabCtrl.js` |
| Enter / Backspace | `packages/muyajs/lib/contentState/enterCtrl.js`, `backspaceCtrl.js` |
| Turn Into / @ menu | `packages/muyajs/lib/contentState/paragraphCtrl.js` → `updateParagraph()` |
| Quick insert config | `packages/muyajs/lib/ui/quickInsert/config.js` |
| Front menu config | `packages/muyajs/lib/ui/frontMenu/config.js` |
| Markdown export | `packages/muyajs/lib/utils/exportMarkdown.js` |
| Markdown import | `packages/muyajs/lib/utils/importMarkdown.js` |
| 4-space → code block trap | `packages/muyajs/lib/contentState/updateCtrl.js` |

Plain paragraphs have **no depth property**. Tab on non-list text calls `insertTab()` (inline spaces). List Tab calls `indentListItem()` (AST re-parenting).

## Contribution

- PRs target **`develop`** (not `main`)
- New features need a **suggestion issue** first (upstream etiquette)
- Run `pnpm run lint` and tests before submitting
- See `.github/CONTRIBUTING.md`

## Further reading

- `packages/website/content/docs/dev/ARCHITECTURE.md`
- `packages/website/content/docs/dev/BUILD.md`
- `packages/website/content/docs/dev/DEBUGGING.md`
- `packages/website/content/docs/dev/INTERFACE.md`
- `packages/website/content/docs/dev/IPC.md`
- `packages/muya/AGENTS.md` — TS rewrite internals
- `CLAUDE.md` — original Claude Code copy of this file (kept for compatibility)

## Important build notes

- **CommonJS vs ESM**: `main` and `preload` → CommonJS; `renderer` → ESM only
- **Minify locales**: required before production builds (`pnpm run minify-locales`)
- **Native modules**: `pnpm run rebuild-native` after Electron version changes
- **Hot reload**: renderer hot-reloads; main process changes need `pnpm run dev` restart
- **Path aliases** (`packages/desktop/electron.vite.config.ts`):
  - `@` → `packages/desktop/src/renderer/src`
  - `common` → `packages/desktop/src/common`
  - `@shared` → `packages/desktop/src/shared`
  - `muya` → `../muyajs`
- **Patches**: `packages/desktop/patches/` via patch-package in postinstall