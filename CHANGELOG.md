# Changelog

All notable changes to this repository's skills are documented here. Skill
versions follow [Semantic Versioning](https://semver.org/) through each
skill's `metadata.version` field.

## [1.0.8] - 2026-11-25

### Added

- A **Skills section** on the documentation site with one page per skill
  (overview plus backstage-catalog-builder, peer-code-review,
  documentation-review), mirroring the homebrew-tap site's per-item pages
  and exposing every skill in the navigation.

### Changed

- The documentation site theme now matches
  [gautampachnanda101/homebrew-tap](https://gautampachnanda101.github.io/homebrew-tap/):
  Material for MkDocs with indigo primary/accent, automatic light/dark
  toggles, Space Grotesk and IBM Plex Mono fonts, navigation tabs, and code
  copy buttons — while keeping the `techdocs-core` plugin so the site stays
  renderable as Backstage TechDocs. Because `mkdocs-techdocs-core` resets
  the theme palette unconditionally, a small local `palette-restore` plugin
  (installed through `docs/requirements.txt`) re-applies the palette after
  it.

## [1.0.7] - 2026-11-25

### Changed

- The local Backstage test-instance fixtures (`catalog-info.yaml`,
  `entities.yaml`, `org.yaml`, `github-discovery.yaml`) moved from the
  repository root into the skill they serve:
  `skills/backstage-catalog-builder/tests/fixtures/backstage-instance/`.
  The repository root now holds infrastructure only; `make backstage*`
  targets, the discovery-config generator, their tests, and the docs all
  resolve the new location.

## [1.0.6] - 2026-11-25

### Changed

- Skill directories moved under `skills/` (matching the layout of the
  ecosystem's reference repository). `skills/` is the Claude plugin's default
  skill directory, so new skills now ship through the plugin with no manifest
  edit; the installer, conformance tests, pre-commit harness, Make targets,
  CI, and documentation all resolve the new layout.

## [1.0.5] - 2026-11-25

### Added

- GOV.UK grounding where it applies, from the UK Government Digital Service
  content and accessibility guidance (WCAG 2.2 AA):
  - `documentation-review` 1.1.0: user-needs-first review framing, plain
    English as a mandatory rule with GOV.UK's research rationale, deliberate
    requirement wording (`must`/`need`/`can`), and a full accessibility
    checklist — link text, heading hierarchy, colour-independent meaning,
    contrast, alt text, tables, and open formats over PDFs.
  - `peer-code-review` 1.1.0: a UI-accessibility checklist section for
    changes that touch user-facing interfaces or generated pages (keyboard,
    semantics, labels, contrast), skipped as `n/a` otherwise.
- `backstage-catalog-builder` is unchanged: catalog modeling is a different
  evidence domain, and its generated sites are already shape-validated by
  the TechDocs checker.

## [1.0.4] - 2026-11-25

### Changed

- Skills are fully self-contained: the backstage skill's test suites,
  fixtures, and the llama.cpp eval harness moved inside
  `backstage-catalog-builder/` (`tests/`, `scripts/`), so the folder travels
  with everything it needs. Repository-root directories now hold only
  cross-skill contracts: spec and plugin-manifest conformance tests, the
  installer, Make targets, CI, the docs site, and `.claude-plugin/`.
- `docs/contributing.md` documents the repeatable per-skill template with
  the size and load-trigger rules from agentskills.io best practices.

## [1.0.3] - 2026-11-25

### Added

- Two new skills, both at version 1.0.0 and packaged in the plugin:
  - `peer-code-review`: evidence-based code review grounded in Google's
    eng-practices review guide, Fagan inspections, Karl Wiegers, Gerald
    Weinberg, Steve McConnell, and the peer-review research of Cohen and
    Bacchelli & Bird; paced small passes, four checklists, severity-tagged
    findings with file:line evidence, and a structured verdict.
  - `documentation-review`: documentation reviews grounded in the Diátaxis
    framework plus the Google Developers and Microsoft Writing style guides;
    page-type classification first, verified commands/links, style findings,
    and freshness evidence from commit history.
- The repository now holds three independent skills; the installer, spec
  conformance tests, and plugin manifest pick all three up automatically.

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
