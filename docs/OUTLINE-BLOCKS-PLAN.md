# Outline Blocks — Investigation & Implementation Plan

> **Status:** Pre-implementation / grill-with-docs phase  
> **Repo:** Local clone at `/Users/jholt/marktext`  
> **Goal:** Add academic-style outline editing (I. → A. → 1.) with Tab promoting whole blocks, not inline spaces.

---

## 1. Problem statement

MarkText cannot today produce outlines like ministry/legal study documents:

```
I.   Top-level point
  A. Second-level point
    1. Third-level point
```

**Required behavior:**

- Tab indents the **entire block** (block-level), not first-line or inline whitespace
- Mixed marker styles per depth (Roman / letter / decimal)
- Enter creates a sibling at the same depth
- Shift+Tab outdents one level
- Survives save/reopen (markdown round-trip)

**Reference editors that do this well:** Notion (outline mode), Agenda.

---

## 2. Verified findings (subagent review, 2026-06-06)

### Core diagnosis — CONFIRMED

| Finding | Evidence |
|---------|----------|
| Plain paragraphs have no `depth` / `indent` property | `packages/muya/src/state/types.ts` — `IParagraphState` is `{ name, text }` only |
| Tab on plain text = inline space insert | `packages/muyajs/lib/contentState/tabCtrl.js` → `insertTab()` |
| Tab on list items = AST re-parenting | `tabCtrl.js` → `indentListItem()` requires `listItem.preSibling` |
| No `outline-item` block type exists | Repo-wide search: zero matches |
| Roman/alpha list styles absent | `blockSyntax.css` — all nested `ol` are `decimal` |
| Root paragraphs export with no structural indent | `stateToMarkdown.ts` → `serializeTextParagraph(state, indent='')` |

### Corrections to initial analysis

1. **Production engine is `muyajs`**, not `packages/muya` TS rewrite.
   - `packages/desktop/package.json` → `"@marktext/muyajs": "workspace:*"`
   - Vite alias: `muya` → `../muyajs`
   - **Implement in `muyajs` first** unless we also port to muya TS.

2. **Tab handler is central** in production (`ContentState.tabHandler` in `tabCtrl.js`), not per-block like muya TS.

3. **`listIndentation: 'tab'` is a dead preference** — UI exposes it; runtime coerces to `1`; serialization TODO unimplemented.

4. **4-space Tab is hostile** — `updateIndentCode` in `updateCtrl.js` can convert leading 4 spaces to an indented **code block** during editing.

5. **Multi-line Tab is a no-op** for paragraphs/lists in current muya (collapsed cursor required).

6. **`getTOC()` ≠ outline editing** — heading navigation only (`tocCtrl.js`).

### Partial workarounds (not sufficient)

| Workaround | Limitation |
|------------|------------|
| Nested `ol` + Tab | Depth only; source is `1. 2. 3.` everywhere |
| Custom CSS on `ol` | Editor view only; export/PDF ignores it |
| Blockquote (`>`) | Tab doesn't create it; serializes as `> text` |
| Manual `I.` / `A.` / `1.` prefixes | No Tab semantics; fragile |

---

## 3. Preprocessing checklist

Before writing outline block code, complete these steps.

### 3.1 Contributing & process

Source: `.github/CONTRIBUTING.md`

| Requirement | Notes for outline feature |
|-------------|---------------------------|
| PRs target **`develop`** branch | Not `master` |
| New features need **suggestion issue first** | Open issue with reasoning before large PR |
| JSDoc on new code | Required per contributing guide |
| `pnpm run lint` must pass | ES6, 2-space indent, **no semicolons** (MarkText style) |
| All tests pass | Unit + relevant e2e |
| Philosophy: clean, simple, minimal | Feature may belong in settings / opt-in |
| Screen recordings in PR | Demonstrate Tab/Enter/Shift+Tab outline flow |

### 3.2 Code conventions — MarkText (`muyajs`)

| Convention | Location |
|------------|----------|
| ES6 JavaScript | `packages/muyajs/lib/` |
| 2-space indent, no semicolons | ESLint via `pnpm lint` |
| JSDoc on public methods | e.g. `tabCtrl.js`, `paragraphCtrl.js` |
| Block tree via `createBlock(type, extras)` | `contentState/index.js` |
| Partial render after mutations | `partialRender()` |
| i18n via `muya.options.t` | Quick insert, front menu |

### 3.3 Code conventions — Muya TS rewrite (`packages/muya`)

*Not active in desktop today, but target for upstream merge.*

| Convention | Source |
|------------|--------|
| TypeScript, 4-space indent, semicolons | `packages/muya/CONTRIBUTING.md` |
| `I`-prefixed interfaces | `@typescript-eslint/naming-convention` |
| Private members prefixed `_` | e.g. `_indentListItem` |
| New blocks registered in `registerBlocks()` | `packages/muya/src/block/index.ts` |
| `ScrollPage.loadBlock(name)` for block lookup | Warns if unregistered |
| Conventional Commits + commitlint | `feat(core):`, `fix(core):`, etc. |
| E2E for UI/editing surface changes | `packages/muya/e2e/` |

### 3.4 Dev environment

```sh
cd /Users/jholt/marktext
pnpm install
pnpm dev          # start MarkText in dev mode
pnpm lint         # before commits
pnpm test         # unit tests
pnpm test:e2e     # if touching editor UX
```

Build docs: `packages/website/content/docs/dev/BUILD.md`  
Architecture: `packages/website/content/docs/dev/ARCHITECTURE.md`

### 3.5 Open suggestion issue (upstream etiquette)

Per contributing guidelines, before a large PR:

1. File issue on `marktext/marktext` describing academic outline use case
2. Explain why lists/headings/blockquotes are insufficient
3. Propose markdown serialization format (non-standard extension)
4. Link to this local plan doc (or gist) for design detail

---

## 4. UI extension trace — how blocks enter the editor today

Understanding this path is prerequisite for adding outline blocks through the UI.

### 4.1 Entry points (user-facing)

| Entry | Trigger | File |
|-------|---------|------|
| **Quick Insert** (`@` menu) | Type `@` in empty paragraph | `muyajs/lib/ui/quickInsert/index.js` |
| **Front Menu** (paragraph handle) | Click `⋮` on block | `muyajs/lib/ui/frontMenu/index.js` |
| **Turn Into** submenu | Front menu → Turn Into | `frontMenu/config.js` → reuses quick insert items |
| **Keyboard shortcuts** | e.g. `Ctrl+Alt+O` ordered list | Desktop keybinding → `updateParagraph` |
| **Markdown triggers** | `1. `, `- `, `> `, `# ` | `updateCtrl.js` inline transforms |

### 4.2 Quick Insert flow

```
User types @query
  → quickInsert/index.js search()
  → User selects item (dataset.label)
  → selectItem(item)
  → contentState.updateParagraph(item.label, true)   // insertMode=true
```

Config labels (`quickInsert/config.js`):

| Label | Block created via |
|-------|-------------------|
| `paragraph` | No-op (stay paragraph) |
| `ol-order` | `handleListMenu('ol-order')` |
| `ul-bullet` | `handleListMenu('ul-bullet')` |
| `ul-task` | `handleListMenu('ul-task')` |
| `blockquote` | `handleQuoteMenu()` |
| `heading 1`…`heading 6` | Heading transform in `updateParagraph` |
| `pre`, `table`, `html`, `mathblock`, diagrams | respective handlers |

**To add outline via UI:** add a new item to `createQuickInsertObj()` with a new `label` (e.g. `outline-item`), icon, shortcut, i18n keys, and a new `case` in `updateParagraph`.

### 4.3 Front Menu / Turn Into flow

```
User clicks block handle
  → frontMenu shows menu + Turn Into submenu
  → getSubMenu(block) filters available transforms (frontMenu/config.js)
  → selectItem → contentState.updateParagraph(label)
```

`getSubMenu` filters by current block `type` (`p`, `h1`–`h6`, `ul`, `ol`). A new outline block type would need:

- `createGetLabel` case for display name
- `createGetSubMenu` rules for which transforms are allowed
- `isAllowedTransformation` update in `paragraphCtrl.js`

### 4.4 Central transform dispatcher

`packages/muyajs/lib/contentState/paragraphCtrl.js` → `updateParagraph(paraType, insertMode)`:

```js
switch (paraType) {
  case 'ul-bullet':
  case 'ul-task':
  case 'ol-order':  → handleListMenu()
  case 'blockquote': → handleQuoteMenu()
  case 'pre':        → handleCodeBlockMenu()
  case 'heading 1'…: → heading level transform
  // ... container blocks, table, html, diagrams
}
```

**Adding outline:** new case e.g. `'outline'` → `handleOutlineMenu(insertMode)` that wraps selection in an outline container or converts paragraph to `outline-item` block.

### 4.5 Block creation primitives (muyajs)

Unlike muya TS `ScrollPage.registerBlocks()`, muyajs uses imperative `createBlock(type, extras)`:

```js
// contentState/index.js
createBlock(type = 'span', extras = {})
// types: 'p', 'li', 'ul', 'ol', 'blockquote', 'h1'…'h6', 'pre', 'span', etc.
```

New outline support likely needs:

- New block `type` (e.g. `'outline'` container + `'outline-item'` or depth on `'p'`)
- Import path: `importMarkdown.js` token → block
- Export path: `exportMarkdown.js` / `stateToMarkdown.ts`
- Render path: parser render modules
- CSS: `themes/default.css` or `assets/styles/`

### 4.6 Tab / Enter / Backspace (keyboard)

| Key | Handler | File |
|-----|---------|------|
| Tab | `ContentState.tabHandler` | `tabCtrl.js` |
| Enter | `enterHandler` / `docEnterHandler` | `enterCtrl.js` |
| Backspace | `backspaceHandler` | `backspaceCtrl.js` |
| Shift+Tab | unindent branch in `tabHandler` | `tabCtrl.js` |

Outline blocks need new branches **before** `insertTab()` fallback:

```js
if (this.isOutlineItem(startBlock)) {
  return event.shiftKey
    ? this.outdentOutlineItem(startBlock)
    : this.indentOutlineItem(startBlock)
}
```

### 4.7 i18n touchpoints

Quick insert / front menu strings live in desktop locale files and muyajs translation hooks. New UI item needs keys in:

- `packages/desktop/src/renderer/src/locales/` (or equivalent)
- `muya.options.t` callback wiring

### 4.8 Desktop integration (beyond muyajs)

| Area | Package | Purpose |
|------|---------|---------|
| Preferences schema | `packages/desktop/src/main/preferences/schema.json` | New prefs (outline enabled, marker styles) |
| Export HTML/PDF | `exportHtml.js`, export themes | Outline CSS for export |
| Keybindings | `KEYBINDINGS.md` / menu definitions | Optional outline shortcut |

---

## 5. Proposed implementation surface (draft)

> **Not decided yet** — subject to grill-with-docs session.

### Minimum viable outline block

```
outline-list (container, optional)
  └── outline-item × N
        meta: { depth: 1|2|3, markerStyle: 'roman'|'alpha'|'decimal' }
        └── p (paragraph content — marker + text)
```

### Files likely touched (muyajs / production)

| Layer | Files |
|-------|-------|
| Block model | `contentState/index.js` (`createBlock` types) |
| UI — create | `ui/quickInsert/config.js`, `ui/frontMenu/config.js` |
| UI — dispatch | `contentState/paragraphCtrl.js` (`updateParagraph`, `isAllowedTransformation`) |
| Keyboard | `contentState/tabCtrl.js`, `enterCtrl.js`, `backspaceCtrl.js` |
| Import | `utils/importMarkdown.js`, `parser/marked/` |
| Export | `utils/exportMarkdown.js` |
| Render | `parser/render/`, `assets/styles/` |
| Tests | `packages/desktop/test/unit/specs/` |

### Files for muya TS parity (later)

| Layer | Files |
|-------|-------|
| State types | `src/state/types.ts` — `IOutlineItemState` |
| Block class | `src/block/` — new outline block + registration |
| Tab/Enter | `src/block/content/paragraphContent/index.ts` |
| Serialization | `src/state/stateToMarkdown.ts`, `markdownToState.ts` |
| UI | `src/ui/paragraphQuickInsertMenu/config.ts` |
| E2E | `e2e/tests/typing/outline.spec.ts` |

### Markdown serialization (open decision)

Options to resolve in grill session:

1. **Leading-tab extension** — `\t` prefix per depth level (non-standard)
2. **HTML block** — `<ol type="I">` etc. (fragile, sanitization)
3. **Pandoc-style div** — `::: outline-item` fenced extension
4. **Plaintext markers** — `I.` / `A.` / `1.` with export adding structural metadata on import

---

## 6. Grill-with-docs — open decisions

Each item below needs a resolved answer before implementation.

| # | Decision | Recommendation (initial) |
|---|----------|--------------------------|
| 1 | Implement in `muyajs` only, or muya TS first? | **muyajs** (ships in desktop) |
| 2 | New block type vs. extend `ol`/`li`? | **New `outline-item`** — lists can't do mixed marker styles |
| 3 | Marker text in content or computed from depth? | **Computed** — auto `I.`/`A.`/`1.` from depth + sibling index |
| 4 | Max depth? | **3 levels** (Roman/letter/decimal) matching source documents |
| 5 | Markdown format for persistence? | **TBD** — needs grill (see §5) |
| 6 | Opt-in preference or always on? | **Opt-in** — aligns with MarkText minimal-default philosophy |
| 7 | Upstream PR vs. local fork only? | **Local first**, issue + PR if stable |

---

## 7. Next steps (ordered)

- [ ] **Grill session** — resolve open decisions in §6 one at a time
- [ ] Update `CONTEXT.md` as terminology crystallizes
- [ ] Create ADR in `docs/adr/` once markdown serialization format is chosen (hard to reverse)
- [ ] `pnpm install && pnpm dev` — confirm local build works
- [ ] Spike: add `outline` label to quick insert config (no-op handler) to validate UI wiring
- [ ] Implement `outline-item` block + `handleOutlineMenu`
- [ ] Wire Tab/Enter/Shift+Tab in `tabCtrl.js`
- [ ] Import/export round-trip tests
- [ ] E2E: create outline via `@` menu, Tab nest, save, reopen

---

## 8. References

- MarkText repo: https://github.com/marktext/marktext
- Contributing: `.github/CONTRIBUTING.md`
- Muya TS contributing: `packages/muya/CONTRIBUTING.md`
- Architecture: `packages/website/content/docs/dev/ARCHITECTURE.md`
- Related issues: #1592 (tabs), #2371 (indent), #887 (list indent — fixed via `dfm`)
- Subagent verification: 2026-06-06 conversation transcript