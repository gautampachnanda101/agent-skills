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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-report-check.'));
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

function edited(text, pattern, replacement) {
  const result = text.replace(pattern, replacement);
  assert.notEqual(result, text, `edit did not apply: ${pattern}`);
  return result;
}

test('grader rejects reports that skip classification, quote secrets, or break risk order', () => {
  const r1 = runReport(edited(goodReport, /^## Classification\n[\s\S]*?(?=^## )/m, '## Classification\n\n- guide.md\n- reference.md\n\n'));
  assert.equal(r1.status, 1, r1.out);
  assert.match(r1.out, /classification/);

  const r2 = runReport(edited(goodReport, /^## Strengths/m, '## Secrets\n\n`sk-aBcDeFgHiJkLmNoPqRs123456`\n\n## Strengths'));
  assert.equal(r2.status, 1, r2.out);
  assert.match(r2.out, /possible secret/);

  // Move the last finding row to the top of the table.
  const rows = goodReport.match(/^\| `?(?:blocker|major|minor|nit)`? \|[^\n]*$/gm);
  const last = rows.at(-1);
  assert.notEqual(last.match(/`?(\w+)`? \|/)[1], rows[0].match(/`?(\w+)`? \|/)[1]);
  const reordered = edited(goodReport.replace(`${last}\n`, ''), rows[0], `${last}\n${rows[0]}`);
  const r3 = runReport(reordered);
  assert.equal(r3.status, 1, r3.out);
  assert.match(r3.out, /reader-risk order/);
});

test('grader accepts the clean-run report', () => {
  const result = runReport(fs.readFileSync(path.join(root, 'tests', 'expected', 'clean-report.md'), 'utf8'));
  assert.equal(result.status, 0, result.out);
});

const HEADER = '| Severity | Defect | Evidence | Why |\n| --- | --- | --- | --- |\n';
const row = (severity, evidence = '`g.md:3`', defect = 'Defect') => `| \`${severity}\` | ${defect} | ${evidence} | Why |`;

function report(rows, { findings = true } = {}) {
  const section = findings ? `## Findings\n\n${HEADER}${rows.join('\n')}\n` : '';
  return `## Classification\n\n- g.md is a how-to.\n\n${section}\n## Unevaluated\n\n- External links.\n`;
}

const rejected = [
  ['no evidence attached', [row('major', 'no evidence attached')], /without a file:line location/],
  ['a location with no file', [row('major', 'the second paragraph')], /without a file:line location/],
  ['an unknown severity ending in a known one', [row('bogus', '`g.md:3`', 'One unit')], /without a severity token/],
  ['a bad row that mentions the word severity', [row('bogus', 'nowhere', 'Severity unclear')], /without a severity token/],
  ['a blocker after a major', [row('major'), row('blocker')], /reader-risk order/],
  ['a major after a minor', [row('minor'), row('major')], /reader-risk order/],
  ['a minor after a nit', [row('nit'), row('minor')], /reader-risk order/],
];

for (const [name, rows, message] of rejected) {
  test(`grader rejects ${name}`, () => {
    const result = runReport(report(rows));
    assert.equal(result.status, 1, result.out);
    assert.match(result.out, message);
  });
}

test('grader rejects a report without a Findings section', () => {
  const result = runReport(report([], { findings: false }));
  assert.equal(result.status, 1, result.out);
  assert.match(result.out, /no Findings section/);
});

test('grader accepts ordered findings, full Git SHAs, and an empty table', () => {
  const ordered = ['blocker', 'major', 'major', 'minor', 'nit', 'question'].map(s => row(s));
  for (const rows of [ordered, [row('nit', '`g.md:3`, `4f4878760c0eebbceebeb8fafa68a49f1f23dd5a`')], []]) {
    const result = runReport(report(rows));
    assert.equal(result.status, 0, result.out);
  }
});

test('--json prints only JSON', () => {
  const out = execFileSync('node', [script, '--json', path.join(root, 'tests', 'expected', 'planted-defects-report.md')], { encoding: 'utf8' });
  assert.ok(JSON.parse(out).finding_rows >= 10);
});

test('running without arguments prints usage', () => {
  assert.throws(() => execFileSync('node', [script], { encoding: 'utf8', stdio: 'pipe' }), error => {
    assert.equal(error.status, 2);
    assert.match(error.stdout, /Usage: node check-review-report\.mjs/);
    assert.doesNotMatch(error.stdout, /import \{/);
    return true;
  });
});

test('grader accepts a page-level finding and questions anywhere in the order', () => {
  const rows = [row('question', '`g.md`'), row('major', '`g.md`, `h.md`'), row('question'), row('minor')];
  const result = runReport(report(rows));
  assert.equal(result.status, 0, result.out);
});
