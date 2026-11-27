const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-decision-record.mjs');
const load = () => import(script);
const good = '# 0002. Use webhooks\n\n- **Status:** Accepted\n\n## Context\n\nFacts.\n\n## Options considered\n\nA, B.\n\n## Decision\n\nWebhooks.\n\n## Consequences\n\nCosts.\n';

test('a complete record passes, in Nygard, MADR, and status-section forms', async () => {
  const { checkRecord } = await load();
  assert.deepEqual(checkRecord(good), []);
  const madr = '# Use webhooks\n\n## Status\n\nProposed\n\n## Context and Problem Statement\n\nx\n\n## Decision Outcome\n\ny\n\n## Consequences\n\nz\n';
  assert.deepEqual(checkRecord(madr), []);
  assert.deepEqual(checkRecord(`${good}\n\`TODO\` in code is fine.\n`), []);
});

test('missing parts, unknown status, and placeholders are reported', async () => {
  const { checkRecord } = await load();
  const rules = text => checkRecord(text).map(p => p.rule);
  assert.deepEqual(rules(good.replace('## Consequences', '## Notes')), ['section']);
  assert.deepEqual(rules(good.replace('Accepted', 'Maybe')), ['status']);
  assert.deepEqual(rules(good.replace('- **Status:** Accepted\n', '')), ['status']);
  assert.deepEqual(rules(good.replace('Costs.', 'TODO: costs')), ['placeholder']);
  assert.deepEqual(rules(`${good}\n# Second title\n`), ['title']);
});

test('the folder check finds duplicate and skipped numbers and dangling supersedes', async t => {
  const { checkFolder } = await load();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adr-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, '0001-a.md'), good.replace('Accepted', 'Superseded by 0009'));
  fs.writeFileSync(path.join(dir, '0001-b.md'), good);
  fs.writeFileSync(path.join(dir, '0003-c.md'), good);
  fs.writeFileSync(path.join(dir, 'template.md'), '# NNNN. Title\n');
  const { records, problems } = checkFolder(dir);
  assert.equal(records, 3);
  assert.deepEqual(problems.map(p => p.rule).sort(), ['numbering', 'numbering', 'supersede']);
  const run = spawnSync(process.execPath, [script, '--dir', dir], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 2);
});

test("this repository's own decision records pass", () => {
  const run = spawnSync(process.execPath, [script, '--dir', path.resolve(__dirname, '..', '..', '..', 'docs', 'decisions')], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stdout);
});
