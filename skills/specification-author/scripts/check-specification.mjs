#!/usr/bin/env node
/**
 * Checks that a specification can be built and tested from, whatever wrote
 * it:
 *   - one H1 title, and sections for the need, the scope, the non-goals,
 *     the requirements, and the acceptance criteria
 *   - acceptance criteria with unique IDs (AC-1, AC-2, ...), each with
 *     Given, When, and Then
 *   - every requirement ID (R-1, ...) covered by at least one criterion
 *   - no untestable words ("fast", "user-friendly", ...) outside code; say
 *     how fast, for whom, measured how
 *   - no placeholder notes (TODO, FIXME, TBD, XXX); open questions go in an
 *     "Open questions" section
 *
 * Usage: node check-specification.mjs [--json] <spec.md...>
 * Exits 1 on any problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';

const SECTIONS = [
  ['the need', /^##\s+(problem|user need|need|why|background|context)\b/im],
  ['scope', /^##\s+(scope|goals|in scope)\b/im],
  ['non-goals', /^##\s+(non-goals|out of scope|not in scope)\b/im],
  ['requirements', /^##\s+(requirements|functional requirements)\b/im],
  ['acceptance criteria', /^##\s+acceptance criteria\b/im],
];
const VAGUE = /\b(fast|quick(?:ly)?|user[- ]friendly|intuitive|easy|easily|seamless(?:ly)?|robust|scalable|as soon as possible|asap|efficient(?:ly)?|appropriate(?:ly)?|etc\.?)(?=[\s.,;:)]|$)/i;

function prose(text) {
  return text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '').replace(/`[^`\n]*`/g, '');
}

function section(body, pattern) {
  const start = body.search(pattern);
  if (start === -1) return '';
  const rest = body.slice(start).split('\n').slice(1).join('\n');
  const end = rest.search(/^##\s/m);
  return end === -1 ? rest : rest.slice(0, end);
}

export function checkSpecification(text) {
  const problems = [];
  const body = prose(text);
  const titles = body.match(/^#\s+\S.*$/gm) ?? [];
  if (titles.length !== 1) problems.push({ rule: 'title', message: `expected one "# " title, found ${titles.length}` });
  for (const [name, pattern] of SECTIONS) {
    if (!pattern.test(body)) problems.push({ rule: 'section', message: `no section for ${name}` });
  }
  const criteria = section(body, /^##\s+acceptance criteria\b/im);
  const blocks = criteria.split(/(?=\bAC-\d+\b)/).filter(block => /^AC-\d+\b/.test(block));
  if (!blocks.length && /^##\s+acceptance criteria\b/im.test(body)) problems.push({ rule: 'criteria', message: 'no acceptance criteria with IDs such as AC-1' });
  const ids = new Set();
  for (const block of blocks) {
    const id = /^AC-\d+/.exec(block)[0];
    if (ids.has(id)) problems.push({ rule: 'criteria', message: `${id} is used twice` });
    ids.add(id);
    for (const word of ['Given', 'When', 'Then']) {
      if (!new RegExp(`\\b${word}\\b`, 'i').test(block)) problems.push({ rule: 'criteria', message: `${id} has no "${word}"` });
    }
  }
  const requirements = new Set(section(body, /^##\s+(requirements|functional requirements)\b/im).match(/\bR-\d+\b/g) ?? []);
  for (const requirement of requirements) {
    if (!new RegExp(`\\b${requirement}\\b`).test(criteria)) problems.push({ rule: 'coverage', message: `${requirement} is not covered by any acceptance criterion` });
  }
  body.split('\n').forEach((line, index) => {
    if (/^#/.test(line)) return;
    const vague = VAGUE.exec(line);
    if (vague) problems.push({ rule: 'vague', line: index + 1, message: `"${vague[1]}" cannot be tested; say how much, for whom, measured how` });
    const placeholder = /\b(TODO|FIXME|TBD|XXX)\b/.exec(line);
    if (placeholder) problems.push({ rule: 'placeholder', line: index + 1, message: `"${placeholder[1]}" left in the spec; put it under "Open questions"` });
  });
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => arg !== '--json');
  if (!files.length) {
    console.error('Usage: node check-specification.mjs [--json] <spec.md...>');
    process.exit(2);
  }
  const report = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      console.error(`check-specification: cannot read ${file}: ${error.code ?? error.message}`);
      process.exit(2);
    }
    for (const problem of checkSpecification(text)) report.push({ file, ...problem });
  }
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${p.file}${p.line ? `:${p.line}` : ''}: ${p.rule}: ${p.message}`);
    console.log(`Checked ${files.length} spec(s): ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
