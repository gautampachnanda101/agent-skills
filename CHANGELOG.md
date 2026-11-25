# Changelog

All notable changes to this repository's skills are documented here. Skill
versions follow [Semantic Versioning](https://semver.org/) through each
skill's `metadata.version` field.

## [1.0.2] - 2026-11-25

### Added

- Eval-driven verification following
  [agentskills.io/skill-creation/evaluating-skills](https://agentskills.io/skill-creation/evaluating-skills):
  test prompts and assertions live in the skill-local
  `backstage-catalog-builder/evals/evals.json`, and `make skill-llm-verify`
  replays every scenario without the skill as a baseline, aggregating pass
  rates, tokens, and durations into `.llm-cache/benchmark.json`. The current
  benchmark shows a 100-percentage-point pass-rate delta for the skill at a
  few thousand tokens per run.

## [1.0.1] - 2026-11-25

### Added

- Claude plugin distribution: `.claude-plugin/plugin.json` and
  `.claude-plugin/marketplace.json` make the repository its own marketplace,
  so anyone can install with
  `claude plugin marketplace add gautampachnanda101/agent-skills` followed by
  `claude plugin install agent-skills@gautampachnanda101-agent-skills`.
- A `plugin-manifest` CI job that runs `claude plugin validate --strict .`
  with the current Claude Code CLI, plus hermetic manifest tests in the
  repository suite.

## [1.0.0] - 2026-11-25

First tagged release of `backstage-catalog-builder`.

### Added

- Organization, user-account, repository, and selected-path scans that produce
  evidence-based open-source Backstage catalog entities, descriptor files, and
  persistent configuration bundles.
- Gathering of existing configuration sources: descriptor/app-config paths or
  repositories, or a running Backstage catalog API endpoint with a token held
  securely (environment-variable name, credential file, or host secret
  mechanism — never the value).
- Zero-dependency `check-descriptors.mjs` and `check-techdocs.mjs` structural
  checkers with `--json` output, enforcing documented default name rules
  (63-character caps, single separators, npm-scope rejection) and TechDocs
  MkDocs site shape, including monorepo `!include` layouts.
- Guides for configuration delivery, MCP-assisted catalog work, generic
  plugin discovery and integration, scope/evidence modeling, and TechDocs
  MkDocs generation.
- MkDocs documentation site (deployed to GitHub Pages), Make targets for
  installation and update (`make install`, `make update`), a local Backstage
  test instance (`make backstage`), and a local-model end-to-end verification
  (`make skill-llm-verify`).
