# Agent skills

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Each
top-level directory ships one skill with its own `SKILL.md` entry point, so
assistants such as GitHub Copilot, Claude Code, OpenCode, Kiro, Codex, Gemini
CLI, Cursor, Windsurf, and Cline can load it without depending on a particular
editor, model, or operating system.

## Available skills

| Skill | Purpose | Entry point |
| --- | --- | --- |
| [backstage-catalog-builder](https://github.com/gautampachnanda101/agent-skills/tree/main/backstage-catalog-builder) | Scans a GitHub organization, user account, repository, or selected paths, then creates or updates evidence-based open-source Backstage catalog entities, locations, discovery configuration, and an expected-entity inventory. Generates or updates MkDocs documentation (TechDocs), including monorepo layouts. Ships a zero-dependency descriptor checker. | [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/SKILL.md) |

Install with one command from the repository root (see
[Installation](installation.md)):

```sh
make install
```

Then ask the assistant to use a skill by name; see
[Using the skills](usage.md). Before trusting a generated catalog:

```sh
make skill-smoke
```

## Documentation in this site

- [Installation](installation.md) - global and per-project destinations for
  every supported assistant, overrides, and update guidance.
- [Using the skills](usage.md) - example requests, what a complete result
  looks like, and assistant-specific skill documentation links.
- [Verification](verification.md) - descriptor checks, a local model
  end-to-end check, a local Backstage instance, GitHub discovery, and MCP.
- [Contributing a skill](contributing.md) - the conventions and checks for
  adding the next skill.

The entity registered for this repository is `component:default/agent-skills`
in [catalog-info.yaml](https://github.com/gautampachnanda101/agent-skills/blob/main/catalog-info.yaml);
these TechDocs are attached through the `backstage.io/techdocs-ref` annotation.
