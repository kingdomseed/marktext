# Handoff — MarkText Outline Blocks

> **Created:** 2026-06-06  
> **Updated:** 2026-06-06 (orchestration workflow added)
> **Repo:** `/Users/jholt/marktext` (fork: https://github.com/kingdomseed/marktext)  
> **Relaunch:** Read this file + `AGENTS.md` + `CONTEXT.md` + `.scratch/outline-blocks/PRD.md` first.

---

## Agent role — orchestration (read every session)

**I am the orchestrator. I do not implement AFK issue work myself.**

My job each session:

1. **Spawn subagents** to complete the current AFK issue (`.scratch/outline-blocks/issues/NN-*.md`). One issue per cycle unless dependencies allow parallel tracks. Subagents follow TDD slices in the issue file.
2. **Spawn review agents** on the subagents' work. Reviewers check:
   - Matches codebase conventions (`AGENTS.md`, existing patterns in touched files)
   - Simple — YAGNI, KISS; no speculative abstractions
   - No new technical debt or workarounds that bypass established patterns
3. **Review agents write findings to docs** — e.g. `.scratch/outline-blocks/reviews/PR-NN-review.md`. These files are **temporary**; delete after findings are incorporated.
4. **I incorporate** appropriate reviewer changes into the code (or send subagents back with specific fixes). I do not rubber-stamp review output.
5. **Open a PR** into the fork (`kingdomseed/marktext`), one PR per issue slice where practical, targeting `feat/outline-editing-setup` or a child branch per DESIGN PR plan.
6. **Final step per PR:** run Devin review and save output locally:
   ```bash
   npx devin-review https://github.com/kingdomseed/marktext/pull/NNN
   ```
   Write the result to `.scratch/outline-blocks/reviews/devin-review-PR-NNN.md` for human review before merge.

**HITL issue 00** (upstream suggestion) is user-driven; orchestrator may assist but does not substitute for the user filing on `marktext/marktext`.

---

## Mission

Add **academic-style outline editing** to MarkText — the kind used in ministry/legal study documents:

```
I.   Top-level (Roman)
  A. Second-level (letter)
    1. Third-level (decimal)
    … through seven depth levels (see CONTEXT.md marker table)
```

**Must-have UX:** Tab promotes the **entire block** (not inline/first-line spaces). Enter creates same-depth sibling. Shift+Tab outdents. Persists across save/reopen.

**Reference apps:** Notion (outline mode), Agenda.

---

## Artifact map

| Artifact | Path | Role |
|----------|------|------|
| Domain glossary | `CONTEXT.md` | Terms only — grill-derived vocabulary |
| PRD (spec) | `.scratch/outline-blocks/PRD.md` | **`ready-for-agent`** — AR-1–AR-11 rollup; source for `to-issues` |
| Design doc | `.scratch/outline-blocks/DESIGN.md` | Implementation architecture + 10-PR plan |
| Implementation issues | `.scratch/outline-blocks/issues/` | 11 slices (00–10); TDD-first; `REVIEW.md` |
| PR / Devin reviews (temp) | `.scratch/outline-blocks/reviews/` | Review-agent + `devin-review` output; delete after incorporated |
| Persistence ADR | `docs/adr/0001-outline-markdown-serialization.md` | Accepted |
| Investigation plan | `docs/OUTLINE-BLOCKS-PLAN.md` | §1–§4 historical; §5–§7 **superseded** by PRD |
| Agent guide | `AGENTS.md` | Build/run + outline code paths |
| This handoff | `docs/HANDOFF.md` | Session entry + locked decisions |

---

## What we did (cumulative)

### Phase 1 — Investigation (complete)

- Traced Tab → `tabCtrl.js` → `insertTab` (paragraph) vs `indentListItem` (list).
- Four subagents verified diagnosis; engine = **muyajs**, not muya TS.
- Documented UI trace: `@` / Turn Into → `updateParagraph()`.
- Wrote `CONTEXT.md`, `OUTLINE-BLOCKS-PLAN.md`, `AGENTS.md`.

### Phase 2 — Grill-with-docs Q1–Q7 (complete)

All seven decisions locked. See **Locked decisions** below.

### Phase 3 — PRD + adversarial review (complete)

- Published `.scratch/outline-blocks/PRD.md` via `to-prd`.
- Ran **4 parallel adversarial reviewers**; user resolved gaps via `/grill-with-docs` one item at a time.

### Phase 4 — Grill queue AR-1–AR-11 (complete)

- All adversarial findings locked; `CONTEXT.md` glossary updated inline.
- AR-10/AR-11 inferred from prior decisions (silent discoverability; US-9 dropped).

### Phase 5 — PRD rollup + design review (complete)

- PRD updated with full AR-1–AR-11 decisions (63 user stories, implementation + test sections).
- Re-review: completeness + codebase alignment — no blockers for `to-issues`.
- Design doc: `.scratch/outline-blocks/DESIGN.md` (hybrid export seam, PR stack).

### Phase 6 — to-issues + adversarial review (complete)

- Published 11 issues under `.scratch/outline-blocks/issues/` (00 upstream HITL, 01–10 AFK).
- Each issue starts with **TDD approach** (RED → GREEN vertical slices).
- Adversarial review (`act-workflow-refine-spec` + plan-splitting) — findings in `issues/REVIEW.md`, applied to all issues.

### Not done yet

- Dev smoke test (`pnpm install && pnpm dev`).
- Implementation per issues 02–10 (issue 02 in progress).

---

## Current status

| Phase | State |
|-------|-------|
| Investigation | ✅ Complete |
| Grill Q1–Q7 | ✅ Locked |
| Grill AR-1–AR-11 | ✅ Locked |
| ADR-0001 (serialization) | ✅ Accepted |
| PRD rollup | ✅ `ready-for-agent` |
| Design doc + re-review | ✅ Complete — approve with changes (implementation detail) |
| **`to-issues`** | ✅ 11 issues in `.scratch/outline-blocks/issues/` |
| Issue adversarial review | ✅ `issues/REVIEW.md` — findings applied |
| Upstream suggestion (issue 00) | ✅ Filed: https://github.com/marktext/marktext/issues/4379 |
| Implementation issue 01 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/1 → `6e9b137` |
| Dev smoke test | ❌ Not run |
| Implementation issue 02 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/2 → `8283e2a` |
| Implementation issue 03 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/3 → `dfb87c6` |
| Implementation issue 04 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/4 → `4f6ba1d` |
| Implementation issue 05 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/5 → `d58eb26` |
| Implementation issue 06 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/6 → `e7fadb8` |
| Implementation issue 07 | ✅ Merged: https://github.com/kingdomseed/marktext/pull/7 → `310d022` |
| Implementation issue 08 | 🔄 Branch `feat/issue-08-ui-gating` — pending PR |
| Implementation (issue 09+) | ⏭️ **Next** |

---

## Locked decisions (grill Q1–Q7 — do not re-litigate)

| # | Decision | Locked answer |
|---|----------|---------------|
| 1 | Engine | **muyajs** first (desktop production) |
| 2 | Block model | **New outline item** (not `ol`/`li`) |
| 3 | Markers | **Computed structural markers**; paste into existing body = literal text |
| 4 | Max depth | **1–7 hard cap**; sequence through `(a)` at depth 7 |
| 5 | Persistence | **Structural markers in markdown** (ADR-0001) |
| 6 | Availability | **Opt-in** `outlineBlocksEnabled`, **default false** |
| 7 | Delivery | Fork **kingdomseed/marktext** → upstream PR to **`develop`** after issue |

---

## Adversarial review (2026-06-06)

**Method:** `act-workflow-refine-spec` × 4 lenses (Completeness, Codebase alignment, UX coherence, Data model).  
**Gate:** User selected **Discuss findings** → resolve via **grill-with-docs**, one item at a time, then update PRD.

### What the review validated

- Grill-locked decisions are coherent.
- Test seams (E2E + import/export round-trip + paste literal) are correct.
- Tab must intercept before `insertTab` in `tabCtrl.js` (not list `indentListItem`).
- Opt-in default off matches CONTRIBUTING “settings-activated / minimal default.”
- “Footnote pattern” applies to **lexer/import gating only** — UI hiding is **additional** work.

### AR-1 decisions (locked)

| Topic | Decision |
|-------|----------|
| Block shape | **Flat** `outline-item` at document root; body in child `p`; `depth` 1–7 on each item — not `ol`/`li`, not `outline-list` container |
| Outline groups | **Logical** groups within flat items; **continuation** across any non-outline blocks; **restart** only via explicit user action |
| Group persistence | List-aligned: derived sibling markers at export; `start` on restart root when ≠ default sequence; **`groupStart`** on restart root (flat analog of new `ol`) |
| Implicit parent | Nearest preceding item at depth − 1 **in same outline group** |
| Outline siblings | Same depth + same implicit parent **in same group**; marker index resets per parent |
| Tab / Shift+Tab | **Symmetric**; **reparenting cascade**: following contiguous same-depth siblings after moved item become its children; existing deeper descendants stay under moved item |
| vs lists | Copy persistence + `p` body shape; **do not** copy paragraph-auto-split; flat model kept because continuation across outside gaps requires logical groups |

### AR-11 decisions (locked — inferred from AR-1–AR-9, 2026-06-06)

| Topic | Decision |
|-------|----------|
| US-9 new-doc outline | **Drop** — new documents always open with a plain paragraph (same as lists/headings). With pref on, first outline via `@` quick-insert or Turn Into (US-6/US-7). No special new-doc outline item; avoids conflict with default-off + hidden UI (AR-5). |

### AR-10 decisions (locked — inferred from AR-1–AR-9, 2026-06-06)

| Topic | Decision |
|-------|----------|
| Marker-like lines, pref off | **Accept silent behavior** — no detection hint, banner, or prompt. `I.` / `A.` lines stay plain paragraphs (AR-3). User opts in via preference only (AR-5 footnote-mirror). Enabling pref mid-session does not re-import open doc; reopen/reload required for structural recognition. |
| Rationale | Matches footnote pattern (no `[^]` detection prompt) and MarkText minimal-default UI (PRD US-4). |

### AR-9 decisions (locked)

| Topic | Decision |
|-------|----------|
| HTML element model | **Flat outline-item:** explicit marker + cumulative indent + body; not nested `<ol>`. |
| Export path | **Hybrid block-tree seam:** existing `marked()` path for non-outline blocks; outline items only from block tree via muya, document-order interleave; share marker/indent helpers with `ExportMarkdown` — minimal exporter rewrite. |
| Multi-line body (HTML/PDF) | **Mirror markdown:** continuation lines align under body text after marker; same math as WYSIWYG / export markdown. |
| Group-start sentinel (export) | **Invisible everywhere:** omitted block-tree path; consumed on `marked()` path; no comment in HTML/PDF/print. |
| Export CSS | **`exportStyle.css`:** outline HTML/PDF/print styles in muyajs export bundle; not editor theme. |
| Tests | **Required for contribution:** unit tests on hybrid export seam — AR-2 fixture trees × `listIndentation` 1/2/dfm; assert `outline-item` markup, markers, indent/continuation, no list/code misparse, sentinel absent. |

### AR-8 decisions (locked)

| Topic | Decision |
|-------|----------|
| Paragraph → outline (Turn Into) | **Context continuation (B):** depth = nearest preceding outline item in same group; depth 1 if none. Body preserved; marker from group position. |
| Outline → paragraph (Turn Into) | **Promote one level (B):** nested items outdent one depth, stay in same group; body preserved. Not blocked when item has children. |
| Outline ↔ list (Turn Into) | **Deny both:** no direct conversion; pivot through plain paragraph. |
| Outline ↔ heading (Turn Into) | **Allow both:** heading → outline uses outline turn-into rules; outline → heading uses chosen H1–H6 + promote-one-level for nested items. |
| Backspace at body start (boundary) | **Immediate adjacent only:** merge only when previous block is same-depth outline sibling; gaps → outdent or plain-`p` exit per AR-4. |
| Outline → other types (Turn Into) | **Mirror paragraph:** same targets as paragraph (blockquote, code, HR, table, …); list denied. Nested items promote one level on wrapper-removing conversions. |
| Other types → outline (Turn Into) | **Allow:** same inbound sources as paragraph (blockquote, code, …) plus heading; list must pivot through paragraph. Depth via outline turn-into rules. |
| Multiline Turn Into + outline | **Deny outline only:** single-block only when any outline item is source or target; other multiline rules unchanged. |
| Enter / Tab (cross-type neighbor) | **No special rules:** non-empty Enter → same-depth sibling (AR-4), inserted at cursor regardless of next block type; empty Enter → exit (d1→plain `p`, d2–7→outdent+cascade, AR-4); Tab/Shift+Tab → depth change (AR-1). Depth change is Tab, not Enter. |

### AR-7 decisions (locked)

| Topic | Decision |
|-------|----------|
| Paste path | **Same as import** — `pasteHandler` → `markdownToState` with outline lexer when pref on; no separate “paste off” flag for v1 |
| Mid-body paste | US-30 — literal text in body (no strip); test MERGE path with outline items |
| Block / multi-line paste | Structural if import would be (outline items when pref on + valid indent/marker); **test in QA**, adjust if wrong |
| Pref off | Unchanged — no outline lexer |

### AR-6 decisions (locked)

| Topic | Decision |
|-------|----------|
| Source → WYSIWYG | Full `importMarkdown` re-parse (`setMarkdown`) — not incremental merge |
| Marker text (within group) | **Structure-derived:** depth + position in group → marker; casual edits outside app (`B.`→`D.`, `II.`→`V.`) normalize on re-import |
| **group-start root** | **Exception:** item after sentinel or WYSIWYG restart — **honor written marker** (`I.`, `XI.`, etc.); sets `groupStart` + `start`; not overwritten by position in file |
| New groups in source | User must write `<!-- mt:outline-group-start -->` before the line; editing marker alone does **not** start a new group |
| Body / indent edits | Body preserved; indent → depth (AR-2) |

### AR-5 decisions (locked)

| Topic | Decision |
|-------|----------|
| Two seams | (1) **Lexer/import/paste** gated by `outlineBlocksEnabled`; (2) **UI + runtime handlers** — hide `@`/Turn Into, guard typed triggers; **new** outline creation blocked when off |
| Wiring | `editor.vue` watch → `setOptions({ outlineBlocksEnabled }, true)` — same as `footnote` |
| Enable mid-session | **Footnote-mirror:** no auto re-import; existing `I.` paragraphs stay paragraphs until reopen/reload |
| Disable mid-session | **Footnote-mirror:** existing outline items **stay** in block tree + remain editable; export unchanged; off blocks **new** import/create/paste recognition |
| `setOptions` | Updates options + re-render only — does not re-parse open document |

### AR-4 decisions (locked)

| Topic | Decision |
|-------|----------|
| Enter (non-empty body) | New **same-depth sibling** outline item below (US-24) |
| Enter (empty body) | **List-mirror:** depth 1 → plain `p`; depth 2–7 → outdent one level + AR-1 cascade |
| Shift+Enter | Soft/hard line break **within** same outline item body (US-28 — unchanged list behavior) |
| Backspace at body start (has text) | Previous same-depth sibling → **merge**; first under parent at depth 2–7 → **outdent** + cascade; depth 1 with no prior sibling → **plain `p`** |
| Backspace at body start (empty) | **Delete** item; renumber siblings |

### AR-3 decisions (locked)

| Topic | Decision |
|-------|----------|
| Pref off | No outline lexer — existing list/paragraph behavior only |
| Pref on — default | **Indent + marker must agree** (AR-2); 0-indent `1.` → list; 0-indent `I.` → outline d1 |
| Ambiguous `N.` (same bytes, list nest vs outline d3) | **Context continuation** — preceding list chain → list; preceding outline chain → outline |
| Fall-through | Line doesn't satisfy outline rules in outline context → try list, then paragraph (not forced outline) |
| Non-issues | Task lists (`[ ]`/`[x]`), `1)` delimiters, etc. — unchanged GFM list lexer; outline depth-3 is `1.` only |

### AR-2 decisions (locked)

| Topic | Decision |
|-------|----------|
| Indent setting | Reuse existing **`listIndentation`** pref (DFM / 1–4 spaces) — no separate outline pref |
| Depth stacking | **List-mirror cumulative**: each depth adds parent `markerWidth + (listIndentationCount − 1)`; DFM aligns to 4-space grid |
| Body continuation | **Align under body text** after marker (`indent + markerWidth`) — same as `normalizeListItem` |
| Import depth | **Indent + marker must agree** — spaces → depth via inverse stack; marker must match depth style table; mismatch → plain paragraph |
| Group boundary in markdown | **Footnote-pattern consumed sentinel:** export `<!-- mt:outline-group-start -->` before restart roots; outline-gated lexer token → `groupStart` on next item, **no WYSIWYG block**; **only** sentinel + WYSIWYG restart (no marker-regression inference) |
| Test fixtures | **Three trees:** (1) minimal index (`I./A./1./…`); (2) index 2 (`II./B./2./…`); (3) wide markers (`XIV./J./42./j./xiv./(99)/(z)` or similar). Run at `listIndentation` **1, 2, and dfm** |

### Review queue — resolve with grill-with-docs

Work **in order**. After each item: update PRD (+ `CONTEXT.md` or ADR if glossary/architecture changes). Mark item ✅ in this file.

#### Critical (blocks implementation)

| ID | Topic | Problem summary | Grill focus |
|----|-------|-----------------|-------------|
| **AR-1** | **Block tree + sibling scope** | ✅ **Locked** (grill 2026-06-06). See **AR-1 decisions** below. | — |
| **AR-2** | **Indent ↔ depth** | ✅ **Locked** (grill 2026-06-06). See **AR-2 decisions** below. | — |
| **AR-3** | **Import precedence** | ✅ **Locked** (grill 2026-06-06). See **AR-3 decisions** below. | — |

#### Important (would cause rework)

| ID | Topic | Problem summary | Grill focus |
|----|-------|-----------------|-------------|
| **AR-4** | **Empty Enter + Backspace** | ✅ **Locked** (grill 2026-06-06). See **AR-4 decisions** below. | — |
| **AR-5** | **Opt-in seams + toggle** | ✅ **Locked** (grill 2026-06-06). See **AR-5 decisions** below. | — |
| **AR-6** | **Source-mode hand edits** | ✅ **Locked** (grill 2026-06-06). See **AR-6 decisions** below. | — |
| **AR-7** | **Paste policies** | ✅ **Locked** (grill 2026-06-06). See **AR-7 decisions** below. | — |
| **AR-8** | **Turn Into + boundaries** | ✅ **Locked** (grill 2026-06-06). See **AR-8 decisions** below. | — |
| **AR-9** | **HTML/PDF export** | ✅ **Locked** (grill 2026-06-06). See **AR-9 decisions** below. | — |
| **AR-10** | **Discoverability** | ✅ **Locked** (inferred 2026-06-06). See **AR-10 decisions** below. | — |
| **AR-11** | **US-9 new-doc outline** | ✅ **Locked** (inferred 2026-06-06). See **AR-11 decisions** below. | — |

#### Minor (folded into PRD rollup ✅)

- Collapsed-cursor Tab; typed-space code trap vs Tab; bundled source locale coverage; `OUTLINE-BLOCKS-PLAN.md` §5–§7 superseded.

---

## Next step

**Issue 08** (AFK): Creation UI, Turn Into matrix, and UI gating — TDD-first per `.scratch/outline-blocks/issues/08-creation-ui-turn-into.md`.

Issues 01–07 merged on `feat/outline-editing-setup` (`310d022`). Issue 00 upstream suggestion filed ([#4379](https://github.com/marktext/marktext/issues/4379)).

## Implementation order

```
00 (upstream, parallel) ─────────────────────────────┐
01 → 02 ─┬→ 03 → 04 → 05 → 08 → 10 ────────────────┤
         └→ 06 → 07 → 09 ──────────────────────────┘
```

1. Smoke test: `pnpm install && pnpm dev` (optional before 01).
2. Implement issues 01–10 per TDD slices; `pnpm run lint` + tests each PR.
3. Issue 10: E2E + recordings + upstream PR with `Closes #NNN`.

### Optional polish (non-blocking)

- Short grill on **custom restart marker UX** (`XI.` in WYSIWYG vs source-only) — PRD allows source edit per AR-6.

---

## Key code paths (do not re-investigate unless behavior changed)

### Production editor (muyajs)

| File | Role |
|------|------|
| `packages/muyajs/lib/contentState/tabCtrl.js` | Tab / Shift+Tab — outline branch **before** `insertTab` (~513+) |
| `packages/muyajs/lib/contentState/enterCtrl.js` | Enter — empty list item logic ~123–207 (reference for AR-4) |
| `packages/muyajs/lib/contentState/backspaceCtrl.js` | Backspace |
| `packages/muyajs/lib/contentState/paragraphCtrl.js` | `updateParagraph`, `isAllowedTransformation` |
| `packages/muyajs/lib/contentState/updateCtrl.js` | Inline triggers; **4-space code trap** on typed spaces (not Tab) |
| `packages/muyajs/lib/contentState/pasteCtrl.js` | Paste → `markdownToState` (AR-7) |
| `packages/muyajs/lib/utils/exportMarkdown.js` | `normalizeListItem` — export pattern |
| `packages/muyajs/lib/utils/importMarkdown.js` | Lexer options at load (footnote gating model) |
| `packages/muyajs/lib/ui/quickInsert/config.js` | `@` menu — filter when pref off (AR-5) |

### Desktop

| File | Role |
|------|------|
| `packages/desktop/src/renderer/.../editor.vue` | Muya options + `setOptions` watches |
| `packages/desktop/src/main/preferences/schema.json` | `outlineBlocksEnabled` |
| `packages/desktop/src/renderer/.../prefComponents/markdown/` | Pref UI |
| `packages/desktop/src/utils/exportHtml.js` / PDF path | AR-9 |

---

## Skills for this phase

| Skill | When | Who |
|-------|------|-----|
| **tdd** | Subagents follow RED → GREEN slices in each issue | Subagent |
| **implement** | Spawn subagent per AFK issue 01–10 | Orchestrator spawns |
| **review** / **check-work** | Spawn review agent after each implementation PR | Orchestrator spawns |
| **grill-with-docs** | Only if new open decisions emerge | Orchestrator + user |
| **devin-review** | Final gate per PR before merge | Orchestrator runs `npx devin-review` |

---

## User context

- Outline-heavy study documents (ministry/legal style); evaluating MarkText vs Notion/Agenda.
- Wants **no implicit spec** — adversarial findings grilled individually before implementation.
- Fork: kingdomseed; thorough upstream PR with issue, tests, screen recordings.

---

## What not to duplicate

- Investigation detail: `docs/OUTLINE-BLOCKS-PLAN.md` §1–§4  
- Full spec: `.scratch/outline-blocks/PRD.md`  
- Terms: `CONTEXT.md`  
- Build: `AGENTS.md`
