# Contributing a skill

This repository is designed to grow many independent skills. Follow the open
[Agent Skills](https://agentskills.io/) format; skills stay independent of any
one assistant, editor, model, or operating system.

In this page:

- [Layout and naming](#layout-and-naming) — directory and frontmatter rules
- [The repeatable skill template](#the-repeatable-skill-template)
- [Register the skill everywhere it is discovered](#register-the-skill-everywhere-it-is-discovered)
- [Checks before pushing](#checks-before-pushing)
- [CI expectations](#ci-expectations)
- [Releases](#releases) — versioning and the release routine

## Layout and naming

- Place each skill in its own directory under `skills/`, with a `SKILL.md`
  entry point. The directory name must match the skill's `name` in the YAML
  frontmatter. `skills/` is also the Claude plugin's default skill directory,
  so a new skill directory ships through the plugin with no manifest edit.
- Include a lowercase, hyphen-separated `name` and a non-empty `description`.
  Describe both what the skill does and when to use it.
- Follow the full [Agent Skills specification](https://agentskills.io/specification.md)
  frontmatter: `license`, `compatibility` (at most 500 characters, only for
  real environment requirements), and `metadata` (`author`, semantic
  `version`) are expected for published skills. The
  `tests/skills-spec.test.cjs` suite enforces these constraints in pre-commit
  and CI; the official `skills-ref` validator is demonstration-only upstream,
  so the repository tests encode the spec instead.
- Keep the entry point focused; put optional details in linked files within
  the skill directory and load them only when needed.
- Prefer portable instructions and standard tools. Declare dependencies and
  platform limitations; do not assume an assistant-specific tool is available.
- Do not require secrets in files or examples. Ask for authorization before
  external or destructive actions, and surface failures rather than hiding
  them.

## The repeatable skill template

Every skill is self-contained: what one skill needs travels inside its
directory, while contracts spanning skills stay at the repository root. The
shape follows the
[specification](https://agentskills.io/specification.md)'s optional
directories, plus this repository's convention of naming the optional bits:

```text
<skill>/
├── SKILL.md             # required: metadata + instructions, under 500 lines
├── *.md                 # optional supporting guides, loaded on demand
├── scripts/             # optional bundled, dependency-free tooling
├── evals/evals.json     # optional prompts/assertions (agentskills.io format)
└── tests/               # optional skill-local tests and fixtures
```

Template rules from the
[best-practices guide](https://agentskills.io/skill-creation/best-practices.md)
and the specification: keep `SKILL.md` under 500 lines and 5,000 tokens and
move detail to supporting guides; state when each file should load (our
guides live one level deep from `SKILL.md`, which matches the
specification's file-reference rule, and the guides table in
`SKILL.md` names each trigger); make `scripts/` dependency-free so the skill
runs anywhere; ship eval prompts in `evals/evals.json`; and keep the
skill's own tests and fixtures inside its `tests/` directory so they run in
CI wherever the folder sits.

Repository-root-only concerns: the cross-skill conformance tests
(`tests/skills-spec.test.cjs`, `tests/claude-plugin.test.cjs`), installer
and Make targets, CI workflows, the TechDocs site, and the plugin manifests
under `.claude-plugin/`. The pre-commit test harness discovers both layers
automatically.

## Register the skill everywhere it is discovered

Adding a skill directory is not enough for it to ship. Update each place that
enumerates skills:

1. Add the skill to the list in the repository `README.md`.
2. Add a page for it under `docs/skills/`, including its version.
3. Add it to the inventory in [Skills](skills/index.md).
4. Add its page to `nav` in `mkdocs.yml`.
5. Add an example prompt to [Using the skills](usage.md#a-prompt-for-each-skill).
6. If the skill bundles verification assets, extend `make skill-llm-verify`
   or add a task-specific check rather than assuming generic coverage.

`make install` copies every directory under `skills/` that contains a
`SKILL.md`, so the installer needs no change. If the skill adds descriptor
fixtures, add them to `make skill-smoke`.

## Checks before pushing

Install [pre-commit](https://pre-commit.com/#install). Tests run on Node
24.15+ or 26.13+; if the active `node` is older, they re-run under the newest
qualifying install found in nvm or asdf. Then enable hooks:

```sh
make hooks-install
make hooks-check
```

The hook checks YAML (including multi-document catalog files), JSON, merge
conflicts, large added files, whitespace and final newlines. Changes to the Makefile,
scripts, tests, skills, hooks or plugin manifests also run the regression
tests. Hooks never install Node or start Backstage. Installation sets a repository-local hooks path, preserving
existing hooks by delegation/symlinks; global Git settings and the existing
commit-message hook are not modified. At commit time pre-commit checks staged
files and temporarily stashes unstaged tracked changes. Fixers may update
files; review and stage those changes before retrying. The first run downloads
the pinned check environments.

## CI expectations

The `Verify` GitHub Action runs on every push to `main` and on pull requests.
Its jobs run pre-commit checks and `make skill-smoke`, the TechDocs checker on
public repositories, `make skill-llm-verify`, and plugin manifest validation.
Downloads for the model check are cached, so a run takes a few minutes.

`main` has no branch protection, so a failing job does not block a push or a
merge. Check the result yourself, and fix failures before you release. The `Docs` Action builds this
MkDocs site and publishes it to
[GitHub Pages](https://gautampachnanda101.github.io/agent-skills/).

## Releases

User-visible repository changes follow a versioned release:

1. Bump `version` in `.claude-plugin/plugin.json` using
   [Semantic Versioning](https://semver.org/); the git tag follows this
   version. Bump `metadata.version` in the `SKILL.md` of every skill whose
   content changed in the same release, and the version at the top of that
   skill's page under `docs/skills/`.
2. Add a CHANGELOG.md entry describing the change.
3. Check that `v<version>` is not already a tag or a release.
4. Push, wait for a green `Verify` run (it validates the plugin manifests
   with `claude plugin validate --strict .`), then tag `v<version>` and
   create the GitHub Release for it.
