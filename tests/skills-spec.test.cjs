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

const skillDirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'SKILL.md')))
  .map(entry => entry.name);

assert.ok(skillDirs.length > 0, 'expected at least one skill directory');

for (const dir of skillDirs) {
  test(`SKILL.md frontmatter conforms to the Agent Skills spec: ${dir}`, () => {
    const file = path.join(root, dir, 'SKILL.md');
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
