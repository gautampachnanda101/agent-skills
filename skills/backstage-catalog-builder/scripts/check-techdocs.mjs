#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ANNOTATION = 'backstage.io/techdocs-ref';
const MKDOCS_FILES = ['mkdocs.yml', 'mkdocs.yaml'];
const TOP_KEY_PATTERN = /^([A-Za-z][A-Za-z0-9_-]*):(.*?)\s*$/;
const INCLUDE_PATTERN = /^!include\s+(\S+)$/;
const MAX_INCLUDE_DEPTH = 10;

function usage() {
  process.stdout.write(`Usage: node check-techdocs.mjs [<options>] <descriptor files...>

Zero-dependency structural checks for TechDocs references and MkDocs sites
modeled through the ${ANNOTATION} annotation:
  - dir: targets resolving to a directory that contains mkdocs.yml/mkdocs.yaml
  - mkdocs site_name present and matching the owning entity's metadata.name
    (case-insensitive; mismatches outside the exact match are warnings)
  - the techdocs-core plugin present in the referenced (root) site
  - every nav page and nested nav entry resolving inside the site's
    docs_dir (default ./docs, overridable by docs_dir in mkdocs.yml)
  - nav !include entries (mkdocs-monorepo-plugin) resolving to existing
    mkdocs files whose sites carry site_name and resolvable nav pages

url: techdocs-ref values are only recorded, not resolved. Other values are
reported as warnings.

Limitations: line-based structural checking, not a YAML parser. Anchors,
flow-style maps, escaped colons in nav labels, and exotic quoting may be
missed, so also use a YAML parser or mkdocs build where available.

Options:
  --root <dir>  Resolve relative dir: targets and includes from this
                directory instead of each descriptor's own directory
  --json        Emit a JSON report on stdout
  --strict      Treat warnings as failures
  --help        Show this text

Exit status: 0 clean, 1 findings (errors, or warnings with --strict), 2 usage.
`);
}

function parseArgs(argv) {
  const opts = { root: null, json: false, strict: false, help: false, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') { opts.files.push(...argv.slice(i + 1)); break; }
    else if (arg === '--help') opts.help = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--strict') opts.strict = true;
    else if (arg === '--root') { opts.root = argv[++i]; if (!opts.root) return null; }
    else if (arg.startsWith('--') && arg.length > 2) return null;
    else opts.files.push(arg);
  }
  return opts;
}

function clean(value) {
  let out = value.trim().replace(/\s+#.*$/, '');
  if (out.length > 1) {
    const q = out[0];
    if ((q === "'" || q === '"') && out.endsWith(q)) return out.slice(1, -1);
  }
  return out;
}

function readLines(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  } catch (error) {
    return { error: `cannot read file: ${error.code ?? error.message}` };
  }
  return { lines: text.split(/\r?\n/).map((lineText, index) => ({ text: lineText, line: index + 1 })) };
}

function splitDocuments(lines) {
  const docs = [];
  let current = [];
  let skipping = false;
  for (const entry of lines) {
    if (/^-{3}\s*$/.test(entry.text)) {
      if (current) docs.push(current);
      current = [];
      skipping = false;
      continue;
    }
    if (skipping) {
      if (/^\s*$/.test(entry.text)) continue;
      skipping = false;
    }
    if (/^\.{3}\s*$/.test(entry.text)) {
      if (current) { docs.push(current); current = null; }
      skipping = true;
      continue;
    }
    if (current) current.push(entry);
  }
  if (current) docs.push(current);
  return docs.filter(doc => doc.some(entry => entry.text.trim() !== ''));
}

function stripComments(entries) {
  // Comment-only lines are irrelevant to structural lookups.
  return entries.filter(entry => !/^\s*#/.test(entry.text));
}

function topLevelKey(entry) {
  return TOP_KEY_PATTERN.exec(entry.text);
}

function findTopKey(entries, key) {
  for (const entry of entries) {
    const top = topLevelKey(entry);
    if (top && top[1] === key) return { key: top[1], rest: top[2], line: entry.line };
  }
  return null;
}

// Collects `child: value` lines under an annotation mapping such as
// metadata.annotations (exactly one more indent level).
function findAnnotation(entries, name) {
  const start = entries.findIndex(entry => /^ {2}annotations:\s*$/.test(entry.text));
  if (start < 0) return null;
  for (let i = start + 1; i < entries.length; i++) {
    const match = /^ {4}(?:([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)|([A-Za-z0-9._-]+)):(.*?)\s*$/.exec(entries[i].text);
    if (!match) break;
    const key = match[1] ?? match[2];
    if (key === name) return { key, value: clean(match[3]), line: entries[i].line };
  }
  return null;
}

function listAtTopLevel(entries, key) {
  const names = [];
  const start = entries.findIndex(entry => topLevelKey(entry) && topLevelKey(entry)[1] === key);
  if (start < 0) return names;
  for (let i = start + 1; i < entries.length; i++) {
    const entry = entries[i];
    if (/^\s*$/.test(entry.text)) continue;
    if (topLevelKey(entry) || !/^ /.test(entry.text)) break;
    const item = /^\s*-\s*(.*?)\s*$/.exec(entry.text);
    if (!item) continue;
    const text = item[1];
    const colon = text.indexOf(':');
    names.push({ name: (colon >= 0 ? text.slice(0, colon) : text).trim(), value: colon >= 0 ? text.slice(colon + 1) : '', line: entry.line });
  }
  return names;
}

// Walks a nav list at a fixed indent level, recursing into nested label
// lists, and returns every page path and !include entry found.
function collectNavList(entries, start, indent, leaves) {
  let i = start;
  while (i < entries.length) {
    const entry = entries[i];
    if (/^\s*$/.test(entry.text)) { i += 1; continue; }
    if (topLevelKey(entry)) break;
    if (indentOfNav(entry.text) !== indent) break;
    const item = /^\s*-\s*(.*)$/.exec(entry.text);
    if (!item) break;
    const value = clean(item[1]);
    if (INCLUDE_PATTERN.test(value)) {
      pushLeaf(leaves, value, entry.line);
      i += 1;
      continue;
    }
    const separator = value.indexOf(':');
    if (separator >= 0 && !value.endsWith(':')) {
      pushLeaf(leaves, value.slice(separator + 1), entry.line);
      i += 1;
      continue;
    }
    if (value.endsWith(':') || value === '') {
      // Container label; its children are the next deeper list.
      const child = indentOfFirstDeeperListItem(entries, i + 1, indent);
      if (child) {
        i = collectNavList(entries, child.index, child.indent, leaves);
      } else {
        i += 1;
      }
      continue;
    }
    // Bare page path without a label.
    pushLeaf(leaves, value, entry.line);
    i += 1;
  }
  return i;
}

function indentOfFirstDeeperListItem(entries, start, indent) {
  for (let i = start; i < entries.length; i++) {
    const text = entries[i].text;
    if (/^\s*$/.test(text)) continue;
    const lineIndent = indentOfNav(text);
    if (lineIndent <= indent) return null;
    const item = new RegExp(`^\\s{${indent + 1},}-\\s*(.*)$`).exec(text);
    if (item) return { index: i, indent: lineIndent };
    return null;
  }
  return null;
}

function indentOfNav(text) {
  return text.length - text.trimStart().length;
}

function pushLeaf(leaves, value, line) {
  const text = clean(value);
  if (!text || text.endsWith(':')) return;
  const include = INCLUDE_PATTERN.exec(text);
  if (include) {
    leaves.push({ include: include[1], line });
    return;
  }
  leaves.push({ page: text, line });
}

function parseSite(file) {
  const read = readLines(file);
  if (read.error) return { error: read.error };
  const entries = stripComments(splitDocuments(read.lines).flat());
  const siteName = findTopKey(entries, 'site_name');
  const docsDir = findTopKey(entries, 'docs_dir');
  const plugins = listAtTopLevel(entries, 'plugins');
  const navKey = findTopKey(entries, 'nav');
  let navLeaves = [];
  if (navKey && clean(navKey.rest) === '') {
    const navIndex = entries.findIndex(entry => topLevelKey(entry) && topLevelKey(entry)[1] === 'nav');
    const first = indentOfFirstDeeperListItem(entries, navIndex + 1, -1);
    if (first) {
      collectNavList(entries, first.index, first.indent, navLeaves);
    }
  }
  // A flow-style or single-value nav is recorded as present but unstructured.
  return {
    siteName: siteName ? clean(siteName.rest) : null,
    siteNameLine: siteName?.line ?? 1,
    docsDir: (docsDir ? clean(docsDir.rest) : '') || 'docs',
    plugins,
    hasNav: navKey && clean(navKey.rest) === '' ? navLeaves.length > 0 : Boolean(navKey),
    navLeaves,
  };
}

function checkSite(siteFile, entityName, problems, state) {
  const parsed = parseSite(siteFile);
  const siteRoot = path.dirname(siteFile);
  if (parsed.error) {
    problems.push({ severity: 'error', file: siteFile, line: 1, message: `mkdocs site cannot be read: ${parsed.error}` });
    return;
  }
  state.sites += 1;
  if (parsed.siteName == null || parsed.siteName === '') {
    problems.push({ severity: 'error', file: siteFile, line: parsed.siteNameLine, message: 'mkdocs site is missing site_name' });
  }
  if (parsed.siteName && entityName && parsed.siteName.toLowerCase() !== entityName.toLowerCase()) {
    problems.push({
      severity: 'warning',
      file: siteFile,
      line: parsed.siteNameLine,
      message: `mkdocs site_name '${parsed.siteName}' does not match the owning entity name '${entityName}'`,
    });
  }
  const hasCore = parsed.plugins.some(plugin => plugin.name === 'techdocs-core');
  if (!hasCore) {
    problems.push({
      severity: 'error',
      file: siteFile,
      line: 1,
      message: 'mkdocs site is missing the techdocs-core plugin; the TechDocs default generator requires it',
    });
  }
  const docsBase = path.resolve(siteRoot, parsed.docsDir);
  if (!parsed.hasNav) {
    if (!fs.existsSync(path.join(docsBase, 'index.md'))) {
      problems.push({
        severity: 'warning',
        file: siteFile,
        line: 1,
        message: `mkdocs site has no nav and no ${path.relative(siteRoot, docsBase)}/index.md home page`,
      });
    }
    return;
  }
  for (const leaf of parsed.navLeaves) {
    if (leaf.include) {
      checkIncludedSite(leaf.include, siteRoot, problems, state, 1, [siteFile]);
      continue;
    }
    const resolved = path.resolve(docsBase, leaf.page);
    if (!fs.existsSync(resolved)) {
      problems.push({
        severity: 'error',
        file: siteFile,
        line: leaf.line,
        message: `nav page '${leaf.page}' does not exist (resolved to '${docsBase.split(path.sep).pop() + path.sep + path.relative(docsBase, resolved)}')`,
      });
    }
  }
}

function checkIncludedSite(target, siteRoot, problems, state, depth, breadcrumbs) {
  const resolved = path.isAbsolute(target) ? target : path.resolve(siteRoot, target);
  if (breadcrumbs.includes(resolved)) {
    problems.push({ severity: 'error', file: breadcrumbs[breadcrumbs.length - 1], line: 1, message: `nav !include '${target}' creates a circular include` });
    return;
  }
  if (depth > MAX_INCLUDE_DEPTH) {
    problems.push({ severity: 'error', file: breadcrumbs[breadcrumbs.length - 1], line: 1, message: `nav !include exceeds ${MAX_INCLUDE_DEPTH} nested levels` });
    return;
  }
  if (!fs.existsSync(resolved) || !MKDOCS_FILES.includes(path.basename(resolved))) {
    problems.push({ severity: 'error', file: breadcrumbs[breadcrumbs.length - 1], line: 1, message: `nav !include '${target}' does not resolve to an mkdocs file (resolved to '${resolved}')` });
    return;
  }
  const parsed = parseSite(resolved);
  if (parsed.error) {
    problems.push({ severity: 'error', file: resolved, line: 1, message: `included mkdocs site cannot be read: ${parsed.error}` });
    return;
  }
  state.sites += 1;
  if (parsed.siteName == null || parsed.siteName === '') {
    problems.push({ severity: 'error', file: resolved, line: parsed.siteNameLine, message: 'included mkdocs site is missing site_name' });
  }
  const docsBase = path.resolve(path.dirname(resolved), parsed.docsDir);
  if (!parsed.hasNav) {
    if (!fs.existsSync(path.join(docsBase, 'index.md'))) {
      problems.push({ severity: 'warning', file: resolved, line: 1, message: 'included mkdocs site has no nav and no docs index page' });
    }
    return;
  }
  for (const leaf of parsed.navLeaves) {
    if (leaf.include) {
      checkIncludedSite(leaf.include, path.dirname(resolved), problems, state, depth + 1, [...breadcrumbs, resolved]);
      continue;
    }
    const nested = path.resolve(docsBase, leaf.page);
    if (!fs.existsSync(nested)) {
      problems.push({ severity: 'error', file: resolved, line: leaf.line, message: `nav page '${leaf.page}' does not exist (resolved to '${nested}')` });
    }
  }
}

let baseRoot;
const problems = [];
const state = { sites: 0 };

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts) {
    console.error('Invalid arguments.');
    usage();
    process.exit(2);
  }
  if (opts.help) {
    usage();
    process.exit(0);
  }
  if (!opts.files.length) {
    console.error('No descriptor files given.');
    usage();
    process.exit(2);
  }
  baseRoot = opts.root ? path.resolve(opts.root) : null;
  let documents = 0;
  let references = 0;
  let remote = 0;
  for (const file of opts.files) {
    const read = readLines(file);
    if (read.error) {
      problems.push({ severity: 'error', file, line: 0, message: read.error });
      continue;
    }
    const docs = splitDocuments(read.lines);
    documents += docs.length;
    if (!docs.length) {
      problems.push({ severity: 'error', file, line: 0, message: 'no documents found' });
      continue;
    }
    for (const rawDoc of docs) {
      const doc = stripComments(rawDoc);
      const nameEntry = doc.find(entry => /^ {2}name:\s*.+$/.test(entry.text));
      const name = clean(nameEntry?.text.replace(/^ {2}name:\s*/, '') ?? '');
      const annotation = findAnnotation(doc, ANNOTATION);
      if (!annotation) continue;
      references += 1;
      const value = annotation.value;
      const dirValue = /^dir:(.*)$/.exec(value);
      const urlValue = /^url:(.*)$/.exec(value);
      if (urlValue) {
        if (!urlValue[1]) {
          problems.push({ severity: 'error', file, line: annotation.line, message: `${ANNOTATION} url value is empty` });
          remote += 1;
        } else {
          remote += 1;
        }
        continue;
      }
      if (!dirValue) {
        problems.push({ severity: 'warning', file, line: annotation.line, message: `${ANNOTATION} value '${value}' is neither dir: nor url:` });
        continue;
      }
      const rel = dirValue[1].trim() || '.';
      const resolved = path.resolve(baseRoot ?? path.dirname(file), rel);
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
        problems.push({ severity: 'error', file, line: annotation.line, message: `${ANNOTATION} dir target '${value}' resolves to '${resolved}', which is not a directory` });
        continue;
      }
      const siteFile = MKDOCS_FILES.map(candidate => path.join(resolved, candidate)).find(candidate => fs.existsSync(candidate));
      if (!siteFile) {
        problems.push({ severity: 'error', file, line: annotation.line, message: `${ANNOTATION} dir target '${value}' has no ${MKDOCS_FILES.join(' or ')}` });
        continue;
      }
      if (!name && nameEntry) {
        problems.push({ severity: 'warning', file, line: nameEntry.line, message: 'metadata.name is empty; site_name matching is skipped' });
      }
      checkSite(siteFile, name || null, problems, state);
    }
  }
  const errors = problems.filter(problem => problem.severity === 'error').length;
  const warnings = problems.length - errors;
  const failed = errors > 0 || (opts.strict && warnings > 0);
  if (opts.json) {
    process.stdout.write(`${JSON.stringify({ files: opts.files, documents, references, remoteReferences: remote, sites: state.sites, problems, errors, warnings }, null, 2)}\n`);
  } else {
    for (const problem of problems) {
      process.stdout.write(`${problem.file}:${problem.line}: ${problem.severity}: ${problem.message}\n`);
    }
    process.stdout.write(`Checked ${opts.files.length} descriptor file(s), ${references} TechDocs reference(s) (${remote} remote), ${state.sites} mkdocs site(s): ${errors} error(s), ${warnings} warning(s).\n`);
  }
  process.exit(failed ? 1 : 0);
}

main();
