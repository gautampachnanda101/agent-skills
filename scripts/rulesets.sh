#!/bin/sh
# Applies the repository rulesets in .github/rulesets/*.json with gh.
# Each file is matched to an existing ruleset by its "name": a match is
# updated in place, otherwise the ruleset is created, so re-running is safe.
# --dry-run prints what would change without calling the API to write.
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
dry_run=0
[ "${1:-}" = --dry-run ] && dry_run=1

existing=$(gh api 'repos/{owner}/{repo}/rulesets' --jq '.[] | "\(.id)\t\(.name)"')

for file in "$root"/.github/rulesets/*.json; do
	name=$(node -e 'process.stdout.write(JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8")).name)' "$file")
	id=$(printf '%s\n' "$existing" | awk -F '\t' -v n="$name" '$2 == n { print $1 }')
	if [ -n "$id" ]; then
		action="update $name (ruleset $id)"
		set -- --method PUT "repos/{owner}/{repo}/rulesets/$id"
	else
		action="create $name"
		set -- --method POST 'repos/{owner}/{repo}/rulesets'
	fi
	if [ "$dry_run" = 1 ]; then
		echo "Would $action from ${file#"$root"/}"
	else
		gh api "$@" --input "$file" --silent
		echo "Applied: $action"
	fi
done
