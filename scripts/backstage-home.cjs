const fs = require('node:fs');
const path = require('node:path');

const [operation, value, repository] = process.argv.slice(2);
if (!['resolve', 'mark', 'clean'].includes(operation) || !value || !repository) {
  throw new Error('Expected resolve|mark|clean, a non-empty BACKSTAGE_HOME, and the repository path.');
}

function canonicalize(file) {
  try {
    return fs.realpathSync(file);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(file);
    if (parent === file) throw error;
    return path.join(canonicalize(parent), path.basename(file));
  }
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) &&
    relative !== '..' && !path.isAbsolute(relative));
}

const home = canonicalize(path.resolve(repository, value));
const protectedPaths = [canonicalize(path.resolve(repository))];
if (!process.env.HOME) throw new Error('HOME must be set to protect the user home directory.');
protectedPaths.push(canonicalize(path.resolve(process.env.HOME)));
if (home === path.parse(home).root || protectedPaths.some(file => contains(home, file))) {
  throw new Error(`Refusing protected BACKSTAGE_HOME: ${home}`);
}

const marker = path.join(home, '.agent-skills-backstage');
const markerContent = 'agent-skills-managed-backstage-v1\n';

if (operation === 'resolve') {
  console.log(home);
} else if (operation === 'mark') {
  const app = JSON.parse(fs.readFileSync(path.join(home, 'app/package.json'), 'utf8'));
  if (!app.workspaces) throw new Error('Expected a Backstage workspace before marking its directory.');
  fs.writeFileSync(marker, markerContent);
} else {
  if (!fs.existsSync(marker) || fs.lstatSync(marker).isSymbolicLink() ||
    fs.readFileSync(marker, 'utf8') !== markerContent) {
    throw new Error(`Refusing unmarked BACKSTAGE_HOME: ${home}. Run make backstage-setup first.`);
  }
  fs.rmSync(home, { recursive: true });
  console.log(`Removed ${home}`);
}
