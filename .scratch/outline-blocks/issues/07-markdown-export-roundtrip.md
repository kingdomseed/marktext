# Markdown export and round-trip tests

**Status:** pr-open  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-38, US-39, US-40, US-42, US-43

## TDD approach

**RED → GREEN → REFACTOR** via round-trip seam (`importMarkdown` → `ExportMarkdown.generate()`), pattern: `markdown-list-indentation.spec.ts`.

**Fixture trees (AR-2):** minimal index (`I./A./1./…`), index 2 (`II./B./2./…`), wide markers (`XIV./J./42./…`).

1. **Tracer:** Single depth-1 outline item exports `I. {body}` with correct leading indent
2. **Slice 2:** Minimal index tree round-trips at `listIndentation: 1`
3. **Slice 3:** Same at `listIndentation: 2` and `dfm`
4. **Slice 4:** Index-2 tree at all three indent settings
5. **Slice 5:** Wide-marker tree at all three indent settings
6. **Slice 6:** Group-start sentinel emitted before restart root; round-trip preserves `groupStart`/`start` on restart root
7. **Slice 7:** Multi-line body continuation indent in exported markdown
8. **Slice 8:** Document with `outline-item` blocks exports structural markers when `outlineBlocksEnabled: false` (AR-5 disable semantics)

## What to build

- Add `case 'outline-item':` in `translateBlocks2Markdown()` calling `normalizeOutlineItem(block, indent)`
- `normalizeOutlineItem` uses `outlineUtils.computeMarker` + `indentForDepth`; mirror `normalizeListItem` body continuation (`newIndent` = indent + marker width; `exportMarkdown.js` lines 401–427)
- Export `outline-item` blocks **regardless of** `outlineBlocksEnabled` when present in tree

## Acceptance criteria

- [x] All AR-2 fixture trees pass at `listIndentation` 1, 2, `dfm` in `markdown-outline-indentation.spec.ts`
- [x] `normalizeOutlineItem` handles group-start and restart roots
- [x] Round-trip preserves depth structure and body text
- [x] Pref-off export of existing outline items works
- [x] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/02-outline-utils-block-model.md`
- `.scratch/outline-blocks/issues/06-markdown-import-lexer.md`