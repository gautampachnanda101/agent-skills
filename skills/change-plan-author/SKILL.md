---
name: change-plan-author
description: Break an approved specification, design, or written request into an ordered list of small, independently reviewable changes - each with the files it touches, the check that proves it works, its size, and what it depends on - so every change fits one review and the work can stop safely after any of them. Reads the code first to find where each change belongs and plans no code it has not located. Not for writing the code itself, or for planning tests; use test-plan-author for that. Use when asked to plan the work, break down a feature, split a large change, or order the tasks for a spec or ticket.
license: Apache-2.0
compatibility: Host assistant with file-read tools; file-write only to save the plan. Node.js 20+ is optional, for the bundled plan checker.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Change plan author

A change a reviewer can hold in their head gets a real review; a large one
gets skimmed. Plan the work as a sequence of small changes, each one useful
or at least harmless on its own, so the work can be reviewed properly and
can stop after any step without leaving the codebase broken. Defect-finding
in review falls sharply past about 400 changed lines, so no step should be
larger than that.

## Read the request and the code

1. Read what is to be built: the specification and its acceptance criteria,
   the design, or the written request. A written request is enough input;
   if it is ambiguous, ask once.
2. Read the code it touches: the modules, routes, data, tests, and
   configuration. Find where each part of the change belongs, and what
   already exists that it can reuse.
3. Plan only changes you have located: name real files and functions, not
   guesses. Where a file does not exist yet, say where it will go and why
   there.

## Plan the steps

Order the steps so each one builds on the last and leaves the main branch
working:

1. Groundwork with no behaviour change first: types, configuration,
   refactors the feature needs, feature flags.
2. Then the smallest end-to-end slice that works, then each further slice.
3. Then clean-up: removing flags or old paths.

For every step, give:

| Column | What it holds |
| --- | --- |
| Task | A number and what the change does, as a pull request title would |
| Files | The files it adds or changes |
| Check | The test or command that proves it works, and which acceptance criteria it covers |
| Size | `S` (under about 100 changed lines), `M` (under about 400), or a line estimate |
| Depends on | The earlier task numbers it needs |

A step estimated at more than 400 lines is two steps: split it. Note the
risks below the table: data migrations, permissions, and anything that is
hard to roll back.

## Deliver the plan

Give the plan in your reply, or save it where the user asks. Do not write
or change code: the plan is for whoever builds it, and they may change the
order.

When Node.js is available, check the plan:

```sh
node scripts/check-change-plan.mjs <plan.md>
```

It fails when a task has no files, check, or size, a task is over the review
limit, a task depends on a later one, or a placeholder is left in.
