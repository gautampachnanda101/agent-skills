const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const script = path.join(root, 'scripts', 'release.mjs');
const load = () => import(script);

function repo(t, { version = '2.0.0', changelog, curated } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-plan-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, '.claude-plugin'));
  fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({ version }));
  fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), changelog ?? '# Changelog\n\n## [Unreleased]\n\n- next\n\n## [2.0.0] - 2026-11-26\n\n### Changed\n\n- renamed\n\n## [1.2.0] - 2026-11-25\n\n- older\n');
  if (curated) {
    fs.mkdirSync(path.join(dir, '.github', 'release-notes'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.github', 'release-notes', `v${version}.md`), curated);
  }
  return dir;
}

test('notes default to the version\'s changelog section, titled with the tag', async t => {
  const { plan } = await load();
  const release = plan(repo(t));
  assert.equal(release.tag, 'v2.0.0');
  assert.equal(release.title, 'v2.0.0');
  assert.equal(release.notes, '### Changed\n\n- renamed');
  assert.equal(release.source, 'CHANGELOG.md [2.0.0]');
});

test('a curated notes file wins, and its heading becomes the title', async t => {
  const { plan } = await load();
  const release = plan(repo(t, { curated: '# v2.0.0 — big one\n\n## Highlights\n\n- a\n' }));
  assert.equal(release.title, 'v2.0.0 — big one');
  assert.equal(release.notes, '## Highlights\n\n- a');
  assert.equal(release.source, path.join('.github', 'release-notes', 'v2.0.0.md'));
});

test('a version with no notes is refused', async t => {
  const { plan } = await load();
  assert.throws(() => plan(repo(t, { version: '3.0.0' })), /no release notes for v3.0.0/);
});

test('this repository has notes for its current version', async () => {
  const { plan } = await load();
  const release = plan();
  assert.ok(release.notes.length > 100, release.source);
});

test('publishing needs a full commit SHA', () => {
  const result = spawnSync(process.execPath, [script, '--target', 'main'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--target needs a full commit SHA/);
});
