# Installing the skills

Clone or download the repository first. The directories under `skills/` are
the source — assistants do not automatically discover them just because the
repository is open. Installation is always local and never registers anything
in Backstage.

In this page:

- [Quick start](#quick-start) — the one command for every supported assistant
- [Updating installed copies](#updating-installed-copies)
- [Installing as a Claude plugin](#installing-as-a-claude-plugin)
- [Destinations and overrides](#destinations-and-overrides) — the full path
  table
- [Manual copying](#manual-copying) — including a PowerShell example
- [Assistant-specific notes](#assistant-specific-notes)

## Quick start

```sh
make install
```

One run copies every skill directory — `SKILL.md`, guides, and scripts — into
all four destination groups: the shared `~/.agents/skills/` path (GitHub
Copilot in VS Code and CLI, OpenCode, Codex, Gemini CLI, Cursor, Windsurf) and
the personal paths of Kiro (`~/.kiro/skills/`), Claude Code
(`~/.claude/skills/`), and Cline (`~/.cline/skills/`). No assistants are
discovered first, nothing project-local is written, and no administrator
permissions are required.

Copies match the source and are validated against the
[Agent Skills specification](https://agentskills.io/specification.md) in the
repository tests. What each assistant does with them is documented by that
assistant: discovery behavior differs per product, some assistants only read
project-local paths, and cloud sessions may ignore personal directories.

## Updating installed copies

Existing copies are protected: `make install` fails without copying anything
if a skill already exists at a destination. Replace them deliberately after
pulling changes:

```sh
make update
```

`make update` is equivalent to `make install FORCE=1`. Copies never update
automatically, so re-run it whenever the source changes.

## Installing as a Claude plugin

Claude Code can also install the repository as a marketplace, which keeps
updates flowing through the plugin system:

```sh
claude plugin marketplace add gautampachnanda101/agent-skills
claude plugin install agent-skills@gautampachnanda101-agent-skills
```

Receive published updates with
`claude plugin update agent-skills@gautampachnanda101-agent-skills`. The
marketplace and plugin manifests live in `.claude-plugin/` at the repository
root and are validated in CI. If you also copy into `~/.claude/skills/` with
`make install`, keep only one route — Claude may report a duplicate.

## Destinations and overrides

The paths below are a reference for manual installation; personal paths apply
across projects.

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

Two variables override the automatic destinations:

```sh
# Replace the global destination list
make install GLOBAL_DESTS="$HOME/.agents/skills:$HOME/.kiro/skills"

# Install into a single directory
make install DEST="$HOME/.kiro/skills"
make install DEST="/path/to/project/.claude/skills"
```

For example, installing `backstage-catalog-builder` for the current project in
VS Code's local agent and OpenCode produces
`.agents/skills/backstage-catalog-builder/SKILL.md`. To use it in Kiro too,
copy it separately to `.kiro/skills/backstage-catalog-builder/`.

Avoid keeping multiple copies with the same name in locations one assistant
searches: assistants such as OpenCode read both `~/.agents/skills/` and
`~/.claude/skills/`, so a duplicate is possible; remove one if the assistant
reports it.

## Manual copying

Copy the **entire skill directory** by hand, substituting the destination from
the table above. PowerShell example from the repository root:

```powershell
$destination = Join-Path $HOME ".agents/skills"
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$skill = Join-Path $destination "backstage-catalog-builder"
if (Test-Path $skill) {
    Write-Output "Skill already exists; review it before replacing it."
} else {
    Copy-Item -Recurse skills/backstage-catalog-builder $skill
}
```

## Assistant-specific notes

- **Kiro**: the default agent discovers workspace and global skills; custom
  agents need the skill in their `resources` configuration. Kiro can import a
  skill from a public repository URL pointing at the skill directory or its
  `SKILL.md`. See the
  [Kiro documentation](https://kiro.dev/docs/skills/) — global availability
  differs in cloud environments.
- **Cursor**: local and cloud agents handle personal skills differently; see
  the [Cursor documentation](https://cursor.com/docs/skills) before relying on
  a personal installation in the cloud.
- `make help` lists every Make target and option, including the color
  settings (`COLOR=always|never`, `NO_COLOR=1`).
