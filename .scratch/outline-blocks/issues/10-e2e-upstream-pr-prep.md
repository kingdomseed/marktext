# E2E primary flow and upstream PR prep

**Status:** ready-for-agent  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-58, US-59, US-60, US-61, US-62, US-63

## TDD approach

**RED → GREEN → REFACTOR** — E2E is the tracer bullet for this capstone. PR 10 only; does not subsume PRs 1–9.

## E2E prerequisites (add to `helpers.ts` or spec setup)

- Seed `outlineBlocksEnabled: true` in user-data `preferences.json` (or navigate Markdown settings — pick one, document in spec)
- Save helper: `Meta+S` → assert disk markdown via returned `filePath`
- Reopen: relaunch app with same `filePath`
- `@` quick-insert: type `@`, select outline entry from quick-insert popup

1. **Tracer (RED):** Enable pref → `@` create outline → Tab once → save → reopen → depth/marker intact
2. **Slice 2:** Shift+Tab outdent in E2E
3. **Slice 3:** Enter creates sibling; empty Enter exits depth 1 to paragraph
4. **Slice 4:** Source mode shows structural markers after edit
5. **Slice 5:** Paste `A. footnote` mid-body stays literal (AR-7)
6. **Slice 6:** `markdown-outline-html.spec.ts` passes in same CI run (mandatory — not optional)

**HITL tail:** screen recordings per PRD checklist; PR to `develop` with `Closes #NNN` from issue 00.

Verify JSDoc on outline APIs introduced in PRs 1–9.

## What to build

- `packages/desktop/test/e2e/outline-blocks.spec.ts`
- `packages/desktop/test/e2e/data/outline.md` fixture
- Playwright primary journey + upstream PR prep

## Acceptance criteria

- [ ] E2E spec passes in Chromium
- [ ] `pnpm run lint`, `pnpm run test`, `pnpm run test:e2e` pass
- [ ] JSDoc on new public engine methods (across PR stack)
- [ ] Screen recordings: pref on/off, create, Tab/Enter/Shift+Tab, paste literal, save/reopen, source mode, HTML/PDF spot-check, disable-mid-session (AR-5)
- [ ] PR opened to `marktext/marktext` `develop` with `Closes #NNN`

## Blocked by

- `.scratch/outline-blocks/issues/06-markdown-import-lexer.md`
- `.scratch/outline-blocks/issues/07-markdown-export-roundtrip.md`
- `.scratch/outline-blocks/issues/08-creation-ui-turn-into.md`
- `.scratch/outline-blocks/issues/09-hybrid-html-export.md`
- `.scratch/outline-blocks/issues/00-upstream-suggestion-issue.md`