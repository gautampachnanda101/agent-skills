# Agent skills

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Each
directory under [`skills/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills)
ships one skill with its own `SKILL.md` entry point. Assistants such as
GitHub Copilot, Claude Code, OpenCode, Kiro, Codex, Gemini CLI, Cursor,
Windsurf, and Cline can load it without a particular editor, model, or
operating system. Not every client has been tested; see
[Boundaries to expect](usage.md#boundaries-to-expect).

## At a glance

- **Install once, use everywhere** — `make install` copies complete skill
  directories into the personal skills paths of every supported assistant.
- **Evidence-based catalogs** — `backstage-catalog-builder` scans GitHub
  organizations, accounts, repositories, or paths. It produces Backstage
  entities, locations, and discovery configuration, each backed by evidence.
- **Extend what exists** — the builder starts from your current entity
  configuration: descriptor or app-config paths, or a running Backstage with
  a securely held token. It reads your repository and suggests owners and
  other values, and asks you to confirm them.
- **TechDocs built in** — it also generates or updates MkDocs sites wired as
  TechDocs, including monorepo layouts.
- **Verified output** — bundled zero-dependency checkers with `--json`
  reports, a local-model end-to-end check in CI, and an optional local
  Backstage instance for ingestion testing.

## Available skills

The [Skills section](skills/index.md) lists every skill, what it does, what
ships with it, and how to check it.

## In this site

| Page | Start there when you want to |
| --- | --- |
| [Skills](skills/index.md) | Browse every published skill and what ships inside each |
| [Installing the skills](installation.md) | Copy skills into every supported assistant, install the Claude plugin, or pick project-local destinations |
| [Using the skills](usage.md) | Prompt patterns, a fast path that skips the questions, and what a complete run delivers |
| [Verification](verification.md) | Run the bundled checkers and the local-model check |
| [Local Backstage](local-backstage.md) | Try generated descriptors in a local Backstage, or connect through MCP |
| [Contributing a skill](contributing.md) | Add the next skill, follow the release process, and pass the required checks |

This documentation is the companion to the
[repository README](https://github.com/gautampachnanda101/agent-skills#readme),
which carries the CI badges, a summary, and the quick-install commands. The
pages above hold the detail.

The entity registered for this repository is `component:default/agent-skills`
in [catalog-info.yaml](https://github.com/gautampachnanda101/agent-skills/blob/main/catalog-info.yaml);
these TechDocs are attached through the `backstage.io/techdocs-ref` annotation.
