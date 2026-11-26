# 0005. A person publishes each release; CI does not

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

A release is public and hard to take back. CI could publish one whenever the
plugin version changes, but then merging a version bump is the same as
publishing, with no point to check the notes.

## Decision

`scripts/check-versions.mjs` makes every version change come with a
changelog entry. After `Verify` passes, a person checks the notes with
`node scripts/release.mjs --dry-run` and publishes with
`node scripts/release.mjs --target <commit>`. The script skips a version
that is already released and refuses a tag on another commit.

## Consequences

A release waits for someone to run one command. Revisit if releases are
often forgotten; a CI job could then publish, with this record superseded.
