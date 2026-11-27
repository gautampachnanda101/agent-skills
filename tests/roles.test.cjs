// Every skill appears on at least one role page, and role pages link only
// to skills that exist.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const skills = fs.readdirSync(path.join(root, 'skills')).filter(name => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md')));
const rolesDir = path.join(root, 'docs', 'roles');
const pages = fs.readdirSync(rolesDir).filter(file => file.endsWith('.md'));

test('every skill appears on a role page', () => {
  const linked = new Set();
  for (const page of pages.filter(p => p !== 'index.md')) {
    for (const m of fs.readFileSync(path.join(rolesDir, page), 'utf8').matchAll(/\]\(\.\.\/skills\/([a-z0-9-]+)\.md\)/g)) linked.add(m[1]);
  }
  for (const skill of skills) assert.ok(linked.has(skill), `${skill} is on no role page`);
});

test('role pages link only to skills that exist, and the overview lists every role', () => {
  const index = fs.readFileSync(path.join(rolesDir, 'index.md'), 'utf8');
  for (const page of pages) {
    for (const m of fs.readFileSync(path.join(rolesDir, page), 'utf8').matchAll(/\]\(\.\.\/skills\/([a-z0-9-]+)\.md\)/g)) {
      assert.ok(skills.includes(m[1]), `${page} links to ${m[1]}, which is not a skill`);
    }
    if (page !== 'index.md') assert.ok(index.includes(`](${page})`), `the roles overview does not list ${page}`);
  }
});
