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

test('grader rejects reports that skip classification, verification notes, or risk order', () => {
  // no Diátaxis classification statement (section removed entirely)
  const r1 = runReport(goodReport.replace(
    /## Classification[\s\S]*?(?=## Verdict)/,
    '## Classification\n\n- guide.md\n- reference.md\n- clean.md\n\n',
  ));
  assert.equal(r1.status, 1, r1.out);
  assert.match(r1.out, /classification/);

  // quoted secret
  const r2 = runReport(goodReport.replace('## What works', '## Secrets\n\n`sk-aBcDeFgHiJkLmNoPqRs123456`\n\n## What works'));
  assert.equal(r2.status, 1, r2.out);
  assert.match(r2.out, /possible secret/);

  // findings not in reader-risk order: relabel the first major row as a nit
  // and promote it above the remaining majors (a nit before majors is a
  // risk-order violation)
  const firstMajor = goodReport.match(/^\| `major` \|[^\n]*$/m)[0];
  const promoted = goodReport
    .replace(/^\| `major` \|[^\n]*$\n/m, '')
    .replace(/## Findings\n\n(\| Severity[^\n]*\n\|[^\n]*\n)/, `## Findings\n\n$1${firstMajor.replace('`major`', '`nit`')}\n`);
  assert.notEqual(promoted, goodReport);
  const r4 = runReport(promoted);
  assert.equal(r4.status, 1, r4.out);
  assert.match(r4.out, /reader-risk order/);
});

test('grader accepts the clean-run report', () => {
  const result = runReport(fs.readFileSync(path.join(root, 'tests', 'expected', 'clean-report.md'), 'utf8'));
  assert.equal(result.status, 0, result.out);
});
