#!/usr/bin/env node
/**
 * Zero-dependency structural checks for documentation-review reports.
 *
 * A report produced by applying the documentation-review skill must obey its
 * own rules, so a grader can verify them mechanically:
 *   - a classification statement (which Diátaxis form each reviewed page is)
 *   - a Findings section where every row carries a valid severity, a
 *     file:line location, and quoted evidence
 *   - risk-ordered reporting is honored (blocker/major rows appear before
 *     nit rows)
 *   - an unevaluated/limitations statement (commands not run, links not
 *     fetched)
 *   - secrets never quoted in full
 *
 * Usage: node check-review-report.mjs <report.md> [...] [--json]
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SEVERITIES = ['blocker', 'major', 'minor', 'nit', 'question'];
const SECRET_SHAPES = [
  /ghp_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{12,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /[A-Za-z0-9]{40,}/,
];

const args = process.argv.slice(2).filter(a => a !== '--json');
const asJson = process.argv.includes('--json');

if (args.length === 0) {
  const [intro] = readFileSync(new URL(import.meta.url), 'utf8').split('*/').slice(1, 2);
  console.log(intro.replaceAll(' * ', '').replace(/^\n/, ''));
  process.exit(2);
}

let problems = [];
let checked = 0;
let findingRows = 0;

function checkReport(file, text) {
  const local = [];

  const forms = ['tutorial', 'how-to', 'reference', 'explanation'];
  const classifSection = text.split(/^#+ /m).find(section => /^classif/i.test(section.trim()));
  // Strip markdown emphasis and file names: `reference.md` is a filename,
  // not a Diátaxis form usage.
  const prose = classifSection
    ? classifSection.replace(/\*\*/g, '').replace(/[A-Za-z0-9_.-]+\.md\b/g, '')
    : '';
  const classified = prose && forms.some(form => new RegExp(`\\b${form}\\b`, 'i').test(prose));
  if (!classified) {
    local.push('no Diátaxis classification statement (which form each reviewed page is)');
  }

  const findingSection = text.split(/^#+ /m).find(section => /^findings/im.test(section.trim()));
  const rows = findingSection
    ? findingSection.split('\n').filter(line => /^\|/.test(line.trim()))
    : [];
  const dataRows = rows.filter(line => !/^\|\s*-{2,}/.test(line) && !/severity/i.test(line));
  findingRows += dataRows.length;
  const rowOrder = [];
  for (const row of dataRows) {
    const severity = SEVERITIES.find(s => row.toLowerCase().match(new RegExp(`\b?${s}\\b`, 'i')));
    const location = row.match(/[A-Za-z0-9_./-]+:(?:\d+|line \d+)|line \d+|\bL\d+\b/i);
    if (!severity) local.push(`finding row without a severity token: ${row.trim().slice(0, 80)}`);
    else rowOrder.push(SEVERITIES.indexOf(severity));
    if (!location && !/\bquote\b|evidence/i.test(row)) local.push(`finding row without a file:line location or quoted evidence: ${row.trim().slice(0, 80)}`);
  }
  for (let i = 1; i < rowOrder.length; i++) {
    if (rowOrder[i] < rowOrder[i - 1] - 1) {
      local.push('findings were not reported in reader-risk order (blocker/major first, nit last)');
      break;
    }
  }

  if (!/\bunevaluated\b|\bcould not (?:run|fetch|verify)|limitations/i.test(text)) {
    local.push('no unevaluated/limitations statement — say which commands or links could not be verified');
  }

  for (const shape of SECRET_SHAPES) {
    const found = text.match(new RegExp(shape.source, 'g'));
    if (found) local.push(`possible secret quoted in the report: ${found[0].slice(0, 10)}... (name its presence instead)`);
  }

  if (local.length === 0) {
    console.log(`${basename(file)}: report follows the skill's structural and evidence rules`);
  } else {
    console.log(`${basename(file)}: ${local.length} problem(s)`);
    for (const problem of local) console.log(`  error: ${problem}`);
    problems.push(...local.map(message => ({ file: basename(file), message })));
  }
}

for (const file of args) {
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    problems.push({ file, message: 'cannot read file' });
    console.error(`error: cannot read ${file}`);
    continue;
  }
  checkReport(file, text);
  checked += 1;
}

if (asJson) {
  console.log(JSON.stringify({ files: checked, finding_rows: findingRows, problems, errors: problems.length }, null, 2));
}

process.exit(problems.length === 0 ? 0 : 1);
