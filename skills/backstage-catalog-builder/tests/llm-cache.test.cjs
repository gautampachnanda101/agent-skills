const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'skill-llm-verify.sh');

// Stands in for llama-server: like the real binary it needs a versioned
// library symlink at a path relative to itself. It answers --version and then
// refuses to serve, so the script stops right after the cache step.
function fakeServer(libDir) {
  return `#!/bin/sh
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
[ -f "$here/${libDir}/libllama.1.dylib" ] || { echo "Library not loaded" >&2; exit 134; }
[ "$1" = --version ] && exit 0
echo "fake server started" >&2
exit 1
`;
}

function writeBuild(root, binDir, libDir) {
  const bin = path.join(root, binDir);
  const lib = path.join(bin, libDir);
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(lib, { recursive: true });
  fs.writeFileSync(path.join(bin, 'llama-server'), fakeServer(libDir), { mode: 0o755 });
  fs.writeFileSync(path.join(lib, 'libllama.1.0.0.dylib'), '');
  fs.symlinkSync('libllama.1.0.0.dylib', path.join(lib, 'libllama.1.dylib'));
}

function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-cache-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const cache = path.join(dir, 'cache');
  fs.mkdirSync(cache);
  fs.writeFileSync(path.join(cache, 'model.gguf'), '');
  return { dir, cache };
}

function archive(dir, binDir, libDir) {
  const build = path.join(dir, 'build');
  writeBuild(path.join(build, 'llama-test'), binDir, libDir);
  const file = path.join(dir, 'llama.tar.gz');
  const result = spawnSync('tar', ['-czf', file, '-C', build, 'llama-test']);
  assert.equal(result.status, 0, String(result.stderr));
  return file;
}

function run(cache, archiveFile) {
  const result = spawnSync('sh', [script], {
    encoding: 'utf8',
    env: { ...process.env, LLM_CACHE: cache, LLAMA_CPP_URL: pathToFileURL(archiveFile).href },
  });
  assert.equal(result.error, undefined);
  return result.stderr;
}

const layouts = [
  ['flat release archive', '.', '.'],
  ['bin/ and lib/ archive', 'bin', '../lib'],
];

for (const [name, binDir, libDir] of layouts) {
  test(`unpacks a ${name} and starts its server`, t => {
    const { dir, cache } = setup(t);
    const stderr = run(cache, archive(dir, binDir, libDir));
    assert.match(stderr, /Downloading llama\.cpp/);
    assert.match(stderr, /fake server started/);
    assert.equal(fs.existsSync(path.join(cache, 'tool.new')), false);
  });
}

test('reuses a cached build that runs', t => {
  const { dir, cache } = setup(t);
  writeBuild(path.join(cache, 'tool'), '.', '.');
  const stderr = run(cache, path.join(dir, 'missing.tar.gz'));
  assert.match(stderr, /Using cached llama\.cpp/);
  assert.match(stderr, /fake server started/);
});

test('replaces a cached build that cannot load its libraries', t => {
  const { dir, cache } = setup(t);
  writeBuild(path.join(cache, 'tool'), '.', '.');
  fs.rmSync(path.join(cache, 'tool', 'libllama.1.dylib'));
  const stderr = run(cache, archive(dir, '.', '.'));
  assert.match(stderr, /Downloading llama\.cpp/);
  assert.match(stderr, /fake server started/);
});

test('a failed replacement keeps the existing cache', t => {
  const { dir, cache } = setup(t);
  writeBuild(path.join(cache, 'tool'), '.', '.');
  fs.rmSync(path.join(cache, 'tool', 'libllama.1.dylib'));
  const stderr = run(cache, path.join(dir, 'missing.tar.gz'));
  assert.doesNotMatch(stderr, /fake server started/);
  assert.equal(fs.existsSync(path.join(cache, 'tool', 'llama-server')), true);
});
