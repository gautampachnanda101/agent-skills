---
name: test-plan-author
description: Plan the tests that prove a change does what its specification says - every acceptance criterion mapped to unit, integration, or end-to-end tests, with negative, error, and boundary cases - and, when asked, write the failing tests first. Works from the specification or the stated acceptance criteria, never from the implementation, so the tests check what was asked for rather than what was built. Without a specification, it asks for the criteria first. Not for writing the specification or planning the code changes; use specification-author or change-plan-author for those. Use when asked for a test plan, test cases, acceptance tests, coverage of a spec, or tests to write before fixing a bug or building a feature.
license: Apache-2.0
compatibility: Host assistant with file-read and file-write tools; running tests needs the project's test command. Node.js 20+ is optional, for the bundled plan checker.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Test plan author

Tests are only independent if they come from what was asked for. Plan them
from the specification's acceptance criteria, not from the code: code
written to the wrong requirement passes tests written from that code. This
is the verifier's half of "the writer never grades its own work".

## Find the criteria, then the test setup

1. Find the specification or the acceptance criteria: a linked spec, the
   issue, or the request itself. If there are none, ask for them, or offer
   to draft criteria for confirmation first. Do not plan from the code.
2. Read the project's test setup: the test runner and command, where tests
   live, how they are named, and any fixtures or helpers. Follow it.
3. Read the code only to learn where tests attach: its modules, entry
   points, and seams. Do not derive expected results from it. Where the
   code and the specification disagree, the specification sets the expected
   result, and the disagreement goes in your report.

## Plan the tests

For every criterion, plan at least one test, and add the cases that break
things:

| Kind | Plan it when |
| --- | --- |
| Happy path | Always, one per criterion |
| Negative and error | The criterion names a permission, invalid input, or a failure |
| Boundary | The criterion has a number: the value itself, one below, one above |
| Regression | A bug report or correction started the work |

Choose the cheapest level that can prove the criterion: unit for logic,
integration for parts working together, end-to-end only for what a user
must see.

Write the plan as a table with these columns: Criterion (its ID, such as
`AC-3`), Test (what it does and expects), Level, Kind, and File. Below the
table, list each disagreement between the code and the specification.

Give the plan in your reply, or save it where the user asks. Write test
files only after the plan, or the tests to write, are confirmed: they change
the project's test suite.

## Write failing tests first, when asked

When asked to write tests before the fix or the feature, write them in the
project's style, run them with the project's test command, and confirm
they fail for the reason the criterion describes, not because of a typo or
setup error. Report each test's name, the criterion it proves, and why it
fails now. Do not change the code under test.

## Check before you finish

When Node.js is available, run the bundled checker on the plan:

```sh
node scripts/check-test-plan.mjs --spec <spec.md> <plan.md>
```

It fails when a criterion has no test, a test names a criterion the spec
lacks, a test has no level, the plan has no negative or boundary test, or a
placeholder is left in.
