# Make a skill's rules hard

A skill's instructions are requests: capable models follow them, and weaker
ones sometimes do not. To make a rule hold whatever model runs the skill,
enforce it outside the model, in the assistant's permission settings, in
checks on what was produced, and in the repository. This page gives the
settings for each skill. See
[decision 0009](decisions/0009-enforce-rules-outside-the-model.md) for why.

Contents:

- [Why written rules are not enough](#why-written-rules-are-not-enough)
- [The four layers](#the-four-layers)
- [Settings for each skill](#settings-for-each-skill)
- [Ask before writing, in each assistant](#ask-before-writing-in-each-assistant)
- [Check what was produced](#check-what-was-produced)

## Why written rules are not enough

`backstage-catalog-builder` says to write nothing the user has not
confirmed. In the [behaviour evals](verification.md#run-the-behaviour-evals),
Claude Opus 5.5 asked first in three runs of three. Claude Haiku 5.5 wrote
`catalog-info.yaml` before asking in three of three, and repeating the rule
in the step that writes changed nothing. With an assistant rule that asks a
person before writing that file, Haiku tried to write it in three of three
runs, and the assistant stopped it every time.

## The four layers

| Layer | Enforces | Example |
| --- | --- | --- |
| Assistant permissions | What the assistant may do in a session | Ask a person before writing `catalog-info.yaml` |
| Checks on output | What a finished file may contain | No `TODO` in a page; valid descriptors; no secrets |
| The repository | What reaches the main branch | Branch rules, required checks, `CODEOWNERS` review |
| Evals | Which models a skill is trusted with | Behaviour evals per model |

A skill cannot make its own rules hard: its text reaches the model, not the
assistant's permission system. The Agent Skills `allowed-tools` field does
not help either. In Claude Code it pre-approves tools while a skill is
active, which loosens permissions rather than tightening them.

## Settings for each skill

| Skill | Rule | Enforce it with |
| --- | --- | --- |
| `backstage-catalog-builder` | Write descriptors only after confirmation | An ask rule for `**/catalog-info.yaml` and `**/mkdocs.yml` |
| `backstage-catalog-builder` | Register in a catalog only with approval | An ask rule for the commands or tools that call the catalog API |
| `backstage-catalog-builder` | Valid descriptors and TechDocs sites | `check-descriptors.mjs` and `check-techdocs.mjs` in pre-commit or CI |
| `documentation-author` | No placeholders, vague link text, or bare URLs | `check-page.mjs` in pre-commit |
| `documentation-review`, `peer-code-review` | Report only; never edit, push, or merge | An ask rule for edits, and a deny rule for `git push` and merges |
| `decision-record-author` | Complete records, and no rewrite of an accepted one | `check-decision-record.mjs --dir` in pre-commit, and review of changes to accepted records |
| `specification-author` | Testable requirements, each covered by a criterion | `check-specification.mjs` in pre-commit or CI |
| `specification-review`, `security-review` | Report only; never edit | An ask rule for edits |
| `test-plan-author` | Every acceptance criterion has a test | `check-test-plan.mjs --spec` in CI |
| `change-plan-author` | No step over the review limit, and no code written | `check-change-plan.mjs`, and an ask rule for edits outside the plan |
| `release-notes-author` | Upgrade steps and a rollback for every breaking change; never publish | `check-release-notes.mjs`, and a deny rule for tagging and publishing commands |
| `skill-correction` | Never weaken a check to make a case pass | Required review of eval changes by the skill's owner, through `CODEOWNERS` |
| All | Never commit a secret | gitleaks in pre-commit and CI |

## Ask before writing, in each assistant

Keep the assistant's default of asking before edits, and do not pre-approve
the files a skill must confirm first. Where the defaults have been loosened,
add rules like these to the project's settings.

**Claude Code**, in `.claude/settings.json`. Ask rules outrank allow rules,
and deny rules outrank both:

```json
{
  "permissions": {
    "ask": [
      "Write(**/catalog-info.yaml)",
      "Edit(**/catalog-info.yaml)",
      "Write(**/mkdocs.yml)",
      "Edit(**/mkdocs.yml)"
    ],
    "deny": ["Bash(git push:*)", "Bash(gh pr merge:*)"]
  }
}
```

This is the rule the behaviour evals use for the case
`owner-evidence-host-gate`.

**OpenCode**, in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "edit": "ask",
    "bash": { "git push*": "deny", "gh pr merge*": "deny" }
  }
}
```

The OpenCode settings were not tested in the evals; check them in your
version.

**Other assistants:** use the assistant's approval setting, so it asks
before writing files and running commands, and its command deny list, if
it has one.

## Check what was produced

Output checks hold whatever wrote the file, so run them where a person
cannot skip them. In this repository they run before every commit and in
CI:

```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: check-page
      name: Placeholders and link text in finished pages
      entry: node skills/documentation-author/scripts/check-page.mjs
      language: system
      files: '^(README|CHANGELOG|AGENTS)\.md$|^docs/.*\.md$'
```

Point `entry` at wherever the skill is installed in your project, and adjust
`files` to your documentation folders.
