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

| Skill | Purpose | Entry point |
| --- | --- | --- |
| [backstage-catalog-builder](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/backstage-catalog-builder) | Scans a GitHub organization, user account, repository, or selected paths, then creates or updates evidence-based open-source Backstage catalog entities, locations, discovery configuration, and an expected-entity inventory. Builds on existing entity-configuration sources, generates or updates MkDocs documentation (TechDocs), including monorepo layouts, and ships a zero-dependency descriptor checker. | [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/SKILL.md) |
| [peer-code-review](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/peer-code-review) | Runs evidence-based peer code reviews of diffs, commits, or pull requests in small paced passes against checklists derived from Google's eng-practices, Fagan inspections, Wiegers, Weinberg, and McConnell; checks UI changes for WCAG 2.2 AA accessibility as GOV.UK applies it; reports prioritized findings with file:line evidence, severity, and kind-but-technical tone. | [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/peer-code-review/SKILL.md) |
| [documentation-review](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/documentation-review) | Reviews documentation against Diátaxis type and audience, structure and navigation, Google/Microsoft style rules, GOV.UK content design (user needs first, plain English, requirement wording), and WCAG 2.2 AA accessibility; verifies commands, code samples, and links; reports prioritized evidence-backed findings and uses commit history for freshness. | [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/documentation-review/SKILL.md) |

## In this site

| Page | Start there when you want to |
| --- | --- |
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
