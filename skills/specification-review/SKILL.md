---
name: specification-review
description: Review a specification before anyone builds from it - find ambiguous or untestable requirements, acceptance criteria missing Given, When, or Then, requirements no criterion covers, missing failure cases and non-goals, and claims that contradict the repository's code or docs. Checks every claim against the repository, rates each finding by what it would cost if built as written, and gives a verdict, without editing the spec. Not for writing a specification; use specification-author for that. Use when asked to review, check, or sign off a spec, requirements, PRD, user stories, or acceptance criteria.
license: Apache-2.0
compatibility: Host assistant with file-read tools. Writes nothing; the review is the reply.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Specification review

A specification defect is cheapest to fix before the code exists: an
ambiguous requirement becomes two different implementations, and an
untestable one becomes an argument at release. Review the spec the way a
developer and a tester would have to use it, and check it against what the
repository already says. Report; do not edit the spec.

## Read the spec, then the repository

1. Read the whole specification, and note its requirements and acceptance
   criteria with their IDs.
2. Read the parts of the repository the spec touches: the code, routes,
   permissions, limits, and docs for the feature. A spec that contradicts
   the code is the most expensive defect, so look for one on purpose.
3. If the scope of the review is unclear, ask once; otherwise review the
   whole spec.

## What to look for

| Check | Finding when |
| --- | --- |
| Testability | A requirement has no number where it needs one ("fast", "large", "user-friendly") |
| Acceptance criteria | A criterion lacks Given, When, or Then, or its Then cannot pass or fail ("works correctly") |
| Coverage | A requirement no criterion covers, or a criterion that covers no requirement |
| Failure cases | Invalid input, limits, permissions, or errors are not specified |
| Scope | No non-goals, or a non-goal that contradicts a requirement |
| Consistency | The spec contradicts itself, or the repository's code or docs |
| Clarity | One term used for two things, or two terms for one |

## Rate and report

Rate each finding by what it would cost if built as written:

- `blocker`: building it as written would be wrong, for example it
  contradicts the code's permissions or limits
- `major`: two developers would build different things, or a tester could
  not tell pass from fail
- `minor`: a gap a careful developer would ask about
- `nit`: wording
- `question`: something you cannot tell from the spec or the repository

Report with these headings:

1. **Verdict:** `ready`, `ready after changes`, or `not ready`. Any blocker
   or major means `not ready`.
2. **Findings:** a table with the columns Severity, Location, Evidence, and
   Suggested direction. Location is the requirement or criterion ID, or the
   section, plus the file and line of any repository evidence. Evidence
   quotes the spec, and the code or doc it conflicts with.
3. **Strengths:** what the spec does well, only if genuine.
4. **Questions for the author:** anything you could not settle.

Order findings by severity. Never rewrite the spec in the reply; suggest the
direction of a fix in a few words.
