#!/bin/sh
set -eu

if [ -z "${HOME:-}" ]; then
	echo "HOME must not be empty for global installation." >&2
	exit 1
fi

# Shared global directory supported by Copilot, Codex, OpenCode, Gemini,
# Cursor, and Windsurf; also the fallback when no assistant is detected.
destinations="$HOME/.agents/skills"

if [ -d "$HOME/.kiro" ] || [ -d /Applications/Kiro.app ] ||
	[ -d "$HOME/Applications/Kiro.app" ] ||
	command -v kiro >/dev/null 2>&1 || command -v kiro-cli >/dev/null 2>&1; then
	destinations="$destinations:$HOME/.kiro/skills"
fi

if [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1; then
	destinations="$destinations:$HOME/.claude/skills"
fi

cline=0
if [ -d "$HOME/.cline" ] || command -v cline >/dev/null 2>&1; then
	cline=1
fi
for extensions in "$HOME/.vscode/extensions" "$HOME/.vscode-insiders/extensions" \
	"$HOME/.cursor/extensions" "$HOME/.windsurf/extensions"; do
	for extension in "$extensions"/saoudrizwan.claude-dev-*; do
		[ ! -d "$extension" ] || cline=1
	done
done
if [ "$cline" -eq 1 ]; then
	destinations="$destinations:$HOME/.cline/skills"
fi

printf '%s\n' "$destinations"
