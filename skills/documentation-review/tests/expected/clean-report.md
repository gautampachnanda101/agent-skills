# Documentation review: `sync-data.md`, `sync-settings.md`

**Audience:** operators of the `syncctl` CLI who run syncs and maintain `sync.yaml`. You stated this audience, and both pages fit it: they assume a terminal, exit codes, and YAML editing.

**User needs:**
- `sync-data.md` helps the operator finish one task: run a sync and recover from a failed one.
- `sync-settings.md` helps the operator look up every key that `sync.yaml` accepts.

## Classification

| Page | Intended form | Actual form | Verdict |
| --- | --- | --- | --- |
| `sync-data.md` | How-to guide | How-to guide: prerequisites, numbered steps, then re-run behaviour at the end | Correct, with no genre mixing |
| `sync-settings.md` | Reference | Reference: a settings table with an adjacent example | Correct, with no narrative padding |

Both pages pass the three-second test. The first sentence of each page states its outcome.

## Findings

| Severity | Location | Evidence | Suggested fix |
| --- | --- | --- | --- |
| minor | `sync-data.md:24-26` | Step 2 is titled "Check the result" but covers only one failure. It also switches to past tense ("printed", "exited") after step 1 uses the present ("prints", "exits"). The sentence is about 26 words, over the GOV.UK limit of 25. | Put the condition first, in the present tense, and split the sentence. See the first suggested diff. |
| minor | `sync-data.md:24-26`, `sync-settings.md:8-9` | The fix for `cannot read <path>` is "correct the `source` or `target` path". The fact that paths are relative to `sync.yaml` appears only in the reference. That is the most likely cause of a wrong path, and the how-to does not mention it. | Add "Paths are relative to `sync.yaml`" to step 2 and link to the settings table. Keep the reference as the canonical definition. |
| minor | `sync-data.md:10` | The prerequisite tells the reader to check that `syncctl --version` prints a version, but it never states which version these pages document. Readers on other versions cannot tell whether the flags and messages apply to them. | State the minimum supported version, for example "version 1.x or later", or date-stamp the page. |
| minor | `sync-settings.md:10` | The `log_level` row says only "How much the command prints". It does not say what each level prints, so operators cannot choose a level from the reference alone. | Add one short line per value, or add a column that lists the output at each level. |
| minor | `sync-data.md`, `sync-settings.md` | Neither page names an owner, and no Git history, `CODEOWNERS` file, or README maintainer section was available. Without those, no owner could be suggested from evidence. | Assign an owner in `CODEOWNERS` or in the page metadata. If the CLI has a maintainer, that person or team is the natural owner. |
| nit | `sync-data.md:4` | In "Use it after you change files", the pronoun "it" has to refer back to "one command" across a sentence break. | Write "Run it after you change files in the source directory." |
| question | `sync-data.md:22`, `sync-settings.md:10` | Step 1 says the command prints `sync complete`. Does that line still appear when `log_level: error` is set? If not, the expected output in step 1 is wrong for some valid configurations. | Confirm the behaviour. If the line is suppressed, say "With the default `log_level` of `info`, the command prints…" and treat exit code 0 as the success signal. |
| question | `sync-data.md:3-4`, `sync-data.md:28-29` | "Copies new and changed files" does not say what happens to a changed file that already exists in `target`. Is it overwritten without a prompt? Are files deleted from `source` also removed from `target`? Is `target` created if it is missing? If the command overwrites files, a warning must come before step 1. | Confirm the behaviour. If it overwrites, add a warning callout under "Before you start". |
| question | `sync-data.md:24` | Only one failure message is documented. Can the command fail in other ways, such as an invalid `log_level` or a `target` that cannot be written to? | Document any other exit codes and error strings, or link to a troubleshooting reference. |
| question | `sync-settings.md:8-9` | Are absolute paths accepted for `source` and `target`, or only paths relative to `sync.yaml`? | State the rule in the Type column. |

## Strengths

- Both pages pass the Diátaxis check: one form each, with clean cross-links between the how-to and the reference (`sync-data.md:11-12`, `sync-settings.md:3-4`).
- The prerequisites come before the first step that needs them, and include a self-check (`syncctl --version`).
- Each step states its expected output and exit code (`sync-data.md:22`).
- The exact error string is quoted, so readers who search for it can find the page (`sync-data.md:24`).
- The reference table has a header row and the columns operators need: type, default, required, and purpose. A complete example sits right after the table.
- The voice is direct, active, and imperative. There are no `simply`, `just`, or `easy` qualifiers. `need` and `can` carry the requirement strength they should.
- Each page has a single sentence-case `H1`, with no skipped heading levels.
- Code blocks carry language tags. Link text is descriptive and matches the title of each target page.

## Suggested diffs

`sync-data.md:24-26`

```diff
-2. Check the result. If the command printed `sync failed: cannot read <path>`
-   and exited 1, correct the `source` or `target` path in `sync.yaml`, then
-   run the command again.
+2. If the command prints `sync failed: cannot read <path>` and exits 1, the
+   path is wrong. Correct `source` or `target` in `sync.yaml`, then run the
+   command again. Paths are relative to `sync.yaml`; see
+   [Sync settings](sync-settings.md).
```

`sync-data.md:4`

```diff
-target directory. Use it after you change files in the source directory.
+target directory. Run it after you change files in the source directory.
```

## Unevaluated

- **Commands and output:** `syncctl --version`, `syncctl --config sync.yaml`, the `sync complete` and `sync failed: cannot read <path>` messages, and the exit codes 0 and 1 were not run, because nothing could be executed here. The quick start is therefore unverified.
- **Completeness of the settings table:** without the CLI source or a schema, I could not confirm that `source`, `target`, and `log_level` are the only keys.
- **Internal links:** `sync-settings.md` and `sync-data.md` resolve only if both files sit in the same directory. I assumed they do but did not check the filesystem.
- **External links:** there are none.
- **Linters:** none is configured, so `markdownlint`, `vale`, and `markdown-link-check` were not run.
- **Freshness:** no Git history was available, so I could not find the last substantive commit.
- **Contrast and rendered accessibility:** no rendered site was available. The pages have no images, colour cues, or attachments.
- **Report checker:** `scripts/check-review-report.mjs` was not run, because no tools were available.
