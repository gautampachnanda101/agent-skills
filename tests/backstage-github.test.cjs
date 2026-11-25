const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '../scripts/backstage-github.cjs');

test('GitHub registration is idempotent and keeps unrelated backend modules', t => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'github plugin test.'));
  t.after(() => fs.rmSync(app, { recursive: true }));
  const entry = path.join(app, 'packages/backend/src/index.ts');
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  const original = "backend.add(import('@backstage/plugin-catalog-backend'));\nbackend.start();\n";
  fs.writeFileSync(entry, original);
  execFileSync(process.execPath, [script, app]);
  const result = fs.readFileSync(entry, 'utf8');
  assert.ok(result.includes(original.split('\n')[0]));
  assert.equal(result.split('plugin-catalog-backend-module-github').length, 2);
  execFileSync(process.execPath, [script, app]);
  assert.equal(fs.readFileSync(entry, 'utf8'), result);
  assert.equal(
    fs.readFileSync(path.join(app, 'app-config.github.yaml'), 'utf8'),
    fs.readFileSync(path.resolve(__dirname, '../skills/backstage-catalog-builder/tests/fixtures/backstage-instance/github-discovery.yaml'), 'utf8'),
  );
});

test('existing provider configuration is never replaced by the demonstration template', t => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'github plugin preserve.'));
  t.after(() => fs.rmSync(app, { recursive: true }));
  const entry = path.join(app, 'packages/backend/src/index.ts');
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  fs.writeFileSync(entry, 'backend.start();\n');
  const existing = 'catalog:\n  providers:\n    github:\n      approved-org:\n        organization: my-org\n';
  fs.writeFileSync(path.join(app, 'app-config.github.yaml'), existing);
  const output = execFileSync(process.execPath, [script, app], { encoding: 'utf8' });
  assert.equal(fs.readFileSync(path.join(app, 'app-config.github.yaml'), 'utf8'), existing);
  assert.match(output, /preserved the existing app-config\.github\.yaml/);
});

test('unexpected registration points fail without changing backend source', t => {
  const app = fs.mkdtempSync(path.join(os.tmpdir(), 'github plugin invalid.'));
  t.after(() => fs.rmSync(app, { recursive: true }));
  const entry = path.join(app, 'packages/backend/src/index.ts');
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  const original = 'customBackend.start();\n';
  fs.writeFileSync(entry, original);
  assert.throws(
    () => execFileSync(process.execPath, [script, app], { stdio: 'pipe' }),
    /Expected exactly one backend.start/,
  );
  assert.equal(fs.readFileSync(entry, 'utf8'), original);
  assert.equal(fs.existsSync(path.join(app, 'app-config.github.yaml')), false);
});

test('backend runner passes absolute plugin config paths and disables discovery without credentials', t => {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'github runner test.')));
  t.after(() => fs.rmSync(home, { recursive: true }));
  const app = path.join(home, 'app');
  const bin = path.join(home, 'tools/bin');
  fs.mkdirSync(path.join(app, 'node_modules'), { recursive: true });
  fs.mkdirSync(bin, { recursive: true });
  fs.writeFileSync(path.join(app, 'package.json'), '{}');
  fs.writeFileSync(path.join(app, 'app-config.yaml'), '{}');
  fs.writeFileSync(path.join(app, 'app-config.github.yaml'), '{}');
  fs.writeFileSync(path.join(app, '.node-abi'), process.versions.modules);
  fs.writeFileSync(
    path.join(bin, 'yarn'),
    '#!/bin/sh\nprintf "%s\\n" "$@"\n',
    { mode: 0o755 },
  );
  const env = { ...process.env, GITHUB_DISCOVERY_TOKEN: 'test-only' };
  delete env.BACKSTAGE_TOKEN;
  const run = () => execFileSync(
    'make', ['backstage-backend', `BACKSTAGE_HOME=${home}`],
    { cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', stdio: 'pipe' },
  );
  const enabled = run();
  for (const config of ['app-config.yaml', 'app-config.local.yaml', 'app-config.github.yaml']) {
    assert.ok(enabled.split('\n').includes(path.join(app, config)), config);
  }
  const relative = execFileSync(
    'make', [
      'backstage-backend',
      `BACKSTAGE_HOME=${path.relative(path.resolve(__dirname, '..'), home)}`,
    ],
    { cwd: path.resolve(__dirname, '..'), env, encoding: 'utf8', stdio: 'pipe' },
  );
  for (const config of ['app-config.yaml', 'app-config.local.yaml', 'app-config.github.yaml']) {
    assert.ok(relative.split('\n').includes(path.join(app, config)), config);
  }
  delete env.GITHUB_DISCOVERY_TOKEN;
  assert.ok(!run().split('\n').includes(path.join(app, 'app-config.github.yaml')));
});
