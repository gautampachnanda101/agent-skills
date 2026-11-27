#!/usr/bin/env node
/**
 * Checks a change plan, whatever wrote it:
 *   - a Markdown table of tasks with Task, Files, Check, and Size columns
 *     (Depends on is optional)
 *   - every task names its files, the check that proves it, and its size
 *   - no task over the review limit: sizes are S, M, or L, or a number of
 *     changed lines; L and anything over 400 lines fail, because reviews
 *     catch fewer defects past about 400 lines
 *   - "Depends on" names only earlier tasks, so the order is buildable
 *   - no placeholder notes (TODO, FIXME, TBD, XXX)
 *
 * Usage: node check-change-plan.mjs [--json] <plan.md>
 * Exits 1 on any problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';

const LIMIT = 400;

function cells(row) {
  return row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

export function tasks(text) {
  const found = [];
  let header = null;
  for (const line of text.split('\n')) {
    if (!line.trim().startsWith('|')) {
      header = null;
      continue;
    }
    const row = cells(line);
    if (!header) {
      header = row.map(cell => cell.replace(/[`*_]/g, '').toLowerCase());
      continue;
    }
    if (row.every(cell => /^:?-+:?$/.test(cell))) continue;
    const col = name => header.findIndex(cell => name.test(cell));
    const task = col(/^(task|#|step)/);
    if (task === -1 || col(/^files?/) === -1) continue;
    const get = name => (col(name) === -1 ? '' : row[col(name)] ?? '');
    found.push({ task: row[task], files: get(/^files?/), check: get(/^(check|verify|test)/), size: get(/^size/), depends: get(/^depends/) });
  }
  return found;
}

export function checkPlan(text) {
  const problems = [];
  const list = tasks(text);
  if (!list.length) problems.push({ rule: 'table', message: 'no table of tasks with Task and Files columns' });
  const seen = [];
  for (const t of list) {
    const id = (/\d+/.exec(t.task) ?? [t.task])[0];
    for (const [field, value] of [['files', t.files], ['check', t.check], ['size', t.size]]) {
      if (!value || /^[-–—]?$/.test(value)) problems.push({ rule: field, message: `task ${id} has no ${field}` });
    }
    const lines = /(\d[\d,]*)\s*(?:lines?|loc)?/i.exec(t.size)?.[1];
    if (/^\s*L\b|large|XL/i.test(t.size) || (lines && Number(lines.replace(/,/g, '')) > LIMIT)) {
      problems.push({ rule: 'size', message: `task ${id} (${t.size}) is over the review limit of about ${LIMIT} changed lines; split it` });
    }
    for (const dep of t.depends.match(/\d+/g) ?? []) {
      if (!seen.includes(dep)) problems.push({ rule: 'order', message: `task ${id} depends on ${dep}, which is not an earlier task` });
    }
    seen.push(id);
  }
  const placeholder = /\b(TODO|FIXME|TBD|XXX)\b/.exec(text.replace(/`[^`\n]*`/g, ''));
  if (placeholder) problems.push({ rule: 'placeholder', message: `"${placeholder[1]}" left in the plan` });
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => arg !== '--json');
  if (files.length !== 1) {
    console.error('Usage: node check-change-plan.mjs [--json] <plan.md>');
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(files[0], 'utf8');
  } catch (error) {
    console.error(`check-change-plan: cannot read ${files[0]}: ${error.code ?? error.message}`);
    process.exit(2);
  }
  const report = checkPlan(text);
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${files[0]}: ${p.rule}: ${p.message}`);
    console.log(`Checked ${tasks(text).length} task(s): ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
