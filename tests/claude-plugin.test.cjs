const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

// Constraints from https://code.claude.com/docs/en/plugins/manifest-reference
// and the marketplace guide. The authoritative check is
// `claude plugin validate --strict .` in CI; these tests keep the manifests
// conformant locally without requiring the Claude Code CLI.
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

function pluginPath(manifest, value) {
  assert.ok(value.startsWith('./'), `'${value}' must start with ./`);
  const resolved = path.resolve(root, value.replace(/^\.\//, ''));
  assert.ok(!resolved.includes('..'), `'${value}' must stay inside the plugin root`);
  return resolved;
}

test('plugin manifest is valid', () => {
  const manifest = readJson('.claude-plugin/plugin.json');

  assert.ok(manifest.name && NAME_PATTERN.test(manifest.name), 'name must be kebab-case');
  // skills/ is the plugin default skill directory: Claude Code loads every
  // subdirectory holding SKILL.md without a manifest entry. Declared skills
  // would double-load; the dedicated test below checks the real layout.
  if (manifest.version) assert.match(manifest.version, /^\d+\.\d+\.\d+$/, 'version must be semantic');
  if (manifest.homepage) assert.match(manifest.homepage, /^https:/, 'homepage must parse as a URL');
  assert.equal(manifest.license, 'Apache-2.0');
});

test('each skills/ subdirectory is a spec-shaped skill', () => {
  const skillsRoot = path.join(root, 'skills');
  assert.ok(fs.existsSync(skillsRoot), 'skills/ must exist for plugin default discovery');
  const dirs = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
  assert.ok(dirs.length > 0, 'at least one skill directory expected');
  for (const dir of dirs) {
    const skillFile = path.join(skillsRoot, dir, 'SKILL.md');
    assert.ok(fs.existsSync(skillFile), `skills/${dir} must hold SKILL.md directly`);
    const name = /name: (.+)/.exec(fs.readFileSync(skillFile, 'utf8'))[1];
    assert.equal(name, dir, 'skill name must match its directory');
  }
});

test('marketplace entry matches the manifest it lists', () => {
  const marketplace = readJson('.claude-plugin/marketplace.json');
  const manifest = readJson('.claude-plugin/plugin.json');

  assert.ok(marketplace.name && NAME_PATTERN.test(marketplace.name), 'marketplace name must be kebab-case');
  assert.ok(marketplace.description, 'marketplace description is required (validate --strict warns otherwise)');
  assert.ok(marketplace.owner?.name, 'owner.name is required');
  assert.ok(Array.isArray(marketplace.plugins) && marketplace.plugins.length, 'plugins array is required');

  const entry = marketplace.plugins.find(item => item.name === manifest.name);
  assert.ok(entry, 'entry name must equal the manifest name');
  assert.equal(entry.source, './', 'source must reference the marketplace root');
});

test('plugin ships a directory listing icon', () => {
  const icon = path.join(root, '.claude-plugin', 'icon.png');
  assert.ok(fs.existsSync(icon), '.claude-plugin/icon.png must exist (validator warns otherwise)');
  const png = fs.readFileSync(icon);
  assert.ok(png.length < 2 * 1024 * 1024, 'icon must be under 2 MB');
  assert.equal(png.readUInt32BE(16), 512, 'icon width must be between 512 and 2048 px');
  assert.equal(png.readUInt32BE(20), 512, 'icon height must be between 512 and 2048 px');
});
