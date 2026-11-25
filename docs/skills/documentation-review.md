# documentation-review

**Version 1.3.1 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/SKILL.md) · plugin name `agent-skills:documentation-review`**

Reviews documentation the way leading documentation engineers define
quality: classify each page's type and audience first, check structure and
navigation, apply style-guide voice rules, verify commands, code samples,
and links, and report prioritized findings with evidence. Accessibility is
reviewed as part of content quality, at WCAG 2.2 AA as GOV.UK applies it.

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

## Use it

> Review this README with the documentation-review skill.

Findings are graded by reader risk (wrong instructions, then broken
structure, then unverified commands, then voice), cite `file:line` evidence,
and are reported without rewriting the pages unless asked.
