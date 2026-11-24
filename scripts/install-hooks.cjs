const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const active = path.resolve(root, git('rev-parse', '--git-path', 'hooks/pre-commit'), '..');
const managed = path.resolve(root, git('rev-parse', '--git-path', 'agent-skills-hooks'));
const state = path.join(managed, 'previous-hooks-path');
let previous = active;
if (active === managed) {
  previous = fs.readFileSync(state, 'utf8').trim();
} else if (fs.existsSync(managed)) {
  throw new Error(`Refusing to overwrite an existing hook directory: ${managed}`);
}
fs.mkdirSync(managed, { recursive: true });
if (active !== managed) {
  fs.writeFileSync(state, previous);
  if (fs.existsSync(previous)) {
    for (const name of fs.readdirSync(previous)) {
      if (name === 'pre-commit' || name.endsWith('.sample')) continue;
      const source = path.join(previous, name);
      if (fs.statSync(source).isFile()) fs.symlinkSync(source, path.join(managed, name));
    }
  }
}
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const oldHook = path.join(previous, 'pre-commit');
const hook = [
  '#!/bin/sh',
  'set -eu',
  `if [ -x ${quote(oldHook)} ]; then ${quote(oldHook)} "$@"; fi`,
  `exec sh ${quote(path.join(root, '.githooks/pre-commit'))} "$@"`,
  '',
].join('\n');
fs.writeFileSync(path.join(managed, 'pre-commit'), hook, { mode: 0o755 });
git('config', '--local', 'core.hooksPath', managed);
console.log('Enabled repository pre-commit checks; existing hooks are preserved.');
