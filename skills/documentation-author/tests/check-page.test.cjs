const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const script = path.resolve(__dirname, '..', 'scripts', 'check-page.mjs');
const load = () => import(script);

test('flags placeholders, vague link text, and bare URLs, with their lines', async () => {
  const { checkPage } = await load();
  const page = [
    '# Configure retries',
    '',
    'Set the limit, then reload. TODO: confirm the default.',
    '<!-- FIXME: restore the onward link -->',
    'See [click here](setup.md) or [here](a.md) for more.',
    'Docs live at https://example.com/docs today.',
  ].join('\n');
  assert.deepEqual(checkPage(page).map(p => [p.line, p.rule]), [
    [3, 'placeholder'], [4, 'placeholder'], [5, 'link-text'], [5, 'link-text'], [6, 'bare-url'],
  ]);
});

test('code, inline code, badges, autolinks, and descriptive links pass', async () => {
  const { checkPage } = await load();
  const page = [
    '[![Verify](https://example.com/badge.svg)](https://example.com/ci)',
    '',
    'Never write `TODO` or `click here` in a page; see [the style rules](style.md).',
    'The site is <https://example.com/docs>.',
    '````markdown',
    '```yaml',
    '# TODO inside nested code',
    '```',
    'TODO still inside the outer fence; https://example.com',
    '````',
    'TODOS and XXXL are words, not placeholders.',
    'A link whose text wraps: [Make the',
    '  rules hard](https://example.com/hard-rules/) is fine.',
  ].join('\n');
  assert.deepEqual(checkPage(page), []);
});

test('the command reports each file and exits 1, 0, or 2', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-page-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bad = path.join(dir, 'bad.md');
  const good = path.join(dir, 'good.md');
  fs.writeFileSync(bad, '# Page\n\nTBD\n');
  fs.writeFileSync(good, '# Page\n\nDone.\n');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  const failed = run(bad, good);
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /bad\.md:3: placeholder/);
  assert.equal(run(good).status, 0);
  assert.equal(JSON.parse(run('--json', bad).stdout).problems[0].rule, 'placeholder');
  assert.equal(run().status, 2);
  assert.equal(run(path.join(dir, 'missing.md')).status, 2);
});
