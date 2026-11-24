#!/bin/sh
# Prints the bin directory of a Node.js version supported by Backstage
# (24.15+ or 26.13+), installing one with nvm or asdf when needed.
# Progress messages go to stderr so stdout is only the directory.
set -eu

want="${BACKSTAGE_NODE_VERSION:-24}"

supported() {
	"$1" -e 'const [a, b] = process.versions.node.split(".").map(Number);
process.exit((a === 24 && b >= 15) || (a === 26 && b >= 13) || a > 26 ? 0 : 1)' 2>/dev/null
}

current=$(command -v node 2>/dev/null || true)
if [ -n "$current" ] && supported "$current"; then
	dirname "$current"
	exit 0
fi
[ -n "$current" ] && echo "Node $("$current" -v) is not supported by Backstage; looking for nvm or asdf." >&2

nvm_dir="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$nvm_dir/nvm.sh" ]; then
	set +u
	# shellcheck disable=SC1091
	. "$nvm_dir/nvm.sh" --no-use
	if ! nvm which "$want" >/dev/null 2>&1; then
		echo "Installing Node $want with nvm..." >&2
		nvm install "$want" >&2
	fi
	node_path=$(nvm which "$want")
	set -u
	if supported "$node_path"; then
		dirname "$node_path"
		exit 0
	fi
	echo "nvm Node $("$node_path" -v) is too old; run: nvm install $want" >&2
fi

if command -v asdf >/dev/null 2>&1; then
	asdf plugin list 2>/dev/null | grep -qx nodejs || asdf plugin add nodejs >&2
	version=$(asdf latest nodejs "$want")
	if ! asdf where nodejs "$version" >/dev/null 2>&1; then
		echo "Installing Node $version with asdf..." >&2
		asdf install nodejs "$version" >&2
	fi
	node_path="$(asdf where nodejs "$version")/bin/node"
	if supported "$node_path"; then
		dirname "$node_path"
		exit 0
	fi
fi

echo "No supported Node.js found. Install Node 24.15+ or 26.13+ (for example 'nvm install 24' or 'asdf install nodejs latest:24')." >&2
exit 1
