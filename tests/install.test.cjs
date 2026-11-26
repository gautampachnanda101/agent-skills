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

function oldCopy(dir, author = 'gautampachnanda101') {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'),
    `---\nname: doc-author\ndescription: old\nmetadata:\n  author: ${author}\n  version: "1.2.0"\n---\n`);
}

test('update removes a renamed skill\'s old copy, and status reports it first', t => {
  const { home, run } = setup(t);
  const old = path.join(home, '.claude/skills/doc-author');
  oldCopy(old);
  assert.match(run('status').toString(), /doc-author: renamed to documentation-author\n.*old copy; make update removes it/);
  const output = run('update').toString();
  assert.match(output, /Removed doc-author from .*\.claude\/skills: renamed to documentation-author/);
  assert.equal(fs.existsSync(old), false);
  assert.equal(fs.existsSync(path.join(home, '.claude/skills/documentation-author/SKILL.md')), true);
  assert.doesNotMatch(run('status').toString(), /renamed to/);
});

test('a user\'s own skill or link with a renamed skill\'s name is kept', t => {
  const { home, run } = setup(t);
  const own = path.join(home, '.claude/skills/doc-author');
  oldCopy(own, 'someone-else');
  const target = path.join(home, 'linked-skill');
  oldCopy(target);
  fs.mkdirSync(path.join(home, '.agents/skills'), { recursive: true });
  fs.symlinkSync(target, path.join(home, '.agents/skills/doc-author'));
  run('update');
  assert.equal(fs.existsSync(path.join(own, 'SKILL.md')), true);
  assert.equal(fs.lstatSync(path.join(home, '.agents/skills/doc-author')).isSymbolicLink(), true);
  assert.equal(fs.existsSync(path.join(target, 'SKILL.md')), true);
});
