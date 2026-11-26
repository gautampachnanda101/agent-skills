#!/usr/bin/env node
/**
 * Runs the checkable cases in each skill's evals/evals.json against a model
 * and grades the replies.
 *
 * The model is any command that reads a prompt on stdin and prints its reply
 * on stdout, set in SKILL_EVAL_CMD. Each prompt holds the skill's SKILL.md,
 * the guides the eval file lists, the case's input files with line numbers,
 * and the task. Answer keys (ledgers) are never sent.
 *
 * A case is graded only when it has a `checks` object:
 *   grader         a script in the skill that must pass the reply
 *   ledger         a JSON list of defects; each must appear as one finding
 *                  row matching every `match` pattern, at an allowed severity
 *   max_severity   no finding may be more severe than this
 *   must_match     patterns the reply must contain (multiline, ignore case)
 *   must_not_match patterns the reply must not contain
 *   unwrap_fence   grade the contents of the reply's first fenced block
 *
 * Usage:
 *   SKILL_EVAL_CMD='<command>' node scripts/skill-evals.mjs \
 *     [--skill <name>] [--eval <id>] [--runs <n>] [--out <dir>] [--baseline]
 *   node scripts/skill-evals.mjs --grade <skill> <eval-id> <reply-file>
 *
 * --baseline sends the same task without the skill, for comparison.
 * Exits 1 if any graded run fails or nothing matched; 2 on bad arguments.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEVERITIES = ['blocker', 'major', 'minor', 'nit', 'question', 'defer'];

function usageError(message) {
  console.error(`skill-evals: ${message}`);
  process.exit(2);
}

function option(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith('--')) usageError(`${name} needs a value`);
  return value;
}

function loadEvals(skill) {
  const file = path.join(root, 'skills', skill, 'evals', 'evals.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function requireEvals(skill) {
  const spec = loadEvals(skill);
  if (!spec) usageError(`no evals/evals.json for skill "${skill}"`);
  return spec;
}

function numbered(text) {
  return text.split('\n').map((line, i) => `${String(i + 1).padStart(4)}  ${line}`).join('\n');
}

export function buildPrompt(skill, spec, evalCase, { baseline = false } = {}) {
  const dir = path.join(root, 'skills', skill);
  const parts = [];
  if (!baseline) {
    parts.push(`Apply this skill. You cannot run tools; everything you may read is below.\n\n<skill name="${skill}">\n${fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8')}\n</skill>`);
    for (const guide of spec.guides ?? []) {
      parts.push(`<guide file="${guide}">\n${fs.readFileSync(path.join(dir, guide), 'utf8')}\n</guide>`);
    }
  } else {
    parts.push('You cannot run tools; everything you may read is below.');
  }
  // Inputs are labelled by file name alone, so fixture folder names (which
  // may hint at the answer) never reach the model. Names must be unique.
  const names = (evalCase.files ?? []).map(file => path.basename(file));
  const clash = names.find((name, i) => names.indexOf(name) !== i);
  if (clash) throw new Error(`${skill}#${evalCase.id}: two input files are named ${clash}`);
  for (const file of evalCase.files ?? []) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    const name = path.basename(file);
    parts.push(`<file name="${name}" note="line numbers added">\n${file.endsWith('.diff') ? text : numbered(text)}\n</file>`);
  }
  parts.push(`<task>\n${evalCase.prompt}\n</task>`);
  return parts.join('\n\n');
}

function cells(row) {
  const parts = row.trim().match(/(?:`[^`]*`|\\.|[^|])+|\|(?=\|)/g) ?? [];
  return parts.map(part => (part === '|' ? '' : part.trim()));
}

// Finding rows from every table under the Findings heading.
export function findingRows(reply) {
  const text = reply.replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[^\n]*$/gm, '');
  const lines = text.split('\n');
  const start = lines.findIndex(line => /^#+\s+findings/i.test(line));
  if (start === -1) return [];
  const level = /^(#+)/.exec(lines[start])[1].length;
  const rows = [];
  let header = null;
  for (const line of lines.slice(start + 1)) {
    const heading = /^(#+)\s/.exec(line);
    if (heading && heading[1].length <= level) break;
    if (!line.trim().startsWith('|')) {
      header = null;
      continue;
    }
    const row = cells(line);
    if (!header) {
      header = row.map(cell => cell.replace(/[`*_]/g, '').trim().toLowerCase());
      continue;
    }
    if (row.every(cell => /^:?-+:?$/.test(cell))) continue;
    const at = header.indexOf('severity');
    rows.push({ text: line, severity: at === -1 ? '' : (row[at] ?? '').replace(/[`*_]/g, '').trim().toLowerCase() });
  }
  return rows;
}

export function grade(skill, evalCase, reply) {
  const checks = evalCase.checks;
  const dir = path.join(root, 'skills', skill);
  const failures = [];
  let text = reply;
  if (checks.unwrap_fence) {
    const fence = /^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\s*$/m.exec(reply);
    if (!fence) failures.push('no fenced block in the reply');
    else text = fence[2];
  }
  for (const pattern of checks.must_match ?? []) {
    if (!new RegExp(pattern, 'im').test(text)) failures.push(`missing /${pattern}/`);
  }
  for (const pattern of checks.must_not_match ?? []) {
    const found = new RegExp(pattern, 'im').exec(text);
    if (found) failures.push(`unexpected /${pattern}/: "${found[0].slice(0, 60)}"`);
  }
  const rows = findingRows(text);
  if (checks.ledger) {
    const ledger = JSON.parse(fs.readFileSync(path.join(dir, checks.ledger), 'utf8'));
    const matches = (defect, row) => defect.match.every(pattern => new RegExp(pattern, 'i').test(row.text));
    // A row that reports several defects takes the severity of the worst one,
    // so it may be more severe than a lesser defect alone would be.
    const combined = row => ledger.filter(defect => matches(defect, row)).length > 1;
    const accepts = (defect, row) => defect.severity.includes(row.severity) ||
      (combined(row) && SEVERITIES.indexOf(row.severity) <= Math.max(...defect.severity.map(s => SEVERITIES.indexOf(s))));
    for (const defect of ledger) {
      const hits = rows.filter(row => matches(defect, row));
      if (!hits.length) failures.push(`missed: ${defect.defect}`);
      else if (!hits.some(row => accepts(defect, row))) {
        failures.push(`wrong severity for "${defect.defect}": ${hits.map(row => row.severity).join('/')} (accepted: ${defect.severity.join('/')})`);
      }
    }
  }
  if (checks.max_severity) {
    const limit = SEVERITIES.indexOf(checks.max_severity);
    for (const row of rows) {
      const rank = SEVERITIES.indexOf(row.severity);
      if (rank !== -1 && rank < limit) failures.push(`finding above ${checks.max_severity}: ${row.text.trim().slice(0, 100)}`);
    }
  }
  if (checks.grader) {
    const scratch = fs.mkdtempSync(path.join(process.env.TMPDIR ?? '/tmp', 'skill-eval-'));
    const file = path.join(scratch, 'reply.md');
    fs.writeFileSync(file, text);
    const result = spawnSync(process.execPath, [path.join(dir, checks.grader), '--json', file], { encoding: 'utf8' });
    fs.rmSync(scratch, { recursive: true, force: true });
    if (result.status !== 0) {
      let messages = [result.stderr.trim() || 'grader failed'];
      try {
        messages = JSON.parse(result.stdout).problems.map(problem => problem.message);
      } catch {}
      failures.push(...messages.map(message => `grader: ${message}`));
    }
  }
  return { passed: failures.length === 0, failures, findings: rows.length };
}

function skillsWithEvals() {
  return fs.readdirSync(path.join(root, 'skills')).filter(skill => loadEvals(skill)?.evals.some(e => e.checks));
}

function main() {
  const gradeArgs = process.argv.indexOf('--grade');
  if (gradeArgs !== -1) {
    const [skill, id, file] = process.argv.slice(gradeArgs + 1);
    if (!file) usageError('--grade needs <skill> <eval-id> <reply-file>');
    const evalCase = requireEvals(skill).evals.find(e => String(e.id) === id);
    if (!evalCase) usageError(`${skill} has no eval with id ${id}`);
    if (!evalCase.checks) usageError(`${skill}#${id} has no checks to grade`);
    if (!fs.existsSync(file)) usageError(`no reply file at ${file}`);
    const result = grade(skill, evalCase, fs.readFileSync(file, 'utf8'));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.passed ? 0 : 1);
  }
  const command = process.env.SKILL_EVAL_CMD;
  if (!command) {
    const [header] = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/');
    console.log(header.replace(/^#!.*\n\/\*\*\n/, '').replace(/^ \* ?/gm, '').trim());
    process.exit(2);
  }
  const runsOption = option('--runs', '1');
  if (!/^[1-9]\d*$/.test(runsOption)) usageError(`--runs must be a whole number of 1 or more, not "${runsOption}"`);
  const runs = Number(runsOption);
  const baseline = process.argv.includes('--baseline');
  const out = path.resolve(option('--out', path.join(root, '.eval-results')));
  fs.mkdirSync(out, { recursive: true });
  const only = option('--skill');
  const onlyEval = option('--eval');
  const summary = [];
  for (const skill of only ? [only] : skillsWithEvals()) {
    const spec = requireEvals(skill);
    for (const evalCase of spec.evals.filter(e => e.checks && (!onlyEval || String(e.id) === onlyEval))) {
      const prompt = buildPrompt(skill, spec, evalCase, { baseline });
      for (let run = 1; run <= runs; run++) {
        const label = `${skill}#${evalCase.id}${baseline ? ' (baseline)' : ''} run ${run}/${runs}`;
        const started = Date.now();
        let reply = '';
        try {
          reply = execFileSync('sh', ['-c', command], { input: prompt, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 15 * 60_000 });
        } catch (error) {
          reply = String(error.stdout ?? '');
          console.error(`${label}: model command failed: ${String(error.message).split('\n')[0]}`);
        }
        const base = path.join(out, `${skill}-${evalCase.id}${baseline ? '-baseline' : ''}-${run}`);
        fs.writeFileSync(`${base}.md`, reply);
        const result = grade(skill, evalCase, reply);
        fs.writeFileSync(`${base}.json`, JSON.stringify(result, null, 2) + '\n');
        summary.push({ skill, eval: evalCase.id, run, baseline, passed: result.passed, seconds: Math.round((Date.now() - started) / 1000), failures: result.failures });
        console.log(`${result.passed ? 'PASS' : 'FAIL'} ${label} (${summary.at(-1).seconds}s)`);
        for (const failure of result.failures) console.log(`  - ${failure}`);
      }
    }
  }
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  if (!summary.length) {
    console.error(`skill-evals: no graded cases matched${only ? ` --skill ${only}` : ''}${onlyEval ? ` --eval ${onlyEval}` : ''}`);
    process.exit(1);
  }
  const passed = summary.filter(s => s.passed).length;
  console.log(`${passed}/${summary.length} runs passed; replies in ${out}`);
  process.exit(passed === summary.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
