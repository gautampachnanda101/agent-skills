# Verification

Three layers of checks keep generated and shipped descriptors trustworthy, and
all of them run in the repository's CI `Verify` workflow.

In this page:

- [Descriptor and TechDocs checks](#descriptor-and-techdocs-checks)
- [Local model end-to-end check](#local-model-end-to-end-check)
- [Try the output in a local Backstage](#try-the-output-in-a-local-backstage)
  - [Backstage options](#backstage-options)
  - [Base catalog for skill tests](#base-catalog-for-skill-tests)
  - [GitHub organization discovery](#github-organization-discovery)
  - [Connect through MCP](#connect-through-mcp)

## Descriptor and TechDocs checks

Two bundled checkers run everywhere, including from any installed skill copy
(`scripts/` beside the `SKILL.md`). Validate this repository's own catalogs
and fixtures:

```sh
make skill-smoke
node backstage-catalog-builder/scripts/check-descriptors.mjs catalog-info.yaml
node backstage-catalog-builder/scripts/check-techdocs.mjs catalog-info.yaml
```

Both are zero-dependency and run on Node 18+.

The **descriptor checker** validates required fields per kind, unique
`(kind, namespace, name)` identities, entity name syntax, Location targets,
and `$text`/`$yaml` API placeholders. Pass `--json` for a machine-readable
report and `--strict` to fail on warnings.

The **TechDocs checker** validates `backstage.io/techdocs-ref: dir:` targets,
`site_name` matching the owning entity, the required `techdocs-core` plugin,
and every nav page and `!include` target. `site_name` mismatches are warnings
(`--strict` fails them); `url:` values are recorded, not resolved.

Both are line-based structural checkers, not full YAML or schema validators —
use a real parser or the catalog's `validate-entity` for that.

CI exercises them beyond the fixtures: the `TechDocs checker on public
repositories` job validates a pinned Backstage checkout (real-world nested
nav, quoted values, plugin maps) and the `mkdocs-monorepo-plugin` test
fixtures (custom `docs_dir` in included sites, quoted `!include` values, bare
subnav pages). The generation contract across layouts — multi-document
catalogs, API contracts with aggregate Locations, per-package and aggregated
monorepo sites, custom `docs_dir`, path-limited `dir:` scopes — is covered by
[tests/output-examples.test.cjs](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/tests/output-examples.test.cjs)
with fixtures in
[tests/fixtures/techdocs](https://github.com/gautampachnanda101/agent-skills/tree/main/backstage-catalog-builder/tests/fixtures/techdocs).
The descriptor, TechDocs, and output-contract suites, their fixtures, and the
eval harness live inside the skill's own `tests/` and `scripts/` directories,
so the skill travels with its verification.

## Local model end-to-end check

`make skill-llm-verify` runs cheap LLM round trips against the real
`SKILL.md`: it downloads a pinned CPU build of llama.cpp (about 23 MB) and a
quantized Qwen2.5-0.5B-Instruct model (about 400 MB) into a git-ignored
`.llm-cache/`, starts a local `llama-server`, then applies the skill in two
scenarios validated by the bundled checkers:

1. **Descriptor scenario** — generate a catalog descriptor from source
   evidence; the output must pass `check-descriptors.mjs` with
   evidence-backed values.
2. **MkDocs scenario** — generate a `mkdocs.yml` for an existing `docs/`
   tree while the TechDocs guide is loaded; the file must pass both
   `check-descriptors.mjs` and `check-techdocs.mjs` (site_name match,
   `techdocs-core` plugin, valid nav).

TechDocs wiring the tiny model cannot apply reliably (annotation modeling,
monorepo layouts) is validated deterministically by the checker tests and the
public-repository CI job instead.

The prompts live in the skill-local
[evals/evals.json](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/evals/evals.json)
in the format from
[agentskills.io/skill-creation/evaluating-skills](https://agentskills.io/skill-creation/evaluating-skills),
with the bundled checkers serving as the assertions. Each run also replays the
same prompts **without** the skill instructions (baseline; skip with
`LLM_BASELINE=0`, tune attempts with `LLM_BASELINE_ATTEMPTS`) and aggregates
pass rates, token usage, and durations into `.llm-cache/benchmark.json`:

```json
{
  "run_summary": {
    "with_skill": { "evals_passed": 2, "evals_total": 2, "pass_rate": 1.0, "tokens_mean": 6249 },
    "without_skill": { "evals_passed": 0, "evals_total": 2, "pass_rate": 0.0, "tokens_mean": 201 }
  },
  "delta": { "pass_rate": 1.0 }
}
```

The delta is the skill's value against its token cost: with the skill the
small model produces evidence-grounded, structurally valid output; without it,
the same model fails both scenarios. A baseline failure is a result, never a
blocking error — only with-skill runs gate CI.

| Variable | Purpose |
| --- | --- |
| `LLAMA_CPP_URL` | Use a different llama.cpp build |
| `LLM_MODEL_URL` | Point at a larger model to exercise harder scenarios |
| `LLM_ATTEMPTS` / `LLM_CTX` / `LLM_PORT` / `LLM_CACHE` | Tune attempts, context, server port, and cache location |

On public repositories the hosted runner is free, the cache makes downloads
one-time, and each run costs a few minutes of CPU.

## Try the output in a local Backstage

Run a local [open-source Backstage](https://backstage.io/docs/getting-started/)
app that loads descriptors produced by the skill:

```sh
make backstage CATALOG_FILES="/path/to/repo/catalog-info.yaml"
```

The first run scaffolds the app with `@backstage/create-app` and installs
dependencies, which takes a few minutes. Open the UI at
`http://localhost:3000` and the catalog API at
`http://localhost:7007/api/catalog`.

### Backstage options

| Option | Purpose |
| --- | --- |
| `CATALOG_FILES=a.yaml:b.yaml` | Colon-separated descriptor files, loaded as `file` locations; overrides the default repo locations (base fixtures stay loaded) |
| `BACKSTAGE_TOKEN` | Environment-only static bearer token for the catalog API; the generated config references the variable, never its value |
| `BACKSTAGE_APP_PORT` / `BACKSTAGE_BACKEND_PORT` | UI and backend ports (default `3000` / `7007`) |
| `BACKSTAGE_HOME` | App, tools, and clone directory (default `.backstage/` in this repo, git-ignored) |
| `BACKSTAGE_NODE_VERSION` | Node version selector through nvm/asdf (default `24`; Backstage needs 24.15+ or 26.13+, and native modules rebuild on ABI change) |

Other behaviors worth knowing:

- By default, this repository's root `catalog-info.yaml` and root descriptors
  under `BACKSTAGE_HOME/repos/*/` load automatically, so approved local clones
  remain in the catalog after restarts.
- `app-config.local.yaml` is regenerated on each run; the demo's random-joke
  home widget, which calls an external API, is disabled.
- `make backstage-backend` starts only the backend.
- `make backstage-clean` removes the local app and its clones only when the
  directory carries the managed marker from a successful setup — it rejects
  the filesystem root, home, repository root, and their ancestors.

### Base catalog for skill tests

Every run loads `backstage/catalog-info.yaml`, which links a synthetic
organization, the `catalog-test` team, a synthetic user, and example Domain,
System, Component, API, and Resource entities. They need no external services
or credentials; the user entity is not a login account, and none of the
fixtures represents real upstream ownership.

To test any locally cloned repository:

1. Ask the skill to generate or update its descriptors. For new entities
   without known owners, explicitly approve `group:default/catalog-test` as a
   test-only owner; preserve existing ownership otherwise.
2. Restart the app with that repository's root descriptor or aggregate
   Location (not each child separately):

   ```sh
   make backstage CATALOG_FILES="/path/to/clone/catalog-info.yaml"
   ```

   Multiple repositories are comma-free and colon-separated:

   ```sh
   make backstage CATALOG_FILES="/path/to/repo-a/catalog-info.yaml:/path/to/repo-b/catalog-info.yaml"
   ```

3. Open `http://localhost:3000/catalog` and check entities, ownership,
   dependencies, API definitions, and processing errors.

Keep identities distinct across repositories and do not recreate the
`catalog-test` group in each one. Relative Location targets resolve from their
descriptor file and must exist on the backend's filesystem; API definitions in
file locations should be inline, because Backstage does not apply
`$text`/`$yaml` placeholders there.

### GitHub organization discovery

Install the official GitHub catalog backend module and restart the app:

```sh
make backstage-github
```

The target installs `@backstage/plugin-catalog-backend-module-github` 0.14.2
(compatible with the tested Backstage 1.57 scaffold), registers it in the
backend, and writes a separate local config. The example discovers only the
public `backstage/backstage` repository, excluding forks and archived
repositories, refreshing every 30 minutes.

GitHub GraphQL requires a credential even for public repositories. Keep the
token in your environment — the YAML contains only a variable reference:

```sh
export GITHUB_DISCOVERY_TOKEN="$(gh auth token)"
make backstage
```

Without the variable, startup reports that GitHub discovery is disabled while
the local file catalog still works. Edit the local `app-config.github.yaml`
to change the organization/filter; re-running `make backstage-github`
restores the example config. Note that this provider ingests **existing
published descriptors only** — it does not generate them from source files.
Use the skill for missing descriptors, file inspection, ownership decisions,
and cross-repository modeling; GitHub user accounts need user-repository
enumeration rather than an organization provider. See
[scope-and-modeling.md](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/scope-and-modeling.md).

### Connect through MCP

The scaffold registers the open-source MCP Actions Backend, and this
repository's [VS Code MCP configuration](https://github.com/gautampachnanda101/agent-skills/blob/main/.vscode/mcp.json)
connects to `http://localhost:7007/api/mcp-actions/v1` using a secure prompt —
not a stored token:

1. Start Backstage with a token in the environment:

   ```sh
   export BACKSTAGE_TOKEN="$(openssl rand -hex 24)"
   make backstage
   ```

2. In VS Code, run **MCP: List Servers**, start **backstage**, and supply the
   same token through the secure prompt. Never paste the token into chat or
   commit it to a file.
3. Confirm tools are listed, then invoke a read-only catalog tool. The skill
   discovers actual tool names and schemas — not every REST endpoint is
   exposed as an MCP action.

Other MCP-capable assistants can use the same HTTP endpoint with their own
secret-aware authorization; update the client URL if the backend port changes.
A saved connection config alone proves nothing — initialization plus a
successful tool call is the connectivity evidence. The skill's
[mcp-workflow.md](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/mcp-workflow.md)
covers catalog-model discovery, per-entity server validation, paginated
inspection, safe registration, and coverage reconciliation: it treats
transport success and tool-result errors separately, and never mistakes a
file location for a URL upload.
