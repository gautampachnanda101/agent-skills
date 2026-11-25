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

const HEADER = '| Severity | Defect | Evidence | Why |\n| --- | --- | --- | --- |\n';

function report({ verdict = 'request changes', rows = [], extra = '' }) {
  return `Verdict: \`${verdict}\`\n\n## Findings\n\n${HEADER}${rows.join('\n')}\n${extra}\n## Strengths\n\n- Small seams.\n`;
}

const MAJOR = '| `major` | Swallows errors | `a.js:3`, quote: `catch {}` | Hidden failure |';
const NIT = '| `nit` | Name | `a.js:3` | Reads better |';

const rejected = [
  ['an unknown severity with a known one in the prose', { rows: ['| `critical` | A major risk | `a.js:3` | Why |'] }, /without a severity token/],
  ['a bad row that mentions the word severity', { rows: [MAJOR, '| `bogus` | Severity unclear | nowhere | Why |'] }, /without a severity token/],
  ['a file with neither a line nor a quote', { rows: ['| `major` | Broken | `a.js` | Why |'] }, /without a file:line location/],
  ['a location outside the evidence column', { rows: ['| `major` | Broken at `a.js:3` | none | Why |'] }, /without a file:line location/],
  ['a row with missing cells', { rows: ['| `major` | `a.js:3` |'] }, /cells/],
  ['an approval with an open blocker', { verdict: 'approve', rows: ['| `blocker` | Broken | `a.js:3` | Why |'] }, /verdict/],
  ['a commented approval with an open major', { verdict: 'approve with comments', rows: [MAJOR] }, /verdict/],
  ['requested changes without a blocker or major', { rows: [NIT] }, /verdict/],
  ['a verdict that only starts like a known one', { verdict: 'approvezzz', rows: [NIT] }, /no recognized verdict/],
  ['an invented approval', { verdict: 'approve with reservations', rows: [NIT] }, /no recognized verdict/],
];

for (const [name, parts, message] of rejected) {
  test(`grader rejects ${name}`, () => {
    const result = runReport(report(parts));
    assert.equal(result.status, 1, result.out);
    assert.match(result.out, message);
  });
}

const accepted = [
  ['a full Git SHA in evidence', { verdict: 'approve', rows: ['| `nit` | Pin | `a.yml:3`, quote: `4f4878760c0eebbceebeb8fafa68a49f1f23dd5a` | Why |'] }],
  ['quoted code that says you should', { verdict: 'approve', rows: ['| `nit` | Wording | `a.md:3`, quote: `you should run make` | Why |'] }],
  ['a pipe inside a code quote', { rows: ['| `major` | Pipe | `a.sh:3`, quote: `a | b` | Why |'] }],
  ['a deleted file with a quote', { rows: ['| `major` | Deleted | `a.test.js`, quote: `it("retries")` | Why |'] }],
  ['an approval with no findings', { verdict: 'approve' }],
  ['findings grouped under subheadings', { rows: [MAJOR], extra: `\n### More\n\n${HEADER}${NIT}\n` }],
];

for (const [name, parts] of accepted) {
  test(`grader accepts ${name}`, () => {
    const result = runReport(report(parts));
    assert.equal(result.status, 0, result.out);
  });
}

test('findings under subheadings are still checked', () => {
  const result = runReport(report({ rows: [MAJOR], extra: `\n### More\n\n${HEADER}| \`bogus\` | x | \`a.js:3\` | y |\n` }));
  assert.equal(result.status, 1, result.out);
});

test('a reported secret is never echoed back', () => {
  const secret = 'ghp_aBcDeFgHiJkLmNoPqRsTuVw1234567890';
  const result = runReport(report({ rows: [MAJOR], extra: `\n\`${secret}\`\n` }));
  assert.equal(result.status, 1, result.out);
  assert.ok(!result.out.includes(secret.slice(0, 8)), result.out);
});

test('--json prints only JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'report-json.'));
  try {
    const file = path.join(dir, 'report.md');
    fs.writeFileSync(file, goodReport);
    const json = JSON.parse(execFileSync('node', [script, file, '--json'], { encoding: 'utf8' }));
    assert.equal(json.files, 1);
    assert.equal(json.finding_rows, 8);
    assert.equal(json.problems.length, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('running without arguments prints usage', () => {
  assert.throws(() => execFileSync('node', [script], { encoding: 'utf8', stdio: 'pipe' }), error => {
    assert.equal(error.status, 2);
    assert.match(error.stdout, /Usage: node check-review-report\.mjs/);
    assert.doesNotMatch(error.stdout, /import \{/);
    return true;
  });
});

test('grader accepts the clean-run report', () => {
  const result = runReport(fs.readFileSync(path.join(root, 'tests', 'expected', 'clean-report.md'), 'utf8'));
  assert.equal(result.status, 0, result.out);
});
