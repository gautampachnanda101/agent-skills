# doc-author

**Version 1.1.0 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/doc-author/SKILL.md) · plugin name `agent-skills:doc-author`**

Writes new documentation and rewrites existing pages with the discipline a
[documentation-review](documentation-review.md) pass will later demand:
state the user need first, choose the Diátaxis form, structure for the
reader's work, write in plain English with deliberate requirement wording,
and verify every command, link, and lint check before delivery.

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
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/doc-author/SKILL.md) | Need → form → structure → voice → validation flow |
| [`style-rules.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/doc-author/style-rules.md) | The self-validator checklist applied before delivery |

## Mechanical pass built in

Before asking for human review it runs what the project declares —
`markdownlint`, `vale`, link checkers, or the repository's zero-dependency
TechDocs checker — in a fix-and-verify loop, and reports anything it could
not evaluate rather than assuming clean.

## Use it

> Write the getting-started guide for this repository using the doc-author
> skill, following Diátaxis.

Pairs with [documentation-review](documentation-review.md): author first,
review second — or review an existing page and hand the findings to the
author skill to fix.
