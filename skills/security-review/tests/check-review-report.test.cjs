const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-review-report.mjs');
const load = () => import(script);
const FAIL = 'request changes';
const PASS = 'approve with comments';
const report = verdict => `**Verdict:** \`${verdict}\`

## Findings

| Severity | Location | Evidence | Suggested direction |
| --- | --- | --- | --- |
| major | R-1 | "every user" | Name the roles. |
| question | R-2 | "fast" | How fast? |
| minor | AC-2 | no Then | Add a Then. |
`;

test('a well-formed report passes, with a question anywhere in the order', async () => {
  const { checkReport } = await load();
  assert.deepEqual(checkReport(report(FAIL)), []);
});

test('a missing or wrong verdict, missing columns, bad severities, and bad order fail', async () => {
  const { checkReport } = await load();
  const rules = text => checkReport(text).map(p => p.rule);
  assert.deepEqual(rules(report(PASS)), ['verdict']);
  assert.deepEqual(rules(report(FAIL).replace(/^\*\*Verdict[^\n]*\n/, '')), ['verdict']);
  assert.deepEqual(rules(report(FAIL).replace('| Evidence |', '| Notes |')), ['columns']);
  assert.deepEqual(rules(report(FAIL).replace('| minor |', '| urgent |')), ['severity']);
  assert.deepEqual(rules(report(FAIL).replace('| minor | AC-2', '| blocker | AC-2')), ['order']);
  assert.deepEqual(rules('No findings here.'), ['verdict', 'findings']);
});

test('the command exits 2 on bad usage', () => {
  assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 2);
});
