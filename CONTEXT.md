# MarkText Outline Editing

Local fork work to add academic-style outline editing (Roman → letter → number hierarchy with block-level Tab indent) to MarkText's Muya editor.

## Language

**Outline**:
A hierarchical document structure where each level uses a distinct numbering style and entire lines indent as blocks, not as first-line or inline whitespace.
_Avoid_: TOC, table of contents (those are heading navigation only in MarkText today)

**Outline item**:
A single entry in an outline — one logical point at a specific depth, with a marker (e.g. `I.`, `A.`, `1.`) and body text.
_Avoid_: List item (a GFM bullet/ordered list node with `-` or `1.` markers)

**Outline depth**:
How many indent levels an outline item sits below the document root. Depth 1 is top-level Roman; depth 2 is letter; depth 3 is number (target convention — not yet implemented).
_Avoid_: Heading level, list nesting level

**Block-level indent**:
Moving the entire paragraph block visually and structurally when the user presses Tab, without inserting leading spaces into the text content.
_Avoid_: Inline tab, first-line indent, text-indent

**Marker style**:
The numbering or lettering scheme at a given depth (`upper-roman`, `upper-alpha`, `decimal`).
_Avoid_: List marker, bullet marker

**Muya**:
MarkText's WYSIWYG markdown editor engine. Production desktop builds use the legacy `packages/muyajs` package; `packages/muya` is a TypeScript rewrite not yet wired into desktop.
_Avoid_: Muya v2 (prefer "muya TS rewrite" when distinguishing)