# Markdown import lexer and precedence rules

**Status:** merged — PR #6  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-31, US-32, US-33, US-34, US-35, US-36, US-37, US-41

## TDD approach

**RED → GREEN → REFACTOR** — Lexer-only slices use `markdown-footnotes.spec.ts` pattern; import slices use `createMuyaContext` + `importMarkdown`.

1. **Tracer:** Pref off → `I. Top` imports as plain paragraph
2. **Slice 2:** Pref on → `I. Top` at depth 1 imports as `outline-item`
3. **Slice 3:** Pref on, `0`-indent `1. foo` → GFM ordered list, not outline d3
4. **Slice 4:** Indent + marker disagree → plain paragraph
5. **Slice 5:** Ambiguous `N.` — context continuation from preceding outline vs list chain
5b. **Slice 5b:** Depth 4–7 markers (`a.`, `i.`, `(1)`, `(a)`) import when indent+marker agree
6. **Slice 6:** `<!-- mt:outline-group-start -->` before `XI.` → `groupStart` + honored `start`; **without** sentinel, `XI.` after `II.` stays continuation (not new group)
7. **Slice 7:** Outline lexer runs **before** indented `code` rule (~line 147 in lexer.js)
8. **Slice 8:** Multi-line block paste via `markdownToState` — structural when import rules satisfied
9. **Slice 9:** Pref on, task lists and `1)` delimiters → unchanged GFM

Mid-body MERGE literal (`A. footnote` in existing body) verified in issue 10 E2E.

Within-group casual marker edits normalize to structure-derived values on re-import (AR-6).

## Components

- `packages/muyajs/lib/parser/marked/options.js` — `outlineBlocksEnabled: false`
- `packages/muyajs/lib/parser/marked/rules.js` — 7 depth marker regexes + group-start sentinel
- `packages/muyajs/lib/parser/marked/lexer.js` — gate with `if (this.options.outlineBlocksEnabled)`; insert **before `code` rule (~147)**
- `packages/muyajs/lib/utils/importMarkdown.js` — pass option into `Lexer` (mirror footnote ~87–98); tokens → `createOutlineItem()` + child `p` (mirror `list_item_start` ~394–412)
- `packages/muyajs/lib/utils/outlineUtils.js` — `depthFromIndent`, `markerMatchesDepth`
- `packages/desktop/test/unit/specs/markdown-outline-import.spec.ts`

## What to build

Import structural outline markers into `outline-item` blocks when preference is on. Apply AR-3 precedence, AR-2 indent agreement, group-start sentinel, paste/import shared path.

## Acceptance criteria

- [x] All TDD slices pass
- [x] Lexer outline rules registered before indented `code` rule when pref on
- [x] `outline_item` tokens produce `outline-item` + child `p` block tree
- [x] Precedence table matches AR-3
- [x] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/02-outline-utils-block-model.md`

May proceed in parallel with issues 03–05 after blocker lands.