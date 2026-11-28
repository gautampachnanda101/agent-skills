const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-workflow.mjs');
const fixture = name => fs.readFileSync(path.join(__dirname, 'fixtures', 'reply', name), 'utf8');
const load = () => import(script);

test('the risky workflow trips every rule, at the right lines', async () => {
  const { checkWorkflow } = await load();
  const found = checkWorkflow(fixture('pr-checks.yml')).map(p => `${p.line}:${p.rule}`);
  assert.deepEqual(found.sort(), ['1:permissions', '10:permissions', '12:credentials', '12:unpinned', '14:pr-target', '15:unpinned', '19:injection', '25:secret-echo'].sort());
});

test('a pinned, least-privilege workflow that passes untrusted input through env is clean', async () => {
  const { checkWorkflow } = await load();
  assert.deepEqual(checkWorkflow(fixture('ci.yml')), []);
});

test('local actions and digest-pinned containers count as pinned', async () => {
  const { checkWorkflow } = await load();
  const text = 'permissions:\n  contents: read\njobs:\n  a:\n    steps:\n      - uses: ./.github/actions/setup\n      - uses: docker://alpine@sha256:' + 'a'.repeat(64) + '\n';
  assert.deepEqual(checkWorkflow(text), []);
});

test('the command exits 1 on problems and 2 on bad usage', () => {
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.equal(run(path.join(__dirname, 'fixtures', 'reply', 'pr-checks.yml')).status, 1);
  assert.equal(run(path.join(__dirname, 'fixtures', 'reply', 'ci.yml')).status, 0);
  assert.equal(run().status, 2);
});
