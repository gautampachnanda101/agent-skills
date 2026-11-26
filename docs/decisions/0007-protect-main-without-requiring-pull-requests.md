# 0007. Protect `main` from rewrites without requiring pull requests

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

`main` had no protection. The repository has one maintainer, who pushes to
`main` directly and merges Dependabot pull requests.

## Decision

Two rulesets, kept in `.github/rulesets/` and applied by
`scripts/rulesets.sh`:

- `protect-main`: `main` cannot be deleted or force-pushed.
- `protect-release-tags`: `v*` tags cannot be deleted or moved.

Direct pushes are still allowed, and CI results do not block them.

## Consequences

History and published tags cannot be rewritten by accident. A failing CI run
still does not stop a push, so check `Verify` before releasing. Requiring
pull requests and passing checks would be the next step if more people
contribute.
