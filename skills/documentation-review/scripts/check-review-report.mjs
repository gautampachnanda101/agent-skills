#!/usr/bin/env node
/**
 * Zero-dependency structural checks for documentation-review reports.
 *
 * A report produced by applying the documentation-review skill must obey its
 * own rules, so a grader can verify them mechanically:
 *   - a classification statement (which Diátaxis form each reviewed page is)
 *   - a Findings table where every row carries a valid severity and, in its
 *     Location or Evidence column, the file it concerns (with a line where
 *     the finding is about specific text)
 *   - risk-ordered reporting: no finding precedes a more severe one
 *     (questions are not ranked)
 *   - an unevaluated/limitations statement (commands not run, links not
 *     fetched)
 *   - secrets never quoted in full
 *
 * Usage: node check-review-report.mjs <report.md> [...] [--json]
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SEVERITIES = ['blocker', 'major', 'minor', 'nit', 'question'];
const FORMS = ['tutorial', 'how-to', 'reference', 'explanation'];
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

// A page-level finding, such as a missing entry point, has no line to cite,
// so a named file is enough evidence for a documentation finding.
function hasEvidence(text) {
  return /[\w./-]+:\d+|\bline \d+|\bL\d+\b/i.test(text) || /[\w./-]+\.[A-Za-z]\w*/.test(text);
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

function checkReport(file, text) {
  const local = [];

  // Strip markdown emphasis and file names: `reference.md` is a filename,
  // not a Diátaxis form usage.
  const classification = (section(text, /^classif/i) ?? [])
    .join('\n')
    .replace(/\*\*/g, '')
    .replace(/[A-Za-z0-9_.-]+\.md\b/g, '');
  if (!FORMS.some(form => new RegExp(`\\b${form}\\b`, 'i').test(classification))) {
    local.push('no Diátaxis classification statement (which form each reviewed page is)');
  }

  const rows = checkFindings(text, local);
  findingRows += rows.length;
  const order = rows.map(row => SEVERITIES.indexOf(row.severity)).filter(rank => rank >= 0 && SEVERITIES[rank] !== 'question');
  if (order.some((rank, i) => i > 0 && rank < order[i - 1])) {
    local.push('findings were not reported in reader-risk order (blocker/major first, nit last)');
  }

  if (!/\bunevaluated\b|\bcould not (?:run|fetch|verify)|limitations/i.test(text)) {
    local.push('no unevaluated/limitations statement — say which commands or links could not be verified');
  }

  checkSecrets(text, local);

  problems.push(...local.map(message => ({ file: basename(file), message })));
  if (asJson) return;
  if (local.length === 0) {
    console.log(`${basename(file)}: report follows the skill's structural and evidence rules`);
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
