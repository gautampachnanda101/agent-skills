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

function archive(dir, binDir, libDir, omit) {
  const build = path.join(dir, 'build');
  writeBuild(path.join(build, 'llama-test'), binDir, libDir);
  if (omit) fs.rmSync(path.join(build, 'llama-test', omit));
  const file = path.join(dir, 'llama.tar.gz');
  const result = spawnSync('tar', ['-czf', file, '-C', build, 'llama-test']);
  assert.equal(result.status, 0, String(result.stderr));
  return file;
}

// Ambient LLM_*/LLAMA_* settings must not change what the tests exercise.
const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^(LLM_|LLAMA_|SKILL_DIR$)/.test(name)),
);

function run(cache, archiveFile, env = {}) {
  const result = spawnSync('sh', [script], {
    encoding: 'utf8',
    timeout: 60_000,
    env: { ...cleanEnv, LLM_CACHE: cache, LLAMA_CPP_URL: pathToFileURL(archiveFile).href, ...env },
  });
  assert.equal(result.error, undefined);
  return result.stderr;
}

// A cached build as the script leaves it: the files plus where they came from.
function writeCache(cache, archiveFile) {
  writeBuild(path.join(cache, 'tool'), '.', '.');
  fs.writeFileSync(path.join(cache, 'tool', '.source'), `${pathToFileURL(archiveFile).href}\n`);
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
  const missing = path.join(dir, 'missing.tar.gz');
  writeCache(cache, missing);
  const stderr = run(cache, missing);
  assert.match(stderr, /Using cached llama\.cpp/);
  assert.match(stderr, /fake server started/);
});

test('a second run reuses what the first run downloaded', t => {
  const { dir, cache } = setup(t);
  const file = archive(dir, '.', '.');
  run(cache, file);
  assert.match(run(cache, file), /Using cached llama\.cpp/);
});

test('replaces a cached build that came from another URL', t => {
  const { dir, cache } = setup(t);
  writeCache(cache, path.join(dir, 'other.tar.gz'));
  assert.match(run(cache, archive(dir, '.', '.')), /Downloading llama\.cpp/);
});

test('replaces a cached build of unknown origin', t => {
  const { dir, cache } = setup(t);
  writeBuild(path.join(cache, 'tool'), '.', '.');
  assert.match(run(cache, archive(dir, '.', '.')), /Downloading llama\.cpp/);
});

test('replaces a cached build that cannot load its libraries', t => {
  const { dir, cache } = setup(t);
  const file = archive(dir, '.', '.');
  writeCache(cache, file);
  fs.rmSync(path.join(cache, 'tool', 'libllama.1.dylib'));
  const stderr = run(cache, file);
  assert.match(stderr, /Downloading llama\.cpp/);
  assert.match(stderr, /fake server started/);
});

test('a failed replacement keeps the existing cache', t => {
  const { dir, cache } = setup(t);
  writeCache(cache, path.join(dir, 'other.tar.gz'));
  const stderr = run(cache, path.join(dir, 'missing.tar.gz'));
  assert.doesNotMatch(stderr, /fake server started/);
  assert.equal(fs.existsSync(path.join(cache, 'tool', 'llama-server')), true);
});

test('rejects a downloaded build that does not run and keeps the cache', t => {
  const { dir, cache } = setup(t);
  writeCache(cache, path.join(dir, 'other.tar.gz'));
  const stderr = run(cache, archive(dir, '.', '.', 'libllama.1.dylib'));
  assert.match(stderr, /does not run on this machine/);
  assert.match(stderr, /Library not loaded/);
  assert.equal(fs.existsSync(path.join(cache, 'tool', 'llama-server')), true);
});

test('rejects an archive without llama-server and keeps the cache', t => {
  const { dir, cache } = setup(t);
  writeCache(cache, path.join(dir, 'other.tar.gz'));
  const stderr = run(cache, archive(dir, '.', '.', 'llama-server'));
  assert.match(stderr, /llama-server not found in the archive/);
  assert.equal(fs.existsSync(path.join(cache, 'tool', 'llama-server')), true);
});

test('LLM_MODEL_URL replaces a model that came from another URL', t => {
  const { dir, cache } = setup(t);
  const file = archive(dir, '.', '.');
  const model = path.join(dir, 'other.gguf');
  fs.writeFileSync(model, 'other model');
  const env = { LLM_MODEL_URL: pathToFileURL(model).href };
  assert.match(run(cache, file, env), /Downloading model/);
  assert.equal(fs.readFileSync(path.join(cache, 'model.gguf'), 'utf8'), 'other model');
  assert.match(run(cache, file, env), /Using cached model/);
});

test('a failed model download keeps the existing model', t => {
  const { dir, cache } = setup(t);
  fs.writeFileSync(path.join(cache, 'model.gguf'), 'kept');
  run(cache, archive(dir, '.', '.'), { LLM_MODEL_URL: pathToFileURL(path.join(dir, 'none.gguf')).href });
  assert.equal(fs.readFileSync(path.join(cache, 'model.gguf'), 'utf8'), 'kept');
});
