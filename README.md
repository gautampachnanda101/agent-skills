# Agent skills

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Every
top-level directory is one independent skill with a `SKILL.md` entry point,
portable across assistants, editors, models, and operating systems.

[![Verify](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml)
[![Docs](https://github.com/gautampachnanda101/agent-skills/actions/workflows/docs.yml/badge.svg?branch=main)](https://gautampachnanda101.github.io/agent-skills/)

Welcome! This repository ships installable skills, each with its own `SKILL.md`
entry point, guides, scripts, and fixtures, so assistants such as GitHub
Copilot, Claude Code, OpenCode, Kiro, Codex, Gemini CLI, Cursor, Windsurf, and
Cline can load them without depending on a particular editor, model, or
operating system.

## Features

- **Evidence-based catalog building**: scans a GitHub organization, user
  account, repository, or selected paths and produces justified
  open-source Backstage entities, locations, and discovery configuration.
- **Builds on what you already have**: extends supplied descriptor paths or
  repositories, or a running Backstage instance reached through its catalog
  API endpoint with a securely held token.
- **TechDocs generation**: creates or updates MkDocs sites wired as TechDocs,
  including monorepo layouts.
- **Verified output**: zero-dependency structural checkers, a local-model
  end-to-end check, and an optional local Backstage instance for ingestion.

## Prerequisites

- Make and a POSIX shell for `make install`; no administrator permissions.
- Node.js 24.15+ or 26.13+ for the bundled checkers and test hooks.
- For Claude Code users only: the Claude Code CLI for the plugin route below.

## Installation

Install every skill globally for your user. Existing copies are protected;
use `make update` to replace them deliberately:

```sh
make install
```

Destinations for each assistant and per-project or manual installs are
documented in [docs/installation.md](./docs/installation.md).

In Claude Code, the repository is also a plugin marketplace:

```sh
claude plugin marketplace add gautampachnanda101/agent-skills
claude plugin install agent-skills@gautampachnanda101-agent-skills
```

## Getting started

Ask the assistant to use a skill by name, for example:

> Use the backstage-catalog-builder skill to create a Backstage catalog for
> this repository.

For more prompts, including a fully specified fast path that skips the
interactive questions, see [docs/usage.md](./docs/usage.md).

## Documentation

Full documentation is on
[GitHub Pages](https://gautampachnanda101.github.io/agent-skills/) or as
[Backstage TechDocs](https://backstage.io/docs/features/techdocs/) attached to
the `component:default/agent-skills` entity
([catalog-info.yaml](./catalog-info.yaml)). Browse the raw pages in
[docs/](./docs). Local preview:

```sh
pip install -r docs/requirements.txt && mkdocs serve
```

## Verification

- `make skill-smoke` runs the bundled descriptor and TechDocs/MkDocs checkers
  over skill fixtures and repository catalogs.
- `make skill-llm-verify` makes a small local llama.cpp model apply the skill
  end to end, then validates its output.
- `make backstage` starts a local open-source Backstage app to confirm
  ingestion, discovery, and MCP connectivity.

`make help` lists every target and option. For details, local URLs, and token
handling, see [docs/verification.md](./docs/verification.md).

## Contributing

The repository is built to accumulate many independent skills. Add one by
following [docs/contributing.md](./docs/contributing.md) (layout, frontmatter,
release, and required checks). Locally:

```sh
make hooks-install
make hooks-check
```

## License

[Apache-2.0](./LICENSE)
