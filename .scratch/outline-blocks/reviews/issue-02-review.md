# Issue 02 review — Outline utilities and block model scaffolding

**Spec:** `.scratch/outline-blocks/issues/02-outline-utils-block-model.md`  
**PR:** https://github.com/kingdomseed/marktext/pull/2  
**Reviewed:** 2026-06-06  
**Verdict:** **Approve after incorporated fixes**

## Summary

The original PR satisfied the issue-02 scaffold shape: `outlineUtils`, flat `outline-item`, `createOutlineItem()`, `outlineCtrl` stub, and `AG_OUTLINE_ITEM`. Review found a few helper-edge issues that would have leaked into later import/export slices. Those are now fixed locally.

## Findings incorporated

- `createOutlineItem(depth)` accepted invalid depths. It now rejects non-1–7 depths with `RangeError`, and the test covers depths 0 and 8.
- Alphabetic markers broke after `Z` because marker formatting used raw character codes. `computeMarker()` now emits `AA.`, `aa.`, and `(aa)` at sibling index 27, and marker validation accepts multi-letter alpha markers.
- `indentForDepth()` only had minimal-parent marker math. It now accepts optional ancestor marker strings so later import/export code can preserve marker-width-aware indent for wide parents such as `XIV.`.
- `indentForDepth()` returned `NaN` for the app's allowed `'tab'` list indentation preference. It now mirrors `ExportMarkdown` and falls back to one-space behavior for non-number, non-`dfm` values.
- Overlapping Roman/alpha marker patterns are now documented in `outlineUtils.js` and covered by tests showing that `depthFromIndent()` disambiguates by combining marker style with indent.
- Public `ContentState` methods/stubs now have JSDoc comments.

## Verification

```bash
pnpm -C packages/desktop exec vitest run test/unit/specs/outline-utils.spec.ts
pnpm exec eslint packages/muyajs/lib/utils/outlineUtils.js packages/muyajs/lib/contentState/outlineCtrl.js packages/muyajs/lib/contentState/index.js packages/desktop/test/unit/specs/outline-utils.spec.ts
pnpm run lint
pnpm run test
```

Results:

- Focused outline suite: 10 tests passed.
- Targeted ESLint: 0 errors; existing Node module-type warning only.
- Full lint: 0 errors, 77 pre-existing warnings.
- Full unit tests: 13 files passed, 575 tests passed.

## Devin note

The Devin job that started from the terminal began before these local fixes. The user reported Devin completed with no bugs found. Its output should be considered a clean review of the original PR commit unless the branch is pushed and Devin is rerun.
