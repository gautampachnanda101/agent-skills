---
name: decision-record-author
description: Write an architecture decision record (ADR) that a newcomer can act on - the context in checkable facts, the options considered with their trade-offs, the decision stated so someone can follow it, and its consequences, including what would make the team revisit it. Reads the repository's existing records first to follow their folder, numbering, template, and status words, and suggests the number, title, and status before writing. Supersedes rather than edits an accepted record. Use when asked to record, document, or write up a technical or architectural decision, an ADR, or a design choice and its alternatives.
license: Apache-2.0
compatibility: Host assistant with file-read and file-write tools. Node.js 20+ is optional, for the bundled record checker.
metadata:
  author: gautampachnanda101
  version: "1.0.0"
---

# Decision record author

A decision record keeps the reason for a choice next to the code it shaped,
so the next person can change it on purpose instead of by accident. Write it
in the form Michael Nygard introduced for architecture decision records:
context, decision, and consequences, plus the options considered, which the
MADR template makes explicit. One record holds one decision.

## Read the repository first, then confirm once

1. Find the existing records: folders such as `docs/decisions/`, `docs/adr/`,
   `doc/adr/`, or `architecture/decisions/`, and any template or index there.
   Follow what you find: the folder, the file names and numbering, the
   template's headings, and its status words.
2. Read the material the decision comes from: the issue, the discussion, the
   code, and earlier records it touches or replaces.
3. Send one message with your suggestions, each with its evidence, and ask
   only what the evidence cannot answer:
   - the file path and number, the next free one in the sequence
   - the title, as the decision in a few words ("Use webhooks for order
     updates", not "Webhooks")
   - the status, usually `Proposed` until the people deciding have agreed
   - which earlier record it supersedes, if any

Write nothing until those are confirmed. With no existing records, suggest
`docs/decisions/0001-record-decisions.md` and the structure below.

## Write the record

Use the repository's template when it has one. Otherwise use these sections:

| Section | What it holds |
| --- | --- |
| Title and status | `# NNNN. The decision in a few words`, a `Status:` line, and the date |
| Context | The forces that made a choice necessary, as facts a newcomer can check: numbers, constraints, links |
| Options considered | At least two real options, including keeping things as they are, each with what it would cost |
| Decision | What the team will do, stated so someone can follow it |
| Consequences | What gets easier, what gets harder, what it rules out, and what would make you revisit it |

- State facts, not advocacy: the context should let a reader disagree with
  the decision for good reasons.
- Every claim comes from the material you read. When a fact is missing, ask,
  or leave it out and say so in your reply; never put a `TODO` in a record.
- Keep it short: a record a reader finishes is worth more than a complete
  one they skip.

## Supersede, do not rewrite

An accepted record is history. To change a decision, write a new record
that says which one it supersedes. Once the new record is accepted, and not
before, change only the old record's status line to `Superseded by NNNN`;
while the new one is proposed, the old decision still stands. Never edit an
accepted record's context, decision, or consequences.

## Check before you finish

When Node.js is available, run the bundled checker on the record, and with
`--dir` on its folder:

```sh
node scripts/check-decision-record.mjs <record.md>
node scripts/check-decision-record.mjs --dir <folder>
```

It fails on a missing title, status, or section, a placeholder note,
duplicate or skipped numbers, and a `Superseded by` that points nowhere.
Fix what it reports, then report the path, the number, and anything you
could not confirm.
