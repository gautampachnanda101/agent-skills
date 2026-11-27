#!/usr/bin/env node
/**
 * Checks a test plan, whatever wrote it:
 *   - a Markdown table of tests with a criterion column (Criterion or AC),
 *     a test column, and a level column (unit, integration, end-to-end)
 *   - at least one negative or error test, and one boundary test, in a Kind
 *     or Type column or the test's description
 *   - with --spec, every acceptance criterion ID (AC-1, ...) in the
 *     specification has at least one test, and the plan names no criterion
 *     the spec lacks
 *   - no placeholder notes (TODO, FIXME, TBD, XXX)
 *
 * Usage: node check-test-plan.mjs [--json] [--spec <spec.md>] <plan.md>
 * Exits 1 on any problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';

function cells(row) {
  return row.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
}

export function planRows(text) {
  const rows = [];
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
    const at = name => header.findIndex(cell => name.test(cell));
    const criterion = at(/^(criterion|criteria|ac|acceptance)/);
    if (criterion === -1) continue;
    rows.push({ criteria: row[criterion].match(/\bAC-\d+\b/g) ?? [], level: row[at(/^level/)] ?? '', kind: row[at(/^(kind|type)/)] ?? '', text: line });
  }
  return rows;
}

export function checkPlan(plan, spec) {
  const problems = [];
  const rows = planRows(plan);
  if (!rows.length) problems.push({ rule: 'table', message: 'no table of tests with a Criterion (or AC) column' });
  for (const row of rows) {
    if (!row.criteria.length) problems.push({ rule: 'criterion', message: `a test names no criterion: ${row.text.trim().slice(0, 80)}` });
    if (!/\b(unit|integration|end-to-end|e2e|contract|component)\b/i.test(row.level)) problems.push({ rule: 'level', message: `a test has no level (unit, integration, end-to-end): ${row.text.trim().slice(0, 80)}` });
  }
  const all = rows.map(row => `${row.kind} ${row.text}`).join('\n');
  if (rows.length && !/\b(negative|error|invalid|reject|denied|forbidden|fail)/i.test(all)) problems.push({ rule: 'negative', message: 'no negative or error test' });
  if (rows.length && !/\b(boundary|edge|limit|maximum|minimum|exactly)/i.test(all)) problems.push({ rule: 'boundary', message: 'no boundary test' });
  if (spec !== undefined) {
    const wanted = new Set(spec.match(/\bAC-\d+\b/g) ?? []);
    const planned = new Set(rows.flatMap(row => row.criteria));
    for (const id of wanted) if (!planned.has(id)) problems.push({ rule: 'coverage', message: `${id} has no test` });
    for (const id of planned) if (!wanted.has(id)) problems.push({ rule: 'coverage', message: `${id} is not in the specification` });
  }
  const placeholder = /\b(TODO|FIXME|TBD|XXX)\b/.exec(plan.replace(/`[^`\n]*`/g, ''));
  if (placeholder) problems.push({ rule: 'placeholder', message: `"${placeholder[1]}" left in the plan` });
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const rest = args.filter(arg => arg !== '--json');
  const at = rest.indexOf('--spec');
  const specFile = at === -1 ? undefined : rest[at + 1];
  const files = at === -1 ? rest : rest.filter((arg, i) => i !== at && i !== at + 1);
  if (files.length !== 1 || (at !== -1 && !specFile)) {
    console.error('Usage: node check-test-plan.mjs [--json] [--spec <spec.md>] <plan.md>');
    process.exit(2);
  }
  let plan;
  let spec;
  try {
    plan = fs.readFileSync(files[0], 'utf8');
    spec = specFile === undefined ? undefined : fs.readFileSync(specFile, 'utf8');
  } catch (error) {
    console.error(`check-test-plan: cannot read: ${error.code ?? error.message}`);
    process.exit(2);
  }
  const report = checkPlan(plan, spec);
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${files[0]}: ${p.rule}: ${p.message}`);
    console.log(`Checked ${planRows(plan).length} planned test(s): ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
