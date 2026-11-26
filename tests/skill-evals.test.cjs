const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const runner = path.join(root, 'scripts', 'skill-evals.mjs');
const load = () => import(runner);

const skills = fs.readdirSync(path.join(root, 'skills')).filter(skill =>
  fs.existsSync(path.join(root, 'skills', skill, 'evals', 'evals.json')));

function evalsOf(skill) {
  return JSON.parse(fs.readFileSync(path.join(root, 'skills', skill, 'evals', 'evals.json'), 'utf8'));
}

for (const skill of skills) {
  test(`evals for ${skill} reference real files and never send an answer key`, async () => {
    const { buildPrompt } = await load();
    const spec = evalsOf(skill);
    for (const guide of spec.guides ?? []) assert.ok(fs.existsSync(path.join(root, 'skills', skill, guide)), guide);
    for (const evalCase of spec.evals) {
      for (const file of evalCase.files ?? []) assert.ok(fs.existsSync(path.join(root, 'skills', skill, file)), file);
      for (const key of ['grader', 'ledger']) {
        const file = evalCase.checks?.[key];
        if (file) assert.ok(fs.existsSync(path.join(root, 'skills', skill, file)), file);
      }
      for (const pattern of [...(evalCase.checks?.must_match ?? []), ...(evalCase.checks?.must_not_match ?? [])]) {
        assert.doesNotThrow(() => new RegExp(pattern, 'im'), pattern);
      }
      if (!evalCase.checks) continue;
      const prompt = buildPrompt(skill, spec, evalCase);
      if (evalCase.checks.ledger) {
        const ledger = JSON.parse(fs.readFileSync(path.join(root, 'skills', skill, evalCase.checks.ledger), 'utf8'));
        for (const defect of ledger) assert.ok(!prompt.includes(defect.defect), `prompt leaks "${defect.defect}"`);
        assert.ok(!/ledger|planted/i.test(prompt.slice(prompt.indexOf('<file'))), 'inputs mention the answer key');
      }
    }
  });
}

test('the expected reports pass their own eval checks', async () => {
  const { grade } = await load();
  const cases = [
    ['peer-code-review', 1, 'planted-defects-report.md'],
    ['peer-code-review', 2, 'clean-report.md'],
    ['documentation-review', 1, 'planted-defects-report.md'],
    ['documentation-review', 2, 'clean-report.md'],
  ];
  for (const [skill, id, file] of cases) {
    const evalCase = evalsOf(skill).evals.find(e => e.id === id);
    const reply = fs.readFileSync(path.join(root, 'skills', skill, 'tests', 'expected', file), 'utf8');
    const result = grade(skill, evalCase, reply);
    assert.ok(result.passed, `${skill}/${file}: ${result.failures.join('; ')}`);
  }
});

test('grading catches a missed defect, a wrong severity, and an over-severe clean review', async () => {
  const { grade } = await load();
  const spec = evalsOf('peer-code-review');
  const planted = fs.readFileSync(path.join(root, 'skills', 'peer-code-review', 'tests', 'expected', 'planted-defects-report.md'), 'utf8');
  const missing = planted.split('\n').filter(line => !/helpers\/queue\.ts/.test(line)).join('\n');
  assert.notEqual(missing, planted);
  assert.match(grade('peer-code-review', spec.evals[0], missing).failures.join('\n'), /missed: Hardcoded token/);
  const demoted = planted.replace(/^\| `?major`? (\|[^\n]*consumer\.test\.ts)/m, '| nit $1');
  assert.notEqual(demoted, planted);
  assert.match(grade('peer-code-review', spec.evals[0], demoted).failures.join('\n'), /wrong severity for "The failure-path test/);
  const clean = fs.readFileSync(path.join(root, 'skills', 'peer-code-review', 'tests', 'expected', 'clean-report.md'), 'utf8');
  const escalated = clean.replace(/^\| `?(nit|minor|question)`? /m, '| major ');
  assert.notEqual(escalated, clean);
  assert.match(grade('peer-code-review', spec.evals[1], escalated).failures.join('\n'), /finding above minor/);
});

test('the runner sends prompts to SKILL_EVAL_CMD and writes a summary', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-evals-'));
  try {
    const reply = path.join(root, 'skills', 'peer-code-review', 'tests', 'expected', 'clean-report.md');
    const result = spawnSync(process.execPath, [runner, '--skill', 'peer-code-review', '--eval', '2', '--out', out], {
      encoding: 'utf8',
      env: { ...process.env, SKILL_EVAL_CMD: `cat >/dev/null; cat '${reply}'` },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /PASS peer-code-review#2/);
    const summary = JSON.parse(fs.readFileSync(path.join(out, 'summary.json'), 'utf8'));
    assert.equal(summary.length, 1);
    assert.equal(summary[0].passed, true);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('without SKILL_EVAL_CMD the runner prints usage', () => {
  const env = { ...process.env };
  delete env.SKILL_EVAL_CMD;
  const result = spawnSync(process.execPath, [runner], { encoding: 'utf8', env });
  assert.equal(result.status, 2);
  assert.match(result.stdout, /SKILL_EVAL_CMD/);
});
