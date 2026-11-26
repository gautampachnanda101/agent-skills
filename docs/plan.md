# Plan: skills for the whole development lifecycle

This plan extends the repository from four skills to a set that covers the
software lifecycle, from a rough idea to a reviewed release. Each skill is
one job with a checkable output, and a person approves each handoff. It is
for maintainers deciding what to build next and in what order.

Contents:

- [Principles](#principles)
- [Phases at a glance](#phases-at-a-glance)
- [Phase 1: evals that watch what a skill does](#phase-1-evals-that-watch-what-a-skill-does)
- [Phase 2: the lifecycle map and artifact contracts](#phase-2-the-lifecycle-map-and-artifact-contracts)
- [Phase 3: inception skills](#phase-3-inception-skills)
- [Phase 4: verification skills](#phase-4-verification-skills)
- [Phase 5: delivery skills](#phase-5-delivery-skills)
- [Phase 6: personas and the end-to-end check](#phase-6-personas-and-the-end-to-end-check)
- [Every suggested skill, and what happens to it](#every-suggested-skill-and-what-happens-to-it)
- [Progress](#progress)

## Principles

These carry over from the work so far, and every phase must keep them:

- **A skill is one job with an output you can check.** A skill earns its
  place with a repeatable procedure and a contract a grader can test. Work an
  assistant already does well, such as writing code, is not a skill.
- **The writer never grades its own work.** Each authoring skill has a
  separate review skill or grader, judged against the spec, not against the
  author's assumptions.
- **Read, suggest, then confirm once.** Skills gather evidence from the
  repository, propose values, and write nothing a person has not confirmed.
- **A person approves every handoff.** A skill stops at its gate and says
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
| 1. Behaviour evals | Evals that run an agent with tools in a fixture repository | Large | 0 |
| 2. Lifecycle map | Roles, artifacts, gates, and a grader for each artifact | Medium | 0 |
| 3. Inception | `specification-author`, `specification-review`, `decision-record-author` | Large | 1, 2 |
| 4. Verification | `test-plan-author`, `security-review` | Large | 1, 2, 3 |
| 5. Delivery | `change-plan-author`, `release-notes-author`, links to existing CI and release skills | Medium | 1, 2 |
| 6. Personas and end to end | Role pages, a worked example, one eval across the whole chain | Medium | 3, 4, 5 |

Six phases follow the foundations. Phases 2 and 5 can run alongside others;
phases 3 and 4 run in order, because the test plan reads the specification.

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

## Phase 2: the lifecycle map and artifact contracts

Skills hand work to each other through files, not chat history. This phase
defines those files once, so every later skill writes and reads the same
shapes.

**Deliver:**

- `docs/lifecycle.md`: each stage, the role that owns it, its skills, the
  artifact it produces, and the gate a person approves.
- A contract for each artifact, with required headings and fields, and a
  grader script with tests:

  | Artifact | Written by | Read by | Gate |
  | --- | --- | --- | --- |
  | Specification | `specification-author` | design, test plan, review | Scope and acceptance criteria |
  | Decision record | `decision-record-author` | everyone | The decision |
  | Change plan | `change-plan-author` | the implementer, reviewer | Task order and scope |
  | Test plan | `test-plan-author` | QA, reviewer | Coverage of every criterion |
  | Review reports | `peer-code-review`, `security-review`, `documentation-review` | the author | Merge |
  | Release notes | `release-notes-author` | users | Release |

- Where the artifacts live in a project, and how a skill finds the upstream
  artifact it needs. The default is a `docs/` path the user confirms, not a
  fixed `.agents/` folder.

**Done when:** every contract has a grader that accepts a valid example and
rejects each missing part, with tests.

## Phase 3: inception skills

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

**Done when:** each skill passes its reply and behaviour evals, and its
baseline without the skill is recorded.

## Phase 4: verification skills

Prove the change does what the specification says, independently of whoever
wrote it.

**Deliver, one release each:**

1. `test-plan-author`. It maps every acceptance criterion to unit,
   integration, or end-to-end tests, including negative and boundary cases,
   and writes failing tests first when asked. It reads the specification,
   not the implementation.
2. `security-review`. It reviews a diff for injection, broken authentication
   or authorization, exposed secrets and personal data, unsafe
   deserialization, and dependency or licence risk. It uses the
   repository's scanners where configured, in the same report shape as
   `peer-code-review`.

**Done when:** each skill finds the defects planted in its fixtures, raises
nothing above minor on a clean companion, and passes its behaviour evals.

## Phase 5: delivery skills

Plan the work in reviewable steps, and describe what shipped.

**Deliver:**

1. `change-plan-author`. It breaks an approved specification or design into
   ordered, independently reviewable tasks, each with its files, its checks,
   and a size that fits one review.
2. `release-notes-author`. It drafts notes from the changelog and merged
   changes, with migrations, breaking changes, and how to roll back. It
   generalizes the release routine this repository already uses.
3. Links, not copies, for work that well-tested skills elsewhere already
   do, such as CI setup, commit messages, pull request descriptions, and
   Dependabot reviews, listed in `docs/lifecycle.md`.

**Done when:** both skills pass their evals, and the lifecycle page links
every stage to a skill or says that it has none yet.

## Phase 6: personas and the end-to-end check

Show the whole chain working, and give each role a page to start from.

**Deliver:**

- A page for each role: product, architect, developer, QA, security, and
  operations. Each lists its skills, the artifacts it reads and writes, and
  the gates it owns. These are documentation, usable in any assistant.
- A worked example in a fixture repository: request, specification, decision
  record, change plan, tests, review reports, and release notes.
- One behaviour eval that runs the chain with an approval at each gate,
  checking that each skill stops at its gate and reads only its upstream
  artifact.

**Done when:** the end-to-end eval passes, and a new user can follow the
worked example from a role page.

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
| api-contract-designer, api-and-schema-designer | Not yet | Revisit after phase 6; needs framework-specific fixtures |
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
| log-root-cause-analyzer, incident-triager | Not yet | Needs incident fixtures; revisit after phase 6 |
| runbook-executor | Not built | Acts on production; outside what a skill should do |

## Progress

| Phase | Status |
| --- | --- |
| 0. Foundations | Done in 2.0.0 |
| 1. Behaviour evals | Contracts, both adapters, and recordings done; local-model results and an OpenCode adapter to follow |
| 2. Lifecycle map | Not started |
| 3. Inception | Not started |
| 4. Verification | Not started |
| 5. Delivery | Not started |
| 6. Personas and end to end | Not started |
