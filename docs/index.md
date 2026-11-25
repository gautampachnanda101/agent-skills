# Agent skills

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Each
top-level directory ships one skill with its own `SKILL.md` entry point, so
assistants such as GitHub Copilot, Claude Code, OpenCode, Kiro, Codex, Gemini
CLI, Cursor, Windsurf, and Cline can load it without depending on a particular
editor, model, or operating system.

## At a glance

- **Install once, use everywhere**: `make install` copies complete skill
  directories into the personal skills paths of every supported assistant.
- **Evidence-based catalogs**: `backstage-catalog-builder` scans GitHub
  organizations, user accounts, single repositories, or selected paths and
  produces justified open-source Backstage entities, locations, discovery
  configuration, and an expected-entity inventory.
- **Extend what exists**: the builder accepts your current entity
  configuration as its starting point — descriptor or app-config paths and
  repositories, or a running Backstage endpoint with a securely held token.
- **TechDocs built in**: it also generates or updates MkDocs sites wired as
  TechDocs, including monorepo layouts.
- **Verified output**: bundled zero-dependency checkers with `--json`
  reports, a local-model end-to-end check in CI, and an optional local
  Backstage instance for ingestion testing.

## Available skills

| Skill | Purpose | Entry point |
| --- | --- | --- |
| [backstage-catalog-builder](https://github.com/gautampachnanda101/agent-skills/tree/main/backstage-catalog-builder) | Scans a GitHub organization, user account, repository, or selected paths, then creates or updates evidence-based open-source Backstage catalog entities, locations, discovery configuration, and an expected-entity inventory. Builds on existing entity-configuration sources, generates or updates MkDocs documentation (TechDocs), including monorepo layouts, and ships a zero-dependency descriptor checker. | [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/SKILL.md) |

## Getting started

Install every skill globally from the repository root (see
[Installing the skills](installation.md)):

```sh
make install
```

Then ask the assistant to use a skill by name; see
[Using the skills](usage.md). Before trusting a generated catalog:

```sh
make skill-smoke
```

## Documentation in this site

- [Installing the skills](installation.md) - global and per-project
  destinations for every supported assistant, the Claude plugin
  marketplace route, overrides, and update guidance.
- [Using the skills](usage.md) - example requests, a fast path that supplies
  every decision up front, what a complete result looks like, and
  assistant-specific skill documentation links.
- [Verification](verification.md) - descriptor checks, a local model
  end-to-end check, a local Backstage instance, GitHub discovery, and MCP.
- [Contributing a skill](contributing.md) - the conventions, releases, and
  checks for adding the next skill.

The entity registered for this repository is `component:default/agent-skills`
in [catalog-info.yaml](https://github.com/gautampachnanda101/agent-skills/blob/main/catalog-info.yaml);
these TechDocs are attached through the `backstage.io/techdocs-ref` annotation.
