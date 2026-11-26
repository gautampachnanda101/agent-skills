## Verdict

Verdict: approve with comments

The production change does not alter behaviour: `2 ** this.attempts * 100` becomes `2 ** this.attempts * BASE_DELAY_MS`, with `BASE_DELAY_MS = 100`. The new test is deterministic. No blocker or major is open. This approval depends on CI passing the new test, because nothing could be run here (see Unevaluated).

## Findings

| Severity | Location | Evidence | Direction |
|---|---|---|---|
| question | `tests/consumer.test.ts:23` | `expect(queue.delays).toEqual([200, 400]);` | This expectation only holds if `this.attempts` is incremented *before* the `requeue` call at `src/queue/consumer.ts:30`. That increment is outside the diff (lines 10–26 are not shown). If `attempts` is still 0 on the first requeue, the result is `[100, 200]` and the test fails. Has this test been run green locally or in CI? |
| minor | `tests/consumer.test.ts:23` | `[200, 400]` | The test name and the PR description say the delay *doubles*, but the assertion pins absolute values. Changing `BASE_DELAY_MS` would break this test even though doubling still holds, so the test is coupled to the constant the PR just extracted. Two options: assert the ratio (`expect(queue.delays[1]).toBe(queue.delays[0] * 2)`), or export `BASE_DELAY_MS` and assert `[2 * BASE_DELAY_MS, 4 * BASE_DELAY_MS]`. |
| nit | `tests/helpers/queue.ts:22-23` | `requeued.push(event.id);` / `delays.push(delay);` | `requeued` and `delays` are parallel arrays that must stay index-aligned. Recording `{ id, delay }` pairs would make that pairing explicit. This is optional, because it would change the existing `requeued` assertion at line 15. |

## Strengths

- The refactor is value-identical. It names a magic number without changing behaviour, which matches the description exactly and nothing more.
- The fake queue records the requested delay instead of waiting it out. The new test is therefore deterministic and fast, with no timers and no sleeping.
- The fake's change is minimal: the shared helper is extended rather than copied, and the existing test at `tests/consumer.test.ts:14-15` keeps working unchanged.

## Deferred

- `src/queue/consumer.ts:9` `private attempts = 0;` is a per-consumer counter, not a per-event one. As a result, one event's failures raise the backoff for the next event. This is pre-existing and outside this PR's scope, so it should be a ticket.
- No test covers the `MAX_ATTEMPTS` boundary: whether the dead-letter path fires after 5 attempts and `attempts` resets (`src/queue/consumer.ts:27`). This is worth a follow-up test ticket.

## Unevaluated

- The test suite was not run, including the new test at `tests/consumer.test.ts:18-24`. Its pass/fail depends on unseen code (see the question above).
- TypeScript compilation (`tsc`) was not run. One thing to confirm: the fake's new `requeue(event, delay: number)` signature should match the `Queue` interface in `src/queue/queue.ts`.
- The project's linter and coverage tooling were not run, and it is unknown which are configured.
- The unchanged context in `src/queue/consumer.ts` (lines 10–26) was not available.
- Accessibility does not apply, because there is no user-facing interface. Documentation and release impact also do not apply, because there is no behaviour or config change.
