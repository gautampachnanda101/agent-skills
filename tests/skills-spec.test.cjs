const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

// Constraints from https://agentskills.io/specification.md
const NAME_LIMIT = 64;
const DESCRIPTION_LIMIT = 1024;
const COMPATIBILITY_LIMIT = 500;
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function simpleScalar(value) {
  const text = value.trim();
  if (text.length < 2) return text;
  const quote = text[0];
  if ((quote === "'" || quote === '"') && text.endsWith(quote)) return text.slice(1, -1);
  return text;
}

const skillsDir = path.join(root, 'skills');

const skillDirs = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
  .map(entry => entry.name);

assert.ok(skillDirs.length > 0, 'expected at least one skill directory under skills/');

for (const dir of skillDirs) {
  test(`SKILL.md frontmatter conforms to the Agent Skills spec: ${dir}`, () => {
    const file = path.join(skillsDir, dir, 'SKILL.md');
    const text = fs.readFileSync(file, 'utf8');
    const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
    assert.ok(match, `${dir}/SKILL.md must start with YAML frontmatter`);
    const frontmatter = match[1];

    const topLevel = {};
    let currentKey = null;
    for (const line of frontmatter.split('\n')) {
      const key = /^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/.exec(line);
      const nested = /^ {2}([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/.exec(line);
      if (key) {
        topLevel[key[1]] = key[2].trim() === '' ? {} : simpleScalar(key[2]);
        currentKey = key[1];
      } else if (nested && currentKey) {
        if (typeof topLevel[currentKey] === 'object') {
          topLevel[currentKey][nested[1]] = simpleScalar(nested[2]);
        }
      }
    }

    const name = topLevel.name;
    assert.ok(name, 'name is required');
    assert.ok(name.length <= NAME_LIMIT, `name must be at most ${NAME_LIMIT} characters`);
    assert.match(name, NAME_PATTERN, 'name must be lowercase alphanumerics and non-consecutive hyphens');
    assert.equal(name, dir, 'name must match the parent directory');

    const description = topLevel.description;
    assert.ok(description, 'description is required');
    assert.ok(description.length <= DESCRIPTION_LIMIT, 'description must be at most 1024 characters');

    if (topLevel.compatibility !== undefined) {
      assert.ok(topLevel.compatibility.length <= COMPATIBILITY_LIMIT, 'compatibility must be at most 500 characters');
    }
    if (topLevel.metadata !== undefined) {
      assert.equal(typeof topLevel.metadata, 'object', 'metadata must be a string-to-string map');
      for (const [key, value] of Object.entries(topLevel.metadata)) {
        assert.equal(typeof value, 'string', `metadata.${key} must map to a string`);
      }
      assert.match(topLevel.metadata.version ?? '', /^\d+\.\d+\.\d+$/, 'metadata.version must be semantic');
    }
  });
}

// The Agent Skills spec recommends a SKILL.md under 500 lines and about
// 5,000 tokens; detail belongs in guides loaded on demand. Tokens are
// estimated at four characters each.
const LINE_LIMIT = 500;
const TOKEN_LIMIT = 5000;

for (const dir of skillDirs) {
  test(`SKILL.md stays within the size budget, and every guide is linked: ${dir}`, () => {
    const skillDir = path.join(skillsDir, dir);
    const text = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
    const lines = text.split('\n').length;
    const tokens = Math.ceil(text.length / 4);
    assert.ok(lines <= LINE_LIMIT, `${dir}/SKILL.md has ${lines} lines; the limit is ${LINE_LIMIT}`);
    assert.ok(tokens <= TOKEN_LIMIT, `${dir}/SKILL.md is about ${tokens} tokens; the limit is ${TOKEN_LIMIT}. Move detail into a guide.`);
    const linked = new Set([...text.matchAll(/\]\(\.\/([^)#\s]+)/g)].map(m => m[1]));
    for (const target of linked) {
      assert.ok(fs.existsSync(path.join(skillDir, target)), `${dir}/SKILL.md links to missing ${target}`);
    }
    for (const guide of fs.readdirSync(skillDir).filter(f => f.endsWith('.md') && f !== 'SKILL.md')) {
      assert.ok(linked.has(guide), `${dir}/${guide} is never linked from SKILL.md, so no assistant will load it`);
    }
  });
}

// A "Not for ...; use <skill>" clause steers the assistant to a sibling, so
// every skill it names must exist.
test('every skill a description points to exists', () => {
  for (const dir of skillDirs) {
    const text = fs.readFileSync(path.join(skillsDir, dir, 'SKILL.md'), 'utf8');
    const description = /^description:\s*(.*)$/m.exec(text)?.[1] ?? '';
    for (const clause of description.match(/Not for [^.]*\./g) ?? []) {
      for (const [, name] of clause.matchAll(/\buse ([a-z0-9]+(?:-[a-z0-9]+)+)/g)) {
        assert.ok(skillDirs.includes(name), `${dir}'s description points to ${name}, which is not a skill`);
      }
      for (const [, name] of clause.matchAll(/\bor ([a-z0-9]+(?:-[a-z0-9]+)+) for/g)) {
        assert.ok(skillDirs.includes(name), `${dir}'s description points to ${name}, which is not a skill`);
      }
    }
  }
});
