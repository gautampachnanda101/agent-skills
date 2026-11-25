# Verification

Three layers of checks keep generated and shipped descriptors trustworthy.
All of them run in the repository's CI `Verify` workflow.

## Descriptor checks

The regression tests exercise the skill's bundled descriptor checker against
[tests/fixtures/descriptors](https://github.com/gautampachnanda101/agent-skills/tree/main/tests/fixtures/descriptors).
On any machine with Node 18+, validate catalog files structurally (required
fields, unique entity identities, name syntax, Location targets,
`$text`/`$yaml` API placeholders):

```sh
make skill-smoke
node backstage-catalog-builder/scripts/check-descriptors.mjs catalog-info.yaml
```

The checker is intentionally not a full YAML or schema validator; use a real
parser or the catalog's `validate-entity` for that. Skill installations include
the checker (`scripts/check-descriptors.mjs` beside the `SKILL.md`), so the
same command works from any installed copy.

## TechDocs and MkDocs checks

The `make skill-smoke` target also runs the bundled TechDocs checker over
[this repository's own MkDocs site](https://github.com/gautampachnanda101/agent-skills/blob/main/mkdocs.yml)
and fixtures for single-repository, monorepo (one `mkdocs.yml` per package
descriptor), and aggregated (`mkdocs-monorepo-plugin` `!include`) layouts. The
checker validates `backstage.io/techdocs-ref: dir:` targets, `site_name`
matching the owning entity, the required `techdocs-core` plugin, and that every
nav page and `!include` target resolves. Node 18+; run standalone:

```sh
node backstage-catalog-builder/scripts/check-techdocs.mjs catalog-info.yaml
```

`site_name` mismatches are warnings (fail with `--strict`); `url:`
`techdocs-ref` values are recorded, not resolved. CI additionally checks a
pinned public repository (Backstage at a fixed tag) to exercise the checker
against real-world MkDocs YAML, including deeply nested nav sections. The
fixtures live in
[tests/fixtures/techdocs](https://github.com/gautampachnanda101/agent-skills/tree/main/tests/fixtures/techdocs).

## Local model end-to-end check

`make skill-llm-verify` runs cheap LLM round trips against the skill: it
downloads a pinned CPU build of llama.cpp (about 23 MB) and a quantized
Qwen2.5-0.5B-Instruct model (about 400 MB) into a git-ignored `.llm-cache/`,
starts a local `llama-server`, and has the model apply the real `SKILL.md` in
two scenarios validated by the bundled checkers:

1. **Descriptor scenario** — generate a catalog descriptor from source
   evidence; the output must pass `check-descriptors.mjs` with the
   evidence-backed values.
2. **MkDocs scenario** — generate a `mkdocs.yml` for an existing `docs/` tree
   while the TechDocs guide is loaded; the generated file is written beside a
   real entity and pages, and must pass both `check-descriptors.mjs` and
   `check-techdocs.mjs` (site_name match, `techdocs-core` plugin, valid nav).

TechDocs wiring that the tiny model cannot apply reliably (annotation
modeling, monorepo layouts) is validated deterministically by the checker
tests and the public-repository CI job instead; set `LLM_MODEL_URL` to a
larger model to exercise those skills through the same scenarios.

Overrides: `LLAMA_CPP_URL`, `LLM_MODEL_URL`, `LLM_ATTEMPTS`, `LLM_CTX`,
`LLM_PORT`, `LLM_CACHE`. The CI `Verify` workflow runs the same check as a
required job; on public repositories the hosted runner is free, the cache makes
downloads one-time, and each run costs only a few minutes of CPU.

## Try the output in a local Backstage

The Makefile can create and run a local
[open-source Backstage](https://backstage.io/docs/getting-started/) app in
`.backstage/` (git-ignored) to load descriptors produced by the skill:

```sh
make backstage CATALOG_FILES="/path/to/repo/catalog-info.yaml"
```

The first run scaffolds the app with `@backstage/create-app` and installs
dependencies, which takes a few minutes. The app opens at
`http://localhost:3000` and the catalog API is at
`http://localhost:7007/api/catalog`.

- Backstage needs Node.js 24.15+ or 26.13+. If the current `node` is older, the
  Makefile uses Node 24 from nvm, then asdf, installing it if needed (override
  with `BACKSTAGE_NODE_VERSION`). Native modules are rebuilt automatically when
  the selected Node version changes.
- `CATALOG_FILES` is a colon-separated list of descriptor files, loaded as
  `file` locations alongside the local test fixtures. These locations replace
  the scaffold's example entities. By default, the repository's root
  `catalog-info.yaml` and root descriptors in `BACKSTAGE_HOME/repos/*/`
  are loaded when present. Approved local clones therefore remain in the
  catalog after restarting. Specify `CATALOG_FILES` to override these automatic
  repository locations; the base fixtures remain loaded.
- Set `BACKSTAGE_TOKEN` in the environment to accept it as a static bearer
  token for the catalog API; the config references the variable, not its value.
  For example: `export BACKSTAGE_TOKEN="$(openssl rand -hex 24)"`.
- Change ports with `BACKSTAGE_APP_PORT` and `BACKSTAGE_BACKEND_PORT`, and the
  location with `BACKSTAGE_HOME`. Relative paths are resolved from this
  repository before changing directories; paths with spaces are supported.
- `make backstage-backend` starts only the backend; `make backstage-clean`
  removes the local app and its clones only when its directory has the managed
  marker created by a successful `make backstage-setup`. Existing installations
  made before this safeguard need `make backstage-setup` once before cleanup.
  Cleanup rejects the filesystem root, user home, repository root, and their
  ancestors, including aliases through symlinks.

`app-config.local.yaml` is regenerated on each run. The demo's random-joke home
widget, which calls an external API, is disabled.

### Base catalog for skill tests

Every run loads `backstage/catalog-info.yaml`, which links to a synthetic
organization, the `catalog-test` team, a synthetic user, and example Domain,
System, Component, API, and Resource entities. They require no external
services or credentials. The user entity is not a login account, and none of
these fixtures represents real upstream ownership.

To test any locally cloned open-source repository:

1. Ask the skill to generate or update that repository's descriptors. For new
   entities without known owners, explicitly approve
   `group:default/catalog-test` as a test-only owner; preserve existing
   ownership otherwise. Optionally use `skill-test-system` as the test system.
2. Stop the current Backstage process, then load the root descriptor or
   aggregate Location (not each child separately):

   ```sh
   make backstage CATALOG_FILES="/path/to/clone/catalog-info.yaml"
   ```

3. Open `http://localhost:3000/catalog` and check entities, ownership,
   dependencies, API definitions, and processing errors. Multiple repositories
   can be supplied:

   ```sh
   make backstage CATALOG_FILES="/path/to/repo-a/catalog-info.yaml:/path/to/repo-b/catalog-info.yaml"
   ```

Choose distinct entity identities across repositories. Do not recreate the
`catalog-test` group in each repository. Relative Location targets resolve from
their descriptor file; all file targets must exist on the Backstage backend's
filesystem. API definitions in file locations should be inline, since Backstage
does not support `$text`/`$yaml` placeholders for these locations.

### GitHub organization discovery plugin

Install the official open-source GitHub catalog backend module:

```sh
make backstage-github
```

The target installs `@backstage/plugin-catalog-backend-module-github` 0.14.2
(compatible with the tested Backstage 1.57 scaffold), registers it once in the
backend, and copies `github-discovery.yaml` to a separate local app config.
Stop and restart your app to activate it.

The example discovers only the public `backstage/backstage` repository in the
`backstage` organization, excluding forks and archived repositories, and
refreshes every 30 minutes. GitHub GraphQL requires a GitHub credential even
for public repositories. Set `GITHUB_DISCOVERY_TOKEN` through your secret
manager or, if explicitly authorized, through the authenticated GitHub CLI:

```sh
export GITHUB_DISCOVERY_TOKEN="$(gh auth token)"
make backstage
```

The token stays in the environment; the YAML contains only a variable
reference. Without the variable, startup explicitly reports that GitHub
discovery is disabled, while the local file catalog still works. The optional
config is preserved across generated-config restarts. Edit the local
`app-config.github.yaml` to change the organization/filter; rerunning
`make backstage-github` restores the example config.

This plugin ingests existing published descriptors; it does not generate them
from source files. Use the skill for missing descriptors, file inspection,
ownership decisions and cross-repository modeling. GitHub user accounts need
user-repository enumeration, not an organization provider. See
[scope and modeling](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/scope-and-modeling.md).

### Connect Backstage through MCP

The scaffold already registers the open-source MCP Actions Backend. This
repository's [VS Code MCP configuration](https://github.com/gautampachnanda101/agent-skills/blob/main/.vscode/mcp.json)
connects to `http://localhost:7007/api/mcp-actions/v1` using a secure password
prompt, not a stored token.

1. Start Backstage with `BACKSTAGE_TOKEN` set through your secret manager or
   terminal environment. The generated app config enables that static token:

   ```sh
   export BACKSTAGE_TOKEN="$(openssl rand -hex 24)"
   make backstage
   ```

2. In VS Code, run **MCP: List Servers**, choose **backstage**, and start it.
   Supply the same token through the secure prompt; do not paste it into chat
   or commit it to a file. Approve workspace/server trust if prompted.
3. Confirm that tools are listed, then invoke an available read-only catalog
   tool. The skill discovers actual tool names and schemas; not every REST
   endpoint is exposed as an MCP action.

Other MCP-capable assistants can use the same HTTP endpoint with their own
secret-aware authorization configuration. If the backend port changes, update
the client URL. Localhost must be permitted by the host's network policy.
Without a successful initialization/tool call, a saved connection config alone
does not prove the server works. The skill's
[MCP workflow](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/mcp-workflow.md)
covers catalog-model discovery, per-entity server validation, paginated
inspection, safe registration and coverage reconciliation. It checks tool
result errors as well as transport success and never treats a file location as
a URL upload.
