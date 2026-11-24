const fs = require('node:fs');
const path = require('node:path');

const app = process.argv[2];
if (!app) throw new Error('Usage: node scripts/backstage-github.cjs /path/to/app');

const entry = path.join(app, 'packages/backend/src/index.ts');
const registration = "backend.add(import('@backstage/plugin-catalog-backend-module-github'));";
const original = fs.readFileSync(entry, 'utf8');
if (!original.includes(registration)) {
  if (original.includes('@backstage/plugin-catalog-backend-module-github')) {
    throw new Error('GitHub module is already referenced differently; review registration manually.');
  }
  if (original.split('backend.start();').length !== 2) {
    throw new Error('Expected exactly one backend.start(); registration point.');
  }
  fs.writeFileSync(entry, original.replace('backend.start();', `${registration}\nbackend.start();`));
}
const config = path.join(app, 'app-config.github.yaml');
if (fs.existsSync(config)) {
  console.log('Registered the GitHub catalog module; preserved the existing app-config.github.yaml provider configuration.');
} else {
  fs.copyFileSync(path.resolve(__dirname, '../backstage/github-discovery.yaml'), config);
  console.log('Registered GitHub catalog discovery and created the demonstration backstage/backstage provider configuration.');
}
