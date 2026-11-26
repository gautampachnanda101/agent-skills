const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-versions.mjs');
const load = () => import(script);

const skillMd = version => `---\nname: demo\ndescription: d\nmetadata:\n  author: someone\n  version: "${version}"\n---\n# Demo\n`;
const plugin = version => JSON.stringify({ name: 'p', version });
const changelog = (...versions) => `# Changelog\n\n## [Unreleased]\n\n${versions.map(v => `## [${v}] - 2026-11-26\n\n- x\n`).join('\n')}`;

function files(overrides = {}) {
  return {
    '.claude-plugin/plugin.json': plugin('2.0.0'),
    'skills/demo/SKILL.md': skillMd('1.0.0'),
    'docs/skills/demo.md': '# demo\n\n**Version 1.0.0 · plugin name `p:demo`**\n',
    'CHANGELOG.md': changelog('2.0.0', '1.0.0'),
    ...overrides,
  };
}

async function run({ now = {}, before = {}, changed = null }) {
  const { check } = await load();
  const current = files(now);
  const previous = files(before);
  return check({ skills: ['demo'], read: f => current[f], base: f => previous[f], changed });
}

test('a consistent repository passes', async () => {
  assert.deepEqual(await run({}), []);
  assert.deepEqual(await run({ changed: [] }), []);
});

test('versions must be X.Y.Z, and the docs page must state the skill version', async () => {
  assert.match((await run({ now: { 'skills/demo/SKILL.md': skillMd('1.0') } })).join('\n'), /demo: metadata.version "1.0" is not X.Y.Z/);
  assert.match((await run({ now: { '.claude-plugin/plugin.json': plugin('v2') } })).join('\n'), /plugin version "v2" is not X.Y.Z/);
  assert.match((await run({ now: { 'skills/demo/SKILL.md': skillMd('1.0.1') } })).join('\n'), /docs\/skills\/demo.md states version 1.0.0, but the skill is 1.0.1/);
});

test('the newest changelog release must be the plugin version', async () => {
  const problems = await run({ now: { 'CHANGELOG.md': changelog('1.0.0') } });
  assert.match(problems.join('\n'), /newest CHANGELOG.md release is 1.0.0, but the plugin version is 2.0.0/);
});

test('a changed skill needs a higher version and a changelog entry', async () => {
  const unbumped = await run({ changed: ['skills/demo/guide.md'] });
  assert.match(unbumped.join('\n'), /demo changed, so its version must increase from 1.0.0 \(now 1.0.0\)/);
  assert.match(unbumped.join('\n'), /CHANGELOG.md must change too/);
  const bumped = {
    'skills/demo/SKILL.md': skillMd('1.0.1'),
    'docs/skills/demo.md': '**Version 1.0.1 ·**',
  };
  assert.deepEqual(await run({ now: bumped, changed: ['skills/demo/SKILL.md', 'docs/skills/demo.md', 'CHANGELOG.md'] }), []);
  const lowered = await run({ now: { 'skills/demo/SKILL.md': skillMd('0.9.0'), 'docs/skills/demo.md': '**Version 0.9.0 ·**' }, changed: ['skills/demo/SKILL.md', 'CHANGELOG.md'] });
  assert.match(lowered.join('\n'), /must increase from 1.0.0 \(now 0.9.0\)/);
});

test('a new or renamed skill has no base version to beat', async () => {
  assert.deepEqual(await run({ before: { 'skills/demo/SKILL.md': undefined }, changed: ['skills/demo/SKILL.md', 'CHANGELOG.md'] }), []);
});

test('the plugin version may not decrease, and a bump needs a changelog change', async () => {
  const lowered = await run({ before: { '.claude-plugin/plugin.json': plugin('3.0.0') }, changed: ['.claude-plugin/plugin.json', 'CHANGELOG.md'] });
  assert.match(lowered.join('\n'), /plugin version decreased from 3.0.0 to 2.0.0/);
  const silent = await run({ before: { '.claude-plugin/plugin.json': plugin('1.9.0') }, changed: ['.claude-plugin/plugin.json'] });
  assert.match(silent.join('\n'), /CHANGELOG.md must change too/);
});

test('semver comparison is numeric', async () => {
  const { compare } = await load();
  assert.ok(compare('1.10.0', '1.9.9') > 0);
  assert.ok(compare('2.0.0', '10.0.0') < 0);
  assert.equal(compare('1.2.3', '1.2.3'), 0);
});

test('the pre-commit mode checks the staged change in a real repository', t => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'check-versions-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], { cwd: repo, stdio: 'pipe' });
  for (const [file, text] of Object.entries(files())) {
    fs.mkdirSync(path.dirname(path.join(repo, file)), { recursive: true });
    fs.writeFileSync(path.join(repo, file), text);
  }
  fs.mkdirSync(path.join(repo, 'scripts'));
  fs.copyFileSync(script, path.join(repo, 'scripts', 'check-versions.mjs'));
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'init');
  const check = (...args) => spawnSync(process.execPath, ['scripts/check-versions.mjs', ...args], { cwd: repo, encoding: 'utf8' });

  fs.writeFileSync(path.join(repo, 'skills/demo/guide.md'), 'new\n');
  assert.equal(check().status, 0, 'unstaged edits are not checked');
  git('add', '-A');
  const failed = check();
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /demo changed, so its version must increase/);

  fs.writeFileSync(path.join(repo, 'skills/demo/SKILL.md'), skillMd('1.1.0'));
  fs.writeFileSync(path.join(repo, 'docs/skills/demo.md'), '**Version 1.1.0 ·**\n');
  fs.appendFileSync(path.join(repo, 'CHANGELOG.md'), '\n- demo 1.1.0\n');
  git('add', '-A');
  assert.equal(check().status, 0, check().stderr);
  git('commit', '-q', '-m', 'bump');
  assert.equal(check('--base', 'HEAD~1').status, 0);
  assert.equal(check('--base', '0000000000000000000000000000000000000000').status, 0, 'a new branch has no base');
  assert.equal(check('--base', 'no-such-ref').status, 2);
});

test('re-recording a transcript needs no version bump', async () => {
  assert.deepEqual(await run({ changed: ['skills/demo/tests/agent-transcripts/case.json'] }), []);
  assert.match((await run({ changed: ['skills/demo/tests/agent-transcripts/case.json', 'skills/demo/SKILL.md'] })).join('\n'), /must increase/);
});
