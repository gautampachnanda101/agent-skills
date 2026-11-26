# 0002. Grade skill replies against answer keys the model never sees

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

The v1.1.2 evals reported 8/8 and 10/10 recall for the review skills. Their
fixtures showed only part of each change, and the answer key was part of the
model's input, so the figures measured nothing.

## Decision

`make skill-evals` sends each case's skill, guides, input files, and task,
and nothing else. The review skills are graded on a real diff and real
pages with planted defects, each with a clean companion. Answer keys
(`tests/ledger.json`) and report graders run only after the reply. A test
fails if a prompt contains any ledger entry. Each case is also run without
the skill, to show what the skill adds.

## Consequences

The evals grade replies, not actions: the model has no tools, so they cannot
show whether a skill reads the repository before asking, runs a command, or
avoids writing unconfirmed files. Evals that run an agent with tools in a
fixture repository would cover that, at a higher cost.
