const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const skill = path.resolve(__dirname, '..');
const repo = path.resolve(skill, '../..');
const script = path.join(skill, 'scripts', 'check-descriptors.mjs');
const fixtures = path.join(skill, 'tests', 'fixtures', 'descriptors');

const validComponent = `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: sample-note-service
spec:
  type: service
  lifecycle: experimental
  owner: group:default/catalog-test
`;
const apiWithPlaceholder = `
---
apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: sample-note-api
spec:
  type: openapi
  lifecycle: experimental
  owner: group:default/catalog-test
  definition:
    $text: ./openapi.yaml
`;

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' });
}

function withTempDir(contents, name = 'catalog.yaml') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descriptor-check.'));
  const file = path.join(dir, name);
  if (contents !== undefined) fs.writeFileSync(file, contents);
  return { dir, file };
}

test('shipped fixtures and repository descriptors pass the checker', () => {
  const result = run([
    path.join(fixtures, 'catalog-valid.yaml'),
    path.join(skill, 'tests/fixtures/backstage-instance/catalog-info.yaml'),
    path.join(repo, 'catalog-info.yaml'),
  ]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /4 document\(s\)/);
});

test('duplicate identities are reported across documents and files', () => {
  const first = withTempDir(`${validComponent}\n---\n${validComponent}`);
  const second = withTempDir(validComponent);
  try {
    const result = run([first.file, second.file]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /duplicate entity identity Component:default:sample-note-service/);
    assert.match(result.stdout, /first defined in /);
  } finally {
    fs.rmSync(first.dir, { recursive: true });
    fs.rmSync(second.dir, { recursive: true });
  }
});

test('missing required spec fields fail per kind', () => {
  for (const kind of ['Component', 'API', 'System', 'Location']) {
    const { dir, file } = withTempDir(validComponent.replace('kind: Component', `kind: ${kind}`).replace(/spec:.*$/s, 'spec:\n  type: service\n'));
    try {
      const result = run([file]);
      assert.equal(result.status, 1, `${kind} should fail: ${result.stdout}`);
      assert.match(result.stdout, new RegExp(`${kind} requires spec\\.`), `${kind}: ${result.stdout}`);
    } finally {
      fs.rmSync(dir, { recursive: true });
    }
  }
});

test('missing API definition placeholder target fails', () => {
  const { dir, file } = withTempDir(validComponent + apiWithPlaceholder.replace('openapi.yaml', 'ghost.yaml'));
  try {
    const result = run([file]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\$text '\.\/ghost\.yaml' does not exist/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('Location targets and placeholders resolve relative to each descriptor or --root', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'descriptor-loc.'));
  t.after(() => fs.rmSync(dir, { recursive: true }));

  const locationFile = path.join(dir, 'locations.yaml');
  fs.writeFileSync(
    locationFile,
    'apiVersion: backstage.io/v1alpha1\nkind: Location\nmetadata:\n  name: sample-loc\nspec:\n  targets:\n    - ./real.yaml\n',
  );
  const missing = run([locationFile]);
  assert.equal(missing.status, 1);
  assert.match(missing.stdout, /Location target '\.\/real\.yaml' does not exist/);
  fs.writeFileSync(path.join(dir, 'real.yaml'), validComponent);
  assert.equal(run([locationFile]).status, 0);

  const nested = path.join(dir, 'nested');
  fs.mkdirSync(nested);
  const nestedFile = path.join(nested, 'catalog.yaml');
  fs.writeFileSync(nestedFile, fs.readFileSync(path.join(fixtures, 'catalog-valid.yaml'), 'utf8'));
  const unresolved = run([nestedFile]);
  assert.equal(unresolved.status, 1);
  assert.match(unresolved.stdout, /\$text '\.\/openapi\.yaml' does not exist/);
  assert.equal(run([nestedFile, '--root', fixtures]).status, 0);
});

test('tab indentation, invalid names, wrong apiVersion and duplicate keys fail', () => {
  const { dir: tabDir, file: tabbed } = withTempDir(validComponent.replace('  type: service', '\ttype: service'));
  try {
    const result = run([tabbed]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /tab character in indentation/);
  } finally {
    fs.rmSync(tabDir, { recursive: true });
  }

  const { dir: nameDir, file: badName } = withTempDir(validComponent.replace('sample-note-service', '-bad name-'));
  try {
    const result = run([badName]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /invalid metadata\.name/);
  } finally {
    fs.rmSync(nameDir, { recursive: true });
  }

  const { dir: versionDir, file: wrongVersion } = withTempDir(validComponent.replace('backstage.io/v1alpha1', 'backstage.io/v1beta1'));
  try {
    const result = run([wrongVersion]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /unexpected apiVersion/);
  } finally {
    fs.rmSync(versionDir, { recursive: true });
  }

  const { dir: keyDir, file: duplicateKey } = withTempDir(`${validComponent}\nkind: Location\n`);
  try {
    const result = run([duplicateKey]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /duplicate top-level key 'kind'/);
  } finally {
    fs.rmSync(keyDir, { recursive: true });
  }
});

test('default name and namespace rules reject npm scopes, bad separators, and over-length values', () => {
  const cases = [
    { name: '@acme/Billing-Service.v2', expecting: /invalid metadata\.name '@acme\/Billing-Service\.v2'/ },
    { name: '-leading-sep', expecting: /invalid metadata\.name '-leading-sep'/ },
    { name: 'a..b', expecting: /invalid metadata\.name 'a\.\.b'/ },
    { name: 'a'.repeat(64), expecting: /exceeds the default 63-character limit \(64\)/ },
  ];
  const dirs = cases.map(item => withTempDir(validComponent.replace('sample-note-service', item.name)));
  const badNamespace = withTempDir(validComponent.replace('  name: sample-note-service', '  name: sample-note-service\n  namespace: .bad.ns'));
  const longNamespace = withTempDir(validComponent.replace('  name: sample-note-service', `  name: sample-note-service\n  namespace: ${'n'.repeat(64)}`));
  const goodNamespace = withTempDir(validComponent.replace('  name: sample-note-service', '  name: sample-note-service\n  namespace: team-one'));
  dirs.push(badNamespace, longNamespace, goodNamespace);
  try {
    cases.forEach((item, index) => {
      const result = run([dirs[index].file]);
      assert.equal(result.status, 1, `case ${item.name} should fail: ${result.stdout}`);
      assert.match(result.stdout, item.expecting);
    });
    const namespaceResult = run([badNamespace.file]);
    assert.equal(namespaceResult.status, 1);
    assert.match(namespaceResult.stdout, /invalid metadata\.namespace '\.bad\.ns'/);
    const longResult = run([longNamespace.file]);
    assert.equal(longResult.status, 1);
    assert.match(longResult.stdout, /namespace.*exceeds the default 63-character limit/);
    const goodResult = run([goodNamespace.file]);
    assert.equal(goodResult.status, 0, goodResult.stdout);
  } finally {
    for (const { dir } of dirs) fs.rmSync(dir, { recursive: true });
  }
});

test('JSON mode reports documents and problems; --strict upgrades warnings', () => {
  const jsonResult = run(['--json', path.join(fixtures, 'catalog-valid.yaml')]);
  assert.equal(jsonResult.status, 0);
  const report = JSON.parse(jsonResult.stdout);
  assert.equal(report.documents, 2);
  assert.equal(report.errors, 0);
  assert.deepEqual(report.problems, []);

  const { dir, file } = withTempDir(validComponent.replace('kind: Component', 'kind: Widget'));
  try {
    const warned = run(['--json', file]);
    assert.equal(warned.status, 0);
    assert.match(warned.stdout, /unknown kind/);
    assert.equal(run(['--strict', file]).status, 1);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test('usage errors exit with status 2 and unreadable files are reported', () => {
  assert.equal(run([]).status, 2);
  assert.equal(run(['--no-such-option']).status, 2);
  assert.equal(run(['--root']).status, 2);
  const result = run([path.join(os.tmpdir(), 'descriptor-check-missing-input.yaml')]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /cannot read file/);
});
