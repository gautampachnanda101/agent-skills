const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

test('local installation preserves existing hooks, chains pre-commit and is repeatable', t => {
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'hook installation test.')));
  t.after(() => fs.rmSync(repo, { recursive: true }));
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const git = (...args) => execFileSync('git', args, { cwd: repo, env, encoding: 'utf8' }).trim();
  git('init', '--quiet');
  const previous = path.join(repo, 'previous hooks');
  fs.mkdirSync(previous);
  const order = path.join(repo, 'order');
  fs.writeFileSync(path.join(previous, 'pre-commit'),
    `#!/bin/sh\nprintf 'previous\\n' >> '${order}'\n`, { mode: 0o755 });
  fs.writeFileSync(path.join(previous, 'commit-msg'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  git('config', '--local', 'core.hooksPath', previous);
  fs.mkdirSync(path.join(repo, 'scripts'));
  fs.copyFileSync(path.resolve(__dirname, '../scripts/install-hooks.cjs'),
    path.join(repo, 'scripts/install-hooks.cjs'));
  fs.mkdirSync(path.join(repo, '.githooks'));
  fs.writeFileSync(path.join(repo, '.githooks/pre-commit'),
    `#!/bin/sh\nprintf 'repository\\n' >> '${order}'\n`);
  const install = () => execFileSync(process.execPath, ['scripts/install-hooks.cjs'], {
    cwd: repo, env, stdio: 'pipe',
  });
  install();
  install();
  const managed = git('config', '--local', '--get', 'core.hooksPath');
  assert.equal(fs.realpathSync(path.join(managed, 'commit-msg')),
    path.join(previous, 'commit-msg'));
  execFileSync(path.join(managed, 'pre-commit'), [], { cwd: repo, env });
  assert.equal(fs.readFileSync(order, 'utf8'), 'previous\nrepository\n');
  assert.equal(fs.readFileSync(path.join(previous, 'commit-msg'), 'utf8'), '#!/bin/sh\nexit 0\n');
  fs.writeFileSync(path.join(previous, 'pre-commit'), '#!/bin/sh\nexit 7\n');
  assert.throws(() => execFileSync(path.join(managed, 'pre-commit'), [], { cwd: repo, env }),
    error => error.status === 7);
  assert.equal(fs.readFileSync(order, 'utf8'), 'previous\nrepository\n');
});
