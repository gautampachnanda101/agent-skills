---
name: documentation-review
description: Review documentation against the leading documentation engineering practices — the Diátaxis framework by Daniele Procida for structure and type, the Google Developers Style Guide and Microsoft Writing Style Guide for voice, and docs-as-code review practice from Anne Gentle and Karl Wiegers. Classifies each page's type and audience, checks structure and navigation, verifies commands, code samples, and links, then reports prioritized findings with file:line evidence and suggested fixes. Use when asked to review, audit, or improve documentation, a README, tutorial, how-to, reference page, explanation, or documentation site.
license: Apache-2.0
compatibility: Host assistant with file-read tools; Bash and Node are optional for verifying commands, links, and MkDocs/TechDocs structure. Fetching external network evidence requires host and user permission.
metadata:
  author: gautampachnanda101
  version: "1.0.0"
---

# Documentation review

Review documentation the way leading documentation engineers define quality:
each page serves one reader need, the structure makes that need obvious, and
every claim, command, and link survives verification. Grounded in Daniele
Procida's [Diátaxis framework](https://diataxis.fr/), the
[Google Developers Style Guide](https://developers.google.com/style) and the
[Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/),
and the docs-as-code review practice described by Anne Gentle and Karl
Wiegers' peer-review research.

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
- Single `H1` per page, consistent heading depth, headings that describe
  content. Navigation must resolve: every nav entry, link, and image target
  exists relative to its document.
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
- **Honesty**: drop `simply`, `just`, `obviously`, and `easy`; they tell
  confused readers they are wrong. State costs and prerequisites plainly.
- **Scannability**: options and environments as tables, steps as numbered
  lists, warnings as callouts — not paragraphs. Prose walls are findings at
  the same severity as broken links, because readers skim.

See [review-checklists.md](./review-checklists.md) for the full checklist.

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
- Report as: findings table, then strengths worth keeping (genuine ones),
  then suggested diffs for small fixes. Do not return whole rewritten pages
  unless asked; propose the change where you found it.
- Order the report by the reader's risk: wrong instructions, then broken
  structure, then missing verification, then voice.

## Review with history

Docs rot silently, so use Git as evidence: last-modified dates identify
staleness, and an un-owned page (no author, no maintenance) is a finding —
assign an owner or mark the page for retirement. Freshness findings cite the
last substantive commit, not the calendar.

## Boundaries

- Never rewrite or push documentation without the user's explicit ask; a
  review reports, an edit changes.
- Surface what you could not verify (links not fetched, commands not run)
  rather than silently skipping or claiming verification.
- Keep secrets out of findings: flag that a token appears in an example;
  never reproduce its value.
