# 0006. Name skills in full words, with a shared prefix per family

- **Status:** Accepted
- **Decided:** 2026-11-26

## Context

The two documentation skills were named `doc-author` and
`documentation-review`, so they did not sort or read as a pair.

## Decision

Skill names use full words, as in `peer-code-review` and
`backstage-catalog-builder`, and related skills share a prefix:
`documentation-author` and `documentation-review`. A rename is a breaking
change. `RENAMED_SKILLS` in the Makefile lets `make update` remove old
copies, but only folders whose `SKILL.md` has the old name and this
repository's author.

## Consequences

Names are longer to type. Renaming `doc-author` needed plugin 2.0.0.
