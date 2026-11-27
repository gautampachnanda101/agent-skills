# decision-record-author

**Version 1.0.0 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/decision-record-author/SKILL.md) · plugin name `agent-skills:decision-record-author`**

Writes an architecture decision record that a newcomer can act on: the
context in checkable facts, the options considered with their costs, the
decision, and its consequences, including what would make the team revisit
it. It reads the repository's existing records first, follows their folder,
numbering, and template, and suggests the number, title, and status before
writing anything.

## Grounded in

- Michael Nygard's
  [architecture decision records](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):
  context, decision, and consequences, one decision per record
- [MADR](https://adr.github.io/madr/), which makes the considered options
  explicit

## What ships

| File | Purpose |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/decision-record-author/SKILL.md) | Read the existing records, suggest, write, supersede, check |
| [`scripts/check-decision-record.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/decision-record-author/scripts/check-decision-record.mjs) | Fails on a missing title, status, or section, a placeholder, broken numbering, or a dangling supersede; zero dependencies |
| [`evals/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/decision-record-author/evals) | Reply and behaviour eval cases |

## Use it

> Write a decision record for moving payment updates from polling to
> webhooks; the discussion is in notes/webhooks.md.

To change an accepted decision, ask for a new record that supersedes it. The
skill changes only the old record's status line.

This repository checks its own records with the bundled checker before
every commit.
