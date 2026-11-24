const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function supportsTests(version) {
  const [major, minor] = version.split('.').map(Number);
  return (major === 24 && minor >= 15) || (major === 26 && minor >= 13) || major > 26;
}

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function newestManagedNode() {
  const roots = [
    path.join(os.homedir(), '.nvm', 'versions', 'node'),
    path.join(os.homedir(), '.asdf', 'installs', 'nodejs'),
  ];
  const found = [];
  for (const root of roots) {
    let entries;
    try {
      entries = fs.readdirSync(root);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const version = entry.replace(/^v/, '');
      if (!/^\d+\.\d+\.\d+$/.test(version) || !supportsTests(version)) continue;
      const bin = path.join(root, entry, 'bin', 'node');
      if (fs.existsSync(bin)) found.push({ version, bin });
    }
  }
  return found.sort((left, right) => compareVersions(right.version, left.version))[0];
}

const active = process.versions.node;
let nodeBin = process.execPath;
let env = process.env;
if (!supportsTests(active)) {
  const managed = newestManagedNode();
  if (!managed) {
    console.error(
      `Tests require Node 24.15+ or 26.13+, but the active Node is ${active} and no qualifying nvm or asdf installation was found. Install one before committing.`,
    );
    process.exit(1);
  }
  nodeBin = managed.bin;
  env = { ...process.env, PATH: `${path.dirname(managed.bin)}:${process.env.PATH}` };
}

const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'tests'))
  .filter(file => file.endsWith('.test.cjs'))
  .map(file => path.join(root, 'tests', file));
if (!files.length) throw new Error('No repository tests found.');
const result = spawnSync(nodeBin, ['--test', ...files], { cwd: root, stdio: 'inherit', env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
