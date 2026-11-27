# Changelog

All notable changes to this repository's skills are documented here. Skill
versions follow [Semantic Versioning](https://semver.org/) through each
skill's `metadata.version` field.

## [2.0.0] - 2026-11-27

### Changed

- **Breaking:** `doc-author` is renamed `documentation-author` (2.0.0), to
  match `documentation-review` and the full-word names of the other skills.
  Invoke it as `/documentation-author`, or `agent-skills:documentation-author`
  through the plugin. Its behaviour is unchanged. `make update` installs the
  new name and removes old `doc-author` copies that came from this
  repository. `make status` lists any that remain.

### Added

- "Not for ..." clauses on the skills that overlap, so each says which
  sibling to use instead: `peer-code-review` 1.3.3 and `security-review`
  1.0.2, `documentation-author` 2.2.1 and `documentation-review` 1.4.2,
  `specification-author` 1.0.1 and `specification-review` 1.0.1, and
  `test-plan-author` 1.0.1. Their behaviour cases now also fail if the
  sibling loads instead.
- Role pages for product, architect, developer, QA, security, operations,
  and skill owners: each lists its skills, what they read and produce, and
  what the role approves. A test checks that every skill appears on one.
- `agent-evals --grade --save` keeps a passing re-graded run as a case's
  recording, so a check that changes needs no new model run.
- `release-notes-author` 1.0.0: drafts release notes for the people who install a release from the changelog, the merged changes, and the code: breaking changes with exact upgrade steps, migrations, how to roll back, and what changed in the reader's terms. It looks in the diff for what changelogs miss, such as renamed settings, and never tags or publishes. `scripts/check-release-notes.mjs` fails on a missing version, upgrade section, or rollback section, a bare commit hash, or a placeholder.
- `change-plan-author` 1.0.0: breaks an approved specification, design, or written request into small, ordered, independently reviewable changes, each with the files it touches, the check that proves it, its size, and its dependencies. It reads the code first and plans only changes it has located. `scripts/check-change-plan.mjs` fails on a task with no files, check, or size, a task over the 400-line review limit, or one that depends on a later task.
- `security-review` 1.0.1: reviews a diff, commit, or pull request for security defects after running the repository's own configured scanners: injection, missing authentication and authorization, path traversal, eval and unsafe deserialization, secrets and personal data in code or logs, weakened token checks, and risky dependencies. It rates findings by exploitability, never quotes a secret, and never edits the code. Its evals plant eight defects beside a clean change, and read the verdict from the verdict line.
- `test-plan-author` 1.0.0: plans the tests that prove a change meets its specification, mapping every acceptance criterion to unit, integration, or end-to-end tests with negative, error, and boundary cases, and writes failing tests first when asked. It plans from the specification, never the implementation, and reports where the two disagree. `scripts/check-test-plan.mjs --spec` fails when a criterion has no test.
- `specification-review` 1.0.0: reviews a specification before it is built, checking every claim against the repository. It finds untestable requirements, acceptance criteria without Given, When, or Then, uncovered requirements, missing failure cases and non-goals, and contradictions with the code or docs, rates each by what it would cost if built as written, and gives a verdict without editing the spec. Its evals plant six defects, two of them contradictions with the repository, beside a clean spec that must not be over-flagged.
- `specification-author` 1.0.0: turns a rough request into a specification with the need, scope, non-goals, numbered measurable requirements, and Given/When/Then acceptance criteria covering every requirement. It reads the repository first and asks three to five questions that change the outcome, each with a suggested answer. `scripts/check-specification.mjs` fails on missing sections, incomplete criteria, uncovered requirements, untestable words, and placeholders.
- `decision-record-author` 1.0.0: writes an architecture decision record with checkable context, the options considered, the decision, and its consequences. It reads the repository's existing records first and suggests the number, title, and status before writing, and supersedes rather than edits an accepted record. `scripts/check-decision-record.mjs` checks the title, status, sections, placeholders, numbering, and supersede links, and runs on this repository's own records in pre-commit.
- A fifth skill, `skill-correction` 1.0.0: it turns a correction to a
  skill's behaviour into a failing eval case and the smallest fix. It reads
  the skill, its evals, and the evidence; classifies the root cause
  (selection, a missing or buried instruction, ambiguity, the harness, or
  model capability) with `root-causes.md`; writes a minimal fixture and
  contract that fail on the observed behaviour; proposes the smallest
  change; and re-runs the skill's cases. It writes nothing before the
  correction, case, and fix are confirmed.
- Repository checks on every commit and in CI: markdownlint for Markdown,
  shellcheck for shell scripts, zizmor for workflow security, and gitleaks
  for secrets. CI also scans the full history. Reviewed false positives
  are listed by fingerprint in `.gitleaksignore`.
- `scripts/check-versions.mjs`: a changed skill must raise its version and
  update the changelog, versions may not decrease, each skill's docs page
  states its version, and the newest changelog release is the plugin
  version.
- `scripts/release.mjs` publishes the release for the plugin version, with
  notes from `.github/release-notes/` or the changelog. It skips a version
  already released.
- Dependabot proposes GitHub Actions updates after a seven-day cooldown.
- `main` is protected against deletion and force-pushes, and `v*` release
  tags against deletion and moving. The rules live in `.github/rulesets/`
  and `scripts/rulesets.sh` applies them.
- A size budget for every `SKILL.md`: at most 500 lines and about 5,000
  tokens, as the Agent Skills spec recommends, and every guide in a skill
  must be linked from its `SKILL.md`.
- Decision records in `docs/decisions/` for the eval design, the local
  model in CI, pinning, releases, skill names, and protecting `main`.
- Behaviour evals (`make skill-agent-evals`) run an assistant with tools in
  a fixture repository and grade what it does: which skill loads, which
  files it reads, which commands it runs, and whether it writes before
  confirmation. Each case is an assistant-neutral contract in the skill's
  `evals/agent-evals.json`. Adapters: `claude-code`, and `openai`, a
  built-in agent for llama.cpp, Ollama, or any OpenAI-compatible server.
  Recorded transcripts are graded in the test suite with no model, and
  each contract clause is broken in turn to show it is enforced. Every
  skill gets a patch release for its new cases.
- Hard rules, enforced outside the model: a [Make a skill's rules
  hard](https://gautampachnanda101.github.io/agent-skills/hard-rules/)
  page gives each skill's important rules with the assistant settings and
  checks that enforce them. `documentation-author` 2.2.0 ships
  `scripts/check-page.mjs`, which fails on placeholder notes, vague link
  text, and bare URLs, and runs in this repository's pre-commit hooks.
  Behaviour cases can declare host rules with `ask`; with an ask rule for
  `catalog-info.yaml`, Claude Haiku 5.5 tried to write it in three of three
  runs and was stopped every time. Decision record 0009.
- Three real corrections, worked through with `skill-correction`:
  - `documentation-author` 2.1.0 delivers no `TODO`, `FIXME`, or editor's
    notes: unknowns go in the report, and an unconfirmed link or fact is
    left out. It left a `TODO` comment in three of six rewrites; after the
    fix, three of three passed. Both of its reply cases now fail on `TODO`.
  - `peer-code-review` 1.3.2: the answer key now accepts duplicated logic
    described as "exists in both", which a correct review was failed for.
    The skill itself was unchanged.
  - The confirmation-gate behaviour cases (`backstage-catalog-builder`
    owner evidence, `documentation-author` suggest first) now allow the
    write and require that nothing changes. Telling the assistant it could
    not write had hidden whether the skill waits for confirmation. Opus
    passes both, three of three; Claude Haiku 5.5 wrote `catalog-info.yaml`
    before asking in three of three runs, with or without the rule repeated
    in the writing step, so the skill was left unchanged.
  - `skill-correction` 1.0.1 adds these as examples in `root-causes.md`.
- `backstage-catalog-builder` 1.2.3: `make skill-llm-verify` clears the
  previous run's model outputs when it starts, including file names older
  versions used, so every output in `.llm-cache/` is from the latest run.
- `backstage-catalog-builder` 1.2.2: its description now says it checks
  and validates existing descriptors. In the behaviour evals, Opus skipped
  the skill for "check this catalog-info.yaml" in two of three runs.
- The built-in agent offers a `use_skill` tool, as hosts with a skill tool
  do, and leaves sampling to the server's defaults.
- Ownership is checked: every skill has its own `.github/CODEOWNERS` line,
  a `metadata.author`, and a row in the *Levels and owners* table naming
  the same owner. The table gives each skill's level and who checks its
  output.
- Recordings store the skill version they were made with, and `make status`
  lists any that are older than their skill. Changing a recording needs no
  version bump.

### Changed (repository)

- `backstage-catalog-builder` 1.2.0 fits the size budget (about 6,400
  tokens before, 4,700 after). Detail moved, unchanged, into guides:
  `discover-sources.md` (tools and repository enumeration),
  `verify-and-report.md` (validation passes and reporting), the scope
  confirmations in `scope-and-modeling.md`, and API registration in
  `configuration-delivery.md`. `SKILL.md` keeps a summary and a link.
- This repository's catalog entity is owned by
  `user:default/gautampachnanda101`, with lifecycle `production`; it was
  the test placeholder `group:default/catalog-test` and `experimental`.

### Fixed

- Lint findings: a code fence without blank lines in
  `backstage-catalog-builder`, bare example URLs in the usage
  guide, and shell warnings in `backstage-node.sh` and
  `skill-llm-verify.sh`. `backstage-node.sh` now passes `--no-use` to nvm in
  a way POSIX `sh` supports.
- Every GitHub Action and pre-commit hook is pinned to a commit. Checkouts
  no longer keep the token in `.git/config`, and only the Pages deploy job
  can write to Pages.
- `make skill-evals` no longer reports success when nothing ran: an
  unmatched `--skill` or `--eval` now exits 1. A bad `--runs` value, an
  unknown skill, an unknown `--grade` case, or a missing reply file exits 2
  with a message instead of a crash. Two input files with the same name are
  refused, because the prompt labels files by name.
- CI pins the Claude Code CLI used to validate the plugin manifest, and the
  local-model cache key now follows the pins in `skill-llm-verify.sh`, so a
  changed pin no longer reuses a stale cache.

## [1.2.0] - 2026-11-25

### Added

- Every skill reads the repository before it asks, then sends one batch of
  suggestions, each with its evidence, for the user to accept or correct.
  `backstage-catalog-builder` 1.1.0 adds `suggest-from-evidence.md`: owner
  signals ranked by strength (descriptors, `CODEOWNERS`, catalog groups,
  maintainers, the account, committers), placeholder owners such as
  `group:default/catalog-test` flagged for replacement, and a single
  confirmation message. `doc-author` 1.2.0 suggests the need, audience, and
  placement; `documentation-review` 1.4.0 states the inferred audience and
  suggests owners for unowned pages; `peer-code-review` 1.3.0 suggests the
  diff and base branch.
- `make skill-evals` grades every skill against its evals with any model
  command (`SKILL_EVAL_CMD`). Answer keys are never sent to the model.
- Real eval inputs for the review skills: a pull-request diff with eight
  planted defects and a clean companion, and two documentation pages with ten
  planted defects and two clean companions. The v1.1.2 fixtures showed only
  part of the change and put the answer key in the model's input, so their
  published recall figures did not measure the skills.
- `make skill-llm-verify` checks SHA-256 digests for the pinned llama.cpp
  archives and model, and the model is pinned to a revision. CI runs it on
  Linux x64 and arm64, and macOS arm64 and Intel.

### Changed

- The review skills name their report headings and table columns, agree the
  verdict with the findings, and point to their graders.
- Eval results with Claude Opus 5.5, three runs per case: 22 of 24 runs
  pass with the skills, and 2 of 8 without them. Details are under
  [Verification](https://gautampachnanda101.github.io/agent-skills/verification/#run-the-skill-evals).

### Added (unreleased 1.1.3 work, shipped in 1.2.0)

- `doc-author` ships `evals/evals.json` alongside its sibling skills:
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

### Changed (unreleased 1.1.3 work, shipped in 1.2.0)

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
