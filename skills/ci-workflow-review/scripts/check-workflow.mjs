#!/usr/bin/env node
/**
 * Checks GitHub Actions workflow files for the patterns that most often let
 * an attacker run code, steal a token, or change what CI runs. It reads
 * the YAML line by line, so it needs no dependencies; it does not judge
 * whether the workflow does the right job.
 *
 *   unpinned         `uses:` not pinned to a full 40-character commit SHA
 *                    (local ./actions and docker://...@sha256 are fine)
 *   permissions      `permissions: write-all`, or no top-level permissions
 *   pr-target        `pull_request_target` together with a checkout of the
 *                    pull request's head, which runs untrusted code with
 *                    secrets and a write token
 *   injection        an attacker-controlled `${{ github.event... }}` or
 *                    `github.head_ref` expanded inside a `run:` script
 *   secret-echo      a secret printed with echo or printf
 *   credentials      `actions/checkout` without `persist-credentials: false`
 *
 * Usage: node check-workflow.mjs [--json] <workflow.yml...>
 * Exits 1 on any problem, 2 on bad usage.
 */
import fs from 'node:fs';

const UNTRUSTED = /\$\{\{\s*(github\.event\.(issue\.title|issue\.body|pull_request\.title|pull_request\.body|pull_request\.head\.ref|pull_request\.head\.label|comment\.body|review\.body|review_comment\.body|head_commit\.message|head_commit\.author\.(name|email)|commits\b[^}]*|pages\b[^}]*|discussion\.(title|body))|github\.head_ref)\s*\}\}/;

export function checkWorkflow(text) {
  const problems = [];
  const lines = text.split('\n');
  const add = (line, rule, message) => problems.push({ line, rule, message });
  if (!/^permissions\s*:/m.test(text)) add(1, 'permissions', 'no top-level `permissions:`; jobs get the default token scope');
  const prTarget = /^\s*pull_request_target\s*:?\s*$|^on\s*:.*pull_request_target|^\s*-\s*pull_request_target\b/m.test(text);
  let inRun = false;
  let runIndent = 0;
  let checkout = null;
  const closeCheckout = () => {
    if (checkout && !checkout.persistFalse) add(checkout.line, 'credentials', '`actions/checkout` keeps the token in .git/config; set `persist-credentials: false`');
    checkout = null;
  };
  lines.forEach((raw, index) => {
    const line = index + 1;
    const indent = raw.match(/^\s*/)[0].length;
    const body = raw.replace(/\s+#.*$/, '');
    if (/^\s*-\s/.test(raw) && checkout && indent <= checkout.indent) closeCheckout();
    if (inRun && raw.trim() && indent <= runIndent) inRun = false;
    const uses = /^\s*-?\s*uses\s*:\s*['"]?([^'"\s#]+)/.exec(body);
    if (uses) {
      const ref = uses[1];
      if (!ref.startsWith('./') && !/^docker:\/\/.+@sha256:[0-9a-f]{64}$/.test(ref) && !/@[0-9a-f]{40}$/.test(ref)) {
        add(line, 'unpinned', `\`${ref}\` is not pinned to a full commit SHA; a moved tag changes what runs`);
      }
      if (/^actions\/checkout@/.test(ref)) {
        closeCheckout();
        checkout = { line, indent: indent - (raw.trim().startsWith('-') ? 0 : 2), persistFalse: false };
      }
    }
    if (checkout && /persist-credentials\s*:\s*false/.test(body)) checkout.persistFalse = true;
    if (prTarget && checkout && /ref\s*:.*(pull_request\.head\.(sha|ref)|github\.head_ref|refs\/pull\/)/.test(body)) {
      add(line, 'pr-target', '`pull_request_target` checks out the pull request\'s code, which then runs with secrets and a write token');
    }
    if (/^\s*permissions\s*:\s*write-all\b/.test(body)) add(line, 'permissions', '`permissions: write-all` gives every job every write scope');
    const run = /^(\s*)-?\s*run\s*:\s*(.*)$/.exec(raw);
    if (run) {
      inRun = true;
      runIndent = run[1].length;
    }
    if ((inRun || run) && UNTRUSTED.test(raw)) add(line, 'injection', `\`${UNTRUSTED.exec(raw)[0]}\` is attacker-controlled and expands inside a shell script; pass it through an env variable`);
    if ((inRun || run) && /\b(echo|printf)\b[^\n]*\$\{\{\s*secrets\./.test(raw)) add(line, 'secret-echo', 'a secret is printed to the log');
  });
  closeCheckout();
  return problems.sort((a, b) => a.line - b.line);
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => arg !== '--json');
  if (!files.length) {
    console.error('Usage: node check-workflow.mjs [--json] <workflow.yml...>');
    process.exit(2);
  }
  const report = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      console.error(`check-workflow: cannot read ${file}: ${error.code ?? error.message}`);
      process.exit(2);
    }
    for (const problem of checkWorkflow(text)) report.push({ file, ...problem });
  }
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${p.file}:${p.line}: ${p.rule}: ${p.message}`);
    console.log(`Checked ${files.length} workflow(s): ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
