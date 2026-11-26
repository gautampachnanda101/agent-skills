# Documentation review: `guide.md`, `reference.md`

**Audience:** operators of the sync command-line interface (CLI), as stated in the task. Each finding says whether it helps or hurts that audience.

**User need per page:**

- `guide.md`: an operator wants to run a sync. This is a task need, so the page should be a how-to.
- `reference.md`: an operator wants to look up sync settings. This is a lookup need, so the page should be a reference.

## Classification

| Page | Intended form | Actual form | Verdict |
| --- | --- | --- | --- |
| `guide.md` | How-to guide ("Syncing your data") | A mix: history preamble (lines 3–5), explanation (lines 11–14), one task sentence (line 18) | Misclassified. The explanation crowds out the task, and the task has no real steps. |
| `reference.md` | Reference (settings table) | Mostly reference, plus a duplicated explanation sentence (line 8) and an architecture diagram (line 12) | Mostly correct. It is incomplete and contains wrong facts. |

## Findings

| Severity | Location | Evidence | Suggested fix |
| --- | --- | --- | --- |
| blocker | `reference.md:14`, `CHANGELOG.md:3-9` | The page says "This page documents the current release, CLI 1.2." The changelog lists 4.0.0 as "The current release" and 1.2.0 as "First public release." Operators on 4.0.0 are reading docs that are 3 major versions old. | Check the settings against 4.0.0, then update the stamp to "CLI 4.0". Do not rely on the word "current"; state the version the page was last checked against. |
| blocker | `reference.md:10` | "Setting `interval` is optional. You must set it before the first run." The two sentences contradict each other, so at least one is wrong. An operator who skips the setting may have a failed first run. | Check the CLI's behaviour. Then either state the default ("Optional. Default: N seconds.") or mark the setting as required ("You must set `interval` before the first sync."). Do not keep both. |
| major | `guide.md:1-16` | The page is classified as a how-to, but its first sentences are project history (lines 3–5). It then explains how replication works (lines 11–14) before any task content. It fails the three-second outcome test, and the task appears last. | Open with the outcome, for example "Run a sync to reconcile local data with the remote." Put the steps straight after it. Move lines 11–14 to an explanation page, and delete lines 3–5 or move them there too. |
| major | `guide.md:18` | "Simply click the red button on the right to start." This depends on colour and position, which fails a screen-reader user. It tells a CLI audience to click a button, but no button is shown. "Simply" adds no meaning. There is also no actual sequence of steps. | Replace with numbered steps that name the command, for example "1. Run `sync start`." Confirm the real command first. If a graphical control does exist, name it by its label, not its colour or position. |
| major | `guide.md:20` | "Read more [here](reference.md)." This is non-descriptive link text and fails WCAG 2.4.4. The reader cannot tell where the link goes. | Use "See [sync settings](reference.md) for `interval` and `retries`." |
| major | `reference.md:12` | `<img src="architecture-diagram.png">` has no `alt` attribute and no description in the text around it. Screen-reader users get nothing from it. An architecture diagram is also explanation content, not reference. | Add alt text and a short text description of the diagram. Better still, move the diagram to the explanation page suggested above. |
| major | `reference.md:3-6` | The settings table has no type, unit, default, or allowed range. The `retries` row says only "attempts", and the `interval` row does not give its unit. The column heading "Info" says nothing. This lookup page is not complete enough for operators to set values correctly. | Use these columns: Setting, Type, Default, Required, Description. For example: `interval`, duration (seconds?), default ?, how often sync runs. |
| major | `guide.md:9`, `reference.md:8` | The same sentence appears on both pages: "The sync interval controls how often local and remote data are compared." The two copies will drift apart over time. | Keep the definition only in the `interval` row of `reference.md`. In `guide.md`, link to that row instead of repeating it. |
| minor | `guide.md:11-14` | "optimistic replication" and "version vectors" are used without definition. Operators running a sync do not need them. | Move this text to an explanation page and define the terms there, or remove it. |
| minor | `guide.md:3-5`, `guide.md:11-13` | Both sentences run over 25 words, which fails the plain English guideline and affects cognitive accessibility. | Split each into shorter sentences, or remove them as part of the restructure above. |
| minor | `guide.md:7` | The heading "Overview" does not describe its section, so the anchor is vague when a screen reader lists headings. | Use a descriptive heading such as "How sync reconciles data", or remove the section in the restructure. |
| minor | `reference.md` (whole page) | The page does not link back to the task guide, so readers who land on it cannot find how to run a sync. | Add "To run a sync, see [Syncing data](guide.md)." |
| question | `guide.md`, `reference.md` | Neither page names an owner. `guide.md:5` says "the platform team designed" the current architecture. That is the only ownership evidence available. | Name the platform team as owner, based on `guide.md:5`, or retire the pages if no owner is confirmed. |

## Strengths

- Each page has exactly one `H1`, and the heading levels do not skip.
- `reference.md` uses a data table with a header row and no layout tables.
- `reference.md:14` attempts to date-stamp the content by version, which is the right practice even though the version is wrong.
- `guide.md` links to the reference page, so it is not an orphan.

## Suggested diffs

`reference.md:10`, once the correct behaviour is confirmed. This example assumes the setting is optional with a default:

```diff
-Setting `interval` is optional. You must set it before the first run.
+`interval` is optional. If you don't set it, sync uses the default of <N> seconds.
```

`reference.md:14`:

```diff
-This page documents the current release, CLI 1.2.
+This page documents CLI 4.0.
```

`guide.md:18-20`, with the command name to be confirmed:

```diff
-Simply click the red button on the right to start.
-
-Read more [here](reference.md).
+1. Run `<sync start command>`.
+
+To change how often sync runs, see [sync settings](reference.md).
```

`reference.md:12`:

```diff
-<img src="architecture-diagram.png">
+<img src="architecture-diagram.png" alt="Sync architecture: <short description>">
```

## Unevaluated

- **Commands:** none were run, and no runnable command appears in either page. The CLI's real start command, the `interval` default, and whether `interval` is required are not verified.
- **Image target:** whether `architecture-diagram.png` exists relative to `reference.md` could not be checked, because no filesystem listing was available.
- **Links:** the internal link `guide.md:20` → `reference.md` points at a file that was provided, so it resolves. There are no external links.
- **Linters:** none are configured. `markdownlint`, `vale`, and `markdown-link-check` were not run.
- **Contrast:** not applicable to the Markdown source. The rendered site was not inspected.
- **Freshness and ownership:** this is not a git repository, so last-modified dates and authorship could not be checked. The `scripts/check-review-report.mjs` structure check was not run.
