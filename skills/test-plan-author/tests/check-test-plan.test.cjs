const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-test-plan.mjs');
const load = () => import(script);
const spec = '## Acceptance criteria\n\n- AC-1: Given ... when ... then ...\n- AC-2: Given ... when ... then ...\n';
const plan = `| Criterion | Test | Level | Kind |
| --- | --- | --- | --- |
| AC-1 | merges two accounts | integration | happy path |
| AC-2 | rejects an open dispute | unit | negative |
| AC-2 | undo on day 30, refuse on day 31 | unit | boundary |
`;

test('a plan covering every criterion with negative and boundary tests passes', async () => {
  const { checkPlan } = await load();
  assert.deepEqual(checkPlan(plan, spec), []);
  assert.deepEqual(checkPlan(plan), []);
});

test('uncovered or unknown criteria, missing levels, kinds, and placeholders fail', async () => {
  const { checkPlan } = await load();
  const rules = (p, s = spec) => checkPlan(p, s).map(x => x.rule);
  assert.deepEqual(rules(plan.replace(/\| AC-2 \| rejects[^\n]*\n/, '').replace(/\| AC-2 \| undo[^\n]*\n/, '')), ['negative', 'boundary', 'coverage']);
  assert.deepEqual(rules(plan.replace('| AC-1 |', '| AC-9 |')), ['coverage', 'coverage']);
  assert.deepEqual(rules(plan.replace('| integration |', '| soon |')), ['level']);
  assert.deepEqual(rules(`${plan}\nTODO: add load tests\n`), ['placeholder']);
  assert.deepEqual(rules('No table here.'), ['table', 'coverage', 'coverage']);
});

test('the command takes --spec and exits 1 or 2', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'spec.md'), spec);
  fs.writeFileSync(path.join(dir, 'plan.md'), plan.replace(/\| AC-1[^\n]*\n/, ''));
  const run = (...a) => spawnSync(process.execPath, [script, ...a], { encoding: 'utf8' });
  const failed = run('--spec', path.join(dir, 'spec.md'), path.join(dir, 'plan.md'));
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /AC-1 has no test/);
  fs.writeFileSync(path.join(dir, 'full.md'), plan);
  assert.equal(run(path.join(dir, 'full.md')).status, 0, 'a plan alone, without --spec, is checked');
  assert.equal(run().status, 2);
  assert.equal(run('--spec').status, 2);
});
