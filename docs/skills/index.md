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
- [documentation-author](documentation-author.md) — authors new pages and rewrites existing
  ones with the same rules the review skill enforces.
- [skill-correction](skill-correction.md) — turns a correction to a skill's
  behaviour into a failing eval case and the smallest fix.
- [decision-record-author](decision-record-author.md) — writes architecture decision records that follow the repository's own records, and supersedes rather than rewrites.
- [specification-author](specification-author.md) — turns a rough request into a specification with numbered requirements and Given/When/Then acceptance criteria, after asking the questions that change the outcome.
- [specification-review](specification-review.md) — reviews a specification before it is built: untestable requirements, incomplete criteria, uncovered requirements, and contradictions with the repository.

## Levels and owners

A skill can serve one person, a team, or a business process; see
[the plan](../plan.md#three-levels-of-use). Each skill's owner is the person
asked to review changes to it, from
[`.github/CODEOWNERS`](https://github.com/gautampachnanda101/agent-skills/blob/main/.github/CODEOWNERS).

| Skill | Level | Who checks its output | Owner |
| --- | --- | --- | --- |
| [backstage-catalog-builder](backstage-catalog-builder.md) | Team; registering in a live catalog is process level | The person running it, and the catalog's owner before registration | @gautampachnanda101 |
| [documentation-author](documentation-author.md) | Personal | The person who asked for the page | @gautampachnanda101 |
| [documentation-review](documentation-review.md) | Personal | The page's author | @gautampachnanda101 |
| [peer-code-review](peer-code-review.md) | Team | The change's author, and whoever decides to merge | @gautampachnanda101 |
| [skill-correction](skill-correction.md) | Team | The skill's owner, before the case and fix are written | @gautampachnanda101 |
| [decision-record-author](decision-record-author.md) | Personal | The people making the decision, before its status changes from Proposed | @gautampachnanda101 |
| [specification-author](specification-author.md) | Personal | The person who asked for the feature, and whoever builds or tests it | @gautampachnanda101 |
| [specification-review](specification-review.md) | Team | The spec's author, and whoever approves building it | @gautampachnanda101 |

To make a skill's important rules hold whatever model runs it, apply the
settings in [Make a skill's rules hard](../hard-rules.md).

CI checks every skill against the specification and runs the tests a skill
ships. `backstage-catalog-builder` also gets structural checks and a
local-model check. See [Verification](../verification.md).
