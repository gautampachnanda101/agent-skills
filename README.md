# agent-skills

[![Verify](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml)
[![Docs](https://github.com/gautampachnanda101/agent-skills/actions/workflows/docs.yml/badge.svg?branch=main)](https://gautampachnanda101.github.io/agent-skills/)

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Every
top-level directory is one independent skill — a `SKILL.md`, guides, scripts,
and fixtures — portable across assistants, editors, models, and operating
systems. The first skill is `backstage-catalog-builder`: it scans GitHub
repositories and builds evidence-based open-source Backstage catalogs,
including TechDocs generation and structural validation.

## Install

Requires Make and a POSIX shell. Copy every skill into the personal skills
directories of all supported assistants:

```sh
git clone https://github.com/gautampachnanda101/agent-skills
cd agent-skills
make install
```

Claude Code users can install through the plugin system instead:

```sh
claude plugin marketplace add gautampachnanda101/agent-skills
claude plugin install agent-skills@gautampachnanda101-agent-skills
```

Use one route or the other; see
[Installation](https://gautampachnanda101.github.io/agent-skills/installation/)
for project-local paths, updates, and per-assistant destinations.

## Use

Open the repository you want to catalog and ask:

> Use the backstage-catalog-builder skill to create a Backstage catalog for
> this repository.

More prompts, including an account-wide run and a fast path that skips the
interactive questions, are in
[Using the skills](https://gautampachnanda101.github.io/agent-skills/usage/).

## Documentation

| Page | Covers |
| --- | --- |
| [Installing the skills](https://gautampachnanda101.github.io/agent-skills/installation/) | Global, project-local, and Claude plugin installs; update guidance |
| [Using the skills](https://gautampachnanda101.github.io/agent-skills/usage/) | Example prompts, complete-result expectations, assistant docs |
| [Verification](https://gautampachnanda101.github.io/agent-skills/verification/) | Bundled checkers, local-model CI check, local Backstage instance |
| [Contributing a skill](https://gautampachnanda101.github.io/agent-skills/contributing/) | Layout, frontmatter, and release conventions for the next skill |

The documentation is a [TechDocs](https://backstage.io/docs/features/techdocs/)
site built by the `Docs` workflow and attached to the
`component:default/agent-skills` entity ([catalog-info.yaml](./catalog-info.yaml)).
Local preview: run `pip install -r docs/requirements.txt`, then `mkdocs serve`.

## Contributing

See [Contributing a skill](https://gautampachnanda101.github.io/agent-skills/contributing/).
Locally, enable the pre-commit hooks and run the checks:

```sh
make hooks-install
make hooks-check
```

## License

[Apache-2.0](./LICENSE)
