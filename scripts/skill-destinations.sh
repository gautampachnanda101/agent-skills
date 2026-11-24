#!/bin/sh
set -eu

if [ -z "${HOME:-}" ]; then
	echo "HOME must not be empty for global installation." >&2
	exit 1
fi

# One canonical personal directory per supported assistant, as a single
# colon-separated line. The shared directory serves Copilot (VS Code and
# CLI), OpenCode, Codex, Gemini CLI, Cursor, and Windsurf; the other paths
# are tool-exclusive.
destinations="$HOME/.agents/skills"
destinations="$destinations:$HOME/.kiro/skills"
destinations="$destinations:$HOME/.claude/skills"
destinations="$destinations:$HOME/.cline/skills"
printf '%s\n' "$destinations"
