#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const API_VERSION = 'backstage.io/v1alpha1';
const KINDS = new Set(['Component', 'API', 'System', 'Domain', 'Resource', 'Location', 'Group', 'User', 'Template', 'Relation']);
const REQUIRED = {
  API: ['type', 'lifecycle', 'owner', 'definition'],
  Component: ['type', 'lifecycle', 'owner'],
  Resource: ['type', 'owner'],
  System: ['owner'],
  Location: ['targets'],
};
const REF_FIELDS = ['owner', 'system', 'subcomponentOf'];
const REF_LISTS = ['dependsOn', 'providesApis', 'consumesApis'];
const NAME_PATTERN = /^[a-zA-Z0-9]+([-_.][a-zA-Z0-9]+)*$/;
const NAMESPACE_PATTERN = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;
const NAME_MAX_LENGTH = 63;
const TOP_KEY_PATTERN = /^([A-Za-z][A-Za-z0-9_-]*):(.*?)\s*$/;
const SUB_KEY_PATTERN = /^ {2}([A-Za-z][A-Za-z0-9_-]*):(.*?)\s*$/;

function usage() {
  process.stdout.write(`Usage: node check-descriptors.mjs [<options>] <descriptor files...>

Zero-dependency structural checks for Backstage entity descriptors:
  - apiVersion ${API_VERSION} and a recognized kind
  - required metadata.name and spec fields per kind
  - Backstage default name rules for metadata.name and namespace: at most
    ${NAME_MAX_LENGTH} characters, alphanumerics separated by single '-', '_' or
    '.' for names and by '-' for namespaces
  - duplicate (kind, namespace, name) identities across all input files
  - duplicate top-level keys inside one document
  - Location spec.targets existing relative to each descriptor's directory
  - $text/$yaml/$json/$file placeholders existing relative to it

Limitations: line-based structural checking, not a YAML parser or schema
validator. Anchors, flow-style maps, and exotic quoting may be missed, so
also use a YAML parser or the catalog's validate-entity when available.

Options:
  --root <dir>  Resolve relative Location targets and placeholders from this
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

function blockKeys(doc, parent) {
  const keys = [];
  const parentPattern = new RegExp(`^${parent}\\s*:`);
  let inside = false;
  for (const entry of doc) {
    const top = TOP_KEY_PATTERN.exec(entry.text);
    if (top) {
      inside = parentPattern.test(entry.text);
      if (inside && top[2].trim() === '{}') break;
      continue;
    }
    if (inside) {
      const sub = SUB_KEY_PATTERN.exec(entry.text);
      if (sub) keys.push({ key: sub[1], rest: sub[2], line: entry.line });
    }
  }
  return keys;
}

function blockList(doc, parent, key) {
  const listPattern = new RegExp(`^ {2}${key}:(.*?)\\s*$`);
  const parentPattern = new RegExp(`^${parent}\\s*:`);
  const items = [];
  let inside = false;
  let collecting = false;
  for (const entry of doc) {
    if (TOP_KEY_PATTERN.test(entry.text)) {
      inside = parentPattern.test(entry.text);
      collecting = false;
      continue;
    }
    if (!inside) continue;
    const sub = listPattern.exec(entry.text);
    if (sub) { collecting = !sub[1].trim(); continue; }
    if (!collecting) continue;
    if (/^\s*$/.test(entry.text)) continue;
    const item = /^ {2,}-\s*(.*?)\s*$/.exec(entry.text);
    if (item) { items.push({ rest: item[1], line: entry.line }); continue; }
    if (!/^ {4,}\S/.test(entry.text)) collecting = false;
  }
  return items;
}

function placeholderTargets(doc, valueKey) {
  const valuePattern = new RegExp(`^ {2}${valueKey}:(.*?)\\s*$`);
  const found = [];
  let inside = false;
  let collecting = false;
  for (const entry of doc) {
    if (TOP_KEY_PATTERN.test(entry.text)) {
      inside = /^spec\s*:/.test(entry.text);
      collecting = false;
      continue;
    }
    if (!inside) continue;
    const sub = valuePattern.exec(entry.text);
    if (sub) { collecting = !sub[1].trim(); continue; }
    if (!collecting) continue;
    if (/^\s*$/.test(entry.text)) continue;
    const placeholder = /^ *\$(text|yaml|json|file)\s*:\s*(.*?)\s*$/.exec(entry.text);
    if (placeholder) found.push({ directive: placeholder[1], rest: placeholder[2], line: entry.line });
    else if (SUB_KEY_PATTERN.test(entry.text)) collecting = false;
  }
  return found;
}

function refLooksValid(value) {
  return value !== '' && !/\s/.test(value) && !value.startsWith(':');
}

function resolvesToLocal(value) {
  return value !== '' && !/^(https?:|file:)/i.test(value);
}

function checkDocument(entries, file, problems, identities) {
  const firstLine = entries[0]?.line ?? 1;
  for (const entry of entries) {
    if (/^[ \t]*\t/.test(entry.text)) {
      problems.push({ severity: 'error', file, line: entry.line, message: 'tab character in indentation is invalid YAML; use spaces' });
    }
  }
  const topLevel = [];
  const seenKeys = new Map();
  for (const entry of entries) {
    const top = TOP_KEY_PATTERN.exec(entry.text);
    if (!top) continue;
    if (seenKeys.has(top[1])) {
      problems.push({ severity: 'error', file, line: entry.line, message: `duplicate top-level key '${top[1]}' in document` });
    }
    seenKeys.set(top[1], entry.line);
    topLevel.push({ key: top[1], rest: top[2], line: entry.line });
  }
  const findKey = key => topLevel.find(entry => entry.key === key);
  const apiVersion = findKey('apiVersion');
  if (!apiVersion) problems.push({ severity: 'error', file, line: firstLine, message: 'missing apiVersion' });
  else if (clean(apiVersion.rest) !== API_VERSION) {
    problems.push({ severity: 'error', file, line: apiVersion.line, message: `unexpected apiVersion '${clean(apiVersion.rest)}' (expected '${API_VERSION}')` });
  }
  const kindEntry = findKey('kind');
  if (!kindEntry) {
    problems.push({ severity: 'error', file, line: firstLine, message: 'missing kind' });
    return;
  }
  const kind = clean(kindEntry.rest);
  if (!kind) {
    problems.push({ severity: 'error', file, line: kindEntry.line, message: 'kind has no value' });
    return;
  }
  if (!KINDS.has(kind)) {
    problems.push({ severity: 'warning', file, line: kindEntry.line, message: `unknown kind '${kind}'; default catalog rules may reject it` });
  }
  const baseDir = baseRoot ?? path.dirname(file);
  const metadataKeys = blockKeys(entries, 'metadata');
  const metadataName = metadataKeys.find(entry => entry.key === 'name');
  if (!metadataName) {
    problems.push({ severity: 'error', file, line: firstLine, message: 'missing metadata.name' });
    return;
  }
  const name = clean(metadataName.rest);
  if (!name || !NAME_PATTERN.test(name)) {
    problems.push({ severity: 'error', file, line: metadataName.line, message: `invalid metadata.name '${name}': default rules require alphanumerics separated by single '-', '_' or '.', with no leading or trailing separator` });
  } else if (name.length > NAME_MAX_LENGTH) {
    problems.push({ severity: 'error', file, line: metadataName.line, message: `metadata.name '${name}' exceeds the default ${NAME_MAX_LENGTH}-character limit (${name.length})` });
  }
  const namespaceKey = metadataKeys.find(entry => entry.key === 'namespace');
  const namespace = namespaceKey ? clean(namespaceKey.rest) : 'default';
  if (namespaceKey && (!namespace || !NAMESPACE_PATTERN.test(namespace))) {
    problems.push({ severity: 'error', file, line: namespaceKey.line, message: `invalid metadata.namespace '${namespace}': default rules require 1-63 characters, alphanumerics separated by single '-'` });
  } else if (namespaceKey && namespace.length > NAME_MAX_LENGTH) {
    problems.push({ severity: 'error', file, line: namespaceKey.line, message: `metadata.namespace '${namespace}' exceeds the default ${NAME_MAX_LENGTH}-character limit (${namespace.length})` });
  }
  if (name && NAME_PATTERN.test(name)) {
    const identity = `${kind}:${namespace}:${name}`;
    const first = identities.get(identity);
    if (first) {
      problems.push({ severity: 'error', file, line: metadataName.line, message: `duplicate entity identity ${identity}; first defined in ${first.file}:${first.line}` });
    } else {
      identities.set(identity, { file, line: metadataName.line });
    }
  }
  const specKeys = blockKeys(entries, 'spec');
  for (const field of REQUIRED[kind] ?? []) {
    if (field === 'targets') {
      const hasTargets = specKeys.some(entry => entry.key === 'targets' || entry.key === 'wildcardTargets');
      if (!hasTargets) {
        problems.push({ severity: 'error', file, line: firstLine, message: `${kind} requires spec.targets or spec.wildcardTargets` });
      }
      continue;
    }
    if (!specKeys.some(entry => entry.key === field)) {
      problems.push({ severity: 'error', file, line: firstLine, message: `${kind} requires spec.${field}` });
    }
  }
  for (const refField of REF_FIELDS) {
    const refKey = specKeys.find(entry => entry.key === refField);
    if (refKey && !refLooksValid(clean(refKey.rest))) {
      problems.push({ severity: 'error', file, line: refKey.line, message: `spec.${refField} '${clean(refKey.rest)}' is not a valid entity reference` });
    }
  }
  for (const refList of REF_LISTS) {
    for (const item of blockList(entries, 'spec', refList)) {
      const value = clean(item.rest);
      if (!refLooksValid(value)) {
        problems.push({ severity: 'error', file, line: item.line, message: `spec.${refList} entry '${value}' is not a valid entity reference` });
      }
    }
  }
  for (const item of blockList(entries, 'spec', 'targets')) {
    const value = clean(item.rest);
    if (!value) problems.push({ severity: 'error', file, line: item.line, message: 'empty Location target' });
    else if (resolvesToLocal(value) && !fs.existsSync(path.resolve(baseDir, value))) {
      problems.push({ severity: 'error', file, line: item.line, message: `Location target '${value}' does not exist (resolved to '${path.resolve(baseDir, value)}')` });
    }
  }
  for (const placeholder of placeholderTargets(entries, 'definition')) {
    const value = clean(placeholder.rest);
    if (!resolvesToLocal(value)) continue;
    const resolved = path.resolve(baseDir, value);
    if (!fs.existsSync(resolved)) {
      problems.push({ severity: 'error', file, line: placeholder.line, message: `spec.definition $${placeholder.directive} '${value}' does not exist (resolved to '${resolved}')` });
    }
  }
}

let baseRoot;
const problems = [];
const identities = new Map();

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
    for (const doc of docs) checkDocument(doc, file, problems, identities);
  }
  const errors = problems.filter(problem => problem.severity === 'error').length;
  const warnings = problems.length - errors;
  const failed = errors > 0 || (opts.strict && warnings > 0);
  if (opts.json) {
    process.stdout.write(`${JSON.stringify({ files: opts.files, documents, problems, errors, warnings }, null, 2)}\n`);
  } else {
    for (const problem of problems) {
      process.stdout.write(`${problem.file}:${problem.line}: ${problem.severity}: ${problem.message}\n`);
    }
    process.stdout.write(`Checked ${opts.files.length} file(s), ${documents} document(s): ${errors} error(s), ${warnings} warning(s).\n`);
  }
  process.exit(failed ? 1 : 0);
}

main();
