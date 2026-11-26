#!/usr/bin/env node
/**
 * Publishes a GitHub release for the plugin version, once.
 *
 * The version comes from .claude-plugin/plugin.json and the tag is v<version>.
 * Release notes come from .github/release-notes/v<version>.md when that file
 * exists, otherwise from the version's CHANGELOG.md section. A version that
 * is already released is skipped; a tag that exists on another commit fails.
 *
 * Usage:
 *   node scripts/release.mjs --dry-run           print the plan
 *   node scripts/release.mjs --target <sha>      publish (needs gh and GH_TOKEN)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function changelogSection(changelog, version) {
  const lines = changelog.split('\n');
  const start = lines.findIndex(line => line.startsWith(`## [${version}]`));
  if (start === -1) return undefined;
  const end = lines.findIndex((line, i) => i > start && /^## \[/.test(line));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n').trim();
}

export function plan(dir = root) {
  const version = JSON.parse(fs.readFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const tag = `v${version}`;
  const curated = path.join(dir, '.github', 'release-notes', `${tag}.md`);
  let notes;
  let source;
  if (fs.existsSync(curated)) {
    notes = fs.readFileSync(curated, 'utf8').trim();
    source = path.relative(dir, curated);
  } else {
    notes = changelogSection(fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8'), version);
    source = `CHANGELOG.md [${version}]`;
  }
  if (!notes) throw new Error(`no release notes for ${tag}: add a CHANGELOG.md section or ${path.relative(dir, curated)}`);
  // A curated file may open with "# <title>"; otherwise the tag is the title.
  let title = tag;
  const heading = /^# (.+)\n+/.exec(notes);
  if (heading) {
    title = heading[1].trim();
    notes = notes.slice(heading[0].length).trim();
  }
  return { version, tag, title, notes, source };
}

function gh(args) {
  return spawnSync('gh', args, { encoding: 'utf8' });
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const at = process.argv.indexOf('--target');
  const target = at === -1 ? undefined : process.argv[at + 1];
  const release = plan();
  console.log(`Release ${release.tag} "${release.title}", notes from ${release.source}`);
  if (dryRun) {
    console.log(`\n${release.notes}`);
    return;
  }
  if (!target || !/^[0-9a-f]{40}$/.test(target)) {
    console.error('release: --target needs a full commit SHA');
    process.exit(2);
  }
  if (gh(['release', 'view', release.tag, '--json', 'tagName']).status === 0) {
    console.log(`${release.tag} is already released; nothing to do.`);
    return;
  }
  const ref = gh(['api', `repos/{owner}/{repo}/git/ref/tags/${release.tag}`, '--jq', '.object.sha']);
  if (ref.status === 0) {
    let tagged = ref.stdout.trim();
    const peeled = gh(['api', `repos/{owner}/{repo}/git/tags/${tagged}`, '--jq', '.object.sha']);
    if (peeled.status === 0) tagged = peeled.stdout.trim();
    if (tagged !== target) {
      console.error(`release: tag ${release.tag} already points at ${tagged}, not ${target}`);
      process.exit(1);
    }
  }
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'release-'));
  const notesFile = path.join(scratch, 'notes.md');
  fs.writeFileSync(notesFile, `${release.notes}\n`);
  try {
    execFileSync('gh', ['release', 'create', release.tag, '--target', target, '--title', release.title, '--notes-file', notesFile], { stdio: 'inherit' });
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
