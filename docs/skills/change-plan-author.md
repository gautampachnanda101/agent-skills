# change-plan-author

**Version 1.0.1 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/change-plan-author/SKILL.md) · plugin name `agent-skills:change-plan-author`**

Breaks an approved specification, design, or written request into a
sequence of small changes that each fit one review. Every step names the
files it touches, the check that proves it works, its size, and the steps it
depends on, so the work can stop safely after any of them. It reads the code
first and plans only changes it has located.

## Grounded in

Review effectiveness falls sharply past about 400 changed lines in one
sitting, as Jason Cohen's SmartBear study found and
[peer-code-review](peer-code-review.md) applies. So no step in a plan
should be larger than that.

## Use it

> Plan the work for the CSV export spec as a sequence of reviewable changes.

It writes no code. To plan the tests, use
[test-plan-author](test-plan-author.md).
