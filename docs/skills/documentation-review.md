# documentation-review

**Version 1.4.3 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/SKILL.md) · plugin name `agent-skills:documentation-review`**

Reviews documentation the way leading documentation engineers define
quality. It classifies each page's form and audience, checks structure and
navigation, applies style-guide rules, and verifies commands, samples, and
links. Findings come with evidence, in order of risk to the reader.
Accessibility is part of the review, at WCAG 2.2 AA as GOV.UK applies it.

## Grounded in

- Daniele Procida's [Diátaxis](https://diataxis.fr/) — tutorials, how-tos,
  reference, and explanation, each judged by its own standard
- The [Google Developers Style Guide](https://developers.google.com/style) and
  the [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)
- [GOV.UK content design](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/) —
  user needs first, mandatory plain English, deliberate requirement wording
  (`must`/`need`/`can`), accessible link text
- [GOV.UK accessibility](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-accessibility/) —
  WCAG 2.2 AA checked for link text, heading hierarchy, colour-independent
  meaning, contrast, alt text, tables, and open formats
- Karl Wiegers' findings-over-opinions review practice and docs-as-code
  ownership rules

## What ships with the skill

| Path | Role |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/SKILL.md) | Review flow, style rules, accessibility checks, report format |
| [`review-checklists.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/review-checklists.md) | Type/audience, structure, voice, accuracy, code and links, accessibility, freshness |
| [`scripts/check-review-report.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/scripts/check-review-report.mjs) | Zero-dependency report grader with `--json` (Node.js 20+) |
| [`evals/evals.json`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/evals/evals.json) | Eval prompts and grader-backed assertions |
| [`tests/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/documentation-review/tests) | Planted-defect fixtures, expected reports, and grader tests |

## Check a report

Save the review as Markdown, then run the grader:

```sh
node skills/documentation-review/scripts/check-review-report.mjs report.md
```

It exits 0 when the report follows the skill's format, or lists each problem
and exits 1. It checks structure, not whether the findings are right.

## Use it

> Review this README with the documentation-review skill.

Findings are ordered by reader risk: wrong instructions, broken structure,
unverified commands, then voice. Each cites `file:line` evidence. The skill
reports without rewriting pages unless you ask.
