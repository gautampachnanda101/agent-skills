#!/usr/bin/env node
/**
 * Behaviour evals: run an assistant with tools in a fixture repository and
 * grade what it did, not only what it said. Works with any assistant that
 * has an adapter in scripts/agent-adapters/.
 *
 * Each case in skills/<skill>/evals/agent-evals.json names a fixture folder.
 * For every run its base/ folder is copied into a new temporary repository;
 * with "git", that is committed, then change/ is laid over it and committed
 * as the change under review. All of this repository's skills are installed
 * where the adapter's assistant looks for them, without their tests/ and
 * evals/ folders, so the assistant must choose the right skill and never
 * sees an answer key.
 *
 * Adapters turn each assistant's transcript into the same events:
 *   { kind: 'read' | 'search' | 'run' | 'write' | 'skill' | 'other',
 *     path?, command?, skill?, tool, denied, error }
 * Every tool call is denied unless the case allows it; denied attempts stay
 * in the transcript, so a write before confirmation is still caught.
 *
 * A case's "allow" is assistant-neutral:
 *   { "run": ["git show", ...],          command prefixes that may run
 *     "write": ["docs/guide.md", ...] }  files that may be written
 * {{skills}} in a prefix or prompt is the skills folder, and {{root}} the
 * repository's absolute path.
 *
 * A case's "ask" lists files the assistant itself must ask a person about
 * before writing, as a host permission rule would, overriding allow.write.
 * No person answers during an eval, so those writes are blocked by the
 * host, not by the model's choice. The model is not told in advance.
 *
 * Checks:
 *   skill            this skill must be loaded
 *   no_skill         none of these skills may be loaded
 *   read             files that must be read before the reply (path suffixes)
 *   ran              commands that must run (patterns), not only be attempted
 *   no_writes        no write may be attempted, and no file may change
 *   writes_only      only these paths may change (a folder/** allows
 *                    anything inside the folder, here and in allow.write)
 *   files            path -> patterns the file must contain afterwards
 *   must_match / must_not_match   reply patterns (multiline, ignore case)
 *
 * Usage:
 *   node scripts/agent-evals.mjs --agent <adapter> [--model <model>]
 *     [--base-url <url>] [--skill <name>] [--eval <id>] [--runs <n>]
 *     [--out <dir>] [--keep] [--record]
 *   node scripts/agent-evals.mjs --grade <skill> <eval-id> <record.json> [--save]
 *   node scripts/agent-evals.mjs --stale   recordings older than their skill
 *
 * --record saves each passing run as skills/<skill>/tests/agent-transcripts/
 * <eval-id>.json. The test suite grades those recordings against their
 * contracts, and checks that breaking each clause fails, with no model.
 * Adapters: claude-code, openai (any OpenAI-compatible server: llama.cpp's
 * llama-server, Ollama, or a hosted endpoint). Exits 1 if any run fails or
 * nothing matched, 2 on bad arguments, 3 when the assistant hits a usage or
 * rate limit, which stops the run because it says nothing about the skills.
 */
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ADAPTERS = ['claude-code', 'openai'];

function usageError(message) {
  console.error(`agent-evals: ${message}`);
  process.exit(2);
}

function option(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith('--')) usageError(`${name} needs a value`);
  return value;
}

export function skillVersion(skill) {
  const text = fs.readFileSync(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8');
  return /^metadata:\n(?:[ \t]+.*\n)*?[ \t]+version:[ \t]*["']?([^"'\s]+)/m.exec(text)?.[1] ?? null;
}

/**
 * A digest of what an assistant loads from a skill: every file outside
 * tests/ and evals/, with the version line left out. A change to the evals
 * or the version alone leaves it unchanged, so recordings stay current.
 */
export function skillDigest(skill, skillsRoot = path.join(root, 'skills')) {
  const dir = path.join(skillsRoot, skill);
  const hash = crypto.createHash('sha256');
  const walk = rel => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!rel && (entry.name === 'tests' || entry.name === 'evals')) continue;
      const next = path.join(rel, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) {
        let text = fs.readFileSync(path.join(dir, next), 'utf8');
        if (next === 'SKILL.md') text = text.replace(/^([ \t]+version:).*$/m, '$1');
        hash.update(`${next}\0${text}\0`);
      }
    }
  };
  walk('');
  return hash.digest('hex').slice(0, 16);
}

/** Why a recording needs re-recording, or null when it is current. */
export function staleness(recordingVersion, currentVersion, exists = true, recordingDigest = undefined, currentDigest = undefined) {
  if (!exists) return 'no recording';
  if (recordingDigest && currentDigest) return recordingDigest === currentDigest ? null : `recorded before the skill's text changed (now ${currentVersion})`;
  if (!recordingVersion) return `recorded before versions were tracked; the skill is ${currentVersion}`;
  if (recordingVersion !== currentVersion) return `recorded with ${recordingVersion}; the skill is ${currentVersion}`;
  return null;
}

/** Every case whose recorded transcript is missing or older than its skill. */
export function staleRecordings() {
  const stale = [];
  for (const skill of fs.readdirSync(path.join(root, 'skills')).filter(name => loadCases(name)).sort()) {
    const current = skillVersion(skill);
    for (const evalCase of loadCases(skill).evals) {
      const file = path.join(root, 'skills', skill, 'tests', 'agent-transcripts', `${evalCase.id}.json`);
      const stored = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
      const why = staleness(stored?.skill_version, current, Boolean(stored), stored?.skill_digest, skillDigest(skill));
      if (why) stale.push({ skill, eval: evalCase.id, why });
    }
  }
  return stale;
}

export function loadCases(skill) {
  const file = path.join(root, 'skills', skill, 'evals', 'agent-evals.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

export async function loadAdapter(name) {
  if (!ADAPTERS.includes(name)) throw new Error(`unknown adapter "${name}"; choose ${ADAPTERS.join(', ')}`);
  return (await import(pathToFileURL(path.join(root, 'scripts', 'agent-adapters', `${name}.mjs`)).href)).default;
}

function copyTree(from, to, skip = () => false) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip(entry.name)) continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target, skip);
    else if (entry.isFile()) fs.copyFileSync(source, target);
  }
}

function git(dir, ...args) {
  const result = spawnSync('git', ['-c', 'user.name=Eval Author', '-c', 'user.email=author@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout;
}

/** Builds the temporary repository for one run and returns its path. */
export function scaffold(skill, evalCase, skillsDir, parent = os.tmpdir()) {
  const fixture = path.join(root, 'skills', skill, evalCase.fixture);
  const dir = fs.mkdtempSync(path.join(parent, 'agent-eval-'));
  copyTree(path.join(fixture, 'base'), dir);
  if (evalCase.git) {
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', evalCase.git.base_message ?? 'Initial version');
    if (fs.existsSync(path.join(fixture, 'change'))) {
      copyTree(path.join(fixture, 'change'), dir);
      git(dir, 'add', '-A');
      git(dir, 'commit', '-q', '-m', evalCase.git.message ?? 'Change under review');
    }
  }
  for (const name of fs.readdirSync(path.join(root, 'skills'))) {
    if (!fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))) continue;
    copyTree(path.join(root, 'skills', name), path.join(dir, skillsDir, name), entry => entry === 'tests' || entry === 'evals');
  }
  return dir;
}

/** A hash of every file outside .git and the assistant's own folders. */
export function snapshot(dir, ignore = []) {
  const skip = new Set(['.git', ...ignore.map(entry => entry.split('/')[0])]);
  const files = {};
  const walk = rel => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      if (!rel && skip.has(entry.name)) continue;
      const next = path.join(rel, entry.name);
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) files[next] = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, next))).digest('hex');
    }
  };
  walk('');
  return files;
}

export function changedFiles(before, after) {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names].filter(name => before[name] !== after[name]).sort();
}

const norm = file => String(file ?? '').replace(/\\/g, '/');

/** A write rule is a path, or a folder ending in /** for anything inside it. */
export function writeAllowed(rules, file) {
  const target = norm(file).replace(/^\.\//, '');
  return rules.some(rule => (rule.endsWith('/**') ? target.startsWith(rule.slice(0, -2)) : target === rule));
}

export function relativeTo(dir, file) {
  // macOS reports the same temporary folder as /var/... and /private/var/...
  const value = norm(file).replace(/^\/private\//, '/');
  if (value.startsWith('<repo>/')) return value.slice('<repo>/'.length);
  if (!dir) return value.replace(/^\.\//, '');
  const base = norm(dir).replace(/\/$/, '').replace(/^\/private\//, '/');
  if (value.startsWith(`${base}/`)) return value.slice(base.length + 1);
  return value.replace(/^\.\//, '');
}

function readsFile(event, wanted, dir) {
  const suffix = norm(wanted);
  if (event.kind === 'read' || event.kind === 'search') {
    const relative = relativeTo(dir, event.path);
    return relative === suffix || relative.endsWith(`/${suffix}`);
  }
  if (event.kind === 'run') {
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[\\s/'"])${escaped}($|[\\s'"])`).test(event.command ?? '');
  }
  return false;
}

function loadedSkill(event, name, dir) {
  if (event.kind === 'skill') return event.skill === name || String(event.skill).endsWith(`:${name}`);
  return event.kind === 'read' && !event.denied && relativeTo(dir, event.path).endsWith(`/${name}/SKILL.md`);
}

/**
 * A record is everything grading needs, with no access to the run's folder:
 * { events, reply, changed: [paths], files: { path: content | null } },
 * with event paths relative to the repository. Recorded transcripts are
 * graded the same way, so the contracts are tested without a model.
 */
/**
 * Replaces the run's temporary folder with <repo> everywhere in a record,
 * so recordings hold no machine-specific paths. Paths elsewhere keep only
 * their file name.
 */
export function redact(value) {
  const temp = [...new Set([os.tmpdir(), fs.realpathSync(os.tmpdir())])].map(dir => dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const runDir = new RegExp(`(?:/private)?(?:${temp.join('|')})/agent-eval-[A-Za-z0-9]+`, 'g');
  const text = JSON.stringify(value).replace(runDir, '<repo>');
  return JSON.parse(text);
}

export function record(transcript, { dir, before, after, evalCase }) {
  const relative = event => {
    if (event.path === undefined) return event;
    const rel = relativeTo(dir, redact(event.path));
    return rel.startsWith('/') ? { ...event, path: `<outside>/${path.basename(rel)}`, outside: true } : { ...event, path: rel };
  };
  const files = {};
  for (const file of Object.keys(evalCase.checks?.files ?? {})) {
    const full = path.join(dir, file);
    files[file] = fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
  }
  return redact({ events: transcript.events.map(relative), reply: transcript.reply ?? '', changed: changedFiles(before, after), files });
}

export function grade(evalCase, run) {
  const checks = evalCase.checks ?? {};
  const failures = [];
  const { events, reply } = run;
  const dir = '';
  const done = events.filter(event => !event.denied);
  if (checks.skill && !events.some(event => loadedSkill(event, checks.skill, dir))) failures.push(`skill ${checks.skill} was not loaded`);
  for (const name of checks.no_skill ?? []) {
    if (events.some(event => loadedSkill(event, name, dir))) failures.push(`skill ${name} was loaded for an unrelated task`);
  }
  for (const file of checks.read ?? []) {
    if (!done.some(event => readsFile(event, file, dir))) failures.push(`never read ${file}`);
  }
  for (const pattern of checks.ran ?? []) {
    const re = new RegExp(pattern);
    const runs = events.filter(event => event.kind === 'run' && re.test(event.command ?? ''));
    if (!runs.length) failures.push(`never ran /${pattern}/`);
    else if (runs.every(event => event.denied)) failures.push(`/${pattern}/ was attempted but denied`);
  }
  const changed = run.changed ?? [];
  if (checks.no_writes) {
    // A write outside the repository, such as an assistant's own scratch
    // file, is not a change to the user's project.
    for (const event of events.filter(e => e.kind === 'write' && !e.outside)) {
      failures.push(`attempted to write ${relativeTo(dir, event.path)} before confirmation`);
    }
    if (changed.length) failures.push(`changed files: ${changed.join(', ')}`);
  }
  if (checks.writes_only) {
    const stray = changed.filter(file => !writeAllowed(checks.writes_only, file));
    if (stray.length) failures.push(`changed files outside ${checks.writes_only.join(', ')}: ${stray.join(', ')}`);
  }
  for (const [file, patterns] of Object.entries(checks.files ?? {})) {
    const text = run.files?.[file];
    if (text === null || text === undefined) {
      failures.push(`${file} was not written`);
      continue;
    }
    for (const pattern of patterns) if (!new RegExp(pattern, 'im').test(text)) failures.push(`${file} lacks /${pattern}/`);
  }
  for (const pattern of checks.must_match ?? []) {
    if (!new RegExp(pattern, 'im').test(reply)) failures.push(`reply lacks /${pattern}/`);
  }
  for (const pattern of checks.must_not_match ?? []) {
    const found = new RegExp(pattern, 'im').exec(reply);
    if (found) failures.push(`reply has /${pattern}/: "${found[0].slice(0, 60)}"`);
  }
  return { passed: failures.length === 0, failures, tool_calls: events.length, denied: events.filter(event => event.denied).length, changed };
}

/**
 * The note every prompt ends with, so any assistant knows what it may do,
 * as a person would from their own permission settings.
 */
export function permissionNote(allow) {
  const run = allow.run.length
    ? `run commands that start with ${allow.run.map(c => `\`${c}\``).join(', ')}, with any arguments, each on its own and not chained with other commands`
    : 'run no commands';
  const write = allow.write.length ? `write only ${allow.write.map(f => `\`${f}\``).join(', ')}` : 'write no files';
  return `(Permissions for this session: you may read any file in the repository, ${run}, and ${write}. Anything else is denied.)`;
}

/**
 * The case's allow rules and prompt with {{skills}} (the skills folder) and
 * {{root}} (the repository, as given and with symlinks resolved) filled in.
 */
export function resolveCase(evalCase, skillsDir, dir = '') {
  const roots = [...new Set([dir, dir && fs.existsSync(dir) ? fs.realpathSync(dir) : dir])];
  const fill = text => text.replaceAll('{{skills}}', skillsDir);
  const expand = text => (text.includes('{{root}}') ? roots.map(root => fill(text).replaceAll('{{root}}', root)) : [fill(text)]);
  const allow = { run: [...new Set((evalCase.allow?.run ?? []).flatMap(expand))], write: evalCase.allow?.write ?? [], ask: evalCase.ask ?? [] };
  const shown = { run: (evalCase.allow?.run ?? []).filter(rule => !rule.includes('{{root}}')).map(fill), write: allow.write };
  return { prompt: `${fill(evalCase.prompt)}\n\n${permissionNote(shown)}`, allow };
}

const CHECK_KEYS = new Set(['skill', 'no_skill', 'read', 'ran', 'no_writes', 'writes_only', 'files', 'must_match', 'must_not_match']);

/** Problems with a case's contract, before any model runs. */
export function validateCase(skill, evalCase) {
  const problems = [];
  const where = `${skill}#${evalCase.id}`;
  if (!evalCase.id || !evalCase.prompt || !evalCase.fixture) problems.push(`${where}: id, prompt, and fixture are required`);
  const fixture = path.join(root, 'skills', skill, evalCase.fixture ?? '');
  if (!fs.existsSync(path.join(fixture, 'base'))) problems.push(`${where}: no ${evalCase.fixture}/base folder`);
  if (fs.existsSync(path.join(fixture, 'change')) && !evalCase.git) problems.push(`${where}: change/ needs "git"`);
  const checks = evalCase.checks ?? {};
  if (!Object.keys(checks).length) problems.push(`${where}: no checks`);
  for (const key of Object.keys(checks)) if (!CHECK_KEYS.has(key)) problems.push(`${where}: unknown check "${key}"`);
  for (const file of evalCase.ask ?? []) {
    if (!writeAllowed(evalCase.allow?.write ?? [], file)) problems.push(`${where}: ask ${file} needs a matching allow.write, or the model is simply told it cannot write`);
  }
  const patterns = [...(checks.ran ?? []), ...(checks.must_match ?? []), ...(checks.must_not_match ?? []), ...Object.values(checks.files ?? {}).flat()];
  for (const pattern of patterns) {
    try {
      new RegExp(pattern);
    } catch {
      problems.push(`${where}: invalid pattern /${pattern}/`);
    }
  }
  for (const pattern of checks.ran ?? []) {
    const allowed = (evalCase.allow?.run ?? []).some(prefix => new RegExp(pattern).test(prefix.replaceAll('{{skills}}', '.x/skills').replaceAll('{{root}}', '/r')));
    if (!allowed) problems.push(`${where}: /${pattern}/ must run, but no allowed command matches it`);
  }
  for (const file of [...(checks.writes_only ?? []), ...Object.keys(checks.files ?? {})]) {
    const rules = evalCase.allow?.write ?? [];
    if (!rules.includes(file) && !writeAllowed(rules, file)) problems.push(`${where}: ${file} is checked but not allowed to be written`);
  }
  if (checks.no_writes && (evalCase.allow?.write ?? []).length) problems.push(`${where}: no_writes contradicts allow.write`);
  return problems;
}

async function main() {
  if (process.argv.includes('--stale')) {
    const stale = staleRecordings();
    if (!stale.length) console.log('Behaviour-eval recordings: all current.');
    else {
      console.log(`Behaviour-eval recordings to re-record (${stale.length}); run make skill-agent-evals RECORD=1:`);
      for (const { skill, eval: id, why } of stale) console.log(`  ${skill}#${id}: ${why}`);
    }
    return;
  }
  const gradeArgs = process.argv.indexOf('--grade');
  if (gradeArgs !== -1) {
    const [skill, id, file] = process.argv.slice(gradeArgs + 1);
    if (!file) usageError('--grade needs <skill> <eval-id> <record.json>');
    const evalCase = loadCases(skill)?.evals.find(e => String(e.id) === id);
    if (!evalCase) usageError(`no agent eval ${skill}#${id}`);
    const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    const run = stored.record ?? stored;
    const result = grade(evalCase, run);
    console.log(JSON.stringify(result, null, 2));
    // --save keeps a run that passes as the case's recording, so a check
    // that changes needs no new model run.
    if (result.passed && process.argv.includes('--save')) {
      if (!stored.agent || !stored.model) usageError('--save needs a run output from this runner, which names its agent and model');
      const target = path.join(root, 'skills', skill, 'tests', 'agent-transcripts', `${id}.json`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const { events, reply, changed, files } = run;
      fs.writeFileSync(target, JSON.stringify({ agent: stored.agent, model: stored.model, skill_version: skillVersion(skill), skill_digest: skillDigest(skill), recorded: new Date().toISOString().slice(0, 10), events, reply, changed, files }, null, 2) + '\n');
      console.error(`agent-evals: saved ${path.relative(root, target)}`);
    }
    process.exit(result.passed ? 0 : 1);
  }
  const agent = option('--agent');
  if (!agent) usageError(`--agent is required: ${ADAPTERS.join(', ')}`);
  let adapter;
  try {
    adapter = await loadAdapter(agent);
  } catch (error) {
    usageError(error.message);
  }
  const runsOption = option('--runs', '1');
  if (!/^[1-9]\d*$/.test(runsOption)) usageError(`--runs must be a whole number of 1 or more, not "${runsOption}"`);
  const runs = Number(runsOption);
  const settings = { model: option('--model', adapter.defaultModel), baseUrl: option('--base-url', adapter.defaultBaseUrl) };
  if (!settings.model) usageError(`--model is required for ${agent}`);
  const only = option('--skill');
  const onlyEval = option('--eval');
  const keep = process.argv.includes('--keep');
  const recordDir = process.argv.includes('--record');
  const out = path.resolve(option('--out', path.join(root, '.eval-results', 'agent', agent)));
  const skills = only ? [only] : fs.readdirSync(path.join(root, 'skills')).filter(skill => loadCases(skill));
  fs.mkdirSync(out, { recursive: true });
  const summary = [];
  for (const skill of skills) {
    const spec = loadCases(skill);
    if (!spec) usageError(`no evals/agent-evals.json for skill "${skill}"`);
    for (const evalCase of spec.evals.filter(e => !onlyEval || String(e.id) === onlyEval)) {
      for (let run = 1; run <= runs; run++) {
        const label = `${skill}#${evalCase.id} run ${run}/${runs}`;
        const dir = scaffold(skill, evalCase, adapter.skillsDir);
        const before = snapshot(dir, adapter.ownFiles);
        const started = Date.now();
        const { prompt, allow } = resolveCase(evalCase, adapter.skillsDir, dir);
        const transcript = await adapter.run({ dir, prompt, allow, ...settings });
        if (transcript.fatal) {
          // Stop: every later run would fail the same way, and none of it
          // would be evidence about the skills.
          if (!keep) fs.rmSync(dir, { recursive: true, force: true });
          fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
          console.error(`agent-evals: stopped at ${label}: ${transcript.failure}. ${summary.length} run(s) finished before it; nothing after it ran.`);
          process.exit(3);
        }
        const result = record(transcript, { dir, before, after: snapshot(dir, adapter.ownFiles), evalCase });
        const graded = grade(evalCase, result);
        if (transcript.failure) graded.failures.unshift(transcript.failure);
        graded.passed = graded.failures.length === 0;
        const base = path.join(out, `${skill}-${evalCase.id}-${run}`);
        fs.writeFileSync(`${base}.log`, transcript.raw ?? '');
        fs.writeFileSync(`${base}.json`, JSON.stringify({ ...graded, agent, model: settings.model, cost_usd: transcript.cost ?? null, record: result }, null, 2) + '\n');
        if (recordDir && graded.passed) {
          const file = path.join(root, 'skills', skill, 'tests', 'agent-transcripts', `${evalCase.id}.json`);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, JSON.stringify({ agent, model: settings.model, skill_version: skillVersion(skill), skill_digest: skillDigest(skill), recorded: new Date().toISOString().slice(0, 10), ...result }, null, 2) + '\n');
        }
        if (!keep) fs.rmSync(dir, { recursive: true, force: true });
        const seconds = Math.round((Date.now() - started) / 1000);
        summary.push({ agent, model: settings.model, skill, eval: evalCase.id, run, passed: graded.passed, seconds, cost_usd: transcript.cost ?? null, failures: graded.failures });
        const cost = transcript.cost == null ? '' : `, $${transcript.cost.toFixed(2)}`;
        console.log(`${graded.passed ? 'PASS' : 'FAIL'} ${label} (${seconds}s, ${graded.tool_calls} tool calls, ${graded.denied} denied${cost})${keep ? ` ${dir}` : ''}`);
        for (const failure of graded.failures) console.log(`  - ${failure}`);
      }
    }
  }
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  if (!summary.length) {
    console.error('agent-evals: no cases matched');
    process.exit(1);
  }
  const passed = summary.filter(s => s.passed).length;
  const cost = summary.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0);
  console.log(`${passed}/${summary.length} runs passed${cost ? `, $${cost.toFixed(2)}` : ''}; transcripts in ${out}`);
  process.exit(passed === summary.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) await main();
