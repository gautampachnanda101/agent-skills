# peer-code-review

**Version 1.2.0 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/SKILL.md) · plugin name `agent-skills:peer-code-review`**

Runs an evidence-based peer code review of a diff, commit series, or pull
request: focused passes at review-research-informed pacing, findings graded
by severity with `file:line` evidence, why-not-what explanations, and a
verdict the author can act on. User-interface changes additionally get a
WCAG 2.2 AA accessibility check.

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

## Use it

> Review this pull request using the peer-code-review skill.

The review produces a verdict (`approve`, `approve with comments`,
`request changes`, `split before review`), a findings table, genuine
strengths, and a deferred list — without ever pushing to the branch.
