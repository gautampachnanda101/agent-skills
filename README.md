# agent-skills

[![Verify](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml/badge.svg?branch=main)](https://github.com/gautampachnanda101/agent-skills/actions/workflows/verify.yml)
[![Docs](https://github.com/gautampachnanda101/agent-skills/actions/workflows/docs.yml/badge.svg?branch=main)](https://gautampachnanda101.github.io/agent-skills/)

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Each
[skills/](./skills/) subdirectory is one independent skill: a `SKILL.md`,
guides, scripts, and tests. The skills are designed to work across
assistants, editors, models, and operating systems, though not every client
has been tested. The skills today:

| For | Skills |
| --- | --- |
| Deciding what to build | [`specification-author`](./skills/specification-author/SKILL.md), [`specification-review`](./skills/specification-review/SKILL.md), [`decision-record-author`](./skills/decision-record-author/SKILL.md) |
| Building and reviewing | [`change-plan-author`](./skills/change-plan-author/SKILL.md), [`peer-code-review`](./skills/peer-code-review/SKILL.md), [`security-review`](./skills/security-review/SKILL.md) |
| Testing | [`test-plan-author`](./skills/test-plan-author/SKILL.md) |
| Documentation | [`documentation-author`](./skills/documentation-author/SKILL.md), [`documentation-review`](./skills/documentation-review/SKILL.md) |
| Releasing and cataloguing | [`release-notes-author`](./skills/release-notes-author/SKILL.md), [`backstage-catalog-builder`](./skills/backstage-catalog-builder/SKILL.md) |
| Improving the skills | [`skill-correction`](./skills/skill-correction/SKILL.md) |

Each skill works on its own. The [Roles](https://gautampachnanda101.github.io/agent-skills/roles/)
pages show which skills each role uses, and the
[Skills section](https://gautampachnanda101.github.io/agent-skills/skills/)
describes each one.

This README is the landing page; the complete documentation lives in
[the TechDocs site](https://gautampachnanda101.github.io/agent-skills/),
built from [docs/](./docs/) and attached to the
`component:default/agent-skills` entity
([catalog-info.yaml](./catalog-info.yaml)).

## How Agent Skills work

Assistants load skills by
[progressive disclosure](https://agentskills.io/specification.md). A session
starts with only each skill's `name` and `description`, about 100 tokens.
The assistant reads the full `SKILL.md` when a task matches, and loads other
files only when the workflow calls for them. Per the
[specification](https://agentskills.io/specification.md), a skill is one
folder whose only required file is the `SKILL.md`:

```text
skill-name/
├── SKILL.md      # required: metadata + instructions
├── scripts/      # optional: executable code
├── references/   # optional: documentation
├── assets/       # optional: templates, resources
└── ...           # any additional directories — in this repo: tests/ and
                  # evals/ — loaded on demand
```

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

Open a repository and ask for a skill by name. For example: *"Use the
backstage-catalog-builder skill to create a Backstage catalog for this
repository."* or *"Review this pull request using the peer-code-review
skill."*

Prompts for every skill, an account-wide catalog run, and a fast path that
skips the interactive questions: [Using the skills](https://gautampachnanda101.github.io/agent-skills/usage/).

## Documentation

The [TechDocs site](https://gautampachnanda101.github.io/agent-skills/)
covers installation, prompts for each skill, roles, how the skills are
tested, how to make their rules hold with any model, a local Backstage, and
contributing. Its home page is the table of contents. To
preview it locally, run `pip install -r docs/requirements.txt`, then
`mkdocs serve`.

## Contributing

The conventions, checks, and release process are in
[Contributing a skill](https://gautampachnanda101.github.io/agent-skills/contributing/).

## Support

Bug reports, questions, and ideas go to
[GitHub Issues](https://github.com/gautampachnanda101/agent-skills/issues),
the same channel the plugin's support URL points to.

## License

[Apache-2.0](./LICENSE)
