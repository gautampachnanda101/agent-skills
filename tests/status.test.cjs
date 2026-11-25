const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function setup(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'status test.'));
  t.after(() => fs.rmSync(home, { recursive: true }));
  const env = { ...process.env, HOME: home };
  delete env.DEST;
  delete env.GLOBAL_DESTS;
  delete env.FORCE;
  const run = (...args) => execFileSync('make', args, { cwd: root, env, encoding: 'utf8', stdio: 'pipe' });
  return { env, run };
}

test('status reports up-to-date copies and missing installs per destination', t => {
  const { run, env } = setup(t);
  const dest = path.join(env.HOME, 'dest-skills');
  run('install', `DEST=${dest}`);
  const output = run('status', `DEST=${dest}`);
  assert.match(output, /backstage-catalog-builder: source [\d.]+/);
  assert.match(output, new RegExp(`${dest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/backstage-catalog-builder\\s+up to date`));
  assert.match(output, /documentation-review: source [\d.]+/);
  assert.match(output, new RegExp(`${dest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/documentation-review\\s+up to date`));

  const partial = path.join(env.HOME, 'partial-skills');
  fs.mkdirSync(path.join(partial, 'documentation-review'), { recursive: true });
  fs.copyFileSync(path.join(root, 'skills/documentation-review/SKILL.md'), path.join(partial, 'documentation-review', 'SKILL.md'));
  const partialOutput = run('status', `DEST=${partial}`);
  assert.match(partialOutput, /peer-code-review\s+not installed/);
  assert.match(partialOutput, /documentation-review\s+up to date/);
});

test('status flags version drift between an installed copy and the source', t => {
  const { run, env } = setup(t);
  const dest = path.join(env.HOME, 'drift-skills');
  fs.mkdirSync(path.join(dest, 'documentation-review'), { recursive: true });
  const stale = fs.readFileSync(path.join(root, 'skills/documentation-review/SKILL.md'), 'utf8')
    .replace('version: "1.2.0"', 'version: "0.0.9"');
  fs.writeFileSync(path.join(dest, 'documentation-review', 'SKILL.md'), stale);
  const output = run('status', `DEST=${dest}`);
  assert.match(output, /documentation-review\s+installed 0\.0\.9/);
  assert.doesNotMatch(output, /documentation-review\s+up to date/);
});
