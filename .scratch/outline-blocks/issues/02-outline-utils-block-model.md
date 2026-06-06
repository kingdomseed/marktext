# Outline utilities and block model scaffolding

**Status:** implemented — pending PR
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-17, US-18

## TDD approach

**RED → GREEN → REFACTOR** on pure-function seams first. Manual QA uses programmatic `createOutlineItem` until issue 08.

1. **Tracer:** `computeMarker` at depth 1, first sibling → `I.`
2. **Slice 2:** Full depth 1–7 marker sequence for minimal index tree
3. **Slice 3:** `markerWidth(markerString)` for minimal + wide markers (`I.`, `XIV.`, `(1)`, `(a)`)
4. **Slice 4:** `indentForDepth` — golden values derived from `exportMarkdown.js` `normalizeListItem` math (1, 2, 4, `dfm`), not list round-trip strings alone
5. **Slice 5:** `depthFromIndent` + `markerMatchesDepth` — agree → depth; disagree → null
6. **Slice 6:** `walkOutlineGroups` — continuation across plain `p` **and** hard stop at next `groupStart` root
7. **Slice 7:** `ContentState.createOutlineItem(depth)` in `contentState/index.js` — flat root `outline-item` + child `p`

Register `outlineCtrl.js` stub in `contentState/index.js` prototypes array (same pattern as `footnoteCtrl`). Stub signatures for `findImplicitParent` / `findOutlineSiblings` — implementations in issues 04–05.

`normalizeOutlineItem` deferred to issue 07.

## What to build

Introduce the `outline-item` block type and shared marker/indent/group-walk utilities used by export, import, HTML, WYSIWYG, and keyboard handlers.

Flat model: outline items at document root; body in child paragraph; `depth` 1–7; optional `groupStart` and `start` on restart roots.

## Acceptance criteria

- [x] All TDD slices pass (`packages/desktop/test/unit/specs/outline-utils.spec.ts` or equivalent)
- [x] `outlineUtils` exports `markerWidth`, `computeMarker`, `indentForDepth`, `depthFromIndent`, `markerMatchesDepth`, `walkOutlineGroups`
- [x] `createOutlineItem()` on `ContentState` (`index.js`), not `outlineCtrl.js`
- [x] `outlineCtrl.js` registered (stub OK)
- [x] `AG_OUTLINE_ITEM` in `CLASS_OR_ID` (`config/index.js`)
- [x] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/01-outline-preference-engine-wire.md`