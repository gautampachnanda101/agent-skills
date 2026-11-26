# 0008. Contract-based behaviour evals, with no model in CI

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

The reply evals ([0002](0002-grade-skill-replies-with-answer-keys.md)) give
the model no tools, so they cannot show whether a skill reads the repository
before asking, runs the checks it reports, or writes a file before it is
confirmed. Testing that needs an assistant with tools. Each such run calls a
model, and the maintainer does not want model costs in CI. Skills must also
work in any assistant, not only Claude Code.

## Decision

- **A contract per case.** `skills/<skill>/evals/agent-evals.json` gives a
  fixture repository, a prompt, the commands and files the case permits, and
  what the skill must do: which skill loads, which files it reads, which
  commands run, what it may write, and what the reply contains. The
  contract names no assistant.
- **Adapters, one per assistant.** Each installs the skills where its
  assistant looks, denies every tool call the case does not permit, and turns
  its transcript into the same events: read, search, run, write, skill.
  `claude-code` drives Claude Code. `openai` is a small built-in agent for any
  OpenAI-compatible server, such as llama.cpp's `llama-server` or Ollama, and
  enforces the permissions itself.
- **Recorded transcripts are the CI test.** A passing run can be saved with
  `--record`. The test suite grades every recording against its contract,
  then breaks each clause in turn and checks that grading fails. CI runs this
  with no model and no cost.
- **Model runs are local and on request:** `make skill-agent-evals`. The
  `openai` adapter with a local model costs nothing.

## Consequences

CI proves that the contracts are well formed and that every clause is
enforced, but not that today's skills still pass them; that needs a fresh
local run before a release. Recordings go stale when a skill changes, and
should be re-recorded then. An adapter for another assistant can be added
without changing any contract.
