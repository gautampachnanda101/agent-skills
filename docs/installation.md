# Installation

Clone or download the repository. The repository's top-level skill directories
are the source; assistants do not automatically discover them just because the
repository is open.

`make install` copies every top-level skill directory, including supporting
files, into the personal skills directories of the supported assistants. It
requires Make and a POSIX shell. The installer always writes the shared
`~/.agents/skills/` directory (GitHub Copilot in VS Code and CLI, OpenCode,
Codex, Gemini CLI, Cursor, Windsurf) and the personal directories of Kiro
(`~/.kiro/skills/`), Claude Code (`~/.claude/skills/`), and Cline
(`~/.cline/skills/`); no assistants are discovered first. No project-local
installation is made by default, and no administrator permissions are
required. Detection is best-effort: assistants with no known installation
footprint may need an explicit override.

```sh
make install
```

`make install-global` is an alias for the same automatic installation. Existing
copies are protected: the installer checks every destination first and fails
without copying anything if a skill already exists there. To replace installed
copies after pulling changes:

```sh
make update
```

`make update` is equivalent to `make install FORCE=1` and copies the current
skill directories over every destination.

Installation is local and does not register anything in Backstage.

## Claude plugin installation

Claude Code users can install the repository as a marketplace instead, which
keeps updates flowing through the plugin system:

```sh
claude plugin marketplace add gautampachnanda101/agent-skills
claude plugin install agent-skills@gautampachnanda101-agent-skills
```

The marketplace and plugin manifests live in `.claude-plugin/` at the
repository root; `claude plugin validate --strict .` checks them. Updates
arrive through `claude plugin update agent-skills@gautampachnanda101-agent-skills`
when the published version changes. Installing through the marketplace and
copying into `~/.claude/skills/` with `make install` both work; keep only one,
or your assistant may report a duplicate.

## Per-project and manual destinations

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

Optional overrides replace the automatic global destinations or install into a
single directory:

```sh
make install GLOBAL_DESTS="$HOME/.agents/skills:$HOME/.kiro/skills"
make install DEST="$HOME/.kiro/skills"
make install DEST="/path/to/project/.claude/skills"
```

For example, installing `backstage-catalog-builder` for the current project in
VS Code's local agent and OpenCode produces
`.agents/skills/backstage-catalog-builder/SKILL.md`. To use it in Kiro too,
copy it separately to `.kiro/skills/backstage-catalog-builder/`. Copies do not
update automatically; replace them deliberately when updating the source. Avoid
installing multiple copies with the same name into locations searched by the
same assistant. Some assistants, such as OpenCode, also read
`~/.claude/skills/`, so they may find two identical copies; remove one if your
assistant reports a duplicate.

## Verified install behavior

The installer writes complete skill directories (SKILL.md, guides, scripts)
into all four destinations in one run: the shared `~/.agents/skills/` path and
Kiro, Claude Code, and Cline personal paths. The copies are validated against
the [Agent Skills specification](https://agentskills.io/specification.md) in
tests, so files identical to the source land in every destination; what an
individual assistant does with them is documented by that assistant. Discovery
behavior differs per product: some assistants only read project-local paths,
cloud sessions may ignore personal directories, and assistants such as OpenCode
also read `~/.claude/skills/`. Replace installed copies deliberately and remove
duplicates if your assistant reports them.

## Manual copying

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
table above. Copying is local and does not register anything in Backstage.

## Assistant-specific notes

- Kiro's default agent discovers workspace and global skills; custom agents
  need the skill in their `resources` configuration. Kiro also supports
  importing a skill from a public repository URL pointing to the skill
  directory or its `SKILL.md`. Global skill availability differs in cloud
  environments. See the
  [Kiro documentation](https://kiro.dev/docs/skills/) for agent configuration
  and version-specific behavior.
- Cursor's local and cloud agents handle personal skills differently; consult
  the [Cursor documentation](https://cursor.com/docs/skills) before relying on
  a personal installation in the cloud.
- `make help` lists every Make target, option, and example. Help uses colours
  in supported terminals and plain text when redirected; use `COLOR=always` to
  force colours, or `COLOR=never` / `NO_COLOR=1` to disable them.
