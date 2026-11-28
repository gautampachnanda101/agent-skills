# peer-code-review

**Version 1.3.4 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/SKILL.md) · plugin name `agent-skills:peer-code-review`**

Runs an evidence-based peer code review of a diff, commit series, or pull
request. It reviews in focused passes, grades each finding by severity with
`file:line` evidence, explains why, and ends with a verdict the author can
act on. User-interface changes also get a WCAG 2.2 AA accessibility check.

## Grounded in

- Google's [eng-practices code review guide](https://google.github.io/eng-practices/review/) —
  its eight review dimensions, small-change rules, and one-business-day
  response discipline
- Michael Fagan's inspections and Karl Wiegers' *Peer Reviews in Software* —
  preparation, entry/exit criteria, and findings-over-style focus
- Gerald Weinberg's egoless framing and Steve McConnell's *Code Complete* —
  tone and checklist practice
- Cohen (SmartBear) and Bacchelli & Bird's research — review pacing and
  where human review adds value
- [GOV.UK accessibility guidance](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-accessibility/) —
  WCAG 2.2 AA as the standard for interface-touching changes

## What ships with the skill

| Path | Role |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/SKILL.md) | Process, pacing, findings, tone, report format |
| [`checklists.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/checklists.md) | Correctness/design, tests, maintainability, documentation, UI accessibility |
| [`scripts/check-review-report.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/scripts/check-review-report.mjs) | Zero-dependency report grader with `--json` (Node.js 20+) |
| [`evals/evals.json`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/evals/evals.json) | Eval prompts and grader-backed assertions |
| [`tests/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/peer-code-review/tests) | Planted-defect fixtures, expected reports, and grader tests |

## Check a report

Save the review as Markdown, then run the grader:

```sh
node skills/peer-code-review/scripts/check-review-report.mjs report.md
```

It exits 0 when the report follows the skill's format, or lists each problem
and exits 1. It checks structure, not whether the findings are right.

## Use it

> Review this pull request using the peer-code-review skill.

The review produces a verdict, a findings table, genuine strengths, and a
deferred list. The verdict is `approve`, `approve with comments`,
`request changes`, or `split before review`. It never pushes to the
branch.
