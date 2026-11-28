# specification-author

**Version 1.0.2 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/specification-author/SKILL.md) · plugin name `agent-skills:specification-author`**

Turns a rough request into a specification a team can build and test from.
It reads the repository first, asks the three to five questions that would
change what gets built, each with a suggested answer, and writes nothing
until they are answered. The specification has the need, the scope and
non-goals, numbered requirements with measurable targets, and
Given/When/Then acceptance criteria that cover every requirement.

## What ships

| File | Purpose |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/specification-author/SKILL.md) | Read, ask, write, split large requests, check |
| [`scripts/check-specification.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/specification-author/scripts/check-specification.mjs) | Fails on missing sections, incomplete criteria, uncovered requirements, untestable words, and placeholders; zero dependencies |
| [`evals/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/specification-author/evals) | Reply and behaviour eval cases |

## Use it

> Write a spec for adding CSV export to the reports page.

It stands alone. To check a specification, use
[specification-review](specification-review.md); to plan its tests, use
[test-plan-author](test-plan-author.md); to plan the work, use
[change-plan-author](change-plan-author.md).
