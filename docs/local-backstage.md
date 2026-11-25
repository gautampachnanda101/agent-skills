# Local Backstage

Run a local [open-source Backstage](https://backstage.io/docs/getting-started/)
app that loads descriptors produced by the skill:

```sh
make backstage CATALOG_FILES="/path/to/repo/catalog-info.yaml"
```

In this page:

- [Backstage options](#backstage-options)
- [Test a cloned repository](#test-a-cloned-repository)
- [GitHub organization discovery](#github-organization-discovery)
- [Connect through MCP](#connect-through-mcp)

The first run scaffolds the app with `@backstage/create-app` and installs
dependencies, which takes a few minutes. Open the UI at
`http://localhost:3000` and the catalog API at
`http://localhost:7007/api/catalog`.

## Backstage options

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

## Test a cloned repository

Every run also loads a base catalog from
`skills/backstage-catalog-builder/tests/fixtures/backstage-instance/catalog-info.yaml`.
It holds a synthetic organization, the `catalog-test` team, a user, and example
entities. They need no external services or credentials. The user is not a
login account, and no fixture represents real ownership.

To test a repository you have cloned:

1. Ask the skill to generate or update its descriptors. For new entities
   without known owners, explicitly approve `group:default/catalog-test` as a
   test-only owner; preserve existing ownership otherwise.
2. Restart the app with that repository's root descriptor or aggregate
   Location (not each child separately):

   ```sh
   make backstage CATALOG_FILES="/path/to/clone/catalog-info.yaml"
   ```

   Separate several repositories with colons:

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

## GitHub organization discovery

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
[scope-and-modeling.md](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/scope-and-modeling.md).

## Connect through MCP

The scaffold registers the open-source MCP Actions Backend, and this
repository's [VS Code MCP configuration](https://github.com/gautampachnanda101/agent-skills/blob/main/.vscode/mcp.json)
connects to `http://localhost:7007/api/mcp-actions/v1` using a secure prompt —
not a stored token:

1. Create a token in the environment:

   ```sh
   export BACKSTAGE_TOKEN="$(openssl rand -hex 24)"
   ```

2. Copy the token without printing it, then start Backstage. On Linux, replace
   `pbcopy` with `wl-copy` or `xclip -selection clipboard`:

   ```sh
   printf %s "$BACKSTAGE_TOKEN" | pbcopy
   make backstage
   ```

3. In VS Code, run **MCP: List Servers**, start **backstage**, and paste the
   token into the secure prompt. Never paste it into chat or commit it to a
   file. Clear the clipboard afterwards.
4. Confirm tools are listed, then invoke a read-only catalog tool. The skill
   discovers actual tool names and schemas — not every REST endpoint is
   exposed as an MCP action.

Other MCP-capable assistants can use the same HTTP endpoint with their own
secret-aware authorization; update the client URL if the backend port changes.
A saved connection config alone proves nothing — initialization plus a
successful tool call is the connectivity evidence. The skill's
[mcp-workflow.md](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/mcp-workflow.md)
covers catalog-model discovery, per-entity server validation, paginated
inspection, safe registration, and coverage reconciliation: it treats
transport success and tool-result errors separately, and never mistakes a
file location for a URL upload.
