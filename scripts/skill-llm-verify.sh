#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
skill="${SKILL_DIR:-$root/backstage-catalog-builder}"
cache=${LLM_CACHE:-"$root/.llm-cache"}
mkdir -p "$cache"

LLAMA_BUILD=${LLAMA_BUILD:-b12681}
LLM_MODEL_URL=${LLM_MODEL_URL:-https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf}
LLM_ATTEMPTS=${LLM_ATTEMPTS:-3}
LLM_CTX=${LLM_CTX:-8192}
LLM_MAX_TOKENS=${LLM_MAX_TOKENS:-300}
LLM_PORT=${LLM_PORT:-8751}

case "$(uname -s):$(uname -m)" in
Linux:x86_64) llama_asset="llama-$LLAMA_BUILD-bin-ubuntu-x64.tar.gz" ;;
Linux:aarch64) llama_asset="llama-$LLAMA_BUILD-bin-ubuntu-arm64.tar.gz" ;;
Linux:arm64) llama_asset="llama-$LLAMA_BUILD-bin-ubuntu-arm64.tar.gz" ;;
Darwin:arm64) llama_asset="llama-$LLAMA_BUILD-bin-macos-arm64.tar.gz" ;;
Darwin:x86_64) llama_asset="llama-$LLAMA_BUILD-bin-macos-x64.tar.gz" ;;
*)
	echo "Unsupported platform for llama.cpp binaries: $(uname -s):$(uname -m); set LLAMA_CPP_URL." >&2
	exit 2
	;;
esac
llama_url=${LLAMA_CPP_URL:-"https://github.com/ggml-org/llama.cpp/releases/download/$LLAMA_BUILD/$llama_asset"}

server_dir="$cache/tool"
server_bin="$server_dir/llama-server"
if [ ! -x "$server_bin" ]; then
	echo "Downloading llama.cpp from $llama_url ..." >&2
	rm -rf "$server_dir"
	mkdir -p "$cache"
	curl -fL --retry 3 --retry-delay 5 "$llama_url" | tar -xzf - -C "$cache"
	found=$(find "$cache" -maxdepth 3 -name llama-server -type f | grep -v "^\." | head -n 1)
	[ -n "$found" ] || {
		echo "llama-server not found in the archive." >&2
		exit 1
	}
	mkdir -p "$server_dir"
	mv "$(dirname "$found")"/* "$server_dir/"
	chmod +x "$server_bin"
else
	echo "Using cached llama.cpp: $server_dir" >&2
fi

model_file="$cache/model.gguf"
if [ ! -f "$model_file" ]; then
	echo "Downloading model from $LLM_MODEL_URL ..." >&2
	curl -fL --retry 3 --retry-delay 5 -o "$model_file" "$LLM_MODEL_URL"
else
	echo "Using cached model: $model_file" >&2
fi

port=$(node -e '
const net = require("node:net");
const base = Number(process.argv[1]);
const s = net.createServer();
s.once("error", () => process.exit(1));
s.listen(base, "127.0.0.1", () => { s.close(() => process.exit(0)); });
' "$LLM_PORT" 2>/dev/null && echo "$LLM_PORT") || port=$((LLM_PORT + 1))
[ -n "$port" ] || port=$((LLM_PORT + 1))

echo "Starting llama-server on port $port ..." >&2
"$server_bin" -m "$model_file" -c "$LLM_CTX" --threads -1 \
	--host 127.0.0.1 --port "$port" >"$cache/server.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
trap 'kill "$server_pid" 2>/dev/null || true' INT TERM

ready=0
i=0
while [ "$i" -lt 120 ]; do
	if kill -0 "$server_pid" 2>/dev/null; then
		if curl -sf "http://127.0.0.1:$port/health" >/dev/null 2>&1; then
			ready=1
			break
		fi
	else
		break
	fi
	i=$((i + 1))
	sleep 1
done
if [ "$ready" -ne 1 ]; then
	echo "llama-server failed to become healthy; log tail:" >&2
	tail -n 20 "$cache/server.log" >&2
	exit 1
fi

LLM_SYSTEM=$(cat "$skill/SKILL.md")

# The authentic workflow loads the TechDocs guide from SKILL.md before
# documentation work; the mkdocs scenario applies that combined instruction set.
LLM_SYSTEM_TECHDOCS="$LLM_SYSTEM

$(cat "$skill/techdocs-mkdocs.md")"

DESCRIPTOR_PROMPT='Create the catalog descriptor for this repository:

- Repository: acme/ledger-sync (https://github.com/acme/ledger-sync)
- Evidence found in the source: a Python FastAPI HTTP service that reads files
  from one storage bucket and writes JSON lines to another; it is deployed to
  production; the project documentation assigns ownership to the platform-team
  group.
- The repository contains no API specification files.

The entity must be named ledger-sync with type service, lifecycle production,
and owner referencing the platform-team group. Ground every field in the
evidence only; omit any field the evidence does not support (no system, tags,
links, or dependencies). Answer with only one fenced yaml block containing the
final catalog-info.yaml.'

MKDOCS_PROMPT='Generate the mkdocs.yml for this documented repository:

- Entity name: inventory-notifier (the mkdocs site_name must be exactly this).
- The docs/ directory contains these pages: index.md, usage.md.
- TechDocs builds this site, so plugins must include techdocs-core.
- Set repo_url to https://github.com/acme/inventory-notifier.

Answer with only one fenced yaml block containing the final mkdocs.yml.'

validate_descriptor() {
	candidate=$1
	checker="$skill/scripts/check-descriptors.mjs"
	{ node "$checker" "$candidate" 2>&1; } >"$cache/checker-descriptor.log" || return 1
	grep -Fq 'name: ledger-sync' "$candidate" &&
		grep -Fq 'type: service' "$candidate" &&
		grep -Fq 'lifecycle: production' "$candidate" &&
		grep -Fq 'platform-team' "$candidate"
}

# Validates the model-generated mkdocs.yml by placing the real skill fixture
# entity and documentation pages beside it, then running both bundled checkers:
# the generated site must carry the techdocs-core plugin, match the entity
# name, and resolve every nav entry against the actual docs/ tree.
validate_mkdocs() {
	generated=$1
	site_dir="$cache/mkdocs-scenario-site"
	rm -rf "$site_dir"
	mkdir -p "$site_dir/docs"
	cp "$root/tests/fixtures/techdocs/single/docs/index.md" \
		"$root/tests/fixtures/techdocs/single/docs/usage.md" "$site_dir/docs/"
	sed 's/sample-doc-service/inventory-notifier/g' \
		"$root/tests/fixtures/techdocs/single/catalog-info.yaml" >"$site_dir/catalog-info.yaml"
	mv "$generated" "$site_dir/mkdocs.yml"
	{
		echo '--- check-descriptors ---'
		node "$skill/scripts/check-descriptors.mjs" "$site_dir/catalog-info.yaml"
		echo '--- check-techdocs ---'
		node "$skill/scripts/check-techdocs.mjs" "$site_dir/catalog-info.yaml"
	} >"$cache/checker-mkdocs.log" || return 1
	grep -Fq 'techdocs-core' "$site_dir/mkdocs.yml" ||
		{
			echo "missing techdocs-core plugin" >&2
			return 1
		}
	grep -Fq 'site_name: inventory-notifier' "$site_dir/mkdocs.yml" ||
		{
			echo "site_name does not match the entity" >&2
			return 1
		}
}

run_scenario() {
	key=$1
	system=$2
	prompt=$3
	attempt=1
	while [ "$attempt" -le "$LLM_ATTEMPTS" ]; do
		temp=0
		seed=0
		if [ "$attempt" -gt 1 ]; then
			temp=0.7
			seed=$attempt
		fi
		echo "[$key] Attempt $attempt/$LLM_ATTEMPTS (temperature $temp, seed $seed) ..." >&2

		LLM_SYSTEM="$system" LLM_USER="$prompt" \
			LLM_TEMP="$temp" LLM_SEED="$seed" LLM_MAX_TOKENS="$LLM_MAX_TOKENS" \
			node -e '
const fs = require("node:fs");
const payload = {
  messages: [
    { role: "system", content: process.env.LLM_SYSTEM },
    { role: "user", content: process.env.LLM_USER },
  ],
  temperature: Number(process.env.LLM_TEMP),
  max_tokens: Number(process.env.LLM_MAX_TOKENS),
};
if (Number(process.env.LLM_SEED) > 0) payload.seed = Number(process.env.LLM_SEED);
fs.writeFileSync(process.argv[1], JSON.stringify(payload));
' "$cache/payload-$key.json"

		if ! curl -sS -m 240 -X POST \
			-H 'Content-Type: application/json' \
			--data-binary @"$cache/payload-$key.json" \
			"http://127.0.0.1:$port/v1/chat/completions" -o "$cache/response-$key.json"; then
			echo "Completion request failed; server log tail:" >&2
			tail -n 20 "$cache/server.log" >&2
			attempt=$((attempt + 1))
			continue
		fi

		if ! node -e '
const chunks = [];
process.stdin.on("data", c => chunks.push(c));
process.stdin.on("end", () => {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    console.error("Response was not JSON.");
    process.exit(3);
  }
  const message = parsed.choices && parsed.choices[0] && parsed.choices[0].message;
  const content = (message && typeof message.content === "string") ? message.content : "";
  if (!content.trim()) {
    console.error("Completion was empty.");
    process.exit(3);
  }
  const fence = content.match(/```(?:yaml|yml)?[^\n]*\n([\s\S]*?)```/);
  const yaml = (fence ? fence[1] : content).trim();
  process.stdout.write(yaml + "\n");
});
' <"$cache/response-$key.json" >"$cache/candidate-$key.yaml"; then
			echo "Extraction failed; see response at $cache/response-$key.json" >&2
			attempt=$((attempt + 1))
			continue
		fi

		# Snapshot the candidate first: some validators consume it (the
		# mkdocs validator moves it into the assembled site directory).
		cp "$cache/candidate-$key.yaml" "$cache/result-$key.yaml"
		if "validate_$key" "$cache/candidate-$key.yaml"; then
			case "$key" in
			descriptor) outcome="generated descriptor passed structural checks" ;;
			mkdocs) outcome="generated MkDocs site passed structural checks" ;;
			*) outcome="output passed structural checks" ;;
			esac
			echo "PASS [$key]: the model applied the skill; $outcome." >&2
			printf 'File for %s scenario:\n%s\n' "$key" "$(cat "$cache/result-$key.yaml")"
			return 0
		fi

		echo "[$key] Attempt $attempt failed; checker findings:" >&2
		cat "$cache/checker-$key.log" 2>/dev/null || true
		attempt=$((attempt + 1))
		sleep 2
	done

	echo "FAIL [$key]: the model did not produce a valid descriptor in $LLM_ATTEMPTS attempts." >&2
	return 1
}

run_scenario descriptor "$LLM_SYSTEM" "$DESCRIPTOR_PROMPT" || exit 1
run_scenario mkdocs "$LLM_SYSTEM_TECHDOCS" "$MKDOCS_PROMPT" || exit 1

echo "PASS: the model applied the skill in every scenario." >&2
exit 0
