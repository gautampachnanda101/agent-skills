# Verification

Check the skills four ways: the bundled checkers, a small local model that
applies `backstage-catalog-builder` end to end, reply evals, and behaviour
evals. CI runs the checkers and the local model in the `Verify` workflow,
and grades recorded behaviour runs; the reply and behaviour evals call a
model, so you run them yourself. To see descriptors in a running catalog, use a
[local Backstage](local-backstage.md), which CI does not run.

In this page:

- [Check descriptors and TechDocs](#check-descriptors-and-techdocs)
- [Run the local-model check](#run-the-local-model-check)
- [Run the skill evals](#run-the-skill-evals)
- [Run the behaviour evals](#run-the-behaviour-evals)
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

## Run the skill evals

Grade every skill against its `evals/evals.json` with a capable model:

```sh
SKILL_EVAL_CMD='<command>' make skill-evals
```

Set `SKILL_EVAL_CMD` to any command that reads a prompt on standard input and
prints the model's reply. Each prompt holds the skill, its guides, the case's
input files with line numbers, and the task. Answer keys are never sent. Add
`SKILL=<name>` to run one skill, or `RUNS=3` to repeat each case.

For example, with Claude Code installed:

```sh
SKILL_EVAL_CMD='claude -p --tools "" --setting-sources "" --no-session-persistence' \
  make skill-evals RUNS=3
```

Each run ends with a line such as `30/30 runs passed`, and writes every
reply and its grade to `.eval-results/`. The command exits 1 when any run
fails or when no case matched the filters, and 2 on a bad argument. A case
passes when the reply meets its checks:

| Check | Meaning |
| --- | --- |
| `grader` | The skill's report grader passes the reply |
| `ledger` | Every planted defect appears as a finding, at an accepted severity |
| `max_severity` | No finding on a clean input is more severe than this |
| `must_match` / `must_not_match` | Required and forbidden content |

The review skills' planted-defect inputs are real: a pull-request diff and
two documentation pages, each with a clean companion. CI does not run these
evals, because they need a model account.

Results for release 1.2.0, with Claude Opus 5.5, three runs per case with
the skill and one without:

| Skill | Cases | With the skill | Without |
| --- | --- | --- | --- |
| backstage-catalog-builder | Suggest an owner from strong evidence; from weak evidence | 6/6 | 1/2 |
| documentation-author | Write a how-to; rewrite a reference page | 5/6 | 1/2 |
| documentation-review | Ten planted defects; two clean pages | 6/6 | 0/2 |
| peer-code-review | Eight planted defects; a clean change | 5/6 | 0/2 |

The two failures: one rewrite left a `TODO` comment in the page, and one
review raised the duplicated retry logic only as a question. Without the
skill, the review replies had no findings table to grade.

## Run the behaviour evals

The skill evals grade a reply. The behaviour evals grade what an assistant
does with the skill: which skill it loads, which files it reads, which
commands it runs, and whether it writes anything before you confirm. See
[decision 0008](decisions/0008-contract-based-behaviour-evals.md).

Each case is a contract in the skill's `evals/agent-evals.json`, with a
fixture repository under its `tests/fixtures/agent/`. Every run copies the
fixture to a temporary folder and installs all the skills, without their
tests. It then runs the assistant with every tool call denied unless the
case permits it.

Run them with an assistant adapter:

```sh
# Any OpenAI-compatible server, for example llama.cpp's llama-server:
make skill-agent-evals AGENT=openai BASE_URL=http://127.0.0.1:8080/v1 MODEL=<model>

# Claude Code, on your Claude account:
make skill-agent-evals AGENT=claude-code
```

| Adapter | Assistant | Skills installed in | Permissions enforced by |
| --- | --- | --- | --- |
| `claude-code` | Claude Code, with project settings only | `.claude/skills/` | Claude Code `--allowedTools` rules |
| `openai` | A built-in agent with five tools, for llama.cpp, Ollama, or a hosted endpoint | `.agents/skills/` | The adapter itself |

A local model costs nothing, but needs one that calls tools; for example,
start llama.cpp with `llama-server -m <model.gguf> --jinja`. Add `SKILL=`,
`RUNS=`, or `RECORD=1`. Transcripts and grades go to `.eval-results/agent/`.

These evals call a model, so CI never runs them. Instead, `RECORD=1` saves
each passing run to the skill's `tests/agent-transcripts/`. The test suite
grades every recording against its contract, and breaks each clause in turn
to check that grading fails. Re-record after changing a skill.

Results on 2026-11-26 with Claude Code and Claude Opus 5.5, after fixing the
harness problems the first run exposed:

| Skill | Case | Result |
| --- | --- | --- |
| backstage-catalog-builder | Suggests the owner from `CODEOWNERS`, and waits for confirmation although writing is allowed | 3 of 3; Claude Haiku 5.5, 0 of 3 |
| backstage-catalog-builder | Runs the descriptor checker | 3 of 3 runs after 1.2.2 widened the skill's description; 1 of 3 before |
| documentation-author | Suggests the audience and location, and waits for confirmation although writing is allowed | 3 of 3 |
| documentation-author | Writes the confirmed page and runs its commands | Pass |
| documentation-review | Finds a broken link without editing | Pass |
| documentation-review | Checks the documented Node version against `package.json` | Pass |
| peer-code-review | Reviews the latest commit with `git` | Pass |
| peer-code-review | Runs the tests before approving | Pass |
| (none) | Loads no skill for an unrelated question | Pass |

Claude Code estimates $0.06 to $0.24 a run at API prices, about $3.80 for
this phase. On a Claude subscription, runs count against its usage limits
instead; with an API key, that account is charged.

Results for the skills added on 2026-11-27, with Claude Opus 5.5. Reply
cases ran with the skill and once without it. Every behaviour case has since
passed three runs in three; see the steering results below.

| Skill | Reply, with the skill | Without | Behaviour cases |
| --- | --- | --- | --- |
| decision-record-author | Pass | Fail | 2 of 2 |
| specification-author | Pass | Fail: none of the sections | 2 of 2 |
| specification-review | 2 of 2 | 0 of 2 | 2 of 2 |
| test-plan-author | Pass | Fail: no levels or boundary tests | 2 of 2 |
| security-review | 2 of 2 | 0 of 2 | 2 of 2 |
| change-plan-author | Pass | Fail: no task table | 2 of 2 |
| release-notes-author | Pass | Fail: no rollback | 2 of 2 |

Several first runs failed for reasons in the evals, not the skills, and were
fixed before these results: a prompt that asked to build instead of to
specify, checks that matched too narrowly, a fixture name that hinted at the
answer, and a "clean" specification that the review correctly found gaps in,
three times.

### Steering: choosing between siblings

The skills that overlap say which sibling to use instead, in a "Not for ..."
clause, and their behaviour cases fail if the sibling loads. With Claude Opus
5.5, three runs per case, on 2026-11-27:

| Skill | Runs passed |
| --- | --- |
| peer-code-review | 9 of 9 |
| security-review, documentation-author, documentation-review, specification-author | 6 of 6 each |
| specification-review | 6 of 6 |
| test-plan-author | 6 of 6 |
| decision-record-author, change-plan-author, release-notes-author, skill-correction | 3 of 3 per case |

No run loaded the wrong sibling. Running each case three times found two
eval problems that single runs had missed: the clean specification still
had two real gaps, which the review found in two of three runs, and a check
did not recognise "there's no open-dispute check" as reporting a
disagreement. Both were fixed in the evals; no skill changed. These runs
cost about $12 at API prices.

### ci-workflow-review

With Claude Opus 5.5 on 2026-11-28: the planted workflow's six defects were
all found and the clean workflow approved, while both baselines without the
skill had no verdict or findings table. Behaviour cases passed three runs in
three each: it ran the bundled checker, `zizmor`, and `actionlint` and wrote
nothing; it did not load for writing a new job; and it said so when a
repository had no workflows. A harness bug first counted the checker's own
output, which mentions `permissions:`, as a permission denial; denials are
now read from Claude Code's own refusal wording.

### Steering: near misses and untested branches

Every skill has a near-miss case: a prompt that sounds like it, but belongs
to a sibling or to no skill. Four more cases test branches no case had run.
With Claude Opus 5.5, three runs per case, on 2026-11-27:

| Cases | Runs passed |
| --- | --- |
| 12 near misses, one per skill | 36 of 36 |
| `decision-record-author` with no existing records | 3 of 3 |
| `security-review` with no scanner configured | 3 of 3 |
| `test-plan-author` with no specification | 3 of 3 |
| `skill-correction` given a vague complaint and no evidence | 3 of 3 |

Two of the branch cases failed at first because of the cases, not the
skills. "Write unit tests for merge.js" was a coding request, which the
assistant rightly did without the skill; the case now asks for a test plan.
The vague-complaint fixture still held a transcript, which the skill rightly
read and acted on; the fixture now has no evidence. `specification-review`
and `security-review` now bundle report graders: every report the skills
produced passes them, and their baselines fail.

A usage limit stopped one batch of runs part-way. The runner now stops on a
usage or rate limit, with exit code 3, instead of grading the remaining runs
as failures.

With the `openai` adapter and Qwen3 8B on a local llama.cpp server, at no
cost, 1 of 9 cases passed: the unrelated question.

- With skills listed only in the system prompt, it loaded none of them.
- With a `use_skill` tool, it loaded the right skill in 4 of the 8 cases that
  need one, then stopped after one or two tool calls instead of following
  the skill's steps.

A model of this size can pick a skill, but does not yet carry out a
multi-step procedure. It still tests the harness for free.

## Check a review report

The two review skills ship graders for the reports they produce. See
[peer-code-review](skills/peer-code-review.md#check-a-report) and
[documentation-review](skills/documentation-review.md#check-a-report).
