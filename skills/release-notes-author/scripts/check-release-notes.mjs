#!/usr/bin/env node
/**
 * Checks release notes, whatever wrote them:
 *   - the version (X.Y.Z) in the title
 *   - when there is a breaking change, an upgrade or migration section
 *   - when there is a breaking change or a migration, a rollback section
 *   - no bare commit hashes as entries, and no placeholder notes
 *     (TODO, FIXME, TBD, XXX)
 *
 * Usage: node check-release-notes.mjs [--json] <notes.md>
 * Exits 1 on any problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';

function prose(text) {
  return text.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\s*$/gm, '').replace(/`[^`\n]*`/g, 'code');
}

export function checkNotes(text) {
  const problems = [];
  const body = prose(text);
  const title = /^#\s+(.*)$/m.exec(body)?.[1] ?? '';
  if (!/\bv?\d+\.\d+\.\d+\b/.test(title)) problems.push({ rule: 'version', message: 'the title does not name the version (X.Y.Z)' });
  const headings = [...body.matchAll(/^#{2,3}\s+(.*)$/gm)].map(m => m[1].toLowerCase());
  const breaking = headings.some(h => /breaking/.test(h)) || /\bbreaking change\b/i.test(body);
  const migration = headings.some(h => /migrat/.test(h)) || /\bmigration\b/i.test(body);
  if (breaking && !headings.some(h => /upgrad|migrat|how to update|what to do/.test(h))) {
    problems.push({ rule: 'upgrade', message: 'a breaking change has no upgrade or migration section saying what to do' });
  }
  if ((breaking || migration) && !headings.some(h => /roll ?back|revert|downgrad/.test(h))) {
    problems.push({ rule: 'rollback', message: 'a breaking change or migration has no rollback section' });
  }
  body.split('\n').forEach((line, index) => {
    if (/^\s*[-*]\s+`?[0-9a-f]{7,40}`?\s*$/.test(line)) problems.push({ rule: 'entry', line: index + 1, message: 'an entry is only a commit hash; say what changed for the reader' });
    const placeholder = /\b(TODO|FIXME|TBD|XXX)\b/.exec(line);
    if (placeholder) problems.push({ rule: 'placeholder', line: index + 1, message: `"${placeholder[1]}" left in the notes` });
  });
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => arg !== '--json');
  if (files.length !== 1) {
    console.error('Usage: node check-release-notes.mjs [--json] <notes.md>');
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(files[0], 'utf8');
  } catch (error) {
    console.error(`check-release-notes: cannot read ${files[0]}: ${error.code ?? error.message}`);
    process.exit(2);
  }
  const report = checkNotes(text);
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${files[0]}${p.line ? `:${p.line}` : ''}: ${p.rule}: ${p.message}`);
    console.log(`Checked the notes: ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
