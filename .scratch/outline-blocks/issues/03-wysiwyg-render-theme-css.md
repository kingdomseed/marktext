# WYSIWYG render and editor theme CSS

**Status:** implemented — pending PR  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-12, US-20, US-28, US-29, US-56

## TDD approach

**RED → GREEN → REFACTOR** through observable DOM/render seams.

1. **Tracer:** Programmatic `outline-item` at depth 1 renders structural marker `I.` separate from body text
2. **Slice 2:** Collapsed caret at body start — selection offsets refer only to body `span`; Left arrow from offset 0 does not focus marker chrome (may touch `arrowCtrl` / `clickCtrl`)
3. **Slice 3:** Depth 3 item shows decimal marker `1.` with cumulative indent per `listIndentation`
4. **Slice 4:** Multi-line body — continuation lines align under body text after marker
5. **Slice 5:** `.ag-outline-item` distinct from `.ag-list-item` (root container, not `li` ancestry)

Marker computed at render via `outlineUtils.computeMarker` — not stored marker text on block.

Manual smoke in `pnpm dev` after green tests.

## What to build

**Renderer:** `packages/muyajs/lib/parser/render/renderBlock/renderContainerBlock.js` — branch `type === 'outline-item'`:
- Sibling marker element (non-contenteditable) + child `p` body
- `data-depth`, cumulative indent via `outlineUtils.indentForDepth`
- Selector: `.ag-outline-item` + `CLASS_OR_ID.AG_OUTLINE_ITEM`

**CSS:** `packages/muyajs/lib/assets/styles/index.css` — marker column widths (wide Roman), continuation alignment (mirror `li.ag-list-item > p.ag-paragraph` rules without assuming `li` parent).

## Acceptance criteria

- [x] TDD render/DOM tests pass
- [x] Structural marker displayed; not editable as body prefix
- [x] Body editable in child paragraph; caret/selection excludes marker
- [x] Cumulative indent per depth and `listIndentation`
- [x] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/02-outline-utils-block-model.md`

Issue 04 may start after this issue's **Slice 1** tracer if render/CSS slices 3–5 are still in flight.