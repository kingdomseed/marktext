# Outline items persist as structural markers in markdown

MarkText outline editing uses computed structural markers (like ordered lists), not marker text stored in body content. On save, outline items export as indented lines with depth-appropriate markers (`I.`, `A.`, `1.`, `a.`, `i.`, `(1)`, `(a)`). On load, line-start marker patterns plus indent recreate depth and sibling order; body text is everything after the marker.

We rejected leading-tab depth encoding, fenced extensions, and HTML blocks. Structural markers match ministry/legal study documents, stay readable outside MarkText, and mirror the existing list export/import pattern (`normalizeListItem` / lexer). Paste into an existing outline item does not strip marker-like text — only structural import of new lines derives depth from markers.

**Status:** accepted (grill-with-docs, 2026-06-06)

**Considered options:** leading-tab depth prefix; Pandoc-style fenced blocks; HTML `<ol type="…">`; plaintext markers without computed round-trip (rejected — conflicts with Q3).

**Consequences:** Import needs a marker lexer for seven depth-specific patterns including parenthetical forms. Export must walk outline items in document order and recompute markers from depth + sibling index. Source-code mode will show markers in the file (same as lists today).