// Behaviour-eval contracts, graders, and adapters, tested with no model:
// recorded transcripts are graded against their contracts, and each
// contract clause is broken in turn to show the grader enforces it.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const load = () => import(path.join(root, 'scripts', 'agent-evals.mjs'));
const loadAdapter = name => import(path.join(root, 'scripts', 'agent-adapters', `${name}.mjs`));

const skills = fs.readdirSync(path.join(root, 'skills')).filter(skill =>
  fs.existsSync(path.join(root, 'skills', skill, 'evals', 'agent-evals.json')));

function cases(skill) {
  return JSON.parse(fs.readFileSync(path.join(root, 'skills', skill, 'evals', 'agent-evals.json'), 'utf8')).evals;
}

function recording(skill, id) {
  const file = path.join(root, 'skills', skill, 'tests', 'agent-transcripts', `${id}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

test('every skill has behaviour evals', () => {
  const all = fs.readdirSync(path.join(root, 'skills')).filter(skill => fs.existsSync(path.join(root, 'skills', skill, 'SKILL.md')));
  assert.deepEqual(skills.sort(), all.sort());
});

for (const skill of skills) {
  test(`behaviour contracts for ${skill} are well formed`, async () => {
    const { validateCase } = await load();
    const ids = cases(skill).map(c => c.id);
    assert.equal(new Set(ids).size, ids.length, 'case ids must be unique');
    for (const evalCase of cases(skill)) assert.deepEqual(validateCase(skill, evalCase), []);
  });

  test(`recorded transcripts for ${skill} meet their contracts, and breaking any clause fails`, async () => {
    const { grade } = await load();
    for (const evalCase of cases(skill)) {
      const run = recording(skill, evalCase.id);
      assert.ok(run, `${skill}#${evalCase.id} has no recorded transcript; run agent-evals with --record`);
      const verdict = grade(evalCase, run);
      assert.ok(verdict.passed, `${skill}#${evalCase.id}: ${verdict.failures.join('; ')}`);
      const checks = evalCase.checks;
      const fails = (label, broken) => {
        const result = grade(evalCase, broken);
        assert.ok(!result.passed, `${skill}#${evalCase.id}: breaking "${label}" was not caught`);
      };
      const events = run.events;
      if (checks.skill) fails('skill', { ...run, events: events.filter(e => e.kind !== 'skill' && !String(e.path ?? '').endsWith('/SKILL.md')) });
      for (const name of checks.no_skill ?? []) fails(`no_skill ${name}`, { ...run, events: [...events, { kind: 'skill', skill: name }] });
      for (const file of checks.read ?? []) {
        fails(`read ${file}`, { ...run, events: events.filter(e => !(String(e.path ?? '').endsWith(file) || String(e.command ?? '').includes(file))) });
      }
      for (const pattern of checks.ran ?? []) {
        const re = new RegExp(pattern);
        fails(`ran ${pattern}`, { ...run, events: events.map(e => (e.kind === 'run' && re.test(e.command) ? { ...e, denied: true } : e)) });
      }
      if (checks.no_writes) {
        fails('no_writes (attempt)', { ...run, events: [...events, { kind: 'write', path: 'catalog-info.yaml', denied: true }] });
        fails('no_writes (change)', { ...run, changed: ['notes.txt'] });
      }
      if (checks.writes_only) fails('writes_only', { ...run, changed: [...run.changed, 'src/other.js'] });
      for (const file of Object.keys(checks.files ?? {})) {
        fails(`files ${file} written`, { ...run, files: { ...run.files, [file]: null } });
        fails(`files ${file} content`, { ...run, files: { ...run.files, [file]: '' } });
      }
      if ((checks.must_match ?? []).length) fails('must_match', { ...run, reply: '' });
    }
  });
}

test('scaffold builds the change under review and installs skills without tests or evals', async t => {
  const { scaffold } = await load();
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-'));
  t.after(() => fs.rmSync(parent, { recursive: true, force: true }));
  const evalCase = cases('peer-code-review').find(c => c.id === 'review-commit');
  const dir = scaffold('peer-code-review', evalCase, '.agents/skills', parent);
  const log = execFileSync('git', ['log', '--format=%s'], { cwd: dir, encoding: 'utf8' }).trim().split('\n');
  assert.deepEqual(log, ['Retry deliveries until they succeed', 'Initial version']);
  assert.match(fs.readFileSync(path.join(dir, 'src', 'queue.js'), 'utf8'), /while \(true\)/);
  for (const skill of skills) {
    assert.ok(fs.existsSync(path.join(dir, '.agents', 'skills', skill, 'SKILL.md')), skill);
    assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', skill, 'tests')), false);
    assert.equal(fs.existsSync(path.join(dir, '.agents', 'skills', skill, 'evals')), false);
  }
});

test('the Claude Code adapter maps tool calls to neutral events and flags denials', async () => {
  const { parse, permissionRules } = await loadAdapter('claude-code');
  const lines = [
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'a', name: 'Skill', input: { skill: 'peer-code-review' } }] } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'b', name: 'Read', input: { file_path: '/repo/src/queue.js' } }] } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'c', name: 'Write', input: { file_path: '/repo/notes.txt' } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'c', is_error: true, content: "Claude requested permissions to write, but you haven't granted it yet." }] } },
    { type: 'result', result: 'Done.', total_cost_usd: 0.12 },
  ].map(line => JSON.stringify(line)).join('\n');
  const { events, reply, cost } = parse(lines);
  assert.deepEqual(events.map(e => [e.kind, e.denied]), [['skill', false], ['read', false], ['write', true]]);
  assert.equal(events[0].skill, 'peer-code-review');
  assert.equal(reply, 'Done.');
  assert.equal(cost, 0.12);
  assert.deepEqual(permissionRules({ run: ['git show'], write: ['docs/a.md'] }).slice(-3), ['Bash(git show:*)', 'Write(docs/a.md)', 'Edit(docs/a.md)']);
});

test('the built-in agent enforces paths, commands, and writes itself', async t => {
  const { execute, commandAllowed, textToolCalls } = await loadAdapter('openai');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openai-agent-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  const allow = { run: ['git status', 'node --version'], write: ['docs/guide.md'] };
  assert.equal(execute(dir, allow, 'read_file', { path: 'README.md' })[1], 'hello\n');
  assert.ok(execute(dir, allow, 'read_file', { path: '../outside' })[0].denied);
  assert.ok(execute(dir, allow, 'run_command', { command: 'rm README.md' })[0].denied);
  assert.ok(fs.existsSync(path.join(dir, 'README.md')));
  assert.equal(commandAllowed('node --version', allow.run), true);
  assert.equal(commandAllowed('node --version; rm x', allow.run), false);
  assert.equal(commandAllowed('node --versionx', allow.run), false);
  assert.ok(execute(dir, allow, 'write_file', { path: 'notes.txt', content: 'x' })[0].denied);
  assert.equal(fs.existsSync(path.join(dir, 'notes.txt')), false);
  const [written] = execute(dir, allow, 'write_file', { path: 'docs/guide.md', content: '# Guide\n' });
  assert.equal(written.denied, false);
  assert.equal(fs.readFileSync(path.join(dir, 'docs', 'guide.md'), 'utf8'), '# Guide\n');
  assert.deepEqual(textToolCalls('{"name": "read_file", "arguments": {"path": "README.md"}}').map(c => c.function.name), ['read_file']);
  assert.deepEqual(textToolCalls('<think>hm</think><tool_call>{"name":"list_files","arguments":{}}</tool_call>').map(c => c.function.name), ['list_files']);
  assert.deepEqual(textToolCalls('Here is my answer: 5'), []);
  fs.mkdirSync(path.join(dir, '.agents', 'skills', 'demo'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'skills', 'demo', 'SKILL.md'), '---\nname: demo\ndescription: Demo.\n---\nDo the demo.\n');
  fs.writeFileSync(path.join(dir, '.agents', 'skills', 'demo', 'guide.md'), '# Guide\n');
  const [loaded, text] = execute(dir, allow, 'use_skill', { name: 'demo' });
  assert.deepEqual([loaded.kind, loaded.skill], ['skill', 'demo']);
  assert.match(text, /Guides: \.agents\/skills\/demo\/guide\.md/);
  assert.match(text, /Do the demo\./);
  assert.ok(execute(dir, allow, 'use_skill', { name: 'nope' })[0].error);
});

test('the built-in agent runs a tool loop against an OpenAI-compatible server', async t => {
  const adapter = (await loadAdapter('openai')).default;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openai-loop-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, '.agents', 'skills', 'demo'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'skills', 'demo', 'SKILL.md'), '---\nname: demo\ndescription: Demo skill.\n---\n');
  fs.writeFileSync(path.join(dir, 'README.md'), 'hello\n');
  const replies = [
    { tool_calls: [{ id: '1', type: 'function', function: { name: 'read_file', arguments: '{"path":".agents/skills/demo/SKILL.md"}' } }] },
    { content: '{"name": "write_file", "arguments": {"path": "notes.txt", "content": "x"}}' },
    { content: '<think>done</think>The README says hello.' },
  ];
  const seen = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      seen.push(JSON.parse(body));
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ choices: [{ message: replies[seen.length - 1] }] }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
  const result = await adapter.run({ dir, prompt: 'What does the README say?', allow: { run: [], write: [] }, model: 'test', baseUrl });
  assert.equal(result.failure, null);
  assert.equal(result.reply, 'The README says hello.');
  assert.deepEqual(result.events.map(e => [e.kind, e.denied]), [['read', false], ['write', true]]);
  assert.match(seen[0].messages[0].content, /- demo: Demo skill\./);
  assert.equal(seen[0].tools[0].function.name, 'use_skill');
  assert.deepEqual(seen[0].tools[0].function.parameters.properties.name.enum, ['demo']);
  assert.equal(fs.existsSync(path.join(dir, 'notes.txt')), false);
});

test('paths are matched across /private, and recordings hold no machine paths', async () => {
  const { relativeTo, redact } = await load();
  assert.equal(relativeTo('/var/folders/x/T/agent-eval-abc', '/private/var/folders/x/T/agent-eval-abc/docs/setup.md'), 'docs/setup.md');
  assert.equal(relativeTo('/private/var/folders/x/T/agent-eval-abc', '/var/folders/x/T/agent-eval-abc/README.md'), 'README.md');
  assert.equal(relativeTo('', '<repo>/src/a.js'), 'src/a.js');
  const temp = require('node:fs').realpathSync(os.tmpdir());
  const redacted = redact({ reply: `see ${temp}/agent-eval-Ab12/README.md`, events: [{ command: `cat ${os.tmpdir()}/agent-eval-Zz9/x` }] });
  assert.equal(redacted.reply, 'see <repo>/README.md');
  assert.equal(redacted.events[0].command, 'cat <repo>/x');
  for (const skill of skills) {
    for (const evalCase of cases(skill)) {
      const text = JSON.stringify(recording(skill, evalCase.id) ?? {});
      assert.doesNotMatch(text, /\/var\/folders\/|\/Users\/|\/home\//, `${skill}#${evalCase.id} recording holds a machine path`);
    }
  }
});

test('a recording is stale when it is missing, untracked, or older than its skill', async () => {
  const { staleness, staleRecordings, skillVersion } = await load();
  assert.equal(staleness('1.2.0', '1.2.0'), null);
  assert.equal(staleness('1.2.0', '1.3.0'), 'recorded with 1.2.0; the skill is 1.3.0');
  assert.match(staleness(null, '1.3.0'), /before versions were tracked/);
  assert.equal(staleness(undefined, '1.3.0', false), 'no recording');
  for (const { skill, eval: id, why } of staleRecordings()) {
    const stored = recording(skill, id);
    assert.equal(why, staleness(stored?.skill_version, skillVersion(skill), Boolean(stored)));
  }
});

test('a host ask rule blocks the write in both adapters, and must have a matching allow', async t => {
  const { askSettings, args } = await loadAdapter('claude-code');
  const allow = { run: [], write: ['catalog-info.yaml'], ask: ['catalog-info.yaml'] };
  assert.deepEqual(JSON.parse(askSettings(allow)[1]), { permissions: { ask: ['Write(catalog-info.yaml)', 'Edit(catalog-info.yaml)'] } });
  assert.deepEqual(askSettings({ run: [], write: [] }), []);
  assert.ok(args(allow, 'm').includes('--settings'));
  const { execute } = await loadAdapter('openai');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ask-rule-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const [event, output] = execute(dir, allow, 'write_file', { path: 'catalog-info.yaml', content: 'x' });
  assert.equal(event.denied, true);
  assert.match(output, /needs a person's approval/);
  assert.equal(fs.existsSync(path.join(dir, 'catalog-info.yaml')), false);
  const { validateCase } = await load();
  const unmatched = { id: 'x', prompt: 'p', fixture: 'tests/fixtures/agent/owner-evidence', ask: ['catalog-info.yaml'], checks: { writes_only: [] } };
  assert.match(validateCase('backstage-catalog-builder', unmatched).join('\n'), /ask catalog-info\.yaml needs a matching allow\.write/);
});

test('--grade --save keeps a passing run as the recording, and refuses a failing one', async t => {
  const { skillVersion } = await load();
  const runner = path.join(root, 'scripts', 'agent-evals.mjs');
  const target = path.join(root, 'skills', 'peer-code-review', 'tests', 'agent-transcripts', 'unrelated.json');
  const original = fs.readFileSync(target, 'utf8');
  t.after(() => fs.writeFileSync(target, original));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'save-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const recorded = JSON.parse(original);
  const out = path.join(dir, 'run.json');
  fs.writeFileSync(out, JSON.stringify({ agent: 'claude-code', model: 'm', record: recorded }));
  const ok = require('node:child_process').spawnSync(process.execPath, [runner, '--grade', 'peer-code-review', 'unrelated', out, '--save'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  const saved = JSON.parse(fs.readFileSync(target, 'utf8'));
  assert.equal(saved.model, 'm');
  assert.equal(saved.skill_version, skillVersion('peer-code-review'));
  fs.writeFileSync(out, JSON.stringify({ agent: 'claude-code', model: 'm', record: { ...recorded, reply: 'no answer' } }));
  const bad = require('node:child_process').spawnSync(process.execPath, [runner, '--grade', 'peer-code-review', 'unrelated', out, '--save'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.equal(JSON.parse(fs.readFileSync(target, 'utf8')).model, 'm', 'a failing run is not saved');
});
