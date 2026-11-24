#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
skill="${SKILL_DIR:-$root/backstage-catalog-builder}"
cache=${LLM_CACHE:-"$root/.llm-cache"}
mkdir -p "$cache"

LLAMA_BUILD=${LLAMA_BUILD:-b12681}
LLM_MODEL_URL=${LLM_MODEL_URL:-https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf}
LLM_ATTEMPTS=${LLM_ATTEMPTS:-3}
LLM_CTX=${LLM_CTX:-6144}
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
LLM_USER='Create the catalog descriptor for this repository:

- Repository: acme/ledger-sync (https://github.com/acme/ledger-sync)
- Evidence found in the source: a Python FastAPI HTTP service that reads files
  from one storage bucket and writes JSON lines to another; it is deployed to
  production; the project documentation assigns ownership to the platform-team
  group.
- The repository contains no API specification files.

Apply the descriptor rules the skill defines and answer with only one fenced
yaml block containing the final catalog-info.yaml.'

attempt=1
while [ "$attempt" -le "$LLM_ATTEMPTS" ]; do
	temp=0
	seed=0
	if [ "$attempt" -gt 1 ]; then
		temp=0.7
		seed=$attempt
	fi
	echo "Attempt $attempt/$LLM_ATTEMPTS (temperature $temp, seed $seed) ..." >&2

	LLM_SYSTEM="$LLM_SYSTEM" LLM_USER="$LLM_USER" \
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
' "$cache/payload.json"

	if ! curl -sS -m 240 -X POST \
		-H 'Content-Type: application/json' \
		--data-binary @"$cache/payload.json" \
		"http://127.0.0.1:$port/v1/chat/completions" -o "$cache/response.json"; then
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
' <"$cache/response.json" >"$cache/candidate.yaml"; then
		echo "Extraction failed; see response at $cache/response.json" >&2
		attempt=$((attempt + 1))
		continue
	fi

	checker="$skill/scripts/check-descriptors.mjs"
	if node "$checker" "$cache/candidate.yaml" >"$cache/checker.log" 2>&1 &&
		grep -Fq 'name: ledger-sync' "$cache/candidate.yaml" &&
		grep -Fq 'type: service' "$cache/candidate.yaml" &&
		grep -Fq 'lifecycle: production' "$cache/candidate.yaml" &&
		grep -Fq 'platform-team' "$cache/candidate.yaml"; then
		echo "PASS: the model applied the skill; the descriptor passed structural checks." >&2
		printf 'Generated descriptor:\n%s\n' "$(cat "$cache/candidate.yaml")"
		exit 0
	fi

	echo "Attempt $attempt failed; checker findings:" >&2
	cat "$cache/checker.log" >&2
	attempt=$((attempt + 1))
	sleep 2
done

echo "FAIL: the model did not produce a valid descriptor in $LLM_ATTEMPTS attempts." >&2
echo "Checker: $cache/checker.log; candidate: $cache/candidate.yaml; response: $cache/response.json; server: $cache/server.log" >&2
exit 1
