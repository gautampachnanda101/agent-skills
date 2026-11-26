// Team-level skills need an owner: every skill has its own CODEOWNERS line,
// an author in its metadata, and a row in the Levels table that names the
// same owner.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const skills = fs.readdirSync(path.join(root, 'skills')).filter(name => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))).sort();
const LEVELS = /^(Personal|Team|Process)\b/;

function codeowners() {
  const owners = {};
  for (const line of fs.readFileSync(path.join(root, '.github', 'CODEOWNERS'), 'utf8').split('\n')) {
    const [pattern, ...names] = line.replace(/#.*/, '').trim().split(/\s+/);
    if (pattern && names.length) owners[pattern] = names;
  }
  return owners;
}

function levelsTable() {
  const text = fs.readFileSync(path.join(root, 'docs', 'skills', 'index.md'), 'utf8');
  const section = text.split(/^## Levels and owners$/m)[1]?.split(/^## /m)[0] ?? '';
  const rows = {};
  for (const line of section.split('\n').filter(l => l.startsWith('| [') )) {
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    rows[/\[([^\]]+)\]/.exec(cells[0])[1]] = { level: cells[1], reviewer: cells[2], owner: cells[3] };
  }
  return rows;
}

test('every skill has its own CODEOWNERS line', () => {
  const owners = codeowners();
  for (const skill of skills) assert.ok(owners[`/skills/${skill}/`]?.length, `.github/CODEOWNERS needs a /skills/${skill}/ line`);
  for (const pattern of Object.keys(owners).filter(p => p.startsWith('/skills/'))) {
    assert.ok(skills.includes(pattern.split('/')[2]), `.github/CODEOWNERS names ${pattern}, which is not a skill`);
  }
});

test('every skill names an author in its metadata', () => {
  for (const skill of skills) {
    const text = fs.readFileSync(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8');
    assert.match(text, /^metadata:\n(?:[ \t]+.*\n)*?[ \t]+author:[ \t]*\S+/m, `${skill} has no metadata.author`);
  }
});

test('the Levels table lists every skill with a level, a reviewer, and its CODEOWNERS owner', () => {
  const owners = codeowners();
  const rows = levelsTable();
  assert.deepEqual(Object.keys(rows).sort(), skills);
  for (const skill of skills) {
    assert.match(rows[skill].level, LEVELS, `${skill}: level must start with Personal, Team, or Process`);
    assert.ok(rows[skill].reviewer, `${skill}: say who checks its output`);
    assert.deepEqual(rows[skill].owner.split(/[\s,]+/).filter(Boolean), owners[`/skills/${skill}/`], `${skill}: owner differs from CODEOWNERS`);
  }
});
