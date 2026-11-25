#!/usr/bin/env node
/**
 * Zero-dependency structural checks for peer-code-review reports.
 *
 * A report produced by applying the peer-code-review skill must obey its own
 * rules, so a grader can verify them mechanically:
 *   - one recognized verdict line (approve / approve with comments /
 *     request changes / split before review) that agrees with the severities
 *     of the open findings
 *   - a Findings table where every row carries a valid severity and, in its
 *     Location or Evidence column, a file:line location (or a file and a
 *     quote, for deleted files)
 *   - a strengths section (genuine praise belongs in the report)
 *   - tone: no author-directed blame ("you should have ...") outside code
 *   - secrets: a secret-shaped token found in the diff may be named as
 *     present but must never be quoted in full
 *
 * Usage: node check-review-report.mjs <report.md> [...] [--json]
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const VERDICT = /verdict[^a-z]*(approve with comments|approve(?! with)|request changes|split before review)(?![\w-])/i;
const SEVERITIES = ['blocker', 'major', 'minor', 'nit', 'question', 'defer'];
const SECRET_SHAPES = [
  /gh[opsu]_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AKIA[0-9A-Z]{12,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /[A-Za-z0-9]{40,}/,
];

const args = process.argv.slice(2).filter(a => a !== '--json');
const asJson = process.argv.includes('--json');

if (args.length === 0) {
  const [header] = readFileSync(new URL(import.meta.url), 'utf8').split('*/');
  console.log(header.replace(/^#!.*\n\/\*\*\n/, '').replace(/^ \* ?/gm, '').trim());
  process.exit(2);
}

const problems = [];
let checked = 0;
let findingRows = 0;

// Fenced blocks can hold `#` comments and `|` pipes that are not report
// structure.
function withoutFences(text) {
  return text.replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[^\n]*$/gm, '');
}

// The body of the first heading matching `title`, subheadings included.
function section(text, title) {
  const lines = withoutFences(text).split('\n');
  let level = 0;
  const body = [];
  for (const line of lines) {
    const heading = /^(#+)\s+(.*)$/.exec(line);
    if (level && heading && heading[1].length <= level) break;
    if (level) body.push(line);
    else if (heading && title.test(heading[2])) level = heading[1].length;
  }
  return level ? body : null;
}

// Splits a table row on its separators, not on pipes inside code spans or
// escaped pipes.
function cells(row) {
  const parts = row.trim().match(/(?:`[^`]*`|\\.|[^|])+|\|(?=\|)/g) ?? [];
  return parts.map(part => (part === '|' ? '' : part.trim()));
}

function plain(cell) {
  return cell.replace(/[`*_]/g, '').trim();
}

// Finding rows with the cells their own table header names.
function findings(lines) {
  const rows = [];
  let header = null;
  for (const line of lines) {
    if (!line.trim().startsWith('|')) {
      header = null;
      continue;
    }
    const row = cells(line);
    if (!header) {
      header = row.map(cell => plain(cell).toLowerCase());
      continue;
    }
    if (row.every(cell => /^:?-+:?$/.test(cell))) continue;
    const pick = names => row.filter((_, i) => names.includes(header[i])).join(' ');
    rows.push({
      label: line.trim().slice(0, 80),
      complete: row.length === header.length,
      severity: plain(pick(['severity'])).toLowerCase(),
      evidence: pick(['location', 'evidence', 'location and evidence']),
    });
  }
  return rows;
}

// file:line, or a named file (a deleted one has no line) with a quote.
function hasEvidence(text) {
  if (/[\w./-]+:\d+|\bline \d+|\bL\d+\b/i.test(text)) return true;
  const file = /[\w./-]+\.[A-Za-z]\w*/;
  const spans = text.match(/`[^`]+`|"[^"]+"/g) ?? [];
  return file.test(text) && spans.some(span => !new RegExp(`^${file.source}$`).test(span.slice(1, -1)));
}

function checkFindings(text, local) {
  const body = section(text, /^findings/i);
  if (!body) {
    local.push('no Findings section');
    return [];
  }
  const rows = findings(body);
  for (const row of rows) {
    if (!row.complete) local.push(`finding row whose cells do not match its table header: ${row.label}`);
    if (!SEVERITIES.includes(row.severity)) local.push(`finding row without a severity token: ${row.label}`);
    if (!hasEvidence(row.evidence)) local.push(`finding row without a file:line location or quoted evidence: ${row.label}`);
  }
  return rows;
}

// Reports the line, never the value. Full Git SHAs and SHA-256 digests are
// evidence, not secrets.
function checkSecrets(text, local) {
  text.split('\n').forEach((line, index) => {
    for (const shape of SECRET_SHAPES) {
      const found = line.match(new RegExp(shape.source, 'g')) ?? [];
      if (found.some(value => !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(value))) {
        local.push(`possible secret quoted on line ${index + 1} (name its presence instead)`);
        return;
      }
    }
  });
}

function checkVerdict(text, rows, local) {
  const verdict = VERDICT.exec(text)?.[1].toLowerCase();
  if (!verdict) {
    local.push('no recognized verdict line (expected approve / approve with comments / request changes / split before review)');
    return;
  }
  const blocking = rows.some(row => row.severity === 'blocker' || row.severity === 'major');
  if (verdict.startsWith('approve') && blocking) local.push(`verdict is "${verdict}" with an open blocker or major`);
  if (verdict === 'request changes' && !blocking) local.push('verdict is "request changes" without a blocker or major');
}

function checkReport(file, text) {
  const local = [];

  const rows = checkFindings(text, local);
  findingRows += rows.length;
  checkVerdict(text, rows, local);

  if (!/strength/i.test(text)) local.push('no strengths section — genuine praise belongs in the report');

  const prose = withoutFences(text).replace(/`[^`\n]*`/g, '');
  const blame = prose.match(/\byou should(?: have|'ve)?\b|\byou must fix\b|\byou failed\b/gi);
  if (blame) local.push(`author-directed blame language: ${blame.join(', ')} (talk about the code, not the person)`);

  checkSecrets(text, local);

  problems.push(...local.map(message => ({ file: basename(file), message })));
  if (asJson) return;
  if (local.length === 0) {
    console.log(`${basename(file)}: report follows the skill's structural and tone rules`);
  } else {
    console.log(`${basename(file)}: ${local.length} problem(s)`);
    for (const problem of local) console.log(`  error: ${problem}`);
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
