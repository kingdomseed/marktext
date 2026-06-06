# MarkText Outline Editing

Local fork work to add academic-style outline editing (Roman → letter → number hierarchy with block-level Tab indent) to MarkText's Muya editor.

## Language

**Outline**:
A hierarchical document structure where each level uses a distinct numbering style and entire lines indent as blocks, not as first-line or inline whitespace.
_Avoid_: TOC, table of contents (those are heading navigation only in MarkText today)

**Outline item**:
A single entry in an outline — one logical point at a specific depth, with a structural marker and separate body text.
_Avoid_: List item (a GFM bullet/ordered list node with `-` or `1.` markers)

**Structural marker**:
The outline label (e.g. `I.`, `A.`, `1.`) derived from depth, outline group, and sibling index — displayed like a list marker, not stored in the editable body text.
_Avoid_: Typed prefix, inline marker text

**Body text**:
The editable content of an outline item. Text that looks like a marker (e.g. pasted `A. footnote`) stays as literal body text; it is not stripped or merged into the structural marker.
_Avoid_: Marker, prefix

**Outline group**:
A disconnected outline hierarchy within a document. Implicit parent and sibling relationships apply only among items in the same group — not across groups.
_Avoid_: Outline list, outline container, section

**Outline continuation**:
Adding the next outline item in the same group — e.g. `III.` after `II.` with a paragraph between, or `B.` after `A.` with a paragraph between, or `2.` after `1.` with a paragraph between. Intervening non-outline blocks do not break parent or sibling links inside the group.
_Avoid_: Resume, unpause

**Outline restart**:
Starting a new outline group — e.g. resetting to `I.` or jumping to `XI.` — so the item and everything nested under it belong to a fresh hierarchy, unrelated to earlier outline items. Only an explicit user restart begins a new group; intervening non-outline blocks never do.
_Avoid_: Renumber, reset counter

**Group-start marker**:
The signal that a new outline group begins at the next outline item. In the editor: persisted on the restart root block (WYSIWYG restart action). In saved markdown: a consumed sentinel comment (`<!-- mt:outline-group-start -->`) before restart roots, parsed by the outline lexer (footnote-style extension) — invisible in WYSIWYG, visible in source. The restart root’s written marker (`I.`, `XI.`, etc.) is authoritative on import; all other items in the group get markers from structure. Casual marker edits outside the app (without a sentinel) normalize back on re-import.
_Avoid_: markerStart, groupStart flag, horizontal rule

**Implicit parent**:
Within an outline group, the nearest preceding outline item at exactly one depth level lower. Determines which `A.` / `1.` chain an item belongs to.
_Avoid_: Container parent, list parent

**Outline sibling**:
Within an outline group, outline items at the same depth that share the same implicit parent. Sibling index drives structural marker numbering (`A.` then `B.`, `1.` then `2.`).
_Avoid_: List item, adjacent block

**Outline reparenting cascade**:
When Tab or Shift+Tab changes an outline item’s depth, every **following contiguous outline sibling at the item’s former depth** becomes a child of that item at the new depth plus one; existing deeper descendants stay under the moved item and shift with it. Markers recompute from the new parent/sibling structure. Applies symmetrically for indent and outdent.
_Avoid_: Subtree move, absorb the whole list

**Outline depth**:
How many indent levels an outline item sits below the document root. Supported range is **1–7**. Depth determines block-level indent and which marker style applies; Tab cannot promote past depth 7.
_Avoid_: Heading level, list nesting level

**Outline level**:
Synonym for outline depth when talking about marker style assignment (e.g. “level 4 marker”).
_Avoid_: Heading level

**Block-level indent**:
Moving the entire paragraph block visually and structurally when the user presses Tab, without inserting leading spaces into the text content.
_Avoid_: Inline tab, first-line indent, text-indent

**Outline markdown indent**:
Leading whitespace before an outline item’s structural marker in saved markdown. Follows the same rules as list indentation (`listIndentation` preference): cumulative, marker-width-aware stacking per depth level — not a separate outline-specific setting.
_Avoid_: Tab depth prefix, fixed four-space levels

**Outline body continuation indent**:
Extra leading spaces on continuation lines of multi-line outline body text so wrapped lines align under the first line’s body text (after the structural marker) — not under the marker, not flush left.
_Avoid_: Hanging indent, first-line-only indent

**Markdown round-trip**:
Converting between the markdown text of a document and the editor’s internal outline structure on open/save and when switching WYSIWYG ↔ source mode. “Import” is markdown → editor; “export” is editor → markdown. Not a separate file format — the same `.md` string the user edits.
_Avoid_: Import/export feature, file conversion

**Import precedence**:
When outline mode is enabled, how a markdown line is classified if multiple patterns match. Preceding context continues list or outline chains when the line fits that structure; indent and marker style must agree for outline; otherwise fall through to list, then plain paragraph. With outline mode off, outline patterns are not considered.
_Avoid_: Lexer priority, parse order

**Outline turn-into**:
Converting a block into an outline item via Turn Into or quick-insert when outline mode is enabled. Sources include plain paragraphs, headings, blockquotes, and other types that may turn into a paragraph today — but not list items (see outline–list boundary). Depth follows outline continuation: same depth as the nearest preceding outline item in the same outline group; depth 1 if none. Wrapper removed where applicable; body text preserved; structural marker assigned from group position.
_Avoid_: Import conversion, paste conversion

**Outline turn-out**:
Converting an outline item into a plain paragraph via Turn Into. Body text is preserved; the structural marker is dropped. Nested outline items under the converted item promote one depth level and stay in the same outline group; markers renumber from the new structure.
_Avoid_: De-outline, unoutline, cascade delete

**Outline–list boundary**:
Turn Into does not convert directly between outline items and list items. Restructure through a plain paragraph — outline turn-out or list unwrap, then the target type.
_Avoid_: Outline–list conversion, lossy subtree map

**Outline–heading conversion**:
Turn Into may convert directly between outline items and headings. Heading → outline follows outline turn-into depth rules (`#` markers stripped, body preserved). Outline → heading preserves body at the chosen heading level; nested outline items promote one depth level, same as outline turn-out.
_Avoid_: Heading pivot, section promotion

**Outline backspace merge**:
At the start of an outline item body, Backspace merges with the previous block only when that block is an **immediately adjacent** same-depth outline sibling. Logical siblings separated by paragraphs, headings, or lists do not merge — use outdent (depth ≥ 2) or exit to plain paragraph (depth 1 with no adjacent prior outline item) instead.
_Avoid_: Logical merge, skip-gap merge

**Outline turn-from**:
Turn Into from an outline item follows the same allowed targets as a plain paragraph, except direct conversion to list items (see outline–list boundary). Nested items promote one depth level when the conversion removes the outline wrapper (paragraph, heading, blockquote, etc.).
_Avoid_: Outline outbound matrix

**Outline multiline turn**:
Turn Into that would create, convert, or remove an outline item runs only on a **single-block** selection. Multiline selections that include an outline item are not transformed. Selections with no outline involvement keep existing MarkText multiline rules.
_Avoid_: Batch outline conversion, range turn-into

**Outline empty Enter**:
Pressing Enter on an outline item with an **empty body** exits outline structure — depth 1 becomes a plain paragraph; depth 2–7 outdents one level (with reparenting cascade). Pressing Enter with **text** creates a new same-depth outline sibling below. Neighboring block types (list, heading, paragraph) do not change either rule. Going deeper is Tab, not Enter.
_Avoid_: Enter to indent, blank sibling

**Outline HTML export**:
How outline items appear in HTML, PDF, and print output. Each item is a flat outline-item element with an explicit structural marker, cumulative indent, and body content — not a nested ordered list.
_Avoid_: PDF v2, nested OL export

**Outline export seam**:
HTML/PDF/print keeps the existing markdown-to-`marked()` exporter for all non-outline blocks. Only outline items are rendered from the editor block tree (via muya), interleaved in document order — shared marker and indent math with markdown export, not a full exporter rewrite.
_Avoid_: Full HTML walker, marked-only outline

**Outline HTML body continuation**:
In HTML, PDF, and print export, wrapped and explicit continuation lines within one outline item align under the first line’s body text (after the structural marker) — same rule and math as outline body continuation indent in saved markdown and WYSIWYG.
_Avoid_: Natural wrap export, marker-aligned wrap

**Group-start sentinel (export)**:
The group-start marker never appears in HTML, PDF, or print output. It is omitted on the block-tree export path and consumed on any markdown-to-HTML path — same invisibility as in WYSIWYG.
_Avoid_: Export comment, visible restart marker

**Outline export styling**:
Visual rules for outline items in HTML, PDF, and print live in the export stylesheet (`exportStyle.css`), not the editor theme. Marker column, cumulative indent, and body continuation alignment are export concerns separate from WYSIWYG editing chrome.
_Avoid_: Theme export, inline-only export CSS

**Outline discoverability**:
When outline mode is disabled, lines that look like outline markers remain plain paragraphs with no detection hint or conversion prompt. Enabling outline mode in settings is the only opt-in; structural import on open requires the preference to be on (footnote-mirror: enable mid-session does not re-parse the open document).
_Avoid_: Marker detection, outline hint, auto-enable

**New document default**:
New documents always open with a plain paragraph regardless of outline mode. Outline items are created explicitly via quick-insert or Turn Into after the user has enabled outline mode — not auto-inserted on new doc.
_Avoid_: US-9, outline-first document, blank outline item

**Marker style**:
The numbering or lettering scheme assigned to each outline depth. Fixed sequence: depth 1 upper-roman (`I.`), 2 upper-alpha (`A.`), 3 decimal (`1.`), 4 lower-alpha (`a.`), 5 lower-roman (`i.`), 6 parenthetical decimal (`(1)`), 7 parenthetical lower-alpha (`(a)`). Markers are structural, not body text.
_Avoid_: List marker, bullet marker

**Muya**:
MarkText's WYSIWYG markdown editor engine. Production desktop builds use the legacy `packages/muyajs` package; `packages/muya` is a TypeScript rewrite not yet wired into desktop.
_Avoid_: Muya v2 (prefer "muya TS rewrite" when distinguishing)