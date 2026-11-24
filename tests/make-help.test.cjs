const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const ansi = /\x1b\[[0-9;]*m/g;

function help(args = [], overrides = {}) {
  const env = { ...process.env, TERM: 'xterm', ...overrides };
  if (!Object.hasOwn(overrides, 'NO_COLOR')) delete env.NO_COLOR;
  delete env.COLOR;
  return execFileSync('make', args, { cwd: root, env, encoding: 'utf8', stdio: 'pipe' });
}

test('default help is plain when captured and includes public commands and guidance', () => {
  const output = help(['help']);
  assert.equal(help(), output);
  assert.ok(!output.includes('\x1b'));
  for (const command of [
    'install', 'install-global', 'backstage', 'backstage-backend',
    'backstage-setup', 'backstage-config', 'backstage-github', 'backstage-clean',
  ]) assert.ok(output.includes(command), command);
  assert.ok(output.includes('Delete marked BACKSTAGE_HOME, including its app and local clones.'));
  assert.ok(output.includes('http://localhost:7007/api/mcp-actions/v1'));
});

test('forced colours preserve content, while COLOR=never and NO_COLOR suppress them', () => {
  const plain = help(['help', 'COLOR=never']);
  const coloured = help(['help', 'COLOR=always']);
  assert.ok(coloured.includes('\x1b'));
  assert.equal(coloured.replace(ansi, ''), plain);
  assert.equal(help(['help', 'COLOR=always'], { NO_COLOR: '1' }), plain);
  assert.equal(help(['help'], { TERM: 'dumb' }), plain);
  assert.throws(() => help(['help', 'COLOR=invalid']), /COLOR must be/);
});
