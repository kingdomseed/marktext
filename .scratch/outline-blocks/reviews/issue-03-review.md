# Issue 03 review — WYSIWYG render and editor CSS

Date: 2026-06-06
Branch: `feat/issue-03-wysiwyg-render`
Base: `feat/outline-editing-setup` (`8283e2a`)
PR: https://github.com/kingdomseed/marktext/pull/3

## Local review result

Reviewed issue 03 against:

- `.scratch/outline-blocks/issues/03-wysiwyg-render-theme-css.md`
- `.scratch/outline-blocks/PRD.md`
- `.scratch/outline-blocks/DESIGN.md`
- `AGENTS.md`, `CONTEXT.md`, `docs/HANDOFF.md`

## Findings handled

1. GitHub Codex review flagged that `.ag-front-icon` was still hidden for active `outline-item` roots because the reveal rule only matched `.ag-paragraph.ag-active`.
   - Fixed in `packages/muyajs/lib/assets/styles/index.css`.
   - Added coverage in `packages/desktop/test/unit/specs/outline-render.spec.ts`.

2. GitHub Codex review flagged marker/text vertical misalignment: the outline marker and body paragraph are flex siblings, but `p` margins live on the child paragraph.
   - Fixed in `packages/muyajs/themes/default.css` by moving paragraph-like vertical rhythm to `.ag-outline-item` and resetting child paragraph margin.
   - Added coverage in `packages/desktop/test/unit/specs/outline-render.spec.ts`.

3. New exported outline helpers lacked JSDoc.
   - Added compact JSDoc for `findImplicitParentInGroup` and `getOutlineRenderMeta`.

4. `getOutlineRenderMeta` behavior needed direct coverage for implicit-parent sibling resets and restart markers.
   - Added tests in `packages/desktop/test/unit/specs/outline-utils.spec.ts`.

5. Review noted O(N²) render metadata lookup when each outline item recomputed group metadata independently.
   - Fixed by adding `getOutlineRenderMetaMap()` in `packages/muyajs/lib/utils/outlineUtils.js`.
   - `StateRender` now computes the metadata map once per full, partial, or single render cycle and `renderContainerBlock` reads from it.
   - Removed the old private quadratic helper path.

6. Review noted that omitting root `.ag-paragraph` could hide assumptions in existing CSS/code.
   - Confirmed the root class omission is still intentional because `outline-item` is a flex container, not a paragraph.
   - Fixed the concrete focus-mode dependency by adding `.ag-outline-item` to focus opacity rules.
   - Fixed the concrete selection-helper dependency by treating `.ag-outline-item` as an outmost block container while keeping the body span as the nearest editable block.
   - Added focus-mode and selection-helper coverage in `packages/desktop/test/unit/specs/outline-render.spec.ts`.

7. Review noted the `outline-item` branch discarded the default `getSelector()` result.
   - Fixed by skipping the default selector for outline roots instead of computing and replacing it.

## Review notes accepted as design

- `outline-item` intentionally omits the root `.ag-paragraph` class. It is a flex container, not a paragraph. The body child remains a `p.ag-paragraph`, and selection helpers now recognize the root `.ag-outline-item` explicitly where an outmost block container is required.
- Front icon DOM order is `[frontIcon, marker, body]`, but `.ag-front-icon` is absolutely positioned and does not participate in the flex layout.
- `walkOutlineGroups` intentionally groups outline items across intervening non-outline blocks. Group boundaries are explicit via `groupStart`.
- Reassigning the selector for `outline-item` is intentional because the default `getSelector()` result would produce an invalid/custom `outline-item` tag and add `.ag-paragraph`.
  The code now avoids computing that selector in the first place.

## Verification

```bash
pnpm -C packages/desktop exec vitest run test/unit/specs/outline-render.spec.ts
pnpm -C packages/desktop exec vitest run test/unit/specs/outline-utils.spec.ts
pnpm exec eslint packages/muyajs/lib/utils/outlineUtils.js packages/muyajs/lib/parser/render/index.js packages/muyajs/lib/parser/render/renderBlock/renderContainerBlock.js packages/muyajs/lib/selection/dom.js packages/muyajs/lib/config/index.js packages/desktop/test/unit/specs/outline-render.spec.ts packages/desktop/test/unit/specs/outline-utils.spec.ts
pnpm run lint
pnpm run test
git diff --check
```

Results:

- Focused outline render tests: 8 passed.
- Focused outline utility tests: 13 passed.
- Targeted ESLint: 0 errors.
- Full lint: 0 errors, 77 pre-existing warnings.
- Full unit suite: 14 files passed, 586 tests passed.
- `git diff --check`: clean.
