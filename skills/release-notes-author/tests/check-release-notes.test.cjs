const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-release-notes.mjs');
const load = () => import(script);
const notes = `# orders-api 1.5.0

## Breaking changes

- \`ORDERS_DB_URL\` is renamed \`DATABASE_URL\`.

## Upgrade

1. Rename the variable before deploying.

## Roll back

Redeploy 1.4.2 and set \`ORDERS_DB_URL\` again.

## Fixes

- Refunds no longer double-count tax.
`;

test('complete notes pass, and notes with no breaking change need no upgrade or rollback', async () => {
  const { checkNotes } = await load();
  assert.deepEqual(checkNotes(notes), []);
  assert.deepEqual(checkNotes('# orders-api 1.4.3\n\n## Fixes\n\n- Faster search.\n'), []);
});

test('a missing version, upgrade, rollback, a bare hash, or a placeholder fails', async () => {
  const { checkNotes } = await load();
  const rules = text => checkNotes(text).map(p => p.rule);
  assert.deepEqual(rules(notes.replace('1.5.0', 'next')), ['version']);
  assert.deepEqual(rules(notes.replace('## Upgrade', '## Notes')), ['upgrade']);
  assert.deepEqual(rules(notes.replace('## Roll back', '## Later')), ['rollback']);
  assert.deepEqual(rules('# api 2.0.0\n\n## Database\n\nRuns a migration.\n'), ['rollback']);
  assert.deepEqual(rules(`${notes}- 3f9c2ab\n`), ['entry']);
  assert.deepEqual(rules(`${notes}- TBD: perf numbers\n`), ['placeholder']);
});

test('the command exits 2 on bad usage', () => {
  assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 2);
});
