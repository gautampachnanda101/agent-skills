---
title: Agent skills
---

<!-- The hero uses the Homebrew Tap site's HTML classes, which Markdown
cannot express, so inline HTML is allowed for this block only. -->
<!-- markdownlint-disable MD033 -->

<section class="tap-hero">
  <p class="tap-eyebrow">AGENT SKILLS · ANY ASSISTANT · TESTED</p>
  <h1>Skills for every step from a request to a release.</h1>
  <p class="tap-lede">Twelve skills for coding assistants. Each reads your repository first, writes nothing you have not confirmed, and is tested on what it does, not only on what it says.</p>
  <div class="tap-actions">
    <a class="tap-button tap-button-primary" href="installation/">Get started</a>
    <a class="tap-button tap-button-secondary" href="skills/">Browse the skills</a>
  </div>
</section>

<section class="tap-terminal" aria-label="Installation example">
  <div class="terminal-bar"><span></span><span></span><span></span><strong>shell</strong></div>
  <pre><code><span class="terminal-prompt">$</span> git clone https://github.com/gautampachnanda101/agent-skills
<span class="terminal-prompt">$</span> cd agent-skills &amp;&amp; make install
<span class="terminal-success">installed</span>  12 skills in every supported assistant</code></pre>
</section>

<div class="formula-grid">
  <article class="formula-item">
    <p class="formula-number">01</p>
    <h3>Decide what to build</h3>
    <p>Write a specification with testable criteria, review it against the code, and record the decisions behind it.</p>
    <a href="roles/product/">Product skills</a>
  </article>
  <article class="formula-item">
    <p class="formula-number">02</p>
    <h3>Build and review</h3>
    <p>Plan small, reviewable changes, plan the tests from the spec, and review code and security.</p>
    <a href="roles/developer/">Developer skills</a>
  </article>
  <article class="formula-item">
    <p class="formula-number">03</p>
    <h3>Document and release</h3>
    <p>Write and review documentation, draft release notes with upgrade steps, and keep a Backstage catalog.</p>
    <a href="roles/operations/">Operations skills</a>
  </article>
</div>

<!-- markdownlint-enable MD033 -->

## About

Reusable [Agent Skills](https://agentskills.io/) for coding assistants. Each
directory under [`skills/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills)
ships one skill with its own `SKILL.md` entry point. Assistants such as
GitHub Copilot, Claude Code, OpenCode, Kiro, Codex, Gemini CLI, Cursor,
Windsurf, and Cline can load it without a particular editor, model, or
operating system. Not every client has been tested; see
[Boundaries to expect](usage.md#boundaries-to-expect).

## At a glance

- **Skills for each step of the work** — from a specification and its
  review, through change and test plans, code and security reviews, and
  documentation, to release notes and a Backstage catalog. Each works on its
  own; [Roles](roles/index.md) shows which ones each job uses.
- **Read first, then confirm once** — every skill reads the repository,
  suggests values with their evidence, and writes nothing you have not
  confirmed.
- **Checked output** — most skills bundle a zero-dependency checker that
  fails on what must not ship, such as a criterion without a test or a
  placeholder in a page.
- **Tested behaviour** — reply evals grade what a skill produces, and
  behaviour evals grade what an assistant does with it: what it reads,
  runs, and writes. See [Verification](verification.md).
- **Rules that hold with any model** — the settings that enforce each
  skill's important rules are in [Make a skill's rules hard](hard-rules.md).
- **Install once** — `make install` copies the skills into every supported
  assistant, and the Claude plugin installs them in Claude Code.

## Available skills

The [Skills section](skills/index.md) lists every skill, what it does, what
ships with it, and how to check it.

## In this site

| Page | Start there when you want to |
| --- | --- |
| [Skills](skills/index.md) | Browse every published skill, its level, and its owner |
| [Roles](roles/index.md) | Find the skills for your job |
| [Installing the skills](installation.md) | Copy skills into every supported assistant, install the Claude plugin, or pick project-local destinations |
| [Using the skills](usage.md) | Prompt patterns, a fast path that skips the questions, and what a complete run delivers |
| [Verification](verification.md) | Run the checkers, the local-model check, and the reply and behaviour evals |
| [Make a skill's rules hard](hard-rules.md) | Enforce a skill's important rules with assistant settings and checks |
| [Local Backstage](local-backstage.md) | Try generated descriptors in a local Backstage, or connect through MCP |
| [Contributing a skill](contributing.md) | Add the next skill, follow the release process, and pass the required checks |
| [Plan](plan.md) and [Decisions](decisions/index.md) | See what is planned and why the repository works as it does |

This documentation is the companion to the
[repository README](https://github.com/gautampachnanda101/agent-skills#readme),
which carries the CI badges, a summary, and the quick-install commands. The
pages above hold the detail.

The entity registered for this repository is `component:default/agent-skills`
in [catalog-info.yaml](https://github.com/gautampachnanda101/agent-skills/blob/main/catalog-info.yaml);
these TechDocs are attached through the `backstage.io/techdocs-ref` annotation.
