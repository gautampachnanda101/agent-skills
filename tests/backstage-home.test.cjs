const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts/backstage-home.cjs');

function run(operation, home) {
  return execFileSync(process.execPath, [script, operation, home, root], {
    encoding: 'utf8', stdio: 'pipe',
  });
}

test('cleanup rejects protected paths, normalized aliases, and unmarked directories', t => {
  for (const home of ['', '/', '.', root, `${root}/backstage/..`, process.env.HOME,
    `${process.env.HOME}/`, path.dirname(root)]) {
    assert.throws(() => run('clean', home), /non-empty BACKSTAGE_HOME|Refusing protected/);
  }
  const scratch = fs.mkdtempSync(path.join(process.env.TMPDIR, 'backstage cleanup guard.'));
  t.after(() => fs.rmSync(scratch, { recursive: true }));
  const sentinel = path.join(scratch, 'keep');
  fs.writeFileSync(sentinel, 'unchanged');
  assert.throws(() => run('clean', scratch), /Refusing unmarked/);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'unchanged');
  const alias = path.join(scratch, 'repo-alias');
  fs.symlinkSync(root, alias);
  assert.throws(() => run('clean', alias), /Refusing protected/);
});

test('setup marking enables cleanup only for the managed directory', t => {
  const scratch = fs.mkdtempSync(path.join(process.env.TMPDIR, 'backstage managed test.'));
  t.after(() => fs.rmSync(scratch, { recursive: true }));
  const managed = path.join(scratch, 'managed app');
  fs.mkdirSync(path.join(managed, 'app'), { recursive: true });
  fs.writeFileSync(path.join(managed, 'app/package.json'), '{"workspaces":["packages/*"]}');
  run('mark', managed);
  assert.ok(fs.existsSync(path.join(managed, '.agent-skills-backstage')));
  assert.equal(
    run('resolve', path.relative(root, managed)).trim(),
    fs.realpathSync(managed),
  );
  execFileSync('make', ['backstage-clean', `BACKSTAGE_HOME=${managed}`], {
    cwd: root, stdio: 'pipe',
  });
  assert.equal(fs.existsSync(managed), false);
  assert.equal(fs.existsSync(scratch), true);
});

test('Make setup writes a managed marker only after successful dependency installation', t => {
  const home = fs.mkdtempSync(path.join(process.env.TMPDIR, 'backstage setup marker.'));
  t.after(() => fs.rmSync(home, { recursive: true }));
  const bin = path.join(home, 'tools/bin');
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(path.join(home, 'app'));
  fs.writeFileSync(path.join(home, 'app/package.json'), '{"workspaces":["packages/*"]}');
  const yarn = path.join(bin, 'yarn');
  fs.writeFileSync(yarn, '#!/bin/sh\nexit 3\n', { mode: 0o755 });
  const setup = () => execFileSync('make', ['backstage-setup', `BACKSTAGE_HOME=${home}`], {
    cwd: root, stdio: 'pipe',
  });
  assert.throws(setup, /Error 3/);
  assert.equal(fs.existsSync(path.join(home, '.agent-skills-backstage')), false);
  fs.writeFileSync(yarn, '#!/bin/sh\nexit 0\n');
  setup();
  assert.ok(fs.existsSync(path.join(home, '.agent-skills-backstage')));
});
