---
name: specification-author
description: Turn a rough request into a specification a team can build and test from - the need, the users, the scope and non-goals, numbered requirements with measurable targets, and Given/When/Then acceptance criteria that cover every requirement. Reads the repository and the request first, then asks three to five questions that change the outcome, each with a suggested answer from the evidence, and writes nothing until they are answered. Splits a large request into a first release and follow-ups. Not for reviewing an existing specification; use specification-review for that. Use when asked to write a spec, requirements, user stories, acceptance criteria, a PRD, or to clarify what a feature should do before building it.
license: Apache-2.0
compatibility: Host assistant with file-read and file-write tools. Node.js 20+ is optional, for the bundled specification checker.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Specification author

A specification is worth writing when it removes the ambiguity that would
otherwise surface in review, in testing, or in production. Write one that a
developer can build from and a tester can test from without asking you. It
stands alone: no design, plan, or other skill has to follow it.

## Read first, then ask what changes the outcome

1. Read the request, then the parts of the repository it touches: the code
   and routes for the feature, its data, existing tests, and docs. Note what
   already exists and what the request assumes.
2. Find the decisions that would change what gets built: who uses it, the
   edge cases, the limits (sizes, rates, times), what is out of scope, and
   what happens on failure.
3. Ask three to five of those as questions in one message, each with a
   suggested answer and the evidence for it ("Only the filtered view?
   Suggested: yes, because `ReportTable` already holds the filter state").
   Fewer is better; skip anything the evidence already settles.

Write nothing until the questions are answered. If the user wants a draft
first, mark the unanswered points under "Open questions", never as
placeholders in the text.

## Write the specification

Use the repository's spec template if it has one. Otherwise:

| Section | What it holds |
| --- | --- |
| `# Title` | The feature, in a few words |
| Problem | The need in one or two sentences: who, what, and why now |
| Users | Who uses it, and anyone it affects |
| Scope | What this release does |
| Non-goals | What it deliberately does not do, so nobody builds it by accident |
| Requirements | Numbered `R-1`, `R-2`, ...; each one testable, with a number where it can have one |
| Acceptance criteria | Numbered `AC-1`, ...; each `Given ... when ... then ...`, naming the requirements it covers |
| Open questions | What is still undecided, and who decides |

- Every requirement is covered by at least one acceptance criterion, and
  every criterion can pass or fail on its own.
- Replace vague words with targets: not "fast" but "within 2 seconds at the
  95th percentile for 50,000 rows"; not "user-friendly" but the task and how
  you would observe it.
- Include the failure cases: invalid input, limits exceeded, permissions,
  and what the user sees then.
- When the request is large, split it: a first release that is useful on its
  own, and follow-ups listed under Non-goals with a note that they are next.

## Check before you finish

When Node.js is available, run the bundled checker:

```sh
node scripts/check-specification.mjs <spec.md>
```

It fails on a missing section, a criterion without Given, When, or Then, a
requirement no criterion covers, an untestable word, or a placeholder. Fix
what it reports, then report where the spec is and what is still open.
