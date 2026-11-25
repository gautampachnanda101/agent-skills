# Documentation review checklists

Walk these checklists per page after classifying it with the Diátaxis table
in [SKILL.md](./SKILL.md). Record `pass`, `fail`, or `n/a` with evidence for
every item; an unevaluable item is recorded as such, never assumed. Sources:
Diátaxis (D), Google Developers Style Guide (G), Microsoft Writing Style
Guide (M), Wiegers peer-review practice (W).

## Type and audience fit

- Does the page do the one job of its classified form (learn, task, lookup,
  understand) — with no genre-mixing? (D)
- Would the named audience actually open this page first? Where does the
  entry point send them?
- Does every sentence help the reader's stated need, or is it for the
  author's benefit? (D: needs-based authoring)
- If the page were deleted, what would break for the audience? Pages that
  fail this test are retirement candidates (W: review questions purpose).

## Structure and navigation

- One `H1` that names the content; heading levels never skip; heading text
  describes rather than teases.
- Long pages carry a contents list; site navigation has a single home and
  every entry resolves to a real file.
- Each topic is explained once; cross-links replace duplicated blocks. (W:
  single-definition discipline)
- Order of sections follows the reader's work, not the document's history.
- Related pages link to each other so no page is an orphan. (D: systematic
  relationship between forms)

## Voice, grammar, and clarity

- Second person and active voice throughout; steps in imperative mood. (G, M)
- Present tense in instructions (`then run`, never `the tool will run`). (G)
- Short sentences; one idea per paragraph; acronyms expanded at first use.
- Consistent terminology everywhere: one concept, one term. Flag synonyms
  introduced mid-document. (W)
- No `simply`, `just`, `obviously`, or `easily` in front of anything
  non-trivial. (M)
- Sentence-case headings; punctuation in lists is consistent.
- Numbers, placeholders, and file names are formatted consistently
  (`catalog-info.yaml`, not sometimes `catalog info yaml`).

## Technical accuracy and completeness

- Every command was run as written, from a clean checkout, with output
  recorded — or marked unevaluated with the reason. (W: verified findings)
- Version and prerequisite claims match the actual environment being
  documented.
- Code samples are complete enough to run: imports, paths, and fixtures
  exist, and the sample's output matches what the prose claims.
- Prerequisites are stated before the first step that needs them.
- Warnings precede the risky step they describe, not follow it. (D)

## Code blocks, commands, and links

- Code blocks carry a language tag; shell blocks are copy-pasteable as-is.
- Prompts for secrets are never inside fenced user commands; token values
  come from environment-variable or secret mechanisms, and the text says so.
- Internal links and image paths resolve from the document's own location;
  relative target files exist.
- External links were fetched (with permission) or explicitly marked
  unevaluated. (M: link maintenance is documentation maintenance)
- For MkDocs/TechDocs sites, the bundled zero-dependency checker validates
  nav, includes, and `site_name` against the entity.

## Freshness and ownership

- The page has an owner: a person or team accountable for it. Un-owned pages
  are a finding. (W)
- The last substantive commit is recent relative to the release cadence; a
  page unchanged across releases that shipped what it documents is flagged
  with that evidence.
- Time-sensitive statements carry dates (`since v1.49`, `as of 2026`),
  or get them. (M: date-stamp changes)
