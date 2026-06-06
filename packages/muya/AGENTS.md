# AGENTS.md (packages/muya)

Guidance for agents working inside `packages/muya` — the TypeScript rewrite of Muya.

> **Location.** `packages/muya` is the TS rewrite (upstream: https://github.com/marktext/muya). The legacy JS engine `packages/muyajs` (`@marktext/muyajs`) is still what the **desktop app consumes** via the `muya/` alias. Do not wire muya TS into desktop code yet. For outline-block work, implement in **muyajs first** — see repo-root [`AGENTS.md`](../../AGENTS.md) and [`docs/OUTLINE-BLOCKS-PLAN.md`](../../docs/OUTLINE-BLOCKS-PLAN.md).

## Layout

- `src/` — `@muyajs/core` TypeScript source. Public API: `src/index.ts`
- `test/spec/` — CommonMark / GFM conformance (`test:spec`)
- `examples/` — Vite vanilla-TS demo (`muya-examples`)
- `e2e/` — Playwright suite (`muya-e2e`)
- `eslint.config.mjs`, `.stylelintrc`, `.madgerc` — package-local tooling (marktext-root ESLint ignores `packages/muya/**`)

Stub packages (`facade`, `findReplace`) from upstream were not migrated.

## Commands

Run from repo root:

```bash
pnpm -C packages/muya/examples dev:demo   # examples Vite dev server
pnpm -C packages/muya build                 # tsc && vite build → lib/
pnpm -C packages/muya test                  # Vitest unit tests
pnpm -C packages/muya test:spec             # CommonMark + GFM fixtures
pnpm -C packages/muya lint                  # ESLint (antfu)
pnpm -C packages/muya lint:types            # tsc --noEmit
pnpm -C packages/muya check-circular        # madge — CI enforces
pnpm -C packages/muya/e2e e2e               # Playwright
```

Single file: `pnpm -C packages/muya exec vitest run path/to/file.test.ts`

Engines: Node ≥20.19. Build target: chrome70.

## Architecture

### Entry point and plugins

`src/muya.ts` exports `Muya`. UI plugins via `Muya.use(Plugin, options)`. Canonical wiring: `examples/src/main.ts`.

`new Muya(element, options)` creates contenteditable container. `muya.init()` → `Editor.init()` → `registerBlocks()` → root `ScrollPage`.

### Editor (`src/editor/index.ts`)

Owns `JSONState`, `InlineRenderer`, `Selection`, `Search`, `Clipboard`, `History`, `ScrollPage`. Routes DOM events to active block handlers. `Editor.updateContents()` applies `ot-json1` ops.

### Block tree

Blocks extend `TreeNode → Parent → (Content | Format)` in `src/block/base/`.

**New block types must be registered** in `src/block/index.ts::registerBlocks()`. `ScrollPage.loadBlock(blockName).create(muya, state)` — unregistered names warn and return undefined.

### State and markdown round-trip (`src/state/`)

- `JSONState` — source of truth, OT-ready
- `markdownToState.ts` / `stateToMarkdown.ts` — parse / serialize
- Reference definitions round-trip as paragraph text — do not introduce `ILinkReferenceDefinitionState` paths
- `getTOC(muya)` — heading navigation only, not outline editing

### UI layer (`src/ui/`)

Floating tools/menus via `@floating-ui/dom`. Quick insert: `src/ui/paragraphQuickInsertMenu/config.ts`. Front menu: `src/ui/paragraphFrontMenu/`.

### Public API

`src/index.ts` is the published entrypoint.

## Conventions (enforced by tooling)

- TypeScript, **4-space indent**, **semicolons required**
- Interface names: `I` + uppercase (`IMuyaOptions`)
- Private members: `_` prefix (`_indentListItem`)
- `complexity ≤ 20`, `max-lines-per-function ≤ 200` (warnings)
- No circular imports — `pnpm check-circular` in CI
- CSS co-located with `.ts`, Stylelint enforced
- Commit style follows marktext root guide (not upstream husky/commitlint)

## Outline work — muya TS parity (later)

When porting outline blocks from muyajs:

| Layer | Files |
|-------|-------|
| State | `src/state/types.ts` — `IOutlineItemState` |
| Block | `src/block/` + `registerBlocks()` |
| Tab/Enter | `src/block/content/paragraphContent/index.ts` |
| Serialize | `src/state/stateToMarkdown.ts`, `markdownToState.ts` |
| UI | `src/ui/paragraphQuickInsertMenu/config.ts` |
| E2E | `e2e/tests/typing/outline.spec.ts` |

## Build notes

- `vite-plugin-dts` uses `outDirs` → `lib/types/`
- `@laynezh/vite-plugin-lib-assets` routes icons/fonts

## Further reading

- `CLAUDE.md` — original Claude Code copy (kept for compatibility)
- `CONTRIBUTING.md` — detailed contributor guide
- `MIGRATION.md` — bugfix parity from legacy muya
- Repo root `docs/OUTLINE-BLOCKS-PLAN.md` — outline feature plan