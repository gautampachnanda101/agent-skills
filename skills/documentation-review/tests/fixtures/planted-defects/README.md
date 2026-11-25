# Planted-defect documentation pages

Fixture set for applying the documentation-review skill. Ten defects are
planted across two pages; one companion page is deliberately clean, so the
review must also prove it does not invent findings.

## guide.md — a how-to (defects planted)

```markdown
# Syncing Data

Back in the early days of the project, the sync subsystem went through
several iterations before arriving at today's architecture, which was
designed by the platform team after a long series of incidents.

## Overview

Data syncing works by comparing local state with remote state and
reconciling the differences, which is conceptually similar to how
optimistic replication works in distributed systems.

## Syncing your data

Simply run the sync command:

    click the red Sync button on the right to start the sync

Read more [here](click-here-destination) or at
https://raw.githubusercontent.com/acme/sync/main/README.md.

Sync runs automatically for [Pro users](/pro/#pricing).
```

| # | Planted defect | Expected severity |
| --- | --- | --- |
| 1 | Preamble + theory before any outcome or command; no first-two-sentence outcome | `major` (3-second outcome test) |
| 2 | Quadrant mixing: replicated-systems theory inside a how-to | `major` |
| 3 | `Simply` (honesty rule) | `minor` |
| 4 | Colour-only instruction (`click the red Sync button`) | `major` (accessibility) |
| 5 | Vague link text `here` + bare URL as link body | `major` |
| 6 | Unsorted link dump in body (context-free links) | `minor` |

## reference.md — a reference page (defects planted)

```markdown
# Sync Settings

| Setting | Info |
| --- | --- |
| interval | how often sync runs |

The sync interval can be configured; you must have a Pro subscription
to configure it.

<img src="architecture-diagram.png">

Note: this page documents the sync for CLI 1.2 while the current release
is 4.0 (see CHANGELOG.md).

Duplicate of guide.md's overview paragraph, drift-prone.
```

| # | Planted defect | Expected severity |
| --- | --- | --- |
| 7 | `must` on an optional configuration + no header row semantics declared | `minor` |
| 8 | Image without alt text | `major` |
| 9 | Stale version claim (documents 1.2, project at 4.0) — verifiable via CHANGELOG | `major` |
| 10 | Paragraph duplicated from guide.md | `minor` |

## clean.md — deliberately clean how-to

Outcome in the first two sentences, imperative steps with expected results,
fenced runnable commands, descriptive links, requirement wording correct,
no duplication. Correct outcome: no findings, or one `nit` at most;
false positives here are a grader failure.
