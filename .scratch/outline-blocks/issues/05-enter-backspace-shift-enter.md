# Enter, Backspace, and Shift+Enter

**Status:** ready-for-agent  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-24, US-25, US-26, US-27, US-30, US-51

## TDD approach

**RED → GREEN → REFACTOR** per AR-4. Programmatic fixtures only until issue 08.

Do not copy `enterInEmptyParagraph` list grandparent logic (lines 123–207); outline empty Enter calls `outdentOutlineItem` + cascade or `exitOutlineToParagraph`.

1. **Tracer:** Enter with non-empty body → new same-depth sibling below
2. **Slice 2:** Enter on empty body at depth 1 → plain paragraph
3. **Slice 3:** Enter on empty body at depth 3 → outdent to depth 2 + cascade
4. **Slice 4:** Shift+Enter → soft line break within same outline item body
5. **Slice 5:** Backspace at body start with text, adjacent same-depth sibling → merge (AR-8)
6. **Slice 6:** Backspace at body start with text, depth 3, first under parent (no adjacent sibling) → outdent + cascade
7. **Slice 7:** Backspace at body start, depth 1, no adjacent prior sibling → plain `p`
8. **Slice 8:** Backspace on empty item → delete + sibling renumber
9. **Slice 9:** Backspace does not merge across intervening `p` / heading / list
10. **Slice 10:** Enter mid-body → split into two same-depth siblings at cursor (match list `chopBlockByCursor` behavior)

## What to build

**enterCtrl.js:** Early outline detection — empty vs non-empty Enter.

**backspaceCtrl.js:** Extend `checkBackspaceCase` / handler for outline body start (mirror list `LI` case pattern).

**outlineCtrl.js:** `insertOutlineSibling`, `mergeOutlineSiblings`, `deleteOutlineItem`, `exitOutlineToParagraph`.

## Acceptance criteria

- [ ] All TDD slices pass
- [ ] Enter/Backspace/Shift+Enter match AR-4 and AR-8 merge scope
- [ ] Enter at outline boundary next to list/heading follows normal outline rules (no special casing)
- [ ] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/04-tab-shift-tab-cascade.md`