# Creation UI, Turn Into matrix, and UI gating

**Status:** ready-for-agent  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-4, US-8, US-9, US-10, US-11, US-22, US-44, US-45, US-46, US-47, US-55

## TDD approach

**RED → GREEN → REFACTOR** — menu filter unit tests first; block-tree transforms second.

1. **Tracer:** `quickInsert`/`frontMenu` config filtering when `outlineBlocksEnabled: false` — outline entry IDs absent from filtered list (no DOM)
2. **Slice 2:** Pref on → `@` quick-insert creates depth-1 outline item in empty paragraph
3. **Slice 3:** Turn Into paragraph → outline uses context continuation depth
4. **Slice 4:** Turn Into outline → paragraph promotes children one depth level
5. **Slice 5:** Turn Into outline ↔ list denied both directions
6. **Slice 6:** Multiline selection with any outline item → Turn Into blocked
7. **Slice 7:** **New outline group** calls `restartOutlineGroup()` → `groupStart: true` + `start` from restart marker (default position 1 unless e.g. `XI`)
8. **Slice 8:** Heading ↔ outline both directions
9. **Slice 9:** Blockquote → outline and outline → blockquote (wrapper removed)
10. **Slice 10:** Pref off → create paths hidden; **existing** outline item still editable

## Components

- `packages/muyajs/lib/ui/quickInsert/config.js` + `index.js`
- `packages/muyajs/lib/ui/frontMenu/config.js` + `index.js` — Turn Into + **New outline group**
- `packages/muyajs/lib/contentState/paragraphCtrl.js` — `handleOutlineMenu`, `isAllowedTransformation`, `getTypeFromBlock`
- `packages/muyajs/lib/contentState/outlineCtrl.js` — `restartOutlineGroup(item)`
- `packages/desktop/static/locales/en.json`

## What to build

User-facing creation paths: `@` quick-insert, Turn Into submenu, **New outline group** action. Hide all when pref off. Full AR-8 matrix except list pivot (deny direct outline ↔ list).

## Acceptance criteria

- [ ] TDD slices pass for gating and Turn Into matrix
- [ ] UI hidden when `outlineBlocksEnabled` false; existing items remain editable
- [ ] First outline in fresh context is depth 1 Roman unless continuation applies
- [ ] New documents remain plain paragraph (AR-11)
- [ ] `pnpm run lint` and `pnpm run test` pass

## Blocked by

- `.scratch/outline-blocks/issues/05-enter-backspace-shift-enter.md`
- `.scratch/outline-blocks/issues/01-outline-preference-engine-wire.md`

Soft dependency: issue 03 for manual render verification of `@` create.