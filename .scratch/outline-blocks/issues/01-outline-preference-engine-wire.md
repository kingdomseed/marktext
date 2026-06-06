# Outline preference and engine option wire

**Status:** ready-for-agent  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-1, US-2, US-3, US-4 (UI gating deferred to issue 08), US-5, US-6 (silent by design), US-7

## TDD approach

**RED → GREEN → REFACTOR** in vertical slices. One failing test per behavior; minimal code to pass.

**Prior art (separate concerns):**
- **Option wire:** `editor.vue` footnote watch + initial `setOptions` block (~388, ~1175)
- **Lexer gating (issue 06):** `markdown-footnotes.spec.ts`

1. **Tracer:** `MUYA_DEFAULT_OPTION.outlineBlocksEnabled === false` — `packages/desktop/test/unit/specs/outline-preference.spec.ts`
2. **Slice 2:** `setOptions({ outlineBlocksEnabled: true }, true)` updates `muya.options` without re-parsing open document (blocks unchanged)
3. **Slice 3:** `schema.json` contains `outlineBlocksEnabled` boolean default `false`
4. **Slice 4:** `en.json` keys under Markdown → Extensions mirror `footnote` / `superSubScript` pattern

## What to build

Add opt-in `outlineBlocksEnabled` preference (default off) and wire it to the production editor engine via `setOptions`, following the footnote **option wire** pattern (not lexer gating — that is issue 06).

**Files:**
- `packages/desktop/src/main/preferences/schema.json` + `preference.json`
- `packages/desktop/src/renderer/src/prefComponents/markdown/index.vue` — Extensions `<bool>` after footnote
- `packages/desktop/src/renderer/src/components/editorWithTabs/editor.vue` — watch + initial options
- `packages/muyajs/lib/config/index.js` — `MUYA_DEFAULT_OPTION.outlineBlocksEnabled: false`

**Out of scope (issue 08):** hide `@` quick-insert and Turn Into when pref off (AR-5 seam 2).

Pref description must document footnote-mirror semantics: enable mid-session does not re-import open doc; disable mid-session keeps existing outline items editable.

## Acceptance criteria

- [ ] TDD tracer tests pass in `outline-preference.spec.ts`
- [ ] `outlineBlocksEnabled` in preference schema + default `false` in `preference.json`
- [ ] Toggle in Markdown settings section with `en.json` label and description
- [ ] `editor.vue` watch → `setOptions({ outlineBlocksEnabled }, true)` on change and in initial options block
- [ ] `pnpm run lint` passes

## Blocked by

None — can start immediately