#!/usr/bin/env node
/**
 * Checks decision records (ADRs) for the parts every common format shares,
 * whatever wrote them:
 *   - one H1 title
 *   - a status: a "Status:" line or a "## Status" section, with a known value
 *   - Context, Decision, and Consequences sections (MADR's "Context and
 *     Problem Statement" and "Decision Outcome" count)
 *   - no placeholder notes (TODO, FIXME, TBD, XXX)
 * With --dir, also checks the folder's numbering: NNNN-title.md names,
 * no duplicate numbers, no gaps, and every "Superseded by NNNN" exists.
 *
 * Usage: node check-decision-record.mjs [--json] <record.md...>
 *        node check-decision-record.mjs [--json] --dir <folder>
 * Exits 1 on any problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';
import path from 'node:path';

const STATUSES = /\b(proposed|accepted|rejected|deprecated|superseded)\b/i;
const SECTIONS = [
  ['Context', /^##\s+(context|context and problem statement|problem|background)\b/im],
  ['Decision', /^##\s+(decision|decision outcome)\b/im],
  ['Consequences', /^##\s+(consequences|positive consequences|negative consequences|implications)\b/im],
];

function prose(text) {
  return text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '').replace(/`[^`\n]*`/g, '');
}

export function checkRecord(text) {
  const problems = [];
  const body = prose(text);
  const titles = body.match(/^#\s+\S.*$/gm) ?? [];
  if (titles.length !== 1) problems.push({ rule: 'title', message: `expected one "# " title, found ${titles.length}` });
  const statusLine = /^[-*\s]*\**status:?\**:?\s*(.*)$/im.exec(body);
  const statusSection = /^##\s+status\s*\n+([^\n#]+)/im.exec(body);
  const status = statusLine?.[1] ?? statusSection?.[1];
  if (!status) problems.push({ rule: 'status', message: 'no status: add a "Status:" line or a "## Status" section' });
  else if (!STATUSES.test(status)) problems.push({ rule: 'status', message: `status "${status.trim()}" is not proposed, accepted, rejected, deprecated, or superseded` });
  for (const [name, pattern] of SECTIONS) {
    if (!pattern.test(body)) problems.push({ rule: 'section', message: `no "## ${name}" section` });
  }
  const placeholder = /\b(TODO|FIXME|TBD|XXX)\b/.exec(body);
  if (placeholder) problems.push({ rule: 'placeholder', message: `"${placeholder[1]}" left in the record` });
  return problems;
}

export function checkFolder(dir) {
  const problems = [];
  const records = fs.readdirSync(dir).filter(file => /^\d{4}-[a-z0-9-]+\.md$/.test(file)).sort();
  const numbers = records.map(file => Number(file.slice(0, 4)));
  const seen = new Set();
  for (const [i, n] of numbers.entries()) {
    if (seen.has(n)) problems.push({ file: records[i], rule: 'numbering', message: `number ${String(n).padStart(4, '0')} is used twice` });
    seen.add(n);
  }
  const unique = [...seen].sort((a, b) => a - b);
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] !== unique[i - 1] + 1) problems.push({ rule: 'numbering', message: `numbers jump from ${unique[i - 1]} to ${unique[i]}` });
  }
  for (const file of records) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    for (const problem of checkRecord(text)) problems.push({ file, ...problem });
    for (const match of text.matchAll(/superseded by\s+\[?(\d{4})/gi)) {
      if (!seen.has(Number(match[1]))) problems.push({ file, rule: 'supersede', message: `superseded by ${match[1]}, which does not exist` });
    }
  }
  return { records: records.length, problems };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const rest = args.filter(arg => arg !== '--json');
  const at = rest.indexOf('--dir');
  let report;
  let checked;
  try {
    if (at !== -1) {
      if (!rest[at + 1]) throw Object.assign(new Error('--dir needs a folder'), { usage: true });
      const result = checkFolder(rest[at + 1]);
      report = result.problems;
      checked = `${result.records} record(s) in ${rest[at + 1]}`;
    } else {
      if (!rest.length) throw Object.assign(new Error('give record files or --dir <folder>'), { usage: true });
      report = rest.flatMap(file => checkRecord(fs.readFileSync(file, 'utf8')).map(problem => ({ file, ...problem })));
      checked = `${rest.length} record(s)`;
    }
  } catch (error) {
    console.error(`check-decision-record: ${error.usage ? error.message : `cannot read: ${error.code ?? error.message}`}`);
    console.error('Usage: node check-decision-record.mjs [--json] <record.md...> | --dir <folder>');
    process.exit(2);
  }
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${p.file ?? ''}: ${p.rule}: ${p.message}`);
    console.log(`Checked ${checked}: ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
