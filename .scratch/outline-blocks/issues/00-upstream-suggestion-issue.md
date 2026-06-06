# File upstream suggestion issue

**Status:** filed  
**Parent:** `.scratch/outline-blocks/PRD.md`  
**User stories:** US-57

## TDD approach

Not applicable — process-only HITL slice. No code or automated tests.

## What to build

File a **suggestion issue** on `marktext/marktext` before implementation PR, per CONTRIBUTING etiquette. Use the upstream draft in PRD Further Notes.

**Summary:** Academic outline blocks with Roman/letter/decimal hierarchy and block-level Tab indent.

**Problem:** Lists cannot mix marker styles per depth; Tab on paragraphs inserts spaces; manual prefixes do not round-trip; print/PDF needs outline-aware export.

**Proposed solution:** New outline item block, opt-in preference, structural markdown (ADR-0001), hybrid HTML/PDF export.

**Alternatives rejected:** Nested OL + CSS; leading-tab encoding; headings as outline substitute.

Paste an **inline ADR-0001 summary** (structural markers, seven depth styles, group-start sentinel) into the issue body — not only a fork repo path. Upstream reviewers should not need a fork checkout.

Record the upstream issue number in this file under Comments when filed.

## Acceptance criteria

- [x] Suggestion issue opened on `marktext/marktext`
- [ ] Issue body includes inline ADR-0001 summary and marker table from PRD/CONTEXT
- [ ] Issue notes planned PR will `Closes #NNN` and include demo recordings (pref on/off, Tab/Enter/Shift+Tab, save/reopen, export)
- [x] Issue number and URL recorded below

## Blocked by

None — can start immediately (parallel with implementation)

## Comments

| Field | Value |
|-------|-------|
| Upstream issue # | `marktext/marktext#4379` |
| Upstream URL | https://github.com/marktext/marktext/issues/4379 |
| Filed date | 2026-06-06 |
| Follow-up note | Filed issue covers the user-facing request; full ADR marker table, group-start sentinel, and PR recording note are not yet added upstream. |
