#!/usr/bin/env node
/**
 * Checks finished Markdown pages for what must never ship, whatever model
 * wrote them:
 *   - placeholder notes: TODO, FIXME, TBD, XXX (in text or HTML comments)
 *   - link text that says nothing about its destination: "click here",
 *     "here", "this link", "read more", "more", "link"
 *   - bare URLs in prose (write [descriptive text](url) instead)
 * Fenced code blocks and inline code are skipped, so a page can mention
 * these words in code.
 *
 * Usage: node check-page.mjs [--json] <file.md...>
 * Exits 1 if any page has a problem, 2 on bad usage. Zero dependencies.
 */
import fs from 'node:fs';

const VAGUE_LINK = /^(?:click here|here|this link|this page|read more|more|link)$/i;

export function checkPage(text) {
  const problems = [];
  let fence = null;
  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    const opener = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (fence) {
      if (opener && opener[1][0] === fence[0] && opener[1].length >= fence.length) fence = null;
      return;
    }
    if (opener) {
      fence = opener[1];
      return;
    }
    // Inline code is skipped, and an image (such as a badge) is not link text.
    const prose = raw.replace(/(`+)[\s\S]*?\1/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, 'image');
    const placeholder = /\b(TODO|FIXME|TBD|XXX)\b/.exec(prose);
    if (placeholder) problems.push({ line, rule: 'placeholder', message: `"${placeholder[1]}" left in the page; put unknowns in your report, not the page` });
    for (const match of prose.matchAll(/\[([^\]]+)\]\([^)]*\)/g)) {
      if (VAGUE_LINK.test(match[1].trim())) problems.push({ line, rule: 'link-text', message: `link text "${match[1].trim()}" does not say where it leads` });
    }
    // A link's target is not a bare URL, including when its text wrapped
    // from the line before ("... rules\n  hard](https://...)").
    const withoutLinks = prose.replace(/\[[^\]]*\]\([^)]*\)/g, ' ').replace(/^[^[]*\]\([^)]*\)/, ' ').replace(/<https?:\/\/[^>]+>/g, ' ').replace(/<[^>]+>/g, ' ');
    const bare = /(?:^|[\s(])(https?:\/\/[^\s)>\]]+)/.exec(withoutLinks);
    if (bare) problems.push({ line, rule: 'bare-url', message: `bare URL ${bare[1]}; give it descriptive link text` });
  });
  return problems;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => arg !== '--json');
  if (!files.length) {
    console.error('Usage: node check-page.mjs [--json] <file.md...>');
    process.exit(2);
  }
  const report = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch (error) {
      console.error(`check-page: cannot read ${file}: ${error.code ?? error.message}`);
      process.exit(2);
    }
    for (const problem of checkPage(text)) report.push({ file, ...problem });
  }
  if (json) console.log(JSON.stringify({ problems: report }, null, 2));
  else {
    for (const p of report) console.log(`${p.file}:${p.line}: ${p.rule}: ${p.message}`);
    console.log(`Checked ${files.length} page(s): ${report.length} problem(s).`);
  }
  process.exit(report.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
