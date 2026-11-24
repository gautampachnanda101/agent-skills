# Agent skills

Reusable [Agent Skills](https://agentskills.io/) for coding assistants.

## Available skills

- [backstage-catalog-builder](./backstage-catalog-builder/SKILL.md) scans a
  GitHub organization, user account, repository, or selected repository paths
  and creates or updates evidence-based open-source Backstage catalog entries.
  It discovers available host tools and distinguishes source modeling from
  automatic ingestion of already-published descriptors.

## Install a skill

Clone or download this repository. The repository's top-level skill
directories are the source; assistants do not automatically discover them just
because this repository is open.

Run `make` or `make help` for grouped commands, options, examples and local
Backstage URLs. Help uses colours in supported terminals and plain text when
redirected. Use `COLOR=always` to force colours, or `COLOR=never` / `NO_COLOR=1`
to disable them.

Run `make install` for automatic global installation. The paths below are a
reference for manual installation; personal paths apply across projects.

| Assistant | Project skills directory | Personal skills directory |
| --- | --- | --- |
| GitHub Copilot in VS Code (local agent) | `.agents/skills/` or `.github/skills/` | `~/.agents/skills/` or `~/.copilot/skills/` |
| GitHub Copilot CLI | `.agents/skills/` or `.github/skills/` | `~/.agents/skills/` or `~/.copilot/skills/` |
| Kiro | `.kiro/skills/` | `~/.kiro/skills/` |
| OpenCode | `.agents/skills/` or `.opencode/skills/` | `~/.agents/skills/` or `~/.config/opencode/skills/` |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| OpenAI Codex | `.agents/skills/` | `~/.agents/skills/` |
| Gemini CLI | `.agents/skills/` or `.gemini/skills/` | `~/.agents/skills/` or `~/.gemini/skills/` |
| Cursor | `.agents/skills/` or `.cursor/skills/` | `~/.agents/skills/` or `~/.cursor/skills/` |
| Windsurf | `.agents/skills/` or `.windsurf/skills/` | `~/.agents/skills/` or `~/.codeium/windsurf/skills/` |
| Cline | `.cline/skills/` | `~/.cline/skills/` |

For example, installing `backstage-catalog-builder` for the current project in
VS Code's local agent and OpenCode produces
`.agents/skills/backstage-catalog-builder/SKILL.md`. To use it in Kiro too,
copy it separately to `.kiro/skills/backstage-catalog-builder/`. Copies do not
update automatically; replace them deliberately when updating the source.
Avoid installing multiple copies with the same name into locations searched by
the same assistant.

From the repository root on macOS/Linux, install all skills globally for your
user, across every project, without choosing paths:

```sh
make install
```

The installer always writes the shared `~/.agents/skills/` directory (GitHub
Copilot in VS Code and CLI, OpenCode, Codex, Gemini CLI, Cursor, Windsurf)
and the personal directories of Kiro (`~/.kiro/skills/`), Claude Code
(`~/.claude/skills/`), and Cline (`~/.cline/skills/`); no assistants are
discovered first. No project-local installation is made by default, and no
administrator
permissions are required. Detection is best-effort: assistants with no known
installation footprint may need an explicit override.

`make install-global` is an alias for the same automatic installation.
Some assistants, such as OpenCode,
also read `~/.claude/skills/`, so they may find two identical copies; remove
one if your assistant reports a duplicate. Optional overrides are available
for undetected assistants or manual installation:

```sh
make install GLOBAL_DESTS="$HOME/.agents/skills:$HOME/.kiro/skills"
make install DEST="$HOME/.kiro/skills"
make install DEST="/path/to/project/.claude/skills"
```

This requires Make and a POSIX shell. The installer copies all top-level skill
directories, including their supporting files. It checks every destination
first and fails without copying anything if a skill already exists there. To
update existing copies after pulling changes, add `FORCE=1`, which replaces the
installed skill directories:

```sh
make install FORCE=1
```

Installation is local and does not register anything in Backstage.

Alternatively, copy the **entire skill directory** manually. For example, in
PowerShell from the root of this repository:

```powershell
$destination = Join-Path $HOME ".agents/skills"
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$skill = Join-Path $destination "backstage-catalog-builder"
if (Test-Path $skill) {
    Write-Output "Skill already exists; review it before replacing it."
} else {
    Copy-Item -Recurse backstage-catalog-builder $skill
}
```

For another assistant or project, substitute its skills directory from the
table. Copying is local and does not register anything in Backstage.

Kiro's default agent discovers workspace and global skills; custom agents need
the skill in their `resources` configuration. Kiro also supports importing a
skill from a public repository URL pointing to the skill directory or its
`SKILL.md`. Global skill availability differs in cloud environments. See the
[Kiro documentation](https://kiro.dev/docs/skills/) for agent configuration
and version-specific behavior.

Cursor's local and cloud agents handle personal skills differently; consult the
Cursor documentation before relying on a personal installation in the cloud.

## Use

Open the repository to catalog in the assistant and ask, for example:

> Use the backstage-catalog-builder skill to create a Backstage catalog for
> this repository.

For a complete account-wide configuration, ask:

> Use backstage-catalog-builder for https://github.com/OWNER. Discover all
> eligible repositories, generate missing catalog entries from their files,
> preserve existing metadata, and configure my local Backstage app. Include
> supported APIs, infrastructure, ownership and documentation. Confirm scope
> and missing decisions once, then verify catalog coverage and persistence.

The intended result is a usable configuration bundle, not just a repository
list or discovery plugin. Each approved repository is inspected and either
represented by justified entities or reported with a specific blocker.
The skill assembles locations, approved organization data, app configuration
and an expected-entity inventory, and verifies ingestion when access permits.
Inspection covers actions/CI, teams and organization metadata, documentation
and ADRs, API contracts, infrastructure and technical-insight evidence. Plugin
configuration is derived from discovered capabilities and approved policies,
not guessed annotations or scores.
See the [configuration delivery workflow](./backstage-catalog-builder/configuration-delivery.md).

The assistant should ask about the Backstage configuration and token without
requesting the token value. Creating local descriptors and registering them
with Backstage are separate steps. If the skill is not found, check the
destination, the active assistant or agent, and its skill permissions or
settings. Refer to the relevant documentation:

- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [GitHub Copilot CLI Agent Skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [Kiro Agent Skills](https://kiro.dev/docs/skills/)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills/)
- [Gemini CLI Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Cursor Agent Skills](https://cursor.com/docs/skills)
- [Windsurf Cascade Skills](https://docs.windsurf.com/windsurf/cascade/skills)
- [Cline Skills](https://docs.cline.bot/customization/skills)

Discovery and available capabilities depend on the assistant and its
configuration; compatibility has not been verified in every client.

## Contributor checks

Install [pre-commit](https://pre-commit.com/#install). Tests run on Node 24.15+
or 26.13+; if the active `node` is older, they re-run under the newest
qualifying install found in nvm or asdf. Then enable hooks:

```sh
make hooks-install
make hooks-check
```

The hook checks YAML (including multi-document catalog files), JSON, merge
conflicts, large added files, whitespace and final newlines. Make/script/test
changes also run the repository regression tests. Hooks never install Node or
start Backstage.

Installation sets a repository-local hooks path, preserving existing hooks by
delegation/symlinks; global Git settings and the existing commit-message hook
are not modified. At commit time pre-commit checks staged files and temporarily
stashes unstaged tracked changes. Fixers may update files; review and stage those
changes before retrying. The first run downloads the pinned check environments.

## Try the output in a local Backstage

The Makefile can create and run a local
[open-source Backstage](https://backstage.io/docs/getting-started/) app in
`.backstage/` (git-ignored) to load descriptors produced by the skill:

```sh
make backstage CATALOG_FILES="/path/to/repo/catalog-info.yaml"
```

The first run scaffolds the app with `@backstage/create-app` and installs
dependencies, which takes a few minutes. The app opens at
<http://localhost:3000> and the catalog API is at
<http://localhost:7007/api/catalog>.

- Backstage needs Node.js 24.15+ or 26.13+. If the current `node` is older, the
  Makefile uses Node 24 from nvm, then asdf, installing it if needed
  (override with `BACKSTAGE_NODE_VERSION`). Native modules are rebuilt
  automatically when the selected Node version changes.
- `CATALOG_FILES` is a colon-separated list of descriptor files, loaded as
  `file` locations alongside the local test fixtures. These locations replace
  the scaffold's example entities. By default, the repository's root
  [catalog-info.yaml](./catalog-info.yaml) and root descriptors in
  `BACKSTAGE_HOME/repos/*/catalog-info.yaml` are loaded when present. Approved
  local clones therefore remain in the catalog after restarting. Specify
  `CATALOG_FILES` to override these automatic repository locations; the base
  fixtures remain loaded.
- Set `BACKSTAGE_TOKEN` in the environment to accept it as a static bearer
  token for the catalog API; the config references the variable, not its
  value. For example: `export BACKSTAGE_TOKEN="$(openssl rand -hex 24)"`.
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

Every run loads [backstage/catalog-info.yaml](./backstage/catalog-info.yaml),
which links to a synthetic organization, the `catalog-test` team, a synthetic
user, and example Domain, System, Component, API, and Resource entities. They
require no external services or credentials. The user entity is not a login
account, and none of these fixtures represents real upstream ownership.

To test any locally cloned open-source repository:

1. Ask the skill to generate or update that repository's descriptors. For new
   entities without known owners, explicitly approve `group:default/catalog-test`
   as a test-only owner; preserve existing ownership otherwise. Optionally use
   `skill-test-system` as the test system.
2. Stop the current Backstage process, then load the root descriptor or aggregate
   Location (not each child separately):

   ```sh
   make backstage CATALOG_FILES="/path/to/clone/catalog-info.yaml"
   ```

3. Open <http://localhost:3000/catalog> and check entities, ownership, dependencies,
   API definitions, and processing errors. Multiple repositories can be supplied:

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
backend, and copies [github-discovery.yaml](./backstage/github-discovery.yaml)
to a separate local app config. Stop and restart your app to activate it.

The example discovers only the public `backstage/backstage` repository in the
`backstage` organization, excluding forks and archived repositories, and
refreshes every 30 minutes. GitHub GraphQL requires a GitHub credential even
for public repositories. Set `GITHUB_DISCOVERY_TOKEN` through your secret manager
or, if explicitly authorized to use your authenticated GitHub CLI:

```sh
export GITHUB_DISCOVERY_TOKEN="$(gh auth token)"
make backstage
```

The token stays in the environment; the YAML contains only a variable reference.
Without the variable, startup explicitly reports that GitHub discovery is
disabled, while the local file catalog still works. The optional config is
preserved across generated-config restarts. Edit the local
`app-config.github.yaml` to change the organization/filter; rerunning
`make backstage-github` restores the example config.

This plugin ingests existing published descriptors; it does not generate them
from source files. Use the skill for missing descriptors, file inspection,
ownership decisions and cross-repository modeling. GitHub user accounts (such
as `gautampachnanda101`) need user-repository enumeration, not an organization
provider. See [scope and modeling](./backstage-catalog-builder/scope-and-modeling.md).

### Connect Backstage through MCP

The scaffold already registers the open-source MCP Actions Backend. This repo's
[VS Code MCP configuration](./.vscode/mcp.json) connects to
`http://localhost:7007/api/mcp-actions/v1` using a secure password prompt, not
a stored token.

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
does not prove the server works.
The skill's [MCP workflow](./backstage-catalog-builder/mcp-workflow.md) covers
catalog-model discovery, per-entity server validation, paginated inspection,
safe registration and coverage reconciliation. It checks tool result errors
as well as transport success and never treats a file location as a URL upload.
