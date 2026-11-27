# 0009. Enforce a rule that matters outside the model

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

A skill's text is advice to the model. In the behaviour evals, Claude Opus
5.5 followed "write nothing the user has not confirmed" in three runs of
three, while Claude Haiku 5.5 broke it in three of three, and repeating the
rule where the writing happens made no difference. A skill used by a team
cannot assume which model runs it.

## Decision

A rule whose breach would harm the user, their repository, or a system of
record is enforced outside the model, and the skill text only explains it:

- **Assistant permissions** for actions: ask before writing files a skill
  must confirm, deny pushes and merges for review skills.
- **Checks on output** for content: bundled checkers such as
  `check-page.mjs`, run in pre-commit and CI.
- **Repository rules** for what is merged: branch rules and `CODEOWNERS`.

[Make a skill's rules hard](../hard-rules.md) lists the settings for each
skill. A behaviour case can declare host rules with `ask`, so the evals show
the rule holding with a model that ignores the text.

## Consequences

Users must apply the settings in their assistant; a skill cannot do it for
them. In return, the rules that matter hold with any model. Rules that
cannot be enforced this way, such as how a review is worded, stay advice
and are measured by evals.
