const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const skill = path.resolve(__dirname, '..');
const repo = path.resolve(skill, '..');
const script = path.join(skill, 'scripts', 'check-techdocs.mjs');
const fixtures = path.join(skill, 'tests', 'fixtures', 'techdocs');

const singleDescriptor = path.join(fixtures, 'single', 'catalog-info.yaml');
const aggregateDescriptor = path.join(fixtures, 'aggregate', 'catalog-info.yaml');
const alphaDescriptor = path.join(fixtures, 'monorepo', 'packages', 'alpha', 'catalog-info.yaml');
const bravoDescriptor = path.join(fixtures, 'monorepo', 'packages', 'bravo', 'catalog-info.yaml');

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' });
}

function copyFixture(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `techdocs-${name}.`));
  fs.cpSync(path.join(fixtures, name), dir, { recursive: true });
  return dir;
}

function withTempSite(name, mappers = {}) {
  const dir = copyFixture(name);
  for (const [file, mapper] of Object.entries(mappers)) {
    const target = path.join(dir, ...file.split('/'));
    fs.writeFileSync(target, mapper(fs.readFileSync(target, 'utf8')));
  }
  return dir;
}

function removeLine(source, needle) {
  return source
    .split('\n')
    .filter(line => !line.includes(needle))
    .join('\n');
}

test('fixtures and the repository itself pass the TechDocs checker', () => {
  const result = run([
    path.join(repo, 'catalog-info.yaml'),
    singleDescriptor,
    alphaDescriptor,
    bravoDescriptor,
    aggregateDescriptor,
  ]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /5 TechDocs reference\(s\)/);
  assert.match(result.stdout, /7 mkdocs site\(s\)/);
  assert.match(result.stdout, /0 error\(s\), 0 warning\(s\)/);
});

test('monorepo per-package sites are validated independently', () => {
  const result = run([alphaDescriptor, bravoDescriptor]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /2 TechDocs reference\(s\)/);
  assert.match(result.stdout, /2 mkdocs site\(s\)/);
});

test('aggregated site validates nav !include package sites', () => {
  const result = run([aggregateDescriptor]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /3 mkdocs site\(s\)/);
});

test('url: references are recorded without local resolution', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'techdocs-url.'));
  const file = path.join(dir, 'catalog-info.yaml');
  fs.writeFileSync(file, `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: remote-docs-entity
  annotations:
    backstage.io/techdocs-ref: url:https://github.com/acme/remote-repo/tree/main/docs
spec:
  type: service
  lifecycle: experimental
  owner: group:default/catalog-test
`);
  try {
    const result = run([file]);
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /1 TechDocs reference\(s\) \(1 remote\)/);
    assert.match(result.stdout, /0 mkdocs site\(s\)/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('dir: targets without mkdocs configuration fail', () => {
  const dir = withTempSite('single');
  fs.renameSync(path.join(dir, 'mkdocs.yml'), path.join(dir, 'not-mkdocs.yml'));
  try {
    const result = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /has no mkdocs\.yml or mkdocs\.yaml/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('missing site_name and missing techdocs-core fail', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'techdocs-broken.'));
  fs.cpSync(path.join(fixtures, 'single'), dir, { recursive: true });
  try {
    const mkdocs = path.join(dir, 'mkdocs.yml');
    fs.writeFileSync(mkdocs, removeLine(fs.readFileSync(mkdocs, 'utf8'), 'site_name:'));
    const nameResult = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(nameResult.status, 1);
    assert.match(nameResult.stdout, /mkdocs site is missing site_name/);

    fs.writeFileSync(mkdocs, removeLine(fs.readFileSync(path.join(fixtures, 'single', 'mkdocs.yml'), 'utf8'), 'techdocs-core'));
    const pluginResult = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(pluginResult.status, 1);
    assert.match(pluginResult.stdout, /missing the techdocs-core plugin/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('site_name mismatch warns and fails under --strict', () => {
  const dir = withTempSite('single', {
    'mkdocs.yml': source => source.replace('site_name: sample-doc-service', "site_name: 'something-else'"),
  });
  try {
    const warning = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(warning.status, 0);
    assert.match(warning.stdout, /does not match the owning entity name 'sample-doc-service'/);
    assert.equal(run(['--strict', path.join(dir, 'catalog-info.yaml')]).status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('nav entries must resolve inside the site docs_dir', () => {
  const dir = withTempSite('single', {
    'mkdocs.yml': source => source.replace('- Usage: usage.md', '- Usage: missing.md'),
  });
  try {
    const result = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /nav page 'missing\.md' does not exist/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('a custom docs_dir is honored when resolving nav entries', () => {
  const dir = withTempSite('single', {
    'mkdocs.yml': source => `${source.replace('nav:', 'docs_dir: content\nnav:')}`,
  });
  fs.mkdirSync(path.join(dir, 'content'));
  fs.renameSync(path.join(dir, 'docs', 'index.md'), path.join(dir, 'content', 'index.md'));
  fs.renameSync(path.join(dir, 'docs', 'usage.md'), path.join(dir, 'content', 'usage.md'));
  fs.rmdirSync(path.join(dir, 'docs'));
  try {
    const result = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(result.status, 0, result.stdout);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('nav !include targets must resolve to mkdocs files', () => {
  const dir = withTempSite('aggregate', {
    'mkdocs.yml': source => source.replace('packages/bravo/mkdocs.yml', 'packages/bravo/mkdocs-missing.yml'),
  });
  try {
    const result = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /nav !include 'packages\/bravo\/mkdocs-missing\.yml' does not resolve to an mkdocs file/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('included sites must carry site_name and a valid nav', () => {
  const dir = withTempSite('aggregate', {
    'packages/bravo/mkdocs.yml': source => removeLine(source, 'site_name:'),
  });
  try {
    const result = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /included mkdocs site is missing site_name/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('dir: reference paths stay relative to each descriptor, with --root override', () => {
  const dir = copyFixture('monorepo');
  const descriptor = path.join(dir, 'packages', 'alpha', 'catalog-info.yaml');
  assert.equal(run([descriptor]).status, 0, 'per-package descriptor resolves beside itself');
  // Without the real tree, the same descriptor found in a temp dir fails.
  const orphan = fs.mkdtempSync(path.join(os.tmpdir(), 'techdocs-orphan.'));
  const flat = path.join(orphan, 'catalog-info.yaml');
  fs.writeFileSync(flat, fs.readFileSync(descriptor, 'utf8'));
  try {
    const result = run([flat]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /resolves to '.*', which is not a directory|has no mkdocs\.yml/);
  } finally {
    fs.rmSync(dir, { recursive: true });
    fs.rmSync(orphan, { recursive: true });
  }
});

test('circular and deep !include chains are reported', () => {
  const dir = withTempSite('aggregate', {
    'packages/alpha/mkdocs.yml': () => 'site_name: alpha-loop\nnav:\n  - Back: !include ../../mkdocs.yml\n',
  });
  try {
    const result = run([path.join(dir, 'catalog-info.yaml')]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /circular include/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('JSON mode reports counts and problems', () => {
  const result = run(['--json', aggregateDescriptor]);
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.references, 1);
  assert.equal(report.sites, 3);
  assert.equal(report.errors, 0);
  assert.deepEqual(report.problems, []);
});

test('usage errors exit with status 2 and unreadable files are reported', () => {
  assert.equal(run([]).status, 2);
  assert.equal(run(['--no-such-option']).status, 2);
  assert.equal(run(['--root']).status, 2);
  const result = run([path.join(os.tmpdir(), 'techdocs-check-missing-descriptor.yaml')]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /cannot read file/);
});
