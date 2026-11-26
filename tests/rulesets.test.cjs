const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts', 'rulesets.sh');

function fakeGh(t, existing) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rulesets-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const log = path.join(dir, 'calls.log');
  fs.writeFileSync(path.join(dir, 'gh'), `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\ncase "$*" in *--jq*) printf '${existing}' ;; esac\n`, { mode: 0o755 });
  const run = (...args) => execFileSync('sh', [script, ...args], { env: { ...process.env, PATH: `${dir}:${process.env.PATH}` }, encoding: 'utf8' });
  const calls = () => fs.readFileSync(log, 'utf8').trim().split('\n');
  return { run, calls };
}

test('every ruleset file is valid and named', () => {
  for (const file of fs.readdirSync(path.join(root, '.github', 'rulesets')).filter(f => f.endsWith('.json'))) {
    const ruleset = JSON.parse(fs.readFileSync(path.join(root, '.github', 'rulesets', file), 'utf8'));
    assert.ok(ruleset.name && ruleset.target && ruleset.rules.length, file);
    assert.equal(ruleset.enforcement, 'active', file);
  }
});

test('an existing ruleset is updated by name and a new one is created', t => {
  const { run, calls } = fakeGh(t, '42\\tprotect-main\\n');
  const output = run();
  assert.match(output, /Applied: update protect-main \(ruleset 42\)/);
  assert.match(output, /Applied: create protect-release-tags/);
  const writes = calls().slice(1);
  assert.match(writes[0], /--method PUT repos\/\{owner\}\/\{repo\}\/rulesets\/42 --input .*protect-main\.json/);
  assert.match(writes[1], /--method POST repos\/\{owner\}\/\{repo\}\/rulesets --input .*protect-release-tags\.json/);
});

test('--dry-run reads but never writes', t => {
  const { run, calls } = fakeGh(t, '');
  assert.match(run('--dry-run'), /Would create protect-main/);
  assert.equal(calls().length, 1);
  assert.doesNotMatch(calls()[0], /--method/);
});
