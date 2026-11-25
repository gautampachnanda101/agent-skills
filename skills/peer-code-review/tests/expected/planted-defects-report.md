# peer-code-review: planted-defects change

**Mechanical pass (recorded, per skill rules):** the fixture declares no
configured linter or coverage tool, ESLint/Ruff/mypy could not run, and the
nested `try` in `src/queue/consumer.js:15-19` is reachable only by reading.
Nothing ran; nothing is assumed clean. **Unevaluated: all mechanical
signals.**

**Scope note:** reviewed as a single pull request touching
`src/queue/consumer.js` and `src/ui/status.js`, base `main`. The task list
call at the top of the fixture defines the intent: surface defects matching
its ledger. A `split before review` was considered for the unrelated
reformatting (finding 7) alone is not enough to demand a split; verdict
below.

## Verdict

Verdict: `request changes`

## Findings

| Severity | Defect | Evidence | Why |
| --- | --- | --- | --- |
| `major` | Nested catch swallows every failure and the failure log was removed, so bad state reaches the retry counter silently | `src/queue/consumer.js:15-19`, quote: `catch (error) { // ignore transient errors }` plus deleted `this.log.fail(event.id, error)` | A poisoned event now retries forever with zero operator signal — the exact defect the tests would have caught |
| `major` | Failure-path test was deleted while the failure path itself changed; coverage on the changed code cannot have held | `src/queue/consumer.test.js` (deleted `poll handles rejection` case), quote: `- it("logs and retries", ...)` | The riskiest line in the diff is now the least tested line in the service |
| `major` | Status rendered as a non-semantic `div` styled by colour alone, replacing text in a `<span>` | `src/ui/status.js:6`, quote: `<div style={health.ok ? green : red}>{health.label}</div>` | Colour-only status fails screen readers and colour-blind users (GOV.UK WCAG 2.2 AA); a failed health check must still say "failed" in words |
| `major` | Hardcoded live-looking GitHub token added in a test helper | `tests/helpers/queue.js:41` (presence only — value not reproduced here) | Flag and rotate: the token must not ship in diffs or history |
| `minor` | `# noqa` added with no reason | `src/queue/consumer.js:8`, quote: `# noqa` | Blanket suppressions hide the next real error; state what it silences or fix the root cause |
| `minor` | `health` widened from a typed `Health` object to `any` | `src/ui/status.js:12`, quote: `function renderStatus(health: any)` | Loses the type safety the rest of the module keeps; retyped props keep it safe |
| `minor` | Retry accounting duplicated between `poll()` and `pollOnce()` | `src/queue/consumer.js:22-24` and `src/queue/consumer.js:37-39` | Two copies of the same backoff logic will drift — one of them will silently forget the counter reset |
| `minor` | Whole `src/ui/` import reformat outside the change's purpose | `src/ui/status.js:1-9` churn | Buries the real behavioural change; reformat in isolation or drop it |

**Secret handling note:** finding 4 deliberately does not reproduce the
token; the author must rotate it regardless of the review outcome.

**Deferred:** none — no item here is better as a follow-up ticket than as
part of this change.

## Strengths

- The retry counter itself is a good instinct — bounded retries are better
  than unbounded logging loops.
- `renderStatus` keeping the label in its output preserves a usable fallback
  text for the accessibility fix to build on.

## Follow-up checklist for the author

1. Restore the failure log and add the intent-preserving catch: re-run
   `poll handles rejection`.
2. Re-add the deleted test; re-run lint with suppressions justified.
3. Rotate the leaked token, replace with a fixture credential.
4. Re-type `renderStatus(health: Health)`.
5. Collapse the duplicate retry accounting into one helper.
6. Revert or isolate the `src/ui/` reformat.
