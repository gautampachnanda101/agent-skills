# agent-skills

[![Verify](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml)
[![Docs](https://github.com/gautampachnanda101/agent-skills/actions/workflows/docs.yml/badge.svg?branch=main)](https://gautampachnanda101.github.io/agent-skills/)

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Every
top-level directory is one independent skill — a `SKILL.md`, guides, scripts,
and fixtures — portable across assistants, editors, models, and operating
systems. The first skill is `backstage-catalog-builder`: it scans GitHub
repositories and builds evidence-based open-source Backstage catalogs,
including TechDocs generation and structural validation.

This README is the landing page; the complete documentation lives in
[the TechDocs site](https://gautampachnanda101.github.io/agent-skills/),
built from [docs/](./docs/) and attached to the
`component:default/agent-skills` entity
([catalog-info.yaml](./catalog-info.yaml)).

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

Every destination, project-local paths, `make update`, and per-assistant
notes: [Installing the skills](https://gautampachnanda101.github.io/agent-skills/installation/).

## Use

Open the repository you want to catalog and ask for the skill by name, for
example: *"Use the backstage-catalog-builder skill to create a Backstage
catalog for this repository."*

Prompt examples, an account-wide run, and a fast path that skips the
interactive questions: [Using the skills](https://gautampachnanda101.github.io/agent-skills/usage/).

## Documentation

The complete documentation — installing (including the Claude plugin route),
prompt patterns, verification with the bundled checkers and a local Backstage
instance, and the contribution and release process — lives in the
[TechDocs site](https://gautampachnanda101.github.io/agent-skills/), whose
[home page](https://gautampachnanda101.github.io/agent-skills/) is the table
of contents. To preview locally, run `pip install -r docs/requirements.txt`,
then `mkdocs serve`.

## Contributing

The conventions, checks, and release process are in
[Contributing a skill](https://gautampachnanda101.github.io/agent-skills/contributing/).

## License

[Apache-2.0](./LICENSE)
