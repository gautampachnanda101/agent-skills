# Home

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Each
directory under [`skills/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills)
ships one skill with its own `SKILL.md` entry point, so
assistants such as GitHub Copilot, Claude Code, OpenCode, Kiro, Codex, Gemini
CLI, Cursor, Windsurf, and Cline can load it without depending on a particular
editor, model, or operating system.

## At a glance

- **Install once, use everywhere** — `make install` copies complete skill
  directories into the personal skills paths of every supported assistant.
- **Evidence-based catalogs** — `backstage-catalog-builder` scans GitHub
  organizations, user accounts, single repositories, or selected paths and
  produces justified open-source Backstage entities, locations, discovery
  configuration, and an expected-entity inventory.
- **Extend what exists** — the builder accepts your current entity
  configuration as its starting point: descriptor or app-config paths and
  repositories, or a running Backstage endpoint with a securely held token.
- **TechDocs built in** — it also generates or updates MkDocs sites wired as
  TechDocs, including monorepo layouts.
- **Verified output** — bundled zero-dependency checkers with `--json`
  reports, a local-model end-to-end check in CI, and an optional local
  Backstage instance for ingestion testing.

## Available skills

The long-form inventory lives in the [Skills section](skills/index.md); each
page covers what the skill does, its grounding, what ships with it, and how
to verify it.

| Skill | Purpose | Page |
| --- | --- | --- |
| [backstage-catalog-builder](skills/backstage-catalog-builder.md) | Evidence-based Backstage catalog entities, discovery configuration, and TechDocs sites, built from GitHub scans and existing configuration | [page](skills/backstage-catalog-builder.md) |
| [peer-code-review](skills/peer-code-review.md) | Diff and pull-request reviews with checklists, severity-tagged evidence, and UI accessibility checks | [page](skills/peer-code-review.md) |
| [documentation-review](skills/documentation-review.md) | Documentation reviews grounded in Diátaxis, style guides, and GOV.UK accessibility | [page](skills/documentation-review.md) |

## In this site

| Page | Start there when you want to |
| --- | --- |
| [Skills](skills/index.md) | Browse every published skill and what ships inside each |
| [Installing the skills](installation.md) | Copy skills into every supported assistant, install the Claude plugin, or pick project-local destinations |
| [Using the skills](usage.md) | Prompt patterns, a fast path that skips the questions, and what a complete run delivers |
| [Verification](verification.md) | Validate descriptors and TechDocs yourself, or try output in a local Backstage |
| [Contributing a skill](contributing.md) | Add the next skill, follow the release process, and pass the required checks |

This documentation is the companion to the
[repository README](https://github.com/gautampachnanda101/agent-skills#readme),
which carries the CI badges and the two quick-install commands; every detail
beyond those lives in the pages above.

The entity registered for this repository is `component:default/agent-skills`
in [catalog-info.yaml](https://github.com/gautampachnanda101/agent-skills/blob/main/catalog-info.yaml);
these TechDocs are attached through the `backstage.io/techdocs-ref` annotation.
