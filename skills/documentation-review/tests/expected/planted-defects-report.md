# documentation-review: planted-defects pages

**Mechanical pass (recorded, per skill rules):** `markdownlint`, `vale`, and
`markdown-link-check` are not configured in the fixture; `link targets` were
checked by inspection only. **Unevaluated:** external destinations
(`click-here-destination`, the raw.githubusercontent.com URL), image
geometry, and contrast values — nothing fetched without permission.

## Classification

- `guide.md` — **how-to guide** (a task in progress: "syncing your data"),
  and therefore judged by how-to rules.
- `reference.md` — **reference** (settings lookup), judged by lookup rules.
- `clean.md` — **how-to guide**, judged the same way as `guide.md`.

## Verdict

Verdict: `request changes` — `guide.md` is not usable as a how-to in its
current form; `reference.md` needs the stale-claim and accessibility fixes.

## Findings

| Severity | Defect | Evidence | Why |
| --- | --- | --- | --- |
| `major` | No outcome in the first two sentences — the page opens with project history | `guide.md:1-4`, quote: "Back in the early days of the project..." | Nielsen's scan study: most readers scan, so the outcome must be where scanning stops — nobody scanning reaches the command |
| `major` | Quadrant mixing: distributed-systems theory inside a how-to | `guide.md:8-9`, quote: "conceptually similar to optimistic replication" | The reader came to run a sync, not to understand replication — theory hides the steps behind it |
| `major` | Colour-only instruction and non-actionable text | `guide.md:12`, quote: "click the red Sync button on the right" | Fails screen readers and colour-blind users (GOV.UK WCAG 2.2 AA) — a position the eye must find by name ("choose Sync", then the button state) |
| `major` | Vague link text and a bare URL as link body | `guide.md:14`, quote: `Read more [here](...) or at https://raw.githubusercontent.com/...` | No information scent: "here" says nothing about the destination, and a pasted raw URL is not readable by assistive tech (GOV.UK link rules) |
| `major` | Image without alt text | `reference.md:12`, quote: `<img src="architecture-diagram.png">` | The chart's meaning is unreachable for non-visual readers (GOV.UK: describe images in nearby text) |
| `major` | Stale claim, verifiable against the repository | `reference.md:14-15`, quote: "this page documents the sync for CLI 1.2" | The page contradicts the repo state (CHANGELOG at 4.0); wrong-version docs cost readers more than missing pages |
| `minor` | `Simply` before a non-trivial step | `guide.md:10`, quote: "Simply run the sync command" | Tells a reader who hits trouble the problem is them (Google/Microsoft honesty rule) |
| `minor` | `must` on an optional capability | `reference.md:9`, quote: "you must have a Pro subscription to configure it" | GOV.UK wording ladder: `must` is for real-consequence requirements; `need` fits a gating condition |
| `minor` | Context-free link list in body prose | `guide.md:15-16`, quote: "Read more [here]... or at ..." | GOV.UK: links go where useful in context, not as an unsorted 'more information' dump |
| `minor` | Paragraph duplicated verbatim from guide.md's overview | `reference.md:10`, quote: "The sync interval can be configured..." (same sentence block as guide.md:8) | Duplicated guidance drifts apart — this copy already contradicts nothing today, but will after the first edit |

## Reference-table note

`reference.md`'s settings table (`reference.md:6-8`) also carries its content
in prose instead of columns ("Info" holding a sentence); as a reference form,
the table should state each setting's keys, defaults, and type — recorded as
part of finding `finding table shape` rather than a separate defect.

## Unevaluated

- Whether the destination of `here` and the raw URL resolve (no fetch
  without permission).
- Whether `architecture-diagram.png` has meaningful `alt` elsewhere — absent
  in source shown.
- Contrast measurements for the red/green status styling.

## What works

- `clean.md` shows the intended standard: outcome first, imperative steps
  with results, descriptive links — `guide.md` should match its shape.
- The settings page correctly uses a table for lookup form.
