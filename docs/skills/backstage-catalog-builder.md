# backstage-catalog-builder

**Version 1.0.3 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/SKILL.md) · plugin name `agent-skills:backstage-catalog-builder`**

Scans a GitHub organization, user account, single repository, or selected
paths and produces evidence-based open-source Backstage catalog entities,
discovery configuration, and a persistent configuration bundle. Builds on
what you already have: descriptor or app-config paths and repositories, or a
running Backstage catalog API endpoint with a securely held token.

## Grounded in

- [Backstage descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/),
  catalog configuration, and the catalog API — the default name rules it
  enforces come from the documentation
- The [Backstage plugin directory](https://backstage.io/plugins/) and the
  [`backstage/community-plugins`](https://github.com/backstage/community-plugins)
  workspace repository for plugin discovery
- Agents Skills [evaluating-skills](https://agentskills.io/skill-creation/evaluating-skills)
  guidance for its shipped eval cases

## What ships with the skill

| Path | Role |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/SKILL.md) | Always-loaded instructions and rules |
| [`configuration-delivery.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/configuration-delivery.md), `mcp-workflow.md`, `plugin-integration.md`, `scope-and-modeling.md` | Loaded on demand per workflow |
| [`scripts/check-descriptors.mjs`, `check-techdocs.mjs`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/backstage-catalog-builder/scripts) | Zero-dependency structural checkers with `--json` |
| [`evals/evals.json`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/evals/evals.json) | Eval prompts and checker-backed assertions |
| [`tests/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/backstage-catalog-builder/tests) | Descriptor, TechDocs, and output-contract suites with fixtures, plus the TechDocs/MkDocs documentation site |

## Verify it

```sh
node skills/backstage-catalog-builder/scripts/check-descriptors.mjs catalog-info.yaml
make skill-llm-verify
```

Every CI run also replays the skill's evals against a without-skill baseline;
the benchmark delta and the TechDocs checker over public repositories gate
releases.

## Use it

> Use the backstage-catalog-builder skill to create a Backstage catalog for
> this repository.

Prompt examples and a fast path are in
[Using the skills](../usage.md).
