const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const skill = path.resolve(__dirname, '..');
const repo = path.resolve(skill, '..');
const scripts = path.join(skill, 'scripts');
const descriptorChecker = path.join(scripts, 'check-descriptors.mjs');
const techdocsChecker = path.join(scripts, 'check-techdocs.mjs');

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: repo, encoding: 'utf8' });
}

function tempDir(name) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `examples-${name}.`));
}

function write(dir, relative, content) {
  const target = path.join(dir, ...relative.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return target;
}

function component(name, options = {}) {
  const annotations = Object.entries(options.annotations ?? {})
    .map(([key, value]) => `    ${key}: ${value}`)
    .join('\n');
  return `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${name}
${annotations ? `  annotations:\n${annotations}\n` : ''}spec:
  type: ${options.type ?? 'service'}
  lifecycle: experimental
  owner: group:default/catalog-test
  ${options.extra ?? ''}
`;
}

function mkdocs(name, { docsDir, nav }) {
  return `site_name: ${name}
plugins:
  - techdocs-core
${docsDir ? `docs_dir: ${docsDir}\n` : ''}nav:
${nav.map(line => `  - ${line}`).join('\n')}
`;
}

test('example: catalog bundle with an API contract and an aggregate Location', () => {
  const dir = tempDir('api-bundle');
  write(dir, 'samples-service/catalog-info.yaml', `${component('samples-service', {
    annotations: { 'github.com/project-slug': 'acme/samples-service' },
    extra: `providesApis:
      - api:default/samples-api
`,
  })}\n`);
  write(dir, 'samples-service/samples-api.yaml', `apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: samples-api
  annotations:
    github.com/project-slug: acme/samples-service
spec:
  type: openapi
  lifecycle: production
  owner: group:default/catalog-test
  definition:
    $text: ./openapi.yaml
`);
  fs.copyFileSync(
    path.join(skill, 'tests', 'fixtures', 'descriptors', 'openapi.yaml'),
    path.join(dir, 'samples-service', 'openapi.yaml'),
  );
  write(dir, 'aggregate/catalog-info.yaml', `apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: acme-samples
spec:
  targets:
    - ../samples-service/catalog-info.yaml
    - ../samples-service/samples-api.yaml
`);

  const result = run(descriptorChecker, [
    path.join(dir, 'samples-service', 'catalog-info.yaml'),
    path.join(dir, 'samples-service', 'samples-api.yaml'),
    path.join(dir, 'aggregate', 'catalog-info.yaml'),
  ]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /3 document\(s\)/);
});

test('example: one descriptor file describing two documented components', () => {
  const dir = tempDir('dual-site');
  write(dir, 'catalog-info.yaml', `${component('site-a-entity', {
    annotations: { 'backstage.io/techdocs-ref': 'dir:./site-a' },
  })}\n---\n\n${component('site-b-entity', {
    annotations: { 'backstage.io/techdocs-ref': 'dir:./site-b' },
  })}\n`);
  write(dir, 'site-a/mkdocs.yml', mkdocs('site-a-entity', {
    nav: ['Home: index.md', 'Usage: usage.md'],
  }));
  write(dir, 'site-a/docs/index.md', '# Site A\n');
  write(dir, 'site-a/docs/usage.md', '# Usage\n');
  write(dir, 'site-b/mkdocs.yml', mkdocs('site-b-entity', {
    docsDir: 'content',
    nav: ['Home: index.md', 'Guide: guide.md'],
  }));
  write(dir, 'site-b/content/index.md', '# Site B\n');
  write(dir, 'site-b/content/guide.md', '# Guide\n');

  const result = run(techdocsChecker, [path.join(dir, 'catalog-info.yaml')]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /2 TechDocs reference\(s\)/);
  assert.match(result.stdout, /2 mkdocs site\(s\)/);
});

test('example: path-limited scope resolves docs outside the package directory', () => {
  const dir = tempDir('path-limited');
  write(dir, 'packages/gamma/catalog-info.yaml', `${component('gamma-svc', {
    annotations: { 'backstage.io/techdocs-ref': 'dir:../../docs-site' },
  })}\n`);
  write(dir, 'docs-site/mkdocs.yml', mkdocs('gamma-svc', {
    nav: ['Home: index.md'],
  }));
  write(dir, 'docs-site/docs/index.md', '# Gamma\n');

  const descriptors = run(descriptorChecker, [path.join(dir, 'packages', 'gamma', 'catalog-info.yaml')]);
  assert.equal(descriptors.status, 0, descriptors.stdout);
  const techdocs = run(techdocsChecker, [path.join(dir, 'packages', 'gamma', 'catalog-info.yaml')]);
  assert.equal(techdocs.status, 0, techdocs.stdout);
  assert.match(techdocs.stdout, /1 mkdocs site\(s\)/);
});

test('example: monorepo per-package sites ship as independent bundles', () => {
  const dir = tempDir('monorepo-a');
  const fixture = path.join(skill, 'tests', 'fixtures', 'techdocs');
  for (const pkg of ['alpha', 'bravo']) {
    const base = path.join(fixture, 'monorepo', 'packages', pkg);
    fs.cpSync(base, path.join(dir, 'packages', pkg), { recursive: true });
    const result = run(techdocsChecker, [path.join(dir, 'packages', pkg, 'catalog-info.yaml')]);
    assert.equal(result.status, 0, `${pkg}: ${result.stdout}`);
    assert.match(result.stdout, /1 mkdocs site\(s\)/);
  }
});

test('example: aggregated handbook with deep nav and package includes', () => {
  const dir = tempDir('aggregate-b');
  fs.cpSync(path.join(skill, 'tests', 'fixtures', 'techdocs', 'aggregate'), dir, { recursive: true });
  const result = run(techdocsChecker, [path.join(dir, 'catalog-info.yaml')]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /3 mkdocs site\(s\)/);
});

test('example: remote url reference is recorded without local resolution', () => {
  const dir = tempDir('remote');
  write(dir, 'catalog-info.yaml', `${component('remote-docs', {
    annotations: { 'backstage.io/techdocs-ref': 'url:https://github.com/acme/remote-docs/tree/main/docs' },
  })}\n`);
  const result = run(techdocsChecker, [path.join(dir, 'catalog-info.yaml')]);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /1 TechDocs reference\(s\) \(1 remote\)/);
});
