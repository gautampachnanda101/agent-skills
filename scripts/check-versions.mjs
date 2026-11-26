#!/usr/bin/env node
/**
 * Checks skill and plugin versions and the changelog.
 *
 * Always:
 *   - every skill's metadata.version and the plugin version are X.Y.Z
 *   - each skill's docs page (docs/skills/<name>.md) states its version
 *   - the newest released CHANGELOG.md section is the plugin version
 *
 * Against a base, for what changed since it:
 *   - a skill with any changed file has a higher version than at the base,
 *     except recorded transcripts (tests/agent-transcripts/), which record
 *     evidence about a version rather than change the skill
 *   - no skill or plugin version decreases
 *   - a changed skill or plugin version comes with a CHANGELOG.md change
 *
 * Usage:
 *   node scripts/check-versions.mjs              staged changes against HEAD
 *   node scripts/check-versions.mjs --base REF   HEAD against REF
 *   node scripts/check-versions.mjs --no-base    the always-on checks only
 * Exits 1 when a check fails.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function compare(a, b) {
  const x = SEMVER.exec(a).slice(1).map(Number);
  const y = SEMVER.exec(b).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export function skillVersion(text) {
  return /^metadata:\n(?:[ \t]+.*\n)*?[ \t]+version:[ \t]*["']?([^"'\s]+)["']?/m.exec(text ?? '')?.[1];
}

export function pluginVersion(text) {
  return text ? JSON.parse(text).version : undefined;
}

export function newestRelease(changelog) {
  for (const match of changelog.matchAll(/^## \[([^\]]+)\]/gm)) {
    if (match[1].toLowerCase() !== 'unreleased') return match[1];
  }
  return undefined;
}

/**
 * read(file) returns the current text or undefined; base(file) the text at
 * the base or undefined; changed is the list of changed paths, or null when
 * there is no base. Returns a list of problems.
 */
export function check({ skills, read, base, changed }) {
  const problems = [];
  const plugin = pluginVersion(read('.claude-plugin/plugin.json'));
  if (!SEMVER.test(plugin ?? '')) problems.push(`plugin version "${plugin}" is not X.Y.Z`);

  for (const skill of skills) {
    const version = skillVersion(read(`skills/${skill}/SKILL.md`));
    if (!SEMVER.test(version ?? '')) {
      problems.push(`${skill}: metadata.version "${version}" is not X.Y.Z`);
      continue;
    }
    const page = read(`docs/skills/${skill}.md`);
    const stated = /\*\*Version ([^\s*·]+)/.exec(page ?? '')?.[1];
    if (page !== undefined && stated !== version) {
      problems.push(`docs/skills/${skill}.md states version ${stated ?? '(none)'}, but the skill is ${version}`);
    }
  }

  const changelog = read('CHANGELOG.md') ?? '';
  const released = newestRelease(changelog);
  if (SEMVER.test(plugin ?? '') && released !== plugin) {
    problems.push(`the newest CHANGELOG.md release is ${released ?? '(none)'}, but the plugin version is ${plugin}`);
  }

  if (!changed) return problems;
  let needsChangelog = false;
  for (const skill of skills) {
    const own = changed.filter(file => file.startsWith(`skills/${skill}/`) && !file.startsWith(`skills/${skill}/tests/agent-transcripts/`));
    if (!own.length) continue;
    needsChangelog = true;
    const before = skillVersion(base(`skills/${skill}/SKILL.md`));
    const after = skillVersion(read(`skills/${skill}/SKILL.md`));
    if (!before || !SEMVER.test(before) || !SEMVER.test(after ?? '')) continue; // new or renamed skill
    if (compare(after, before) <= 0) {
      problems.push(`${skill} changed, so its version must increase from ${before} (now ${after})`);
    }
  }
  const pluginBefore = pluginVersion(base('.claude-plugin/plugin.json'));
  if (pluginBefore && SEMVER.test(pluginBefore) && SEMVER.test(plugin ?? '') && pluginBefore !== plugin) {
    needsChangelog = true;
    if (compare(plugin, pluginBefore) < 0) problems.push(`plugin version decreased from ${pluginBefore} to ${plugin}`);
  }
  if (needsChangelog && !changed.includes('CHANGELOG.md')) {
    problems.push('a skill or the plugin version changed, so CHANGELOG.md must change too');
  }
  return problems;
}

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return undefined;
  }
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  const at = args.indexOf('--base');
  const ref = at === -1 ? null : args[at + 1];
  if (at !== -1 && !ref) {
    console.error('check-versions: --base needs a git ref');
    process.exit(2);
  }
  const noBase = args.includes('--no-base') || (ref && /^0+$/.test(ref));
  const staged = !noBase && !ref;
  if (ref && !noBase && git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], root) === undefined) {
    console.error(`check-versions: unknown base ${ref}`);
    process.exit(2);
  }

  // Staged mode reads the index, so the check sees exactly what is committed.
  const read = staged
    ? file => git(['show', `:${file}`], root)
    : ref
      ? file => git(['show', `HEAD:${file}`], root)
      : file => (fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : undefined);
  const base = file => git(['show', `${staged ? 'HEAD' : ref}:${file}`], root);
  const list = staged
    ? git(['ls-files', '--', 'skills/*/SKILL.md'], root)
    : ref
      ? git(['ls-tree', '-r', '--name-only', 'HEAD', '--', 'skills'], root)
      : null;
  const skills = (list
    ? list.split('\n').filter(file => /^skills\/[^/]+\/SKILL\.md$/.test(file)).map(file => file.split('/')[1])
    : fs.readdirSync(path.join(root, 'skills')).filter(name => fs.existsSync(path.join(root, 'skills', name, 'SKILL.md'))))
    .sort();
  const diff = noBase ? null : git(staged ? ['diff', '--cached', '--name-only', '--no-renames', 'HEAD'] : ['diff', '--name-only', '--no-renames', ref, 'HEAD'], root);
  const changed = diff === null || diff === undefined ? null : diff.split('\n').filter(Boolean);

  const problems = check({ skills, read, base, changed });
  for (const problem of problems) console.error(`check-versions: ${problem}`);
  if (problems.length) process.exit(1);
  console.log(`check-versions: ${skills.length} skills and the plugin are consistent${changed ? ` (${changed.length} changed files)` : ''}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
