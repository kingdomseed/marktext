# Issue 01 review — Outline preference and engine option wire

**Spec:** `.scratch/outline-blocks/issues/01-outline-preference-engine-wire.md`  
**Reviewed:** 2026-06-06  
**Verdict:** **Approve**

## Summary

Implementation matches issue 01 scope, follows the footnote option-wire pattern, and satisfies all acceptance criteria. Vitest and lint green after incorporation.

## Must-fix

None.

## Incorporated from review

- Test hygiene: `document.body.removeChild(container)` in slice 2 `finally` block.

## Nice-to-have (deferred)

- Tracer asserting `new Muya(el).options.outlineBlocksEnabled === false` at construction time.
- PR description note that muyajs has no runtime consumer until issue 06.

## Footnote pattern parity

| Seam | Match |
|------|-------|
| `MUYA_DEFAULT_OPTION` | ✅ |
| `schema.json` + `preference.json` | ✅ |
| Pinia + shared types | ✅ |
| `markdown/index.vue` bool + notes | ✅ |
| `editor.vue` watch + initial options | ✅ |
| `en.json` extensions + search.items | ✅ |

Out of scope correctly deferred: lexer (06), UI gating (08).