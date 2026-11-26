# 0003. Run a small local model in CI; run capable-model evals locally

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

A model run in CI needs either an account and credentials in a public
repository's workflows, or a model small enough to run on a hosted runner.

## Decision

CI runs `make skill-llm-verify` on Linux x64 and arm64 and macOS arm64 and
Intel: a 0.5B-parameter model applies the skill, and the structural checkers
grade the output. `make skill-evals` with a capable model runs locally before
a release, and its results go in the changelog.

## Consequences

CI holds no model credentials and costs nothing per run. The small model
checks that the skill can be followed, not how well a capable assistant
applies it, so capable-model results are only as fresh as the last local run.
