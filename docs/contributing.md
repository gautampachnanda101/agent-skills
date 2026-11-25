# Contributing a skill

This repository is designed to grow many independent skills. Follow the open
[Agent Skills](https://agentskills.io/) format; skills stay independent of any
one assistant, editor, model, or operating system.

In this page:

- [Layout and naming](#layout-and-naming) — directory and frontmatter rules
- [Register the skill everywhere it is discovered](#register-the-skill-everywhere-it-is-discovered)
- [Checks before pushing](#checks-before-pushing)
- [CI expectations](#ci-expectations)
- [Releases](#releases) — versioning and the release routine

## Layout and naming

- Place each skill in its own top-level directory, with a `SKILL.md` entry
  point. The directory name must match the skill's `name` in the YAML
  frontmatter.
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

## Register the skill everywhere it is discovered

Adding a skill directory is not enough for it to ship. Update each place that
enumerates skills:

1. The **Available skills** table in the root
   [README](https://github.com/gautampachnanda101/agent-skills#readme) and in
   [index](index.md).
2. The `make install` installer copies every top-level directory with a
   `SKILL.md`, so no change is needed there; verify with
   `make skill-smoke` that new fixture descriptors still pass.
3. If the skill bundles verification assets, extend `make skill-llm-verify`
   or add a task-specific check rather than assuming generic coverage.

## Checks before pushing

Install [pre-commit](https://pre-commit.com/#install). Tests run on Node
24.15+ or 26.13+; if the active `node` is older, they re-run under the newest
qualifying install found in nvm or asdf. Then enable hooks:

```sh
make hooks-install
make hooks-check
```

The hook checks YAML (including multi-document catalog files), JSON, merge
conflicts, large added files, whitespace and final newlines. Make/script/test
changes also run the repository regression tests. Hooks never install Node or
start Backstage. Installation sets a repository-local hooks path, preserving
existing hooks by delegation/symlinks; global Git settings and the existing
commit-message hook are not modified. At commit time pre-commit checks staged
files and temporarily stashes unstaged tracked changes. Fixers may update
files; review and stage those changes before retrying. The first run downloads
the pinned check environments.

## CI expectations

The `Verify` GitHub Action runs pre-commit checks, `make skill-smoke`, and the
local-model end-to-end check (`make skill-llm-verify`) as required jobs on
every push to `main` and on pull requests. Model verification downloads are
cached; a run stays within a few minutes of hosted-runner CPU. Fix failures
before merge; the jobs are meant to block. The `Docs` Action builds this
MkDocs site and publishes it to
[GitHub Pages](https://gautampachnanda101.github.io/agent-skills/).

## Releases

User-visible skill changes follow a versioned release:

1. Bump `metadata.version` in the skill's `SKILL.md` frontmatter and
   `version` in `.claude-plugin/plugin.json` using
   [Semantic Versioning](https://semver.org/) — all three must match per
   release.
2. Add a CHANGELOG.md entry describing the change.
3. Push, wait for a green `Verify` run (it validates the plugin manifests
   with `claude plugin validate --strict .`), then tag `v<version>` and
   create the GitHub Release for it.
