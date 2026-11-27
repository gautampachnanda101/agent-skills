const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-change-plan.mjs');
const load = () => import(script);
const plan = `| Task | Files | Check | Size | Depends on |
| --- | --- | --- | --- | --- |
| 1. Add the export endpoint | src/routes/export.js | \`npm test\`: export.test.js | M (~150 lines) | |
| 2. Add the button | src/ui/ReportTable.js | \`npm test\`: button test | S | 1 |
`;

test('a plan with files, checks, small sizes, and a buildable order passes', async () => {
  const { checkPlan } = await load();
  assert.deepEqual(checkPlan(plan), []);
});

test('missing fields, oversized tasks, bad order, and placeholders fail', async () => {
  const { checkPlan } = await load();
  const rules = text => checkPlan(text).map(p => p.rule);
  assert.deepEqual(rules(plan.replace('| `npm test`: button test |', '| |')), ['check']);
  assert.deepEqual(rules(plan.replace('M (~150 lines)', '650 lines')), ['size']);
  assert.deepEqual(rules(plan.replace('| S | 1 |', '| L | 1 |')), ['size']);
  assert.deepEqual(rules(plan.replace('| S | 1 |', '| S | 3 |')), ['order']);
  assert.deepEqual(rules(`${plan}\nTBD: rollout\n`), ['placeholder']);
  assert.deepEqual(rules('Just prose.'), ['table']);
});

test('the command exits 2 on bad usage', () => {
  assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 2);
});
