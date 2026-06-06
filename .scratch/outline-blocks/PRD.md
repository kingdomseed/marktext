# PRD — Academic Outline Editing for MarkText

**Status:** ready-for-agent  
**Created:** 2026-06-06  
**Updated:** 2026-06-06 (AR-1–AR-11 grill rollup)  
**Fork:** kingdomseed/marktext → upstream PR to marktext/marktext `develop`  
**Domain glossary:** `CONTEXT.md`  
**Persistence ADR:** `docs/adr/0001-outline-markdown-serialization.md`

---

## Problem Statement

MarkText users who write ministry, legal, and academic study documents need hierarchical outlines where each depth uses a distinct numbering style (Roman → letter → decimal and deeper), and where Tab promotes the **entire block** — not inline spaces or list-style re-parenting. Today, plain paragraphs insert spaces on Tab; ordered lists use one marker style at every depth and require list-specific nesting rules. Manually typing `I.` / `A.` / `1.` prefixes is fragile and does not survive editing, save/reopen, block-level indent semantics, or print/PDF export. Users evaluating MarkText as an open-source alternative to Notion or Agenda for outline-heavy study work cannot get the outline behavior they need from lists, headings, or blockquotes alone.

---

## Solution

Add **outline items** as a first-class block type in the production editor engine, gated behind an **opt-in preference** (default off). Each outline item has a **structural marker** computed from **outline depth**, **outline group**, and sibling order — separate from **body text**. Users enable outline mode in settings, create outline items via quick-insert or Turn Into, and edit with Tab (block-level indent with **reparenting cascade**), Shift+Tab (outdent), and Enter (same-depth sibling or empty exit). Documents persist using **structural markers in markdown** (ADR-0001). HTML, PDF, and print use a **hybrid export seam** so outlines render correctly for ministry workflows. Depth supports levels 1–7. Implementation ships in the legacy production engine first; TypeScript engine parity is deferred.

---

## User Stories

### Enabling outline mode

1. As a study-document author, I want to enable outline blocks in MarkText preferences, so that I can opt into outline editing without changing default behavior for other users.
2. As a study-document author, I want outline mode to be off by default, so that existing documents and new users are not surprised by new import rules.
3. As a study-document author, I want a clear preference label and description in the Markdown settings section, so that I understand what enabling outline blocks does.
4. As a study-document author, I want outline quick-insert and Turn Into entries hidden when the preference is off, so that the UI stays minimal per MarkText philosophy.
5. As a study-document author, I want enabling the preference to update the UI and creation paths immediately without restarting the app, understanding that structural recognition of existing marker-like paragraphs in the open document requires save/reopen or reload (footnote-mirror), so that I can try outline mode without surprise re-parsing.
6. As a study-document author, I want no detection hint when opening a file with marker-like lines while outline mode is off, so that I am not nagged — opting in via settings is sufficient (footnote-mirror discoverability).
7. As a study-document author, I want disabling outline mode mid-session to keep existing outline items editable and exportable while stopping new import/create/paste recognition, so that toggle-off does not destroy my document (footnote-mirror disable).

### Creating outline items

8. As a study-document author, I want to create an outline item from an empty paragraph via the `@` quick-insert menu, so that I can start an outline without memorizing markdown syntax.
9. As a study-document author, I want to turn a plain paragraph into an outline item via the front-menu Turn Into submenu, so that I can convert existing text into outline structure.
10. As a study-document author, I want the first outline item I create in a fresh context to use depth 1 with upper-Roman unless outline continuation applies, so that top-level points match my study-document convention.
11. As a study-document author, I want new documents to open with a plain paragraph (not a pre-created outline item), so that default-off behavior stays consistent — I create my first outline explicitly when ready.
12. As a study-document author, I want outline items to be visually distinct from list items, so that I do not confuse outline depth with GFM list nesting.

### Block-level indent, depth, and groups

13. As a study-document author, I want Tab to increase the outline depth of the current outline item (moving the whole block), so that indenting matches Notion/Agenda-style outline editing.
14. As a study-document author, I want Shift+Tab to decrease outline depth by one level, so that I can outdent without deleting content.
15. As a study-document author, I want Tab at depth 7 to do nothing (not insert inline spaces), so that I do not accidentally break outline structure at the maximum depth.
16. As a study-document author, I want Tab with a collapsed cursor to affect the outline item (same as lists), so that block indent works in the common typing flow.
17. As a study-document author, I want each depth to show the correct marker style automatically, so that I never manually retype `I.` / `A.` / `1.` when promoting or demoting levels.
18. As a study-document author, I want depth 1–7 markers to follow the fixed academic sequence (Roman → letter → decimal → lower letter → lower Roman → parenthetical decimal → parenthetical lower-alpha), so that my outlines match ministry/legal conventions.
19. As a study-document author, I want sibling outline items at the same depth to renumber automatically when I insert, delete, or move items, so that marker sequences stay correct without manual fixes.
20. As a study-document author, I want block-level indent to apply in the WYSIWYG view without inserting leading spaces into body text, so that export and source semantics stay clean.
21. As a study-document author, I want outline continuation across paragraphs and other non-outline blocks within a group, so that `III.` can follow `II.` even with prose between them.
22. As a study-document author, I want to start a new outline group explicitly via a front-menu action on the current outline item (**New outline group**), so that a later `I.` or `XI.` does not auto-reset just because of intervening content.
23. As a study-document author, I want Tab/Shift+Tab reparenting to move following same-depth siblings under the moved item when indenting, so that promoting a point absorbs its siblings correctly.

### Enter, Backspace, and editing flow

24. As a study-document author, I want Enter in an outline item with text to create a new same-depth sibling below, so that I can add points quickly (Enter does not increase depth — Tab does).
25. As a study-document author, I want Enter on an empty outline item to exit outline structure (depth 1 → plain paragraph; depth 2–7 → outdent one level with cascade), so that I can end a section without ghost items.
26. As a study-document author, I want Backspace at the start of an outline item body to merge with the immediately adjacent same-depth sibling, outdent, or exit to plain paragraph per context, so that keyboard editing feels natural.
27. As a study-document author, I want Backspace not to merge across paragraphs, headings, or lists even when a logical outline sibling exists earlier, so that intervening content is preserved.
28. As a study-document author, I want to edit body text without the cursor passing through the structural marker, so that markers behave like list bullets — display chrome, not editable prefix.
29. As a study-document author, I want multi-line body text within one outline item to stay a single outline item with continuation lines aligned under body text, so that long explanations do not split into unwanted siblings.
30. As a study-document author, I want Shift+Enter to insert a line break within the same outline item body, so that soft breaks behave like lists today.

### Paste and import behavior

31. As a study-document author, I want pasting text that looks like a marker (`A. footnote`) into the middle of existing body text to remain literal body text, so that pasted references are not stripped or reinterpreted.
32. As a study-document author, I want paste of new lines to use the same structural rules as import, so that paste and open-file behavior stay consistent.
33. As a study-document author, I want opening a markdown file with structural outline markers to recreate outline items when outline mode is enabled, so that save/reopen round-trips my study outline.
34. As a study-document author, I want imported outline lines to derive depth from marker pattern plus leading indent when both agree, so that nested structure is restored correctly.
35. As a study-document author, I want opening a file with `I.` / `A.` lines to leave them as plain paragraphs when outline mode is disabled, so that enabling the feature later is my explicit choice.
36. As a study-document author, I want structural import to apply only when outline mode is enabled, so that I can share markdown with users who do not use outline blocks.
37. As a study-document author, I want ambiguous `N.` lines resolved by preceding list or outline context, so that shared markdown does not force the wrong block type.
38. As a study-document author, I want exported markdown to show computed structural markers and indentation readable in any text editor, so that my documents remain portable outside MarkText.

### Save, reopen, and source mode

39. As a study-document author, I want to save a document with outline items and reopen it with the same depth structure and body text, so that I trust MarkText for long-term study notes.
40. As a study-document author, I want source-code mode to display structural markers in the file, so that I can diff and hand-edit markdown like I do with lists today.
41. As a study-document author, I want switching between WYSIWYG and source mode to preserve outline structure via full re-import, so that dual-mode editing does not corrupt depth.
42. As a study-document author, I want hand-edited markers in source to normalize to structure-derived values on re-import, except restart roots after a group-start marker or WYSIWYG restart, so that casual edits do not desync numbering permanently.
43. As a study-document author, I want outline markdown export to follow the same structural-marker philosophy as ordered-list export, so that behavior is consistent across MarkText.

### Transforms and coexistence with other blocks

44. As a study-document author, I want to turn an outline item into a plain paragraph when needed, with nested items promoting one depth level, so that I am not locked into outline structure forever.
45. As a study-document author, I want Turn Into between outline items, paragraphs, headings, blockquotes, and other paragraph-like blocks to follow explicit rules, so that I can restructure documents without copy-paste workarounds.
46. As a study-document author, I want Turn Into between outline items and list items to require pivoting through a plain paragraph, so that I do not get lossy list/outline conversions.
47. As a study-document author, I want multiline Turn Into blocked when any outline item is involved, so that batch transforms do not corrupt outline structure.
48. As a study-document author, I want outline Tab handling to run before plain-paragraph inline Tab (space insertion), so that Tab in an outline item never inserts indentation spaces into body text.
49. As a study-document author, I want typed-space four-space code-block conversion to remain separate from Tab-based outline indent, so that outline editing does not accidentally create code blocks.
50. As a study-document author, I want outline items to coexist with headings, blockquotes, lists, and code blocks in one document, so that I can mix outline study notes with other markdown content.
51. As a study-document author, I want Enter and Tab at outline boundaries next to lists or headings to follow normal outline rules without special casing, so that keyboard behavior stays predictable.

### HTML, PDF, and print export

52. As a study-document author, I want outline items in HTML and PDF export to show correct structural markers and cumulative indent, so that printed study notes match what I see in the editor.
53. As a study-document author, I want multi-line outline bodies in PDF/HTML to align continuation lines under body text, so that printed outlines remain readable.
54. As a study-document author, I want group-start sentinels omitted from printed output, so that ministry PDFs have no stray HTML comments.

### Localization and quality

55. As a study-document author, I want quick-insert and front-menu labels for outline items in all bundled source locale files for this contribution, so that the feature does not rely on English fallback for shipped UI.
56. As a study-document author, I want outline structural markers visible and aligned in the editor theme, so that deep outlines remain readable.

### Upstream contribution

57. As a contributor, I want a suggestion issue filed on marktext/marktext before the PR, so that the feature follows upstream contributing etiquette.
58. As a contributor, I want the PR to target the `develop` branch with a linked issue, so that it meets merge requirements.
59. As a contributor, I want screen recordings demonstrating Tab, Enter, Shift+Tab, preference toggle, save/reopen, and export, so that reviewers can verify outline UX without building locally.
60. As a contributor, I want unit tests for markdown import/export round-trip and HTML export, so that structural markers and depth survive serialization and print paths.
61. As a contributor, I want E2E tests for the primary outline editing flow, so that desktop integration regressions are caught in CI.
62. As a contributor, I want `pnpm run lint` and existing test suites to pass, so that CI gates are satisfied before merge.
63. As a maintainer reviewing the PR, I want JSDoc on new public methods in the production engine, so that the change meets code documentation standards.

---

## Implementation Decisions

### Engine and delivery

- Implement in the **production legacy editor engine** first. TypeScript rewrite parity deferred.
- Fork **kingdomseed/marktext** → upstream PR to **marktext/marktext** `develop` after suggestion issue.
- Terminology and behavior follow `CONTEXT.md` and ADR-0001.

### Block model (AR-1)

- New block type **outline item** — not `ol`/`li`, not an `outline-list` container.
- **Flat** outline items at document root; body in child paragraph block; `depth` 1–7 on each item.
- **Outline groups** are logical: implicit parent and siblings apply only within the same group.
- **Outline continuation** across any non-outline blocks within a group; **outline restart** only via **New outline group** front-menu action on outline item or group-start sentinel — never from intervening content alone. Sets `groupStart` on restart root; custom markers (`XI.`) per AR-6 (source edit or optional prompt).
- **Implicit parent:** nearest preceding item at depth − 1 in the same group.
- **Outline siblings:** same depth + same implicit parent in the same group; marker index resets per parent.
- **Tab / Shift+Tab:** symmetric **reparenting cascade** — following contiguous same-depth siblings after the moved item become its children; deeper descendants stay under the moved item; markers recompute.
- Persistence: derived sibling markers at export; `start` on restart root when marker ≠ default sequence; `groupStart` on restart root (flat analog of new `ol`).

### Indent and markdown shape (AR-2)

- Reuse **`listIndentation`** pref (DFM / 1–4 spaces) — no separate outline indent pref.
- **Cumulative** depth stacking: each level adds parent `markerWidth + (listIndentationCount − 1)`; DFM aligns to 4-space grid.
- **Outline body continuation indent:** continuation lines align under body text after marker (list-mirror).
- Import: **indent + marker must agree** or line → plain paragraph.
- Group boundary: export `<!-- mt:outline-group-start -->` before restart roots; consumed lexer token sets `groupStart` on next item — no WYSIWYG block; invisible in HTML/PDF export.

### Import lexer placement

- Outline line lexer must run **before** the indented-code rule in the marked lexer when `outlineBlocksEnabled` is on — cumulative outline indent (4+ spaces) would otherwise match code blocks and break round-trip.

### Import precedence (AR-3)

- Pref **off:** no outline lexer.
- Pref **on:** indent + marker must agree for outline; 0-indent `1.` → list; 0-indent `I.` → outline d1.
- Ambiguous `N.`: **context continuation** from preceding list or outline chain.
- Fall-through: try list, then paragraph if outline rules not satisfied.
- Task lists, `1)` delimiters: unchanged GFM behavior.

### Enter, Backspace, Shift+Enter (AR-4)

| Input | Result |
|-------|--------|
| Enter (body has text) | Same-depth sibling below |
| Enter (empty body) | d1 → plain `p`; d2–7 → outdent + cascade |
| Shift+Enter | Line break within same outline item body |
| Backspace at body start (has text) | Adjacent same-depth sibling → merge; else d2–7 first under parent → outdent + cascade; d1 no adjacent sibling → plain `p` |
| Backspace at body start (empty) | Delete item; renumber siblings |
| Backspace merge scope | **Immediately adjacent** same-depth sibling only (AR-8) |

### Opt-in seams and toggle (AR-5)

- **Seam 1:** lexer / import / paste gated by `outlineBlocksEnabled`.
- **Seam 2:** UI + runtime — hide `@`/Turn Into; guard typed triggers; block new outline creation when off.
- Wire: desktop preferences → `setOptions({ outlineBlocksEnabled }, true)` (footnote pattern).
- **Enable mid-session:** no auto re-import; `I.` paragraphs stay paragraphs until reopen/reload.
- **Disable mid-session:** existing outline items stay editable and export unchanged; blocks new import/create/paste recognition.

### Source ↔ WYSIWYG (AR-6)

- Source → WYSIWYG: full `importMarkdown` re-parse (`setMarkdown`).
- Within group: markers **structure-derived** from depth + position.
- **Restart root exception:** after sentinel or WYSIWYG restart — honor written marker; sets `groupStart` + `start`.
- New group in source: requires sentinel; marker edit alone does not start new group.

### Paste (AR-7)

- Same path as import: `pasteHandler` → `markdownToState` with outline lexer when pref on.
- Mid-body paste: literal text (no strip).
- Multi-line / block paste: structural when import would be; validate in QA.

### Turn Into and boundaries (AR-8)

| From → To | Allowed | Notes |
|-----------|---------|-------|
| Paragraph → outline | Yes | **Outline turn-into:** continuation depth or d1 |
| Heading ↔ outline | Yes | Heading strips `#`; outline → heading promotes children one level |
| Blockquote/code/etc. → outline | Yes | Same depth rules; wrapper removed |
| Outline → paragraph | Yes | **Outline turn-out:** children promote one level |
| Outline → heading/blockquote/code/… | Yes | Mirror paragraph targets; children promote on wrapper removal |
| Outline ↔ list | **No** | Pivot through plain paragraph |
| Multiline selection + outline | **No** | Single-block only when outline is source or target |
| Enter/Tab vs neighbors | No special rules | Empty Enter exits; Tab changes depth |

### HTML, PDF, and print export (AR-9)

- **Required** for contribution — not deferred.
- **Flat `outline-item` HTML:** explicit marker span + cumulative indent + body — not nested `<ol>`.
- **Hybrid export seam:** `Muya.exportStyledHTML()` invokes block-tree path when outline items present; existing `marked()` for non-outline slices interleaved in document order; shared marker/indent helpers — minimal exporter rewrite. Single walk preferred over independent `ExportMarkdown` instances per slice (preserve list state at boundaries).
- **Body continuation:** mirror markdown alignment in HTML/PDF.
- **Group-start sentinel:** invisible everywhere (block-tree omit + `marked()` consume).
- **Styles:** `exportStyle.css` in export bundle — not editor theme.
- `marked()` alone is insufficient (depth-3 `1.` → list; 4-space indent → code block risk).

### Discoverability and new documents (AR-10, AR-11)

- **No hints** when pref off and file has marker-like lines (footnote-mirror).
- **New documents** always open with plain paragraph — US-9 dropped; first outline via `@` or Turn Into when pref on.

### Marker and paste semantics

- Computed structural markers; body excludes markers.
- Paste into existing body at cursor: literal text always.

### Opt-in preference

- `outlineBlocksEnabled`, **default false**.
- Preference UI in Markdown settings (footnote / superSubScript pattern).

### Keyboard handlers

- Tab / Shift+Tab: before `insertTab` and before typed-space code trap; block-level depth change.
- Tab at depth 7: no-op (no inline spaces).
- Collapsed cursor: Tab affects outline item (match lists).

### Rendering (WYSIWYG)

- Structural markers as non-editable chrome; separate from body contenteditable.
- Editor theme CSS for marker widths and indent; distinct from export CSS.

### Localization

- v1 contribution: add new outline UI strings to all bundled source locale files; minified locale files are generated by `pnpm run minify-locales`.

### Contributor / PR process

| Step | Requirement |
|------|-------------|
| 1 | Suggestion issue on marktext/marktext |
| 2 | Implement on branch from `develop` |
| 3 | JSDoc on new public engine methods |
| 4 | `pnpm run lint` + tests pass |
| 5 | PR to `develop` with `Closes #NNN` |
| 6 | Screen recordings: pref on/off, `@` create, Tab/Enter/Shift+Tab, paste literal, save/reopen, source mode, HTML/PDF export spot-check |

### Proposed preference schema shape

```json
"outlineBlocksEnabled": {
  "description": "Enable academic-style outline blocks (Roman/letter/decimal hierarchy with block-level Tab indent).",
  "type": "boolean",
  "default": false
}
```

---

## Testing Decisions

### What makes a good test

- Assert **observable behavior** only: markdown strings, HTML output, DOM-visible markers, depth/marker outcomes — not private handler names or block keys.
- Prefer **highest existing seams** before new harnesses.

### Test seams (confirmed)

| Priority | Seam | What it proves |
|----------|------|----------------|
| 1 | **Desktop E2E (Playwright)** | Enable pref → `@` create → Tab/Enter/Shift+Tab → save → reopen → structure intact. Prior art: `test/e2e/`. |
| 2 | **Unit — markdown round-trip** | Import + ExportMarkdown: three fixture trees × `listIndentation` 1, 2, dfm — (1) minimal index `I./A./1./…`; (2) index 2 `II./B./2./…`; (3) wide markers `XIV./J./42./…`. Prior art: `markdown-list-indentation.spec.ts`. |
| 3 | **Unit — HTML export** | Hybrid export seam: same fixtures; assert `outline-item` markup, markers, indent/continuation, no `<ol>`/code misparse, sentinel absent. **Required for contribution.** |
| 4 | **Unit — preference gating** | Pref off → `I.` paragraphs; pref on → outline items. |
| 5 | **Unit — paste MERGE** | Mid-body paste `A. note` stays literal. |

Lower seams (direct handler unit tests) only if higher seams cannot catch a regression.

### Modules under test

- Production engine markdown import/export and HTML export hybrid seam.
- Desktop preference → engine options wiring.
- E2E host (Chromium).

### CI expectations

- Desktop `lint`, `test`, `e2e` must pass.

---

## Out of Scope

- TypeScript rewrite parity (`@muyajs/core`).
- Desktop cutover to TS engine.
- `listIndentation: 'tab'` (known dead).
- Stripping marker-like text on mid-body paste.
- Depth beyond 7.
- Custom per-user marker sequences.
- Plugins / third-party outline formats.
- **US-9** auto outline on new document (dropped).
- **Detection hints** when pref off (AR-10 — silent by design).
- Direct outline ↔ list Turn Into.
- Automatic migration of plain paragraphs that look like outlines when pref enabled mid-session (reopen required).

---

## Further Notes

### Grill and adversarial review

- Grill Q1–Q7 locked in investigation phase.
- Adversarial review AR-1–AR-11 resolved via grill-with-docs (2026-06-06); this PRD is the rollup.
- Minor PRD clarifications folded in: collapsed-cursor Tab; typed-space code trap vs Tab; `OUTLINE-BLOCKS-PLAN.md` §5–§6 superseded.

### Suggested implementation order

1. Preference schema + UI + engine option wire.
2. Block model + WYSIWYG render + theme CSS.
3. Tab / Enter / Backspace handlers.
4. Export/import lexer + `normalizeOutlineItem`.
5. Turn Into matrix + UI filtering.
6. Hybrid HTML export seam + `exportStyle.css`.
7. Unit tests (markdown + HTML fixtures).
8. E2E primary flow.
9. Upstream suggestion issue → PR with recordings.

### Local implementation tracking

**Next:** break into `.scratch/outline-blocks/issues/` via **`/to-issues`** (see `docs/HANDOFF.md`). Design doc: `.scratch/outline-blocks/DESIGN.md`.

### Upstream issue draft

- **Summary:** Academic outline blocks with Roman/letter/decimal hierarchy and block-level Tab indent.
- **Problem:** Lists cannot mix marker styles per depth; Tab on paragraphs inserts spaces; manual prefixes do not round-trip; print/PDF needs outline-aware export.
- **Proposed solution:** New outline item block, opt-in preference, structural markdown (ADR-0001), hybrid HTML/PDF export.
- **Alternatives rejected:** Nested OL + CSS; leading-tab encoding; headings as outline substitute.
