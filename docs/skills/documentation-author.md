# documentation-author

**Version 2.0.1 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-author/SKILL.md) · plugin name `agent-skills:documentation-author`**

Writes new documentation and rewrites existing pages to the standard a
[documentation-review](documentation-review.md) pass will check. It states
the user need first, chooses the Diátaxis form, and writes in plain English
with deliberate requirement wording. It verifies every command, link, and
lint check before delivery, and suggests the need, audience, and placement
from your repository before it asks.

## Grounded in

- Daniele Procida's [Diátaxis](https://diataxis.fr/) — the four forms and
  their separate writing rules
- [GOV.UK content design](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/) —
  user needs first, plain English, `must`/`need`/`can` requirement wording,
  accessible link text
- The [Google Developers Style Guide](https://developers.google.com/style) and
  the [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)
- Docs-as-code practice from Anne Gentle and Karl Wiegers — verified claims,
  no invented content

## What ships with the skill

| Path | Role |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-author/SKILL.md) | Need → form → structure → voice → validation flow |
| [`style-rules.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-author/style-rules.md) | The self-validator checklist applied before delivery |
| [`evals/evals.json`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-author/evals/evals.json) | Eval prompts and assertions |

## Mechanical pass built in

Before asking for human review, it runs what the project declares:
`markdownlint`, `vale`, link checkers, or the repository's TechDocs checker.
It fixes what they find, and reports anything it could not check.

## Use it

> Write the getting-started guide for this repository using the documentation-author
> skill, following Diátaxis.

Pairs with [documentation-review](documentation-review.md): author first,
review second — or review an existing page and hand the findings to the
author skill to fix.
