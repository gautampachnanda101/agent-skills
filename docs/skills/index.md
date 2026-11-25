# Skills

Each directory under [`skills/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills)
ships one independent skill: a `SKILL.md` entry point plus the guides,
scripts, eval cases, and test suites it needs, portable across assistants,
editors, models, and operating systems.

## Install them all

```sh
git clone https://github.com/gautampachnanda101/agent-skills
cd agent-skills && make install
```

Existing copies are protected; use `make update` to replace them. See
[Installing the skills](../installation.md) for per-assistant destinations and
the Claude plugin route.

## The current inventory

- [backstage-catalog-builder](backstage-catalog-builder.md) — evidence-based
  Backstage catalog entities, discovery configuration, and TechDocs sites.
- [peer-code-review](peer-code-review.md) — evidence-based peer code review
  with pacing, checklists, and UI accessibility.
- [documentation-review](documentation-review.md) — documentation reviews
  grounded in Diátaxis, style guides, and GOV.UK accessibility.
- [doc-author](doc-author.md) — authors new pages and rewrites existing
  ones with the same rules the review skill enforces.

Every skill is validated in CI: spec conformance, bundled structural
checkers, an eval-driven local-model check, and — where the skill ships its
own suite — the skill's tests. A skill that fails a check does not ship a
release.
