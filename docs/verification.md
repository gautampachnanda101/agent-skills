# Verification

Run the bundled checkers on catalog descriptors and TechDocs sites, then test
the skill end to end with a small local model. CI runs both in the `Verify`
workflow. To see descriptors in a running catalog, use a
[local Backstage](local-backstage.md), which CI does not run.

In this page:

- [Check descriptors and TechDocs](#check-descriptors-and-techdocs)
- [Run the local-model check](#run-the-local-model-check)
- [Check a review report](#check-a-review-report)

## Check descriptors and TechDocs

The two checkers also work from any installed skill copy, in `scripts/` beside
the `SKILL.md`. They have no dependencies and need Node.js 20 or later. CI runs
them on Node.js 24. Check this repository's own catalogs and fixtures:

```sh
make skill-smoke
node skills/backstage-catalog-builder/scripts/check-descriptors.mjs catalog-info.yaml
node skills/backstage-catalog-builder/scripts/check-techdocs.mjs catalog-info.yaml
```

Each command prints a summary that ends with the number of errors and
warnings.

| Checker | What it validates |
| --- | --- |
| Descriptor | Required fields per kind, unique `(kind, namespace, name)` identities, entity name syntax, Location targets, and `$text`/`$yaml` API placeholders |
| TechDocs | `backstage.io/techdocs-ref: dir:` targets, `site_name` matching the owning entity, the `techdocs-core` plugin, and every nav page and `!include` target |

Pass `--json` for a machine-readable report, or `--strict` to fail on warnings.
A `site_name` mismatch is a warning. The TechDocs checker records `url:` values
but does not resolve them.

Both checkers read lines and structure. They do not replace a YAML parser or
the catalog's `validate-entity`.

CI also runs the TechDocs checker on public repositories:

- a pinned Backstage checkout, for nested nav, quoted values, and plugin maps;
- the `mkdocs-monorepo-plugin` test fixtures, for a custom `docs_dir`, quoted
  `!include` values, and bare subnav pages.

The skill's
[output-examples tests](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/tests/output-examples.test.cjs)
cover generated layouts, with fixtures in
[tests/fixtures/techdocs](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/backstage-catalog-builder/tests/fixtures/techdocs).

## Run the local-model check

Apply the real `SKILL.md` with a small model and validate what it writes:

```sh
make skill-llm-verify
```

The first run downloads a pinned llama.cpp build (about 20 MB) and a quantized
Qwen2.5-0.5B-Instruct model (about 490 MB) into the git-ignored `.llm-cache/`.
A successful run ends with
`PASS: the model applied the skill in every scenario.`

It runs two scenarios:

1. **Descriptor**: generate a catalog descriptor from source evidence. The
   output must pass `check-descriptors.mjs` with evidence-backed values.
2. **MkDocs**: generate a `mkdocs.yml` for an existing `docs/` tree with the
   TechDocs guide loaded. The file must pass both checkers.

The model is too small for annotation modeling and monorepo layouts, so the
checker tests cover those instead.

| Variable | Purpose |
| --- | --- |
| `LLAMA_CPP_URL` | Use a different llama.cpp archive |
| `LLAMA_BUILD` | Use a different llama.cpp release (default `b12681`) |
| `LLM_MODEL_URL` | Use a different model |
| `LLM_ATTEMPTS` / `LLM_CTX` / `LLM_MAX_TOKENS` / `LLM_PORT` / `LLM_CACHE` | Set attempts, context size, output limit, server port, and cache location |
| `LLM_BASELINE` / `LLM_BASELINE_ATTEMPTS` | Skip the baseline with `0`, or set its attempts |

The cache records where each download came from. Changing a URL or build
downloads it again.

The prompts are in the skill's
[evals/evals.json](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/evals/evals.json), in the
[Agent Skills eval format](https://agentskills.io/skill-creation/evaluating-skills).
Each run repeats them without the skill as a baseline, and writes pass rates,
token use, and durations to `.llm-cache/benchmark.json`:

```json
{
  "run_summary": {
    "with_skill": { "evals_passed": 2, "evals_total": 2, "pass_rate": 1.0, "tokens_mean": 6249 },
    "without_skill": { "evals_passed": 0, "evals_total": 2, "pass_rate": 0.0, "tokens_mean": 201 }
  },
  "delta": { "pass_rate": 1.0 }
}
```

The delta shows what the skill adds for its token cost. Only the with-skill
runs must pass; a baseline failure is a result, not an error.

## Check a review report

The two review skills ship graders for the reports they produce. See
[peer-code-review](skills/peer-code-review.md#check-a-report) and
[documentation-review](skills/documentation-review.md#check-a-report).
