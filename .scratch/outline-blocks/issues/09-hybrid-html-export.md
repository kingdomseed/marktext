# Hybrid HTML/PDF export seam

**Status:** ready-for-review
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-52, US-53, US-54

## TDD approach

**RED → GREEN → REFACTOR** via HTML output assertions in `markdown-outline-html.spec.ts`.

1. **Tracer:** Single depth-1 outline item → flat `outline-item` HTML with marker span `I.` — no nested `<ol>`
2. **Slice 2:** AR-2 minimal fixture tree HTML at `listIndentation: 1`
3. **Slice 3:** Same fixtures at `listIndentation: 2` and `dfm`
4. **Slice 4:** Multi-line body — continuation lines align under body text
5. **Slice 5:** Group-start sentinel absent from HTML output
6. **Slice 6:** Indented depth-3 `1.` lines do not render as `<code>` blocks
7. **Slice 7:** Document-order interleave — outline + paragraph blocks in correct sequence
8. **Slice 8:** Document with **no** outline items → HTML identical to pre-feature `marked()` path
9. **Slice 9:** `ExportHtml` hybrid path unit test (primary seam)

Export HTML uses `outline-item` / `outline-marker` / `outline-body` classes — not `.ag-*` editor classes.

## Implementation contract

- `renderHybridHtml(blocks, options)` in `exportHtml.js`: **one document-order walk**; outline slices → `outlineHtml.renderOutlineItemHtml()`; other slices → markdown fragment → `marked()` (preserve list counter state — no per-slice `ExportMarkdown` instances)
- `ExportHtml.generate()`: when block tree contains any `outline-item`, use hybrid path; else existing `marked(fullMarkdown)`
- `packages/muyajs/lib/index.js` `exportStyledHTML()` — pass blocks into `ExportHtml`
- `packages/desktop/src/renderer/src/util/markdownToHtml.ts` — pass `muya` + blocks when available
- New `packages/muyajs/lib/utils/outlineHtml.js`
- `packages/muyajs/lib/assets/styles/exportStyle.css`

PDF/print uses same `exportStyledHTML` path (`editor.vue`).

## What to build

HTML and PDF export render outline items with flat markup, correct markers, cumulative indent, body continuation. Hybrid block-tree seam when outline items present.

## Acceptance criteria

- [x] HTML unit tests pass for fixture trees × indent settings
- [x] No `<ol>` for outline blocks; sentinel invisible
- [x] No-outline regression guard passes
- [x] `exportStyle.css` includes outline print styles
- [x] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/07-markdown-export-roundtrip.md`
