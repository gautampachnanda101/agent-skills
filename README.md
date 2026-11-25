# Agent skills

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Every
top-level directory is one independent skill with a `SKILL.md` entry point,
portable across assistants, editors, models, and operating systems.

[![Verify](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml)
[![Docs](https://github.com/gautampachnanda101/agent-skills/actions/workflows/docs.yml/badge.svg?branch=main)](https://gautampachnanda101.github.io/agent-skills/)

**Documentation**: browse it on
[GitHub Pages](https://gautampachnanda101.github.io/agent-skills/) or
[GitHub](https://github.com/gautampachnanda101/agent-skills/tree/main/docs), or
render it as [Backstage TechDocs](https://backstage.io/docs/features/techdocs/)
through the `component:default/agent-skills` entity
([mkdocs.yml](./mkdocs.yml) is validated and built as part of CI-style
checks). Local preview: `pip install -r docs/requirements.txt && mkdocs serve`.

## Skills

| Skill | Description | Docs |
| --- | --- | --- |
| [backstage-catalog-builder](./backstage-catalog-builder/SKILL.md) | Scans a GitHub organization, user account, repository, or selected repository paths and creates or updates evidence-based open-source Backstage catalog entities, locations, and discovery configuration. Asks for existing entity-configuration sources — descriptor or app-config paths/repositories, or a running catalog API endpoint with a securely supplied token — and builds on them. Distinguishes source modeling from automatic ingestion of published descriptors and ships a zero-dependency structural checker. Also generates or updates evidence-based MkDocs documentation (TechDocs), including monorepo layouts. | [usage](./docs/usage.md) · [verification](./docs/verification.md) |

## Quick start

1. Install every skill globally for your user (requires Make and a POSIX
   shell; no administrator permissions). Existing copies are protected; use
   `FORCE=1` to replace them:

   ```sh
   make install
   ```

   Destinations for each assistant and per-project or manual installs are
   documented in [docs/installation.md](./docs/installation.md).

2. Ask the assistant to use a skill by name, for example:

   > Use the backstage-catalog-builder skill to create a Backstage catalog for
   > this repository.

   See [docs/usage.md](./docs/usage.md) for more prompts and what a complete
   result includes.

   In Claude Code, the repository is also a plugin marketplace:

   ```sh
   claude plugin marketplace add gautampachnanda101/agent-skills
   claude plugin install agent-skills@gautampachnanda101-agent-skills
   ```

## Verification

- `make skill-smoke` runs the bundled descriptor and TechDocs/MkDocs checkers
  over skill fixtures and repository catalogs.
- `make skill-llm-verify` makes a small local llama.cpp model apply the skill
  end to end, then validates its output. CI runs it as a required, cached,
  near-zero-cost job. Details in [docs/verification.md](./docs/verification.md).
- `make backstage` starts a local open-source Backstage app in `.backstage/`
  (git-ignored) to confirm ingestion, discovery, and MCP connectivity of the
  generated descriptors.

`make help` lists every target and option. For local Backstage URLs, token
handling, per-run overrides, and the GitHub discovery plugin, see
[docs/verification.md](./docs/verification.md).

## Contributing

The repository is built to accumulate many independent skills. Add a skill by
following [docs/contributing.md](./docs/contributing.md) (directory layout,
frontmatter rules, installer behavior, and required checks). Contributing
locally:

```sh
make hooks-install
make hooks-check
```

Pre-commit hooks verify YAML, JSON, whitespace, and large-file rules, and run
the regression tests for Make/script/test changes. Tests require Node 24.15+
or 26.13+ (hooks re-run under nvm/asdf when the active `node` is older).
