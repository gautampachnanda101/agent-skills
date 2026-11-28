# test-plan-author

**Version 1.0.2 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/test-plan-author/SKILL.md) · plugin name `agent-skills:test-plan-author`**

Plans the tests that prove a change does what its specification says. Every
acceptance criterion gets at least one test, with negative, error, and
boundary cases where the criterion calls for them. It works from the
specification, never from the implementation, so code written to the wrong
requirement cannot pass tests derived from that code. When asked, it writes
the failing tests first and confirms they fail for the right reason.

## What ships

| File | Purpose |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/test-plan-author/SKILL.md) | Find the criteria, plan, write failing tests first, check |
| [`scripts/check-test-plan.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/test-plan-author/scripts/check-test-plan.mjs) | With `--spec`, fails when a criterion has no test; also checks levels, negative and boundary tests, and placeholders |
| [`evals/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/test-plan-author/evals) | Reply and behaviour eval cases |

## Use it

> Write a test plan for the account-merge spec in docs/specs/merge-accounts.md.

With no specification, it asks for the acceptance criteria first. It pairs
with [specification-author](specification-author.md).
