# Changelog

All notable changes to this repository's skills are documented here. Skill
versions follow [Semantic Versioning](https://semver.org/) through each
skill's `metadata.version` field.

## [1.1.3] - 2026-11-25

### Added

- `doc-author` 1.1.2 ships `evals/evals.json` alongside its sibling skills:
  two prompt scenarios — authoring a missing how-to from described evidence
  and rewriting a narrative page into a reference form — with assertions
  covering the user-need opener, Diátaxis form discipline, expected-outcome
  steps, deliberate requirement wording, findability by an error string,
  and evidence-only content.

### Fixed

- `backstage-catalog-builder` 1.0.4: `make skill-llm-verify` now keeps the
  llama.cpp archive's own layout under `.llm-cache/tool/`, so `llama-server`
  finds its shared libraries whether a build ships them beside the binary
  (official releases) or in a sibling `lib/`. A cached binary that cannot run
  triggers a fresh download, and a failed download no longer destroys the
  existing cache. Regression tests cover both layouts and the fallback.
- `LLAMA_CPP_URL`, `LLAMA_BUILD`, and `LLM_MODEL_URL` are no longer ignored
  when a cache exists: each download records its source URL, and a different
  URL triggers a fresh download. An interrupted model download no longer
  leaves a partial file in use, and with-skill runs are no longer logged as
  `(baseline)`.
- `peer-code-review` 1.2.1 and `documentation-review` 1.3.2: the report
  graders read the Severity and Location/Evidence columns instead of matching
  words anywhere in a row. They now reject unknown severities, rows without
  evidence, and any finding listed before a more severe one, and the code
  grader rejects verdicts that contradict the findings. Full Git SHAs and
  wording inside quoted code no longer fail a report, possible secrets are
  reported by line and never echoed, `--json` prints only JSON, and running
  without arguments prints usage.
- The bundled checkers are documented as needing Node.js 20+; the skill said
  24+ and the site said 18+.

### Changed

- Documentation review fixes: CI claims match the workflow, the contributor
  checklists list every place to update, all four skills have usage prompts,
  the graders are documented, and the local Backstage guide has its own page.

## [1.1.2] - 2026-11-25

### Added

- `peer-code-review` and `documentation-review` ship report graders
  (`scripts/check-review-report.mjs`), planted-defect fixtures, expected
  reports, tests, and `evals/evals.json`.

## [1.1.1] - 2026-11-25

### Changed

- Humanised and research-accuracy pass over both review skills: each named
  study now states what it found and the practical takeaway (Cohen's
  attention-decay data, Bacchelli & Bird's review-comment findings,
  Weinberg's egoless culture, Nielsen's 79%-scan result, Pirolli & Card's
  foraging model), with short sentences and plain words throughout — no
  rules were removed; `doc-author` 1.1.1, `documentation-review` 1.3.1,
  `peer-code-review` 1.2.0.
- Completed the doc-architect draft integration with its remaining three
  rules, found by a rule-by-rule audit: the three-part page order (steps or
  parameters directly after the summary, deep context and edge cases last),
  code examples adjacent to the definitions they illustrate, and error
  strings permitted to headline troubleshooting/reference sections.

## [1.1.0] - 2026-11-25

### Added

- Information-foraging and scannability discipline across the documentation
  skills, grounded in Pirolli & Card's foraging research as applied by Tom
  Johnson and Nielsen's scanning studies:
  - `doc-author` 1.1.0 — outcome-first openers (inverted pyramid), verb-phrase
    guide headings, expected-outcome or verification signal after every
    procedural step, unambiguous unique headings for deep links, deliberate
    ordered/bulleted list choice, and search-alias coverage using the
    audience's own words and error strings (in prose, or a grep-able
    terminal alias block with honest framing about search-engine
    invisibility).
  - `documentation-review` 1.3.0 — the three-second outcome test on task
    pages, duplicate-heading (ambiguous anchor) findings, frontloaded-guide
    heading checks, and synonym/error-string findability review.
- Integration note: this incorporates the community-proposed `doc-architect`
  draft rather than shipping it as a fifth skill — its quadrant-isolation,
  verified-steps, and executability gates already existed in `doc-author`
  and `documentation-review`, so only the novel foraging and scannability
  rules were adopted, with corrected attribution and fixed examples.

## [1.0.9] - 2026-11-25

### Added

- A fourth skill, `doc-author` 1.0.0: authors new documentation and rewrites
  existing pages with the user-need-first flow, Diátaxis typing, GOV.UK
  plain-English and requirement-wording rules, and a built-in lint-and-verify
  pass (`markdownlint`, `vale`, link checkers, or the TechDocs checker);
  ships a `style-rules.md` self-validator. Registered in the site navigation,
  plugin discovery (no manifest edit needed with the `skills/` layout), and
  the inventory tables.
- Linting and code-quality passes in both review skills:
  `peer-code-review` 1.2.0 runs configured linters/type-checkers before the
  human pass, flags new lint suppressions, coverage drops, and loosened type
  discipline, and reports unavailable tooling as unevaluated;
  `documentation-review` 1.2.0 adds the same discipline for documentation —
  `markdownlint`, `vale`, link checkers, and the TechDocs checker in a
  fix-and-verify loop.
- `make status`: compares every installed skill copy against the checked-out
  source by `SKILL.md` `metadata.version`, per destination, so users can see
  drift before running `make update`.

### Changed

- Site parity work for the homebrew-tap theme match: the
  `palette-restore` plugin now also normalizes the theme features to the
  same list as the homebrew-tap site, removing the `content.action.edit`
  pencil button and `navigation.footer` page links that
  `mkdocs-techdocs-core` appends unconditionally; the `edit_uri` mapping
  was dropped for the same reason. One difference remains by design: the
  Material version is pinned by `mkdocs-techdocs-core` to 9.7.7 (the other
  site runs 9.6.23), so asset hashes differ while colors, fonts, toggles,
  and features match.

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
