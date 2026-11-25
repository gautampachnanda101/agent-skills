const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function setup(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'skill install test.'));
  t.after(() => fs.rmSync(home, { recursive: true }));
  const bin = path.join(home, 'bin');
  fs.mkdirSync(bin);
  const env = { ...process.env, HOME: home, PATH: `${bin}:/usr/bin:/bin` };
  delete env.DEST;
  delete env.GLOBAL_DESTS;
  delete env.FORCE;
  const run = (...args) =>
    execFileSync('make', args, { cwd: root, env, stdio: 'pipe' });
  const skill = folder => path.join(home, folder, 'skills/backstage-catalog-builder');
  return { home, bin, env, run, skill };
}

test('default installation installs globally in every supported assistant directory', t => {
  const { run, skill } = setup(t);
  run('install');
  for (const folder of ['.agents', '.kiro', '.claude', '.cline']) {
    assert.equal(
      fs.readFileSync(path.join(skill(folder), 'SKILL.md'), 'utf8'),
      fs.readFileSync(path.join(root, 'skills/backstage-catalog-builder/SKILL.md'), 'utf8'),
    );
  }
});

test('discovered conflicts stop all copying; FORCE replaces existing copies', t => {
  const { run, skill } = setup(t);
  fs.mkdirSync(skill('.claude'), { recursive: true });
  fs.writeFileSync(path.join(skill('.claude'), 'stale'), 'old');
  assert.throws(() => run('install'), /Skill already exists/);
  assert.equal(fs.existsSync(skill('.agents')), false);
  run('install', 'FORCE=1');
  assert.equal(fs.existsSync(path.join(skill('.claude'), 'stale')), false);
  assert.equal(fs.existsSync(path.join(skill('.claude'), 'SKILL.md')), true);
});

test('global alias, fallback and explicit destinations retain their behavior', t => {
  const { home, env, run, skill } = setup(t);
  run('install-global');
  assert.equal(fs.existsSync(path.join(skill('.agents'), 'SKILL.md')), true);
  assert.equal(fs.existsSync(path.join(skill('.claude'), 'SKILL.md')), true);
  const override = path.join(home, 'custom destination');
  run('install', `DEST=${override}`);
  assert.equal(fs.existsSync(path.join(override, 'backstage-catalog-builder/SKILL.md')), true);
  assert.throws(() => run('install', 'DEST='), /Destination must not be empty/);
  assert.throws(
    () => execFileSync('make', ['install'], {
      cwd: root, env: { ...env, HOME: '' }, stdio: 'pipe',
    }),
    /HOME must not be empty/,
  );
});
