# Plan: skills for the whole development lifecycle

This plan extends the repository from four skills to a set that covers the
software lifecycle, from a rough idea to a reviewed release. Each skill is
one job with a checkable output, useful to one person on its own, and a
person approves its result. It is for maintainers deciding what to build
next and in what order.

Contents:

- [Three levels of use](#three-levels-of-use)
- [Principles](#principles)
- [Phases at a glance](#phases-at-a-glance)
- [Phase 1: evals that watch what a skill does](#phase-1-evals-that-watch-what-a-skill-does)
- [Phase 2: levels and ownership](#phase-2-levels-and-ownership)
- [Phase 3: turn corrections into evals](#phase-3-turn-corrections-into-evals)
- [Phase 4: inception skills](#phase-4-inception-skills)
- [Phase 5: verification skills](#phase-5-verification-skills)
- [Phase 6: delivery skills](#phase-6-delivery-skills)
- [Phase 7: role pages](#phase-7-role-pages)
- [Deferred: multi-agent orchestration](#deferred-multi-agent-orchestration)
- [Every suggested skill, and what happens to it](#every-suggested-skill-and-what-happens-to-it)
- [Progress](#progress)

## Three levels of use

A skill can serve one person, a team, or a business process. Each level
needs more than the one before it:

| Level | Who uses it | Who checks the output | What it needs |
| --- | --- | --- | --- |
| Personal | One person, for their own recurring work | That person | The skill and the sources they already use |
| Team | Several people, through a shared repository or plugin | The team, with a named owner | An owner, versions, a changelog, and corrections that feed back into the skill |
| Process | Systems of record, across teams | Approvers at fixed points | Integration, approval points, and monitoring |

This plan builds for the first two levels. Every skill must pay off for one
person before it joins a chain, and every shared skill has an owner and a
way to learn from corrections. Chaining skills into an automated process is
deferred until single skills prove reliable and used. Only
`backstage-catalog-builder` touches a system of record today, and it already
has the third level's safeguards: a dry run, explicit approval, and a check
that the catalog ingested what was registered.

## Principles

These carry over from the work so far, and every phase must keep them:

- **Useful alone, for one person.** A skill works without any other skill
  upstream or downstream. Handoffs between skills are optional extras.
- **Someone owns every shared skill.** Ownership is checked, not assumed.
- **Corrections become evals.** A mistake found in review becomes a failing
  eval case first, then the smallest change to the skill that fixes it.
- **A skill is one job with an output you can check.** A skill earns its
  place with a repeatable procedure and a contract a grader can test. Work an
  assistant already does well, such as writing code, is not a skill.
- **The writer never grades its own work.** Each authoring skill has a
  separate review skill or grader, judged against the spec, not against the
  author's assumptions.
- **Read, suggest, then confirm once.** Skills gather evidence from the
  repository, propose values, and write nothing a person has not confirmed.
- **A person approves every result.** A skill stops at its gate and says
  what it needs approved.
- **Every skill ships with evals, a grader, and fixtures,** and passes them
  before release ([decision 0002](decisions/0002-grade-skill-replies-with-answer-keys.md)).
- **Skills follow the Agent Skills spec and work in any assistant.** Roles
  and handoffs live in documentation, not in a new file format.
- **One skill per release.** Each new skill is a minor plugin version with
  its own eval results in the changelog.

## Phases at a glance

| Phase | Delivers | Size | Depends on |
| --- | --- | --- | --- |
| 0. Foundations | Reply evals, graders, CI checks, versioning, decision records | Done | — |
| 1. Behaviour evals | Evals that run an assistant with tools in a fixture repository | Large | 0 |
| 2. Levels and ownership | Each skill's level, reviewer, and owner; checks that enforce ownership | Small | 0 |
| 3. Corrections into evals | `skill-correction`: a correction becomes a failing eval and a skill fix | Medium | 1 |
| 4. Inception | `specification-author`, `specification-review`, `decision-record-author` | Large | 1, 3 |
| 5. Verification | `test-plan-author`, `security-review` | Large | 1, 3 |
| 6. Delivery | `change-plan-author`, `release-notes-author`, links to existing skills | Medium | 1, 3 |
| 7. Role pages | A page per role listing its skills, inputs, outputs, and approvals | Small | 4, 5, 6 |

Seven phases follow the foundations. Phase 2 can run alongside phase 1.
Phases 4 to 6 need no particular order, because every skill stands alone;
build the one people would use most first.

## Phase 1: evals that watch what a skill does

Today's evals send a prompt with no tools and grade the reply. They cannot
show whether a skill read the repository before asking, ran the checks it
claims, or wrote a file before it was confirmed. Every later skill acts on a
repository, so this comes first.

**Deliver:**

- `make skill-agent-evals`. Each run copies a fixture repository to a
  temporary folder, installs every skill, and runs an assistant with tools
  through an adapter: `claude-code`, or `openai`, a built-in agent for
  llama.cpp, Ollama, or any OpenAI-compatible server.
- Assistant-neutral contracts, and recorded transcripts that the test suite
  grades with no model, so CI never pays for a model call.
- Graders for the transcript and the folder afterwards: which files were
  read, which commands ran, which files changed, and in what order.
- Cases for the four existing skills:
  - reads the evidence before asking (`CODEOWNERS`, descriptors)
  - writes nothing before confirmation
  - runs the checker it reports running
  - the right skill loads for its task, and none loads for an unrelated one
- Decision record 0008 for the design, including cost and sandboxing.

**Done when:** each existing skill has at least two behaviour cases that pass
three runs in three, the selection and decline cases pass, and a full run's
cost is recorded.

## Phase 2: levels and ownership

Make the team level's needs checkable: who owns each shared skill, who
reviews its output, and when its evidence is out of date.

**Deliver:**

- A *Levels* table on the skills overview page: each skill's level, who
  reviews its output, and its owner.
- A `CODEOWNERS` file covering `skills/`, and a test that fails if a skill
  has no owner there or no `metadata.author`.
- A report of stale recordings: a recorded transcript older than its skill's
  current version is listed by `make status`, so it can be re-recorded
  before the next release. It is a report, not a failing check, because
  re-recording needs a model run.

**Done when:** every skill has an owner and a level, and the stale report
lists exactly the recordings older than their skill.

## Phase 3: turn corrections into evals

A shared skill improves when a correction from review changes it for next
time. This repository does that by hand today; this phase makes it a skill.

**Deliver:**

- `skill-correction`. Given a skill and a correction, such as "the review
  approved a change with failing tests", it:
  1. writes a behaviour eval case and a fixture that reproduce the mistake
  2. shows the case failing, or explains why it cannot fail yet
  3. proposes the smallest change to the skill that should fix it
  4. re-runs the case and the skill's other cases, and reports the results

  It writes nothing before the correction and the fixture are confirmed.

**Done when:** it turns at least three real corrections from this
repository's history into failing cases and passing fixes, and passes its
own evals.

## Phase 4: inception skills

Turn a rough request into a specification and record the decisions behind
it, before any code is written.

**Deliver, one release each:**

1. `specification-author`. It reads the repository and the request, asks
   three to five questions that change the outcome (edge cases, users,
   non-goals), suggests answers from evidence, and writes a specification
   with user stories, requirements, and Given/When/Then acceptance criteria.
   It covers splitting a large request into a first release and follow-ups.
2. `specification-review`. It checks a specification for ambiguous or
   untestable criteria, missing non-goals, and conflicts with the
   repository. It is the verifier for 1.
3. `decision-record-author`. It writes a decision record with the context,
   the options considered, and the consequences, using the repository's own
   template if it has one.

Each writes a file a person can use alone; none needs another skill.

**Done when:** each skill passes its reply and behaviour evals, and its
baseline without the skill is recorded.

## Phase 5: verification skills

Prove the change does what the specification says, independently of whoever
wrote it.

**Deliver, one release each:**

1. `test-plan-author`. It maps every acceptance criterion to unit,
   integration, or end-to-end tests, including negative and boundary cases,
   and writes failing tests first when asked. It reads the specification,
   not the implementation. With no specification, it asks for the
   acceptance criteria instead.
2. `security-review`. It reviews a diff for injection, broken authentication
   or authorization, exposed secrets and personal data, unsafe
   deserialization, and dependency or licence risk. It uses the
   repository's scanners where configured, in the same report shape as
   `peer-code-review`.

**Done when:** each skill finds the defects planted in its fixtures, raises
nothing above minor on a clean companion, and passes its behaviour evals.

## Phase 6: delivery skills

Plan the work in reviewable steps, and describe what shipped.

**Deliver:**

1. `change-plan-author`. It breaks an approved specification or design into
   ordered, independently reviewable tasks, each with its files, its checks,
   and a size that fits one review. A written request is enough input.
2. `release-notes-author`. It drafts notes from the changelog and merged
   changes, with migrations, breaking changes, and how to roll back. It
   generalizes the release routine this repository already uses.
3. Links, not copies, for work that well-tested skills elsewhere already
   do, such as CI setup, commit messages, pull request descriptions, and
   Dependabot reviews, listed on the role pages.

**Done when:** both skills pass their evals.

## Phase 7: role pages

Give each role a page to start from, as documentation usable in any
assistant.

**Deliver:**

- A page for each role: product, architect, developer, QA, security, and
  operations. Each lists its skills, what each reads and writes, and what a
  person approves.
- Where one skill's output can feed another, such as a specification read by
  `test-plan-author`, the page says so. Each skill still works alone.

**Done when:** every built skill appears on a role page, and every role page
links only to skills that exist or are listed as planned.

## Deferred: multi-agent orchestration

Running several skills as a chain, with an approval between each step, is
the process level. It needs integration, approval points, and monitoring,
and it pays off only once the single skills are reliable and used.
Revisit it when:

- the skills in phases 4 to 6 pass three behaviour runs in three, and
- people use two or more of them together often enough that the handoff is
  the slow part.

## Every suggested skill, and what happens to it

The Gemini plan suggested these skills. Each is built, merged into another,
covered by an existing skill, linked to elsewhere, or not built.

| Suggested | Outcome | Where |
| --- | --- | --- |
| intent-clarifier | Merged | `specification-author` |
| prd-generator, spec-writer | Merged | `specification-author` |
| user-story-splitter, scope-slicer | Merged | `specification-author` |
| acceptance-criteria-writer | Merged | `specification-author` |
| adr-writer | Built | `decision-record-author` |
| api-contract-designer, api-and-schema-designer | Not yet | Revisit after phase 7; needs framework-specific fixtures |
| schema-modeler | Not yet | As above |
| threat-modeler | Merged, in part | `security-review` covers the diff; a design-level threat model is not yet planned |
| codebase-mapper | Covered | Every skill reads the repository first; `backstage-catalog-builder` models it |
| task-planner | Built | `change-plan-author` |
| spec-to-code-implementer, code-implementer | Not built | The assistant writes code; reviews and tests check it |
| refactor-engine, refactor-and-lint | Not built | The assistant refactors; lint hooks verify |
| doc-sync | Covered | `documentation-author` and `documentation-review` |
| test-plan-generator | Built | `test-plan-author` |
| unit-integration-test-writer, test-writer | Merged | `test-plan-author` writes failing tests first |
| bug-reproducer | Merged | `test-plan-author`: a failing reproduction before a fix |
| coverage-auditor | Merged | `test-plan-author` maps criteria to tests |
| diff-security-auditor, sast-triage | Built | `security-review` |
| dependency-auditor, dependency-and-license-checker, license-scanner | Merged | `security-review` |
| iac-policy-checker | Merged, in part | `security-review` for changed infrastructure files |
| ci-pipeline-builder, ci-cd-generator | Linked | An existing CI setup skill |
| terraform-generator | Not built | Generation without a checkable contract; review covers it |
| release-notes-drafter | Built | `release-notes-author` |
| log-root-cause-analyzer, incident-triager | Not yet | Needs incident fixtures; revisit after phase 7 |
| runbook-executor | Not built | Acts on production; outside what a skill should do |

## Progress

| Phase | Status |
| --- | --- |
| 0. Foundations | Done in 2.0.0 |
| 1. Behaviour evals | Contracts, `claude-code` and `openai` adapters, and recordings done. Opus passes every case; three-run results for each case and an OpenCode adapter remain |
| 2. Levels and ownership | Done: owners, levels, and the stale-recording report. All nine recordings predate version tracking and need re-recording |
| 3. Corrections into evals | `skill-correction` 1.0.0 built; Opus passes its two behaviour cases. Applying it to three real corrections remains |
| 4. Inception | Not started |
| 5. Verification | Not started |
| 6. Delivery | Not started |
| 7. Role pages | Not started |
| Multi-agent orchestration | Deferred |
