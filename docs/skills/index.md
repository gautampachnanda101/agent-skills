# Skills

Each directory under [`skills/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills)
ships one independent skill: a `SKILL.md` entry point plus the guides,
scripts, eval cases, and tests it needs.

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

CI checks every skill against the specification and runs the tests a skill
ships. `backstage-catalog-builder` also gets structural checks and a
local-model check. See [Verification](../verification.md).
