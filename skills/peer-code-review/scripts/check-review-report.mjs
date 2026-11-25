#!/usr/bin/env node
/**
 * Zero-dependency structural checks for peer-code-review reports.
 *
 * A report produced by applying the peer-code-review skill must obey its own
 * rules, so a grader can verify them mechanically:
 *   - one recognized verdict line (approve / approve with comments /
 *     request changes / split before review)
 *   - a Findings table where every row carries a valid severity and a
 *     file:line location with quoted evidence
 *   - a strengths section (genuine praise belongs in the report)
 *   - tone: no author-directed blame ("you should have ...")
 *   - secrets: a secret-shaped token found in the diff may be named as
 *     present but must never be quoted in full
 *
 * Usage: node check-review-report.mjs <report.md> [...] [--json]
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const VERDICTS = ['approve', 'approve with comments', 'request changes', 'split before review'];
const SEVERITIES = ['blocker', 'major', 'minor', 'nit', 'question', 'defer'];
const SECRET_SHAPES = [
  /ghp_[A-Za-z0-9]{20,}/,
  /gho_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{12,}/,
  /sk-[A-Za-z0-920-9]{20,}/,
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

  // 1. verdict
  const verdict = VERDICTS.find(v => new RegExp(`verdict[^a-z]*${v}`, 'i').test(text));
  if (!verdict) local.push("no recognized verdict line (expected approve / approve with comments / request changes / split before review)");

  // 2. findings table shape
  const findingSection = text.split(/^#+ /m).find(section => /^findings/im.test(section.trim()));
  if (!findingSection) {
    local.push('no Findings section');
  } else {
    const rows = findingSection.split('\n').filter(line => /^\|/.test(line.trim()));
    const dataRows = rows.filter(line => !/^\|\s*-{2,}/.test(line) && !/severity/i.test(line));
    findingRows += dataRows.length;
    for (const row of dataRows) {
      const severity = SEVERITIES.find(s => row.toLowerCase().includes(`\`${s}\``) || row.toLowerCase().match(new RegExp(`\\b${s}\\b`, 'i')));
      const location = row.match(/[A-Za-z0-9_./-]+:\d+|line \d+|\bL\d+\b/i) || row.match(/[A-Za-z0-9_./-]+\.(?:js|py|md|ts|go|rs|yaml|yml)[^\s|]*/);
      if (!severity) local.push(`finding row without a severity token: ${row.trim().slice(0, 80)}`);
      if (!location) local.push(`finding row without a file:line location or quote: ${row.trim().slice(0, 80)}`);
    }
  }

  // 3. strengths present
  if (!/strength/i.test(text)) local.push('no strengths section — genuine praise belongs in the report');

  // 4. tone: author-directed blame
  const blame = text.match(/\byou should(?: have|'ve)?\b|\byou must fix\b|\byou failed\b/gi);
  if (blame) local.push(`author-directed blame language: ${blame.join(', ')} (talk about the code, not the person)`);

  // 5. secrets must not be quoted in full
  for (const shape of SECRET_SHAPES) {
    const found = text.match(new RegExp(shape.source, 'g'));
    if (found) local.push(`possible secret quoted in the report: ${found[0].slice(0, 10)}... (name its presence instead)`);
  }

  if (local.length === 0) {
    console.log(`${basename(file)}: report follows the skill's structural and tone rules`);
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
