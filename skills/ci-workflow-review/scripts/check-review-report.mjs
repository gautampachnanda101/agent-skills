#!/usr/bin/env node
/**
 * Checks a ci-workflow-review report's structure, whatever wrote it. It does not
 * judge whether the findings are right; the evals do that.
 *   - a Verdict heading or line, with one of: approve, approve with comments, request changes
 *   - a Findings table with Severity, Location, Evidence, and Suggested
 *     direction columns
 *   - every severity one of blocker, major, minor, nit, question
 *   - findings ordered from most to least severe
 *   - a blocker or major means the verdict is request changes
 *
 * Usage: node check-review-report.mjs [--json] <report.md>
 * Exits 1 on any problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';

const VERDICTS = ["approve", "approve with comments", "request changes"];
const FAIL_VERDICT = 'request changes';
const SEVERITIES = ['blocker', 'major', 'minor', 'nit', 'question'];
const COLUMNS = [['severity', /^severity/], ['location', /^location/], ['evidence', /^evidence/], ['suggested direction', /suggest|direction|\bfix/]];
// A section starts at a heading or a bold label line, such as **Findings**.
const SECTION = /^(?:#+\s+|\*\*)/;

function cells(row) {
  return (row.trim().replace(/^\||\|$/g, '').match(/(?:`[^`]*`|\\.|[^|])+|(?<=\|)(?=\|)/g) ?? []).map(cell => cell.trim());
}

export function verdict(text) {
  const match = /^[#*\s]*verdict\b[^\n]*(?:\n[ \t]*)*([^\n]*)/im.exec(text);
  if (!match) return null;
  const block = `${match[0]}`.toLowerCase().replace(/[`*_]/g, '');
  return VERDICTS.filter(v => block.includes(v)).sort((a, b) => b.length - a.length)[0] ?? '';
}

export function findings(text) {
  const body = text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '');
  const lines = body.split('\n');
  const start = lines.findIndex(line => /^(?:#+\s+|\*\*)findings\b/i.test(line));
  if (start === -1) return { header: null, rows: [] };
  let header = null;
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (SECTION.test(line)) break;
    if (!line.trim().startsWith('|')) {
      if (header && rows.length) break;
      continue;
    }
    const row = cells(line);
    if (!header) {
      header = row.map(cell => cell.replace(/[`*_]/g, '').toLowerCase());
      continue;
    }
    if (row.every(cell => /^:?-+:?$/.test(cell))) continue;
    const at = header.findIndex(cell => /^severity/.test(cell));
    rows.push({ severity: (row[at] ?? '').replace(/[`*_]/g, '').trim().toLowerCase(), text: line });
  }
  return { header, rows };
}

export function checkReport(text) {
  const problems = [];
  const found = verdict(text);
  if (found === null) problems.push({ rule: 'verdict', message: 'no Verdict heading or line' });
  else if (!found) problems.push({ rule: 'verdict', message: `the verdict is not one of: ${VERDICTS.join(', ')}` });
  const { header, rows } = findings(text);
  if (!header) problems.push({ rule: 'findings', message: 'no Findings section with a table' });
  else {
    for (const [name, pattern] of COLUMNS) {
      if (!header.some(cell => pattern.test(cell))) problems.push({ rule: 'columns', message: `the findings table has no ${name} column` });
    }
  }
  // A question is a kind of finding, not a level, so it does not count
  // when checking order.
  let last = -1;
  for (const row of rows) {
    const rank = SEVERITIES.indexOf(row.severity);
    if (rank === -1) {
      problems.push({ rule: 'severity', message: `"${row.severity}" is not a severity: ${row.text.trim().slice(0, 80)}` });
      continue;
    }
    if (row.severity === 'question') continue;
    if (rank < last) problems.push({ rule: 'order', message: `a ${row.severity} finding comes after a less severe one` });
    last = Math.max(last, rank);
  }
  if (found && rows.some(row => row.severity === 'blocker' || row.severity === 'major') && found !== FAIL_VERDICT) {
    problems.push({ rule: 'verdict', message: `a blocker or major finding needs the verdict "${FAIL_VERDICT}", not "${found}"` });
  }
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => arg !== '--json');
  if (files.length !== 1) {
    console.error('Usage: node check-review-report.mjs [--json] <report.md>');
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(files[0], 'utf8');
  } catch (error) {
    console.error(`check-review-report: cannot read ${files[0]}: ${error.code ?? error.message}`);
    process.exit(2);
  }
  const report = checkReport(text);
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${files[0]}: ${p.rule}: ${p.message}`);
    console.log(`Checked the report: ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
