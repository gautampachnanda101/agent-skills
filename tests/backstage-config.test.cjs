const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('default restarts retain local clone root descriptors; explicit files override discovery', t => {
  const home = fs.mkdtempSync(path.join(process.env.TMPDIR, 'catalog persistence test.'));
  t.after(() => fs.rmSync(home, { recursive: true }));
  const app = path.join(home, 'app');
  fs.mkdirSync(app);
  fs.writeFileSync(path.join(app, 'package.json'), '{}');
  const clone = path.join(home, "repos/repo's name");
  fs.mkdirSync(path.join(clone, 'nested'), { recursive: true });
  const descriptor = path.join(clone, 'catalog-info.yaml');
  fs.writeFileSync(descriptor, '{}');
  const child = path.join(clone, 'nested/catalog-info.yaml');
  fs.writeFileSync(child, '{}');
  const root = path.resolve(__dirname, '..');
  const env = { ...process.env };
  delete env.CATALOG_FILES;
  const run = (...args) => {
    execFileSync('make', ['backstage-config', `BACKSTAGE_HOME=${home}`, ...args], {
      cwd: root, env, stdio: 'pipe',
    });
    return fs.readFileSync(path.join(app, 'app-config.local.yaml'), 'utf8');
  };
  const first = run();
  assert.ok(first.includes(descriptor.replaceAll("'", "''")));
  assert.ok(!first.includes(child.replaceAll("'", "''")));
  assert.equal(run(), first);
  const explicit = run(`CATALOG_FILES=${path.join(root, 'catalog-info.yaml')}`);
  assert.ok(!explicit.includes(descriptor.replaceAll("'", "''")));
  assert.ok(explicit.includes(path.join(root, 'backstage/catalog-info.yaml')));
  assert.ok(!run('CATALOG_FILES=').includes(path.join(root, 'catalog-info.yaml')));
});
