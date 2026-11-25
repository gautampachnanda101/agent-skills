# Documentation review checklists

Walk these checklists per page after classifying it with the Diátaxis table
in [SKILL.md](./SKILL.md). Record `pass`, `fail`, or `n/a` with evidence for
every item; an unevaluable item is recorded as such, never assumed. Sources:
Diátaxis (D), Google Developers Style Guide (G), Microsoft Writing Style
Guide (M), GOV.UK content design and accessibility guidance — WCAG 2.2 AA
(GV), Wiegers peer-review practice (W).

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
- Requirements word their strength deliberately: `must` only where skipping
  has real consequence, `need` for process requirements, `can` for optional;
  negative contractions (`can't`, `don't`) avoided where they could be
  misread. (GV)
- Plain English throughout: short words over formal ones (`buy`, `help`,
  `about` over `purchase`, `assist`, `approximately`); sentences over 25
  words split; paragraphs at most 5 sentences. (GV)

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

## Accessibility (WCAG 2.2 AA as GOV.UK applies it)

Accessibility is a content concern, not only a build concern: `how it's
written` and `how it's formatted` are among GOV.UK's named accessibility
inputs. Use automated checks where available; record judgment items as
`unevaluated` rather than passing them silently.

- Link text is descriptive and frontloaded; no `click here`, `here`, `more`,
  or bare URLs as the only text. (GV)
- One link text maps to one destination; the same target reached more than
  once uses the same or equivalently phrased text. (GV)
- Document links state the format and size in the text; links into paid or
  registration-walled content are flagged. (GV)
- Links sit in context at the point of use, not dumped as an unsorted
  further-reading pile; anchors deep into other pages carry text that says
  where the reader lands. (GV)
- Heading levels step down without skips; each page has a unique title;
  headings describe their section content. (GV)
- Meaning never rides on colour or sensory wording alone (`see the red
  box`, `on the right`); status and state words name the meaning. (GV)
- Contrast: body text 4.5:1, large text and UI 3:1 — evaluated with a tool
  when available, otherwise `unevaluated` with the screenshot/claim noted.
- Images carry alt text; complex graphs and charts are described in nearby
  text, not only inside the image. (GV)
- Data tables have header rows; no tables exist just to position content.
  (GV)
- Attachments prefer open formats over PDFs; PDFs carry an accessible or
  HTML equivalent. (GV)
- Plain-English findings double as cognitive accessibility findings: record
  the readability items above against WCAG's `understandable` principle.
  (GV)

## Linting and prose checks

Run the mechanical layer before judgment; record what ran and what could
not.

- Which tools ran (`markdownlint`, `vale`, `markdown-link-check`, the
  repository's TechDocs checker)? Configured-but-unavailable is recorded as
  unevaluated, not assumed clean.
- Machine findings fixed-and-reverified rather than copied into the report;
  the report keeps only judgment findings. (W: findings not opinions)
- Added lint suppressions (`<!-- markdownlint-disable -->`) carry a stated
  reason; blanket disables are a `major`.
- For MkDocs/TechDocs sites, the bundled zero-dependency checker validated
  nav, includes, `site_name`, and entity match — with `--json` when a
  report is needed.

## Freshness and ownership

- The page has an owner: a person or team accountable for it. Un-owned pages
  are a finding. (W)
- The last substantive commit is recent relative to the release cadence; a
  page unchanged across releases that shipped what it documents is flagged
  with that evidence.
- Time-sensitive statements carry dates (`since v1.49`, `as of 2026`),
  or get them. (M: date-stamp changes)
