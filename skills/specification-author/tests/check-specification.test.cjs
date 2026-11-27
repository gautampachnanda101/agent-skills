const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-specification.mjs');
const load = () => import(script);
const spec = `# CSV export for reports

## Problem

Analysts copy report tables by hand into spreadsheets.

## Scope

Export the filtered report table as CSV.

## Non-goals

Scheduled exports.

## Requirements

- R-1: Export the rows of the current filtered view.
- R-2: Exports of up to 50,000 rows finish within 10 seconds.

## Acceptance criteria

- AC-1 (R-1): Given a report filtered to March, when the analyst selects
  Export CSV, then the file holds only March rows.
- AC-2 (R-2): Given 50,000 matching rows, when exported, then the download
  completes within 10 seconds.

## Open questions

- Which time zone do dates use?
`;

test('a testable spec passes', async () => {
  const { checkSpecification } = await load();
  assert.deepEqual(checkSpecification(spec), []);
});

test('missing sections, weak criteria, uncovered requirements, vague words, and placeholders fail', async () => {
  const { checkSpecification } = await load();
  const rules = text => checkSpecification(text).map(p => p.rule);
  assert.deepEqual(rules(spec.replace('## Non-goals', '## Later')), ['section']);
  assert.deepEqual(rules(spec.replace('then the file holds', 'the file holds')), ['criteria']);
  assert.deepEqual(rules(spec.replace('AC-2 (R-2)', 'AC-1 (R-1)')), ['criteria', 'coverage']);
  assert.deepEqual(rules(spec.replace('within 10 seconds.\n\n## Acceptance', 'fast.\n\n## Acceptance')), ['vague']);
  assert.deepEqual(rules(spec.replace('Which time zone', 'TBD: which time zone')), ['placeholder']);
  assert.deepEqual(rules(`${spec}\nUse \`fast\` mode in code.\n`), []);
});

test('the command exits 1 on problems and 2 on bad usage', () => {
  assert.equal(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync(process.execPath, [script, '/nonexistent.md'], { encoding: 'utf8' }).status, 2);
});
