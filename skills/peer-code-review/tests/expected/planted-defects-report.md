## Verdict

Verdict: request changes

Two blockers stop the merge. A live-format credential is committed in a test helper, and `poll()` now silently discards every failed event. There are also major regressions in accessibility, typing, and test coverage. The change is about 60 lines, so it is small enough to review in one sitting and does not need a split.

## Findings

| Severity | Location | Evidence | Direction |
|---|---|---|---|
| blocker | `tests/helpers/queue.ts:3` | `export const apiToken = '<redacted>'`. The value has the GitHub personal-access-token prefix `ghp_`. | This looks like a real credential, and it is now in the branch history. Treat it as compromised: revoke and rotate it now, before anything else. Then remove it from the change and from history (rewriting the commit, not just deleting the line in a follow-up commit). Nothing in the diff reads `apiToken`, so the helper doesn't seem to need it at all. If a test needs a token, use an obviously fake value such as `'test-token'`. |
| blocker | `src/queue/consumer.ts:16-18` | `} catch (error) {` / `// ignore transient errors` / `}` | This catch swallows every error, not only transient ones. The removed `this.log.fail` and `await this.retry(event)` were the only paths that kept a failed event alive. Now a failing event is dropped with no log, no requeue and no dead-letter, so data is lost silently. That contradicts the description's "tolerate transient errors". Either restore logging and retry here, or have `poll()` delegate to the new `pollOnce` logic. Any "ignore" path should first classify the error as transient and still log it. |
| blocker | `src/ui/status.tsx:6-8` | `<div style={{ background: health.ok ? 'green' : 'red', width: 12, height: 12 }} />` | The "Healthy"/"Failed" text and `role="status"` are both gone. Health is now shown only by the colour of an empty `div`. Screen-reader users get no status at all (fails WCAG 1.3.1 and 4.1.3), and colour-blind users can't tell the two states apart (fails WCAG 1.4.1). This regresses AA conformance. Keep the text label and the `role="status"` live region. The colour dot can stay as decoration with `aria-hidden="true"`. |
| major | `src/queue/consumer.ts:25-31` | `this.attempts += 1; if (this.attempts > MAX_ATTEMPTS) { ... }` | `attempts` lives on the consumer instance, and `pollOnce` never resets it on success. Event B therefore inherits event A's failure count, and could be dead-lettered on its first failure or get an inflated backoff. The counter needs to be tracked per event, for example on the event or message metadata, or in a map keyed by `event.id`. It should also reset after a successful `handle`. |
| major | `src/queue/consumer.ts:31`, `:42` | `await this.queue.requeue(event, 2 ** this.attempts * 100);` appears in both `pollOnce` and the existing `retry` | The backoff and requeue logic now exists twice, and `retry` appears to have lost its only caller. Two diverging copies of the retry policy will drift. Keep one path: have `poll` and `pollOnce` share `retry`, extended with the dead-letter branch, and remove whichever is dead. |
| major | `tests/consumer.test.ts:8` | The test `'poll logs and requeues when processing fails'` was deleted. | Coverage of the failure path dropped to zero just as that path changed. The new `pollOnce` has no tests either. Add tests for requeue with backoff, dead-letter after `MAX_ATTEMPTS`, and the counter not leaking between events. Restore a failure-path test for `poll` that shows what it should now do. |
| major | `src/ui/status.tsx:4` | `export function renderStatus(health: any)` | The `Health` type and its import were removed from an exported function. Callers lose compile-time checking of `ok` and `checkedAt`, and a renamed field would now fail at runtime, not at build time. Restore `health: Health`. |
| minor | `src/queue/consumer.ts:45` | `// eslint-disable-next-line @typescript-eslint/no-floating-promises` | This suppression is added with no reason. It also sits on a method declaration, where this rule never fires: the rule flags unawaited promise call sites. So it either does nothing or hints at a real floating promise somewhere else. Remove it, or move it to the actual offending line with a justification. |
| minor | `src/ui/status.tsx:7` | `style={{ background: ..., width: 12, height: 12 }}` | Inline styles replace the existing `'ok'`/`'failed'` classes. That bypasses the stylesheet and `theme.ts`, adding a second way to style status. Prefer class names or theme tokens. |
| minor | `src/ui/theme.ts:1-13` | The exports were reordered and reformatted, with quotes changed from `'` to `"`. | This churn is unrelated to the PR's stated purpose and has no behavioural change, so it buries the real diff. Split it into its own commit or PR, or drop it. If a quote style is wanted, enforce it with a formatter rather than by hand. |
| question | `src/queue/consumer.ts:21`, `:26` | `async pollOnce(event: Event)` / `MAX_ATTEMPTS` | Where is `pollOnce` called, and where is `MAX_ATTEMPTS` defined? Neither appears in the diff. If `pollOnce` has no caller yet, is it meant to replace `poll`? |

## Strengths

- `pollOnce` brings in a bounded retry policy: exponential backoff followed by dead-lettering after `MAX_ATTEMPTS`. That is the right shape for tolerating transient failures without retrying poison messages forever. Once it is the single retry path and its counter is per event, it will meet the PR's goal.

## Deferred

- Add secret scanning (for example gitleaks or GitHub push protection) to pre-commit or CI so token-format strings are rejected before review.
- Add a formatter (for example Prettier) to CI so quote style and ordering stop showing up as diff churn.
- Add automated accessibility checks for UI components (for example `jest-axe`) so colour-only and missing-live-region regressions are caught mechanically.

## Unevaluated

- **ESLint:** declared by the project but not run here. Lint status is unknown, not clean.
- **TypeScript compile (`tsc`):** not run. It is unconfirmed whether `MAX_ATTEMPTS` resolves and whether removing `Health` breaks any callers.
- **Test suite and coverage:** not run. The coverage drop is inferred from the deleted test, not measured.
- **Linked ticket and full file context:** not available. Callers of `pollOnce`, `retry` and `renderStatus` outside the diff could not be checked.
- **`scripts/check-review-report.mjs`:** not run, because no tools were available.
