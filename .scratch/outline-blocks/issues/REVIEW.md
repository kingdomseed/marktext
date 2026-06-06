# Adversarial review — outline issues (2026-06-06)

**Method:** `act-workflow-refine-spec` dimensions (Completeness, Assumptions, UX coherence, Data model, Codebase alignment) + plan-splitting lens (vertical slice vs horizontal, TDD-first).

**Status:** Findings applied to issues 00–10. No blockers remain for implementation start.

---

## Cross-cutting findings (applied)

| Finding | Resolution |
|---------|------------|
| Issues 00–05 are horizontal foundation stack; no user-visible slice until 08 | Noted in issues 02, 03, 05; acceptable per DESIGN 10-PR plan |
| Footnote pattern splits option wire (01) vs lexer gating (06) | Issue 01 prior-art split |
| `tabCtrl.js` needs **two** hooks (~400 Shift+Tab, ~512 Tab) | Issue 04 |
| Backspace lives in `backspaceCtrl.js`, not `enterCtrl.js` | Issue 05 |
| Lexer outline rules before **`code` rule (~147)**, not footnote block | Issue 06 |
| Export emits outline items regardless of pref when in tree | Issue 07 slice 8 |
| `exportStyledHTML` single-walk hybrid contract | Issue 09 |
| E2E blocked by 06+07 (save/reopen), not just 08+09 | Issue 10 |
| TDD vertical slices required in every AFK issue | All issues start with `## TDD approach` |

---

## Per-issue summary

### 00 — Upstream suggestion
- **Important:** Inline ADR summary + PR/recording expectations → **applied**
- **Minor:** Comments table for issue number → **applied**

### 01 — Preference wire
- **Important:** Wrong footnote spec prior art for `setOptions` → **fixed** (split wire vs lexer)
- **Important:** Missing explicit file list → **applied**
- **Important:** US-4/6 scope boundary → **applied**

### 02 — Utils + block model
- **Critical:** `markerWidth` before `indentForDepth`; `createOutlineItem` on ContentState → **applied**
- **Important:** `walkOutlineGroups` group boundary stop → **applied**

### 03 — WYSIWYG render
- **Critical:** Selection/caret excludes marker; render file list → **applied**
- **Important:** Compute marker at render time → **applied**
- **Minor:** Parallel start with 04 after slice 1 → **noted**

### 04 — Tab cascade
- **Critical:** Dual `tabCtrl` hook + implicit parent (not `preSibling`) → **applied**
- **Important:** Sibling renumber slice; depth-1 Shift+Tab no-op → **applied**

### 05 — Enter/Backspace
- **Critical:** `backspaceCtrl.js` target; missing outdent-on-backspace slice → **applied**
- **Important:** Mid-body Enter split rule; don't copy list grandparent logic → **applied**

### 06 — Import lexer
- **Critical:** Lexer before code rule; token→block tree mirror of list → **applied**
- **Important:** Depth 4–7 slices; AR-6 negative (no sentinel = no new group) → **applied**
- **Minor:** Mid-body paste literal deferred to issue 10 → **noted**

### 07 — Export round-trip
- **Critical:** `case 'outline-item'` + `outlineUtils`; pref-off export → **applied**
- **Important:** Blocked-by includes 02; re-import normalization owned by 06 → **applied**

### 08 — Creation UI
- **Critical:** `paragraphCtrl` + `restartOutlineGroup` with `start` → **applied**
- **Important:** Blockquote Turn Into slices; pref-off editable existing items → **applied**

### 09 — Hybrid HTML export
- **Critical:** `renderHybridHtml` single-walk contract; desktop wiring → **applied**
- **Important:** No-outline regression slice; export vs editor class names → **applied**

### 10 — E2E capstone
- **Critical:** Blocked-by missing 06+07; E2E helpers unspecified → **applied**
- **Important:** Mandatory HTML spec in CI; paste literal slice → **applied**

---

## Plan-splitting verdict

| Issue | Slice type | TDD-first |
|-------|------------|-----------|
| 00 | Process HITL | N/A |
| 01 | Horizontal pref | ✅ Tracer + 3 slices |
| 02 | Horizontal utils | ✅ Pure functions first |
| 03 | Horizontal render | ✅ DOM tracer |
| 04 | Horizontal keyboard | ✅ Block-tree assertions |
| 05 | Horizontal keyboard | ✅ AR-4 row coverage |
| 06 | Horizontal import | ✅ Lexer + import seams |
| 07 | Horizontal export | ✅ Round-trip fixtures |
| 08 | **Vertical** UI+transform | ✅ Filter tracer first |
| 09 | Horizontal HTML | ✅ Hybrid regression |
| 10 | **Vertical** integration | ✅ E2E RED→GREEN |

**Overall:** Split matches DESIGN 10-PR plan. Horizontal early issues are intentional scaffolding; TDD tracer bullets added per issue. Ready for AFK agents on issues 01+.