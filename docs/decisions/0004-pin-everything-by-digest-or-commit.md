# 0004. Pin downloads by SHA-256 and actions and hooks by commit

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

CI downloads a llama.cpp release and a model, runs third-party GitHub
Actions, and pre-commit installs third-party hooks. A moved tag or a replaced
file would change what runs without any change in this repository.

## Decision

- Downloads carry a pinned SHA-256 and are refused on mismatch: the llama.cpp
  archives, the model, and gitleaks in CI.
- GitHub Actions and pre-commit hooks are pinned to a commit, with the
  release tag in a comment. zizmor fails a workflow that is not.
- Dependabot proposes action updates after a seven-day cooldown, and hooks
  are updated with `pre-commit autoupdate --freeze`.

## Consequences

Updates are deliberate pull requests rather than silent changes. Each pin
needs a bump to pick up fixes.
