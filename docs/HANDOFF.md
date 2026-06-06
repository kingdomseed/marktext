# Handoff — MarkText Outline Blocks

> **Created:** 2026-06-06  
> **Repo:** `/Users/jholt/marktext` (local clone of https://github.com/marktext/marktext)  
> **Relaunch:** Open this repo in your agent IDE; read this file + `AGENTS.md` + `CONTEXT.md` first.

---

## Mission

Add **academic-style outline editing** to MarkText — the kind used in ministry/legal study documents:

```
I.   Top-level (Roman)
  A. Second-level (letter)
    1. Third-level (decimal)
```

**Must-have UX:** Tab promotes the **entire block** (not inline/first-line spaces). Enter creates same-depth sibling. Shift+Tab outdents. Persists across save/reopen.

**Reference apps:** Notion (outline mode), Agenda.

---

## What we did this session

### 1. Investigated why MarkText fails today

Traced Tab key through production engine (`muyajs`):

- `keyboard.js` → `ContentState.tabHandler` (`tabCtrl.js`)
- Plain paragraph: `insertTab()` — inserts spaces at cursor (inline)
- List item: `indentListItem()` — AST re-parenting (requires previous sibling)
- No `outline-item` block type; `IParagraphState` is `{ name, text }` only

### 2. Spawned four verification subagents

All confirmed core diagnosis. Key corrections captured in plan doc:

- Desktop uses **`muyajs`**, not `packages/muya` TS rewrite
- `listIndentation: 'tab'` preference is **dead** (UI only)
- 4-space Tab can trigger **code block conversion** (`updateCtrl.js`)
- `getTOC()` is heading nav, not outline editing
- Multi-line Tab is **no-op** for paragraphs/lists (collapsed cursor required)

### 3. Documented preprocessing + UI trace

Mapped how new blocks enter the editor:

```
@ quick insert OR front-menu Turn Into
  → quickInsert/index.js selectItem()
  → contentState.updateParagraph(label, insertMode)
  → paragraphCtrl.js switch (paraType)
```

To add outline via UI: new `label` in `quickInsert/config.js` + new `case` in `updateParagraph()`.

### 4. Created agent docs

| Artifact | Path |
|----------|------|
| Domain glossary | `CONTEXT.md` |
| Implementation plan | `docs/OUTLINE-BLOCKS-PLAN.md` |
| Repo agent guide | `AGENTS.md` (converted from `CLAUDE.md`) |
| Muya TS agent guide | `packages/muya/AGENTS.md` |
| This handoff | `docs/HANDOFF.md` |

### 5. Started grill-with-docs

**Question 1 posed, not yet answered by user:**

> Implement in `muyajs` first or `packages/muya` TS rewrite first?  
> **Recommendation:** muyajs first (ships in desktop).

---

## Current status

| Phase | State |
|-------|-------|
| Investigation | ✅ Complete |
| Subagent verification | ✅ Complete |
| Local docs | ✅ Complete |
| AGENTS.md conversion | ✅ Complete |
| Dev environment smoke test | ❌ Not run (`pnpm install && pnpm dev`) |
| Grill session (open decisions) | 🟡 Started — Q1 pending |
| ADR (markdown serialization format) | ❌ Blocked on grill |
| Code changes | ❌ Not started |

---

## Open decisions (resolve via grill-with-docs)

See `docs/OUTLINE-BLOCKS-PLAN.md` §6. Summary:

| # | Decision | Initial recommendation |
|---|----------|------------------------|
| 1 | Engine first: muyajs vs muya TS | **muyajs** |
| 2 | New block type vs extend lists | **New `outline-item`** |
| 3 | Markers computed vs typed | **Computed from depth + index** |
| 4 | Max depth | **3** (Roman/letter/decimal) |
| 5 | Markdown persistence format | **TBD** — needs ADR |
| 6 | Opt-in preference vs default | **Opt-in** (MarkText philosophy) |
| 7 | Upstream PR vs local fork | **Local first**, issue later |

---

## Recommended next steps (in order)

1. **Answer grill Q1** (muyajs-first confirmation)
2. **Smoke test dev env:**
   ```bash
   cd /Users/jholt/marktext
   pnpm install
   pnpm dev
   ```
3. **Continue grill** — one decision at a time; update `CONTEXT.md` as terms crystallize
4. **Write ADR** at `docs/adr/0001-outline-markdown-serialization.md` once format chosen
5. **Spike UI wiring** — add `outline` label to `quickInsert/config.js` + no-op handler to validate menu path
6. **Implement** per `docs/OUTLINE-BLOCKS-PLAN.md` §5 file list (muyajs layer first)

---

## Key files (do not re-investigate unless behavior changed)

### Production editor (muyajs)

| File | Role |
|------|------|
| `packages/muyajs/lib/contentState/tabCtrl.js` | Tab / Shift+Tab |
| `packages/muyajs/lib/contentState/enterCtrl.js` | Enter in lists/paragraphs |
| `packages/muyajs/lib/contentState/backspaceCtrl.js` | Backspace unindent |
| `packages/muyajs/lib/contentState/paragraphCtrl.js` | `updateParagraph()` dispatcher |
| `packages/muyajs/lib/contentState/updateCtrl.js` | 4-space → code block trap |
| `packages/muyajs/lib/ui/quickInsert/config.js` | @ menu block labels |
| `packages/muyajs/lib/ui/frontMenu/config.js` | Turn Into submenu |
| `packages/muyajs/lib/utils/exportMarkdown.js` | Save to .md |
| `packages/muyajs/lib/utils/importMarkdown.js` | Load from .md |

### Desktop wiring

| File | Role |
|------|------|
| `packages/desktop/electron.vite.config.ts` | `muya` → `../muyajs` alias |
| `packages/desktop/package.json` | `@marktext/muyajs` workspace dep |

### Contributing

| File | Role |
|------|------|
| `.github/CONTRIBUTING.md` | PR to `develop`, issue first for features |
| `AGENTS.md` | Agent conventions + outline pointers |

---

## Suggested skills for next agent

| Skill | When to use |
|-------|-------------|
| **grill-with-docs** | Resolve open decisions §6; update `CONTEXT.md`; offer ADR when serialization format is chosen |
| **implement** | Once decisions locked — build outline block with review loop |
| **diagnose** | If Tab/Enter behavior regresses during dev |
| **check-work** | Before considering feature complete |
| **tdd** | Import/export round-trip and Tab handler tests |
| **review** | Before any upstream PR |

---

## Session history (condensed)

1. **User goal:** Understand why MarkText (and markdown editors generally) cannot do block-level outline indent like their screenshot (Watchman Nee / Witness Lee style lesson outline).
2. **We cloned** repo to `/Users/jholt/marktext` and traced Tab → `tabCtrl.js` → `insertTab` vs `indentListItem`.
3. **User asked** for subagent verification — four agents confirmed analysis, caught engine mismatch (muyajs vs muya), dead `tab` pref, code-block trap.
4. **User asked** to capture to local docs + grill-with-docs preprocessing (contributing, conventions, UI trace).
5. **We wrote** `CONTEXT.md`, `docs/OUTLINE-BLOCKS-PLAN.md`, posed grill Q1.
6. **User asked** to convert `CLAUDE.md` → `AGENTS.md` and create this handoff for repo relaunch.

---

## What not to duplicate

Full investigation detail lives in **`docs/OUTLINE-BLOCKS-PLAN.md`**. Domain terms in **`CONTEXT.md`**. Build/run instructions in **`AGENTS.md`**. This handoff is the entry point only.

---

## User context

- Testing MarkText as open-source alternative to Notion/Agenda for outline-heavy study documents
- Wants to understand and fix from the code side, not just find another app
- Will relaunch agent **from within** `/Users/jholt/marktext` with `AGENTS.md` available