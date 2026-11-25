const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts', 'check-review-report.mjs');

const goodReport = fs.readFileSync(
  path.join(root, 'tests', 'expected', 'planted-defects-report.md'),
  'utf8',
);

function runReport(text) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-check.'));
  const file = path.join(dir, 'report.md');
  fs.writeFileSync(file, text);
  let status = 0;
  let out = '';
  try {
    out = execFileSync('node', [script, file], { encoding: 'utf8' });
  } catch (error) {
    status = 1;
    out = String(error.stdout || error);
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  return { status, out };
}

test('the expected planted-defects report passes the report grader', () => {
  const result = runReport(goodReport);
  assert.equal(result.status, 0, result.out);
});

test('grader rejects missing evidence, invalid severities, blame, and quoted secrets', () => {
  // finding without a location or quote
  const r1 = runReport(goodReport.replace(
    '| `major` | Nested catch swallows every failure and the failure log was removed, so bad state reaches the retry counter silently | `src/queue/consumer.js:15-19`, quote: `catch (error) { // ignore transient errors }` plus deleted `this.log.fail(event.id, error)` | A poisoned event now retries forever with zero operator signal — the exact defect the tests would have caught |',
    '| `major` | retry swallows exceptions silently | no evidence attached | reason |',
  ));
  assert.equal(r1.status, 1, r1.out);
  assert.match(r1.out, /without a file:line location/);

  // invalid severity token
  const r2 = runReport(goodReport.replace('severity, location, evidence, suggested direction', 'severity, location, evidence, suggested direction').replace('Verdict: `request changes`', 'Verdict: `request changes`').replace('| `major` | Nested catch', '| `critical` | Nested catch'));
  assert.equal(r2.status, 1, r2.out);
  assert.match(r2.out, /without a severity token|unrecognized verdict|problem/);

  // author-directed blame language
  const r3 = runReport(goodReport.replace(
    '## Strengths',
    '## Author commentary\n\nYou should have written the tests first.\n\n## Strengths',
  ));
  assert.equal(r3.status, 1, r3.out);
  assert.match(r3.out, /blame/);

  // quoted secret
  const r4 = runReport(goodReport.replace(
    '## Strengths',
    '## Secrets\n\nThe diff contained `ghp_aBcDeFgHiJkLmNoPqRsTuVw1234567890`.\n\n## Strengths',
  ));
  assert.equal(r4.status, 1, r4.out);
  assert.match(r4.out, /possible secret/);

  // non-recognized verdict
  const r5 = runReport(goodReport.replace('Verdict: `request changes`', 'Verdict: `looks fine`'));
  assert.equal(r5.status, 1, r5.out);
});

test('grader produces machine-readable output with --json', () => {
  let stdout = '';
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-json.'));
    const file = path.join(dir, 'report.md');
    fs.writeFileSync(file, goodReport);
    try {
      stdout = execFileSync('node', [script, file, '--json'], { encoding: 'utf8' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (error) {
    stdout = String(error.stdout || error);
  }
  const json = JSON.parse(stdout.slice(stdout.indexOf('{')));
  assert.ok(json.files >= 1);
  assert.equal(json.problems.length, 0);
});
