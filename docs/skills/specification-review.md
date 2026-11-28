# specification-review

**Version 1.0.2 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/specification-review/SKILL.md) · plugin name `agent-skills:specification-review`**

Reviews a specification before anyone builds from it, the way a developer
and a tester would have to use it. It checks every claim against the
repository's code and docs, rates each finding by what it would cost if
built as written, and gives a verdict: `ready`, `ready after changes`, or
`not ready`. It never edits the spec.

## What it checks

Testability, acceptance criteria (Given, When, Then), coverage of every
requirement, failure cases, scope and non-goals, consistency with the
repository, and terms. The report uses the same findings table as
[peer-code-review](peer-code-review.md).

## Use it

> Review the spec in docs/specs/csv-export.md before we build it.

It pairs with [specification-author](specification-author.md), but reviews
a specification however it was written.
