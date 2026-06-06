# Tab / Shift+Tab depth change and reparenting cascade

**Status:** ready-for-agent  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-13, US-14, US-15, US-16, US-17, US-19, US-20, US-23, US-48

## TDD approach

**RED → GREEN → REFACTOR** on block-tree outcomes.

1. **Tracer:** Tab on depth-1 outline item → depth 2; marker `A.`
2. **Slice 2:** Shift+Tab on depth 2 → depth 1
3. **Slice 3:** Tab with non-outline `p` between siblings — attaches under correct **implicit parent** (not merely `preSibling`)
4. **Slice 4:** Reparenting cascade — contiguous same-depth followers become children (AR-1)
5. **Slice 5:** After indent, remaining siblings at old depth renumber (`I.` → `II.`, etc.)
6. **Slice 6:** Depth 7 Tab no-op; Shift+Tab at depth 1 no-op
7. **Slice 7:** Outline branches precede `insertTab`, code-block Shift+Tab unindent, format-end Tab, table cell jump

## What to build

Wire in `tabCtrl.js` at **two** points:
1. **~400** (with `isUnindentableListItem`): `if (event.shiftKey && this.isOutdentableOutlineItem()) return this.outdentOutlineItem()`
2. **~512** (before `isIndentableListItem`): `if (this.isIndentableOutlineItem()) return this.indentOutlineItem()`

Implement in `outlineCtrl.js`: `isIndentableOutlineItem`, `isOutdentableOutlineItem`, `indentOutlineItem`, `outdentOutlineItem`, `findImplicitParent`, `findOutlineSiblings`, `reparentingCascade`. Do **not** reuse `indentListItem`.

## Acceptance criteria

- [ ] All TDD slices pass
- [ ] Tab/Shift+Tab change depth without inserting spaces into body text
- [ ] Reparenting cascade and sibling renumbering match AR-1 / US-19
- [ ] Depth 7 Tab no-op; depth 1 Shift+Tab no-op
- [ ] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/03-wysiwyg-render-theme-css.md`