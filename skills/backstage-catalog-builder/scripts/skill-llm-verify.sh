#!/bin/sh
set -eu

skill_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
skill="${SKILL_DIR:-$skill_dir}"
cache=${LLM_CACHE:-"$(dirname "$skill_dir")/.llm-cache"}
mkdir -p "$cache"

LLAMA_BUILD=${LLAMA_BUILD:-b12681}
default_model_url=https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf
LLM_MODEL_URL=${LLM_MODEL_URL:-$default_model_url}
LLM_ATTEMPTS=${LLM_ATTEMPTS:-3}
LLM_BASELINE=${LLM_BASELINE:-1}
BASELINE_ATTEMPTS=${LLM_BASELINE_ATTEMPTS:-1}
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

# Archives are kept exactly as packaged: llama-server finds its shared
# libraries and ggml backends relative to its own location, so moving files
# around (or dropping the versioned library symlinks) breaks loading.
find_server() {
	find "$1" -name llama-server -type f 2>/dev/null | head -n 1
}

# An executable bit is not enough: run the binary so missing shared libraries
# are caught here rather than at server start.
server_usable() {
	[ -n "$1" ] && [ -x "$1" ] && "$1" --version >/dev/null 2>&1
}

# Each download records the URL it came from, so pointing a variable at another
# build or model is never silently answered from the cache.
came_from() {
	[ "$(cat "$1" 2>/dev/null)" = "$2" ]
}

server_bin=$(find_server "$server_dir")
if came_from "$server_dir/.source" "$llama_url" && server_usable "$server_bin"; then
	echo "Using cached llama.cpp: $server_dir" >&2
else
	echo "Downloading llama.cpp from $llama_url ..." >&2
	# Stage the download so a failure never replaces the existing cache.
	staging="$cache/tool.new"
	rm -rf "$staging"
	mkdir -p "$staging"
	curl -fL --retry 3 --retry-delay 5 "$llama_url" | tar -xzf - -C "$staging"
	server_bin=$(find_server "$staging")
	[ -n "$server_bin" ] || {
		echo "llama-server not found in the archive." >&2
		exit 1
	}
	chmod +x "$server_bin"
	server_usable "$server_bin" || {
		echo "The downloaded llama-server does not run on this machine:" >&2
		"$server_bin" --version >&2 || true
		exit 1
	}
	printf '%s\n' "$llama_url" >"$staging/.source"
	rm -rf "$server_dir"
	mv "$staging" "$server_dir"
	server_bin=$(find_server "$server_dir")
fi

model_file="$cache/model.gguf"
model_source="$model_file.source"
# Caches written before sources were recorded hold the default model.
if [ -f "$model_file" ] && [ ! -f "$model_source" ]; then
	printf '%s\n' "$default_model_url" >"$model_source"
fi
if [ -f "$model_file" ] && came_from "$model_source" "$LLM_MODEL_URL"; then
	echo "Using cached model: $model_file" >&2
else
	echo "Downloading model from $LLM_MODEL_URL ..." >&2
	curl -fL --retry 3 --retry-delay 5 -o "$model_file.part" "$LLM_MODEL_URL"
	mv "$model_file.part" "$model_file"
	printf '%s\n' "$LLM_MODEL_URL" >"$model_source"
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

BASELINE_SYSTEM="You are a helpful coding assistant. Answer with only one fenced yaml block."

# Test cases live in the skill-local evals/evals.json (the format documented at
# agentskills.io/skill-creation/evaluating-skills); these built-in prompts are
# the fallback when that file is absent from older copies.
DESCRIPTOR_PROMPT=$(node -e '
const path = require("node:path"), fs = require("node:fs");
const file = process.argv[1];
try {
  const evals = JSON.parse(fs.readFileSync(file, "utf8")).evals;
  process.stdout.write(evals.find(e => e.id === 1).prompt);
} catch {
  fs.createReadStream("/dev/null").pipe(process.stdout);
}
' "$skill/evals/evals.json")
[ -n "$DESCRIPTOR_PROMPT" ] || DESCRIPTOR_PROMPT='Create the catalog descriptor for this repository:

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

MKDOCS_PROMPT=$(node -e '
const fs = require("node:fs");
const file = process.argv[1];
try {
  const evals = JSON.parse(fs.readFileSync(file, "utf8")).evals;
  process.stdout.write(evals.find(e => e.id === 2).prompt);
} catch {
  fs.createReadStream("/dev/null").pipe(process.stdout);
}
' "$skill/evals/evals.json")
[ -n "$MKDOCS_PROMPT" ] || MKDOCS_PROMPT='Generate the mkdocs.yml for this documented repository:

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
	cp "$skill/tests/fixtures/techdocs/single/docs/index.md" \
		"$skill/tests/fixtures/techdocs/single/docs/usage.md" "$site_dir/docs/"
	sed 's/sample-doc-service/inventory-notifier/g' \
		"$skill/tests/fixtures/techdocs/single/catalog-info.yaml" >"$site_dir/catalog-info.yaml"
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

results_file="$cache/eval-results.ndjson"
: >"$results_file"
export RESULTS_FILE="$results_file"

# Appends one attempt result as JSON; tokens and duration come from the run.
record() {
	node -e '
const fs = require("node:fs");
fs.appendFileSync(process.env.RESULTS_FILE, JSON.stringify({
  eval: process.argv[1], config: process.argv[2], passed: process.argv[3] === "true",
  attempts: Number(process.argv[4]), tokens: Number(process.argv[5]), duration_ms: Number(process.argv[6]),
}) + "\n");
' "$1" "$2" "$3" "$4" "$5" "$6"
}

now_ms() {
	node -e 'process.stdout.write(String(Date.now()))'
}

run_scenario() {
	key=$1
	system=$2
	prompt=$3
	config=$4
	attempts=$5
	attempt=1
	while [ "$attempt" -le "$attempts" ]; do
		temp=0
		seed=0
		if [ "$attempt" -gt 1 ]; then
			temp=0.7
			seed=$attempt
		fi
		echo "[$config:$key] Attempt $attempt/$attempts (temperature $temp, seed $seed) ..." >&2

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
' "$cache/payload-$key-$config.json"

		start_ms=$(now_ms)
		if ! curl -sS -m 240 -X POST \
			-H 'Content-Type: application/json' \
			--data-binary @"$cache/payload-$key-$config.json" \
			"http://127.0.0.1:$port/v1/chat/completions" -o "$cache/response-$key-$config.json"; then
			echo "Completion request failed; server log tail:" >&2
			tail -n 20 "$cache/server.log" >&2
			attempt=$((attempt + 1))
			continue
		fi

		tokens=$(node -e 'let u=0;try{const r=JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8"));u=(r.usage&&r.usage.total_tokens)||0}catch{}process.stdout.write(String(u))' "$cache/response-$key-$config.json" 2>/dev/null || echo 0)
		[ -n "$tokens" ] || tokens=0

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
' <"$cache/response-$key-$config.json" >"$cache/candidate-$key-$config.yaml"; then
			echo "Extraction failed; see response at $cache/response-$key-$config.json" >&2
			attempt=$((attempt + 1))
			continue
		fi
		duration_ms=$(($(now_ms) - start_ms))

		# Snapshot the candidate first: some validators consume it (the
		# mkdocs validator moves it into the assembled site directory).
		cp "$cache/candidate-$key-$config.yaml" "$cache/result-$key-$config.yaml"
		if "validate_$key" "$cache/candidate-$key-$config.yaml"; then
			case "$key" in
			descriptor) outcome="generated descriptor passed structural checks" ;;
			mkdocs) outcome="generated MkDocs site passed structural checks" ;;
			*) outcome="output passed structural checks" ;;
			esac
			echo "PASS [$config:$key]: $outcome." >&2
			if [ "$config" = "with_skill" ]; then
				printf 'File for %s scenario:\n%s\n' "$key" "$(cat "$cache/result-$key-$config.yaml")"
			fi
			record "$key" "$config" true "$attempt" "$tokens" "$duration_ms"
			return 0
		fi

		echo "[$config:$key] Attempt $attempt failed; checker findings:" >&2
		cat "$cache/checker-$key.log" 2>/dev/null || true
		attempt=$((attempt + 1))
		sleep 2
	done

	echo "FAIL [$config:$key]: no valid output in $attempts attempts." >&2
	record "$key" "$config" false "$attempts" "$tokens" "$duration_ms"
	return 1
}

run_scenario descriptor "$LLM_SYSTEM" "$DESCRIPTOR_PROMPT" with_skill "$LLM_ATTEMPTS" || exit 1
run_scenario mkdocs "$LLM_SYSTEM_TECHDOCS" "$MKDOCS_PROMPT" with_skill "$LLM_ATTEMPTS" || exit 1

# Without-skill baseline: the same prompts with no skill instructions. The
# delta against this configuration shows what the skill actually adds; a
# baseline failure is a result, not a blocking error.
if [ "$LLM_BASELINE" = 1 ]; then
	run_scenario descriptor "$BASELINE_SYSTEM" "$DESCRIPTOR_PROMPT" without_skill "$BASELINE_ATTEMPTS" || true
	run_scenario mkdocs "$BASELINE_SYSTEM" "$MKDOCS_PROMPT" without_skill "$BASELINE_ATTEMPTS" || true
fi

node -e '
const fs = require("node:fs");
const lines = fs.readFileSync(process.argv[1], "utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const best = new Map();
for (const rec of lines) {
  const key = rec.config + ":" + rec.eval;
  if (!best.has(key) || rec.passed) best.set(key, rec);
}
const summary = {};
for (const config of ["with_skill", "without_skill"]) {
  const recs = [...best.values()].filter(rec => rec.config === config);
  if (!recs.length) continue;
  const passed = recs.filter(rec => rec.passed).length;
  const mean = field => Math.round(recs.reduce((sum, rec) => sum + rec[field], 0) / recs.length);
  summary[config] = {
    evals_passed: passed,
    evals_total: recs.length,
    pass_rate: passed / recs.length,
    tokens_mean: mean("tokens"),
    time_seconds_mean: mean("duration_ms") / 1000,
  };
}
let delta = null;
if (summary.with_skill && summary.without_skill) {
  delta = { pass_rate: summary.with_skill.pass_rate - summary.without_skill.pass_rate };
}
fs.writeFileSync(process.argv[2], JSON.stringify({ run_summary: summary, ...(delta ? { delta } : {}) }, null, 2) + "\n");
' "$results_file" "$cache/benchmark.json"

echo "Eval benchmark: $cache/benchmark.json" >&2
echo "PASS: the model applied the skill in every scenario." >&2
exit 0
