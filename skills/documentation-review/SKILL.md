---
name: documentation-review
description: Review documentation against leading documentation engineering practices — the Diátaxis framework by Daniele Procida, the Google Developers Style Guide and Microsoft Writing Style Guide, GOV.UK content design (user needs first, plain English, clear requirement wording), and WCAG 2.2 AA as adopted for GOV.UK content. Classifies each page's type and audience, checks structure, navigation, voice, and accessibility (link text, headings, tables, images, colour, contrast), verifies commands, code samples, and links, then reports prioritized findings with file:line evidence and suggested fixes. Use when asked to review, audit, or improve documentation, a README, tutorial, how-to, reference page, or documentation site, or to check docs accessibility.
license: Apache-2.0
compatibility: Host assistant with file-read tools; Bash and Node are optional for verifying commands, links, and MkDocs/TechDocs structure. Fetching external network evidence requires host and user permission.
metadata:
  author: gautampachnanda101
  version: "1.4.0"
---

# Documentation review

Review documentation the way leading documentation engineers define quality:
each page serves one reader need, the structure makes that need obvious, and
every claim, command, and link survives verification. Grounded in Daniele
Procida's [Diátaxis framework](https://diataxis.fr/), the
[Google Developers Style Guide](https://developers.google.com/style) and the
[Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/),
the UK Government Digital Service's
[GOV.UK content design guidance](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/)
(user needs first, plain English, accessible link text and formatting), and
WCAG 2.2 AA — the standard GOV.UK content must meet. For structure and
scannability findings, the grounding is information-foraging research
(Pirolli & Card) and Nielsen's scanning studies, as applied to technical
documentation by Tom Johnson.

## Start from the user need, not the page

GOV.UK's first content rule: identify the user need before writing, then
publish only what meets it. When reviewing, name the need each page serves;
content that serves no need is a finding even when it is well written. This
sharpens the audience step below: `tutorial` pages need a learning outcome,
`reference` pages need complete lookup, `how-tos` need task completion.

Read the repository before asking about the audience or scope. The README,
navigation, issues, and the product itself usually show who reads the docs.
State the audience you inferred and its evidence at the top of the report,
so the user can correct it.

## Classify each page before judging it

Diátaxis sorts technical docs into four forms, and each is judged by its own
standard:

| Form | Serves | Fails when |
| --- | --- | --- |
| Tutorial | Learning: a first successful lesson | It assumes knowledge or skips steps, so the learner fails |
| How-to guide | Application: a specific task in progress | It mixes in theory or digresses from the goal |
| Reference | Information: correct, complete lookup | It is narrative, incomplete, or hides a fact in prose |
| Explanation | Understanding: background and concepts | It turns into a how-to or buries the concept in steps |

Classifying one form and writing another is the most common structural
finding. Record the intended form per page, then the misclassifications
before any wording nit. Documentation should be organized so readers find
the form they need; navigation claims must match reality.

## Establish audience and canonical structure

- Name the audience for the doc set in one sentence; every finding cites
  whether it helps or hurts that audience.
- One canonical home per topic: a landing page links outward, long pages
  carry a contents list, and topics are explained once. Duplication is not a
  style issue; it is a defect, because duplicate copies drift apart.
- Single `H1` per page, unique headings (ambiguous anchors break deep
  links), consistent heading depth, headings that describe content.
  Navigation must resolve: every nav entry, link, and image target exists
  relative to its document.
- Apply the three-second outcome test (Nielsen's scannability research:
  79% of users scan): can a reader identify what the page does from the
  first two sentences? A preamble instead of an outcome is a finding —
  information scent starts at the top (Pirolli & Card's foraging model).
- Check the page order too: steps or parameters belong directly after the
  summary, with deep context, trade-offs, and edge cases at the bottom; code
  examples belong beside the definitions they illustrate.
- Flag missing structure: a page without an entry point (README, home, or
  index) or a site without one TOC.

## Apply the style rules that hold up under review

From the Google and Microsoft style guides, review for:

- **Voice**: directly address the reader (`you`); active voice; present
  tense; imperative mood for instructions. Flag future tense on step
  instructions (`the tool will then run` -> `then run`).
- **Clarity**: one idea per paragraph, short sentences, and no undefined
  jargon. Expand acronyms at first use. One term per concept throughout —
  two names for the same thing reads as different things.
- **Plain English**: GOV.UK makes it mandatory for everyone, including
  specialists — research it cites found 80% of readers, and the most
  specialist readers most of all, prefer clear English. Prefer the short
  word (`buy` over `purchase`, `help` over `assist`, `about` over
  `approximately`), split sentences over 25 words, and keep paragraphs to
  five sentences.
- **Honesty**: drop `simply`, `just`, `obviously`, and `easy`; they tell
  confused readers they are wrong. State costs and prerequisites plainly.
- **Requirement wording**: GOV.UK distinguishes strength deliberately —
  `must` for requirements the reader cannot skip without real consequence,
  `need` for process requirements, `can` for optional. Flag inverted or
  inflated wording (`must` on optional steps, `can` on required ones), and
  beware negatives: GOV.UK warns that `can't`/`don't` are easy to misread
  as their opposites.
- **Scannability**: options and environments as tables, steps as numbered
  lists, warnings as callouts — not paragraphs. Prose walls are findings at
  the same severity as broken links, because readers skim.

See [review-checklists.md](./review-checklists.md) for the full checklist.

## Review accessibility as part of content quality

GOV.UK treats accessibility as a content concern, not just a build concern:
content must meet WCAG 2.2 AA — perceivable, operable, understandable,
robust — because "all users will have different needs at different times".
Check, with automated checks where possible and judgment elsewhere:

- **Link text**: descriptive and frontloaded; never `click here`, `here`, or
  a bare URL; each phrase leads wherever it claims — the same text must not
  point to different targets, and document links state format and size.
- **Heading structure**: hierarchical without skipped levels; unique page
  titles; headings describe the section (screen readers navigate by them).
- **Meaning not carried by colour or shape alone**: status text does not
  rely on `red`/`green` wording; contrast meets 4.5:1 (text) and 3:1
  (large text and UI) — flag when judgment cannot confirm and a tool is
  unavailable.
- **Images**: meaningful alt text; complex graphs and charts described in
  nearby text, not only in the image.
- **Tables**: header rows for data tables; no layout tables.
- **Attachments**: open formats preferred over PDFs; when a PDF is needed,
  it should be tagged/accessible or an HTML equivalent offered.
- **Plain English as cognitive accessibility**: the readability findings
  above double as accessibility findings — GOV.UK's rationale is literacy
  and comprehension, not style.

Findings here use the same severity scale; an instruction that breaks a
screen reader (`click the red button on the right`, a link that says
`documentation`) is a `major`, not a nit.

## Run the mechanical pass first

Documentation linting is the deterministic layer before judgment: run the
project's configured Markdown linter (`markdownlint`), prose linter (`vale`
with the house style), link checker (`markdown-link-check`), or the
repository's own TechDocs checker (`check-techdocs.mjs`) for MkDocs sites —
whatever the project declares, via the host's Bash or Node tools.

- Fix-or-report, never assume: a configured linter that cannot run is
  recorded as unevaluated.
- Machine findings are corrected directly (fix-and-verify loop) rather than
  reported as review findings; only linter-invisible issues — accuracy,
  audience fit, structure, accessibility judgment — go in the findings
  table.
- Lint suppressions (`<!-- markdownlint-disable -->`) added without
  justification are a `major`, same rule as code suppressions.

## Verify evidence, not vibes

Wiegers made findings, not opinions, the unit of review — the same holds
here:

- Run commands and code samples where safe and authorized; an untested
  quick-start is the most valuable single finding a review can produce.
  Record tool output alongside the finding.
- Check internal link targets against the filesystem. Use available
  checkers for the format at hand (for example, the zero-dependency
  TechDocs/MkDocs checker in this repository's skills for `mkdocs.yml`
  sites). Spot-check external links by fetching them only with permission;
  otherwise mark them unevaluated rather than assuming.
- Match claims against reality: version numbers, ports, paths, file layouts,
  and prerequisite versions. `requires Node 24` style claims are findings if
  the environment disagrees.
- Quote evidence as `file:line` and cite the conflicting fact (output,
  fixture, git history) in every accuracy finding.

## Rate and report findings

- Severity: `blocker` (instructions that damage the reader's system or are
  factually wrong), `major` (broken navigation, wrong type for the audience,
  untested copy-paste failure), `minor` (style-guide violations), `nit`
  (wording), `question`.
- Report under these headings: `Classification` (each page and its form),
  `Findings` (a table with columns Severity, Location, Evidence, and
  Suggested fix; Location names every file it concerns, with `:line` when
  the finding is about specific text, never just "both pages"), `Strengths` (genuine ones), `Suggested diffs` for small
  fixes, and `Unevaluated`. Do not return whole rewritten pages
  unless asked; propose the change where you found it.
- Order the report by the reader's risk: wrong instructions, then broken
  structure, then missing verification, then voice. Within the table, no
  finding comes before a more severe one.
- When Node.js 20+ is available, save the report and run
  `scripts/check-review-report.mjs <report.md>` from this skill. It checks
  the report's structure, not whether the findings are right.

## Review with history

Docs rot silently, so use Git as evidence: last-modified dates identify
staleness, and an un-owned page (no author, no maintenance) is a finding.
Suggest an owner from evidence (`CODEOWNERS`, recent substantive commits,
the README's maintainer or support section), with that evidence, or suggest
retiring the page. Do not just ask who owns it. Freshness findings cite the
last substantive commit, not the calendar.

## Boundaries

- Never rewrite or push documentation without the user's explicit ask; a
  review reports, an edit changes.
- Surface what you could not verify (links not fetched, commands not run)
  rather than silently skipping or claiming verification.
- Keep secrets out of findings: flag that a token appears in an example;
  never reproduce its value.
