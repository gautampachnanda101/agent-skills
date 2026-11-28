---
name: release-notes-author
description: Draft release notes for the people who install or depend on a release - what changed for them, breaking changes with the exact steps to upgrade, data migrations, and how to roll back - from the changelog, the merged changes since the last release, and the code. Leads with what readers must act on, translates commit messages into effects, and never invents a change it cannot find. Not for writing the changelog entry for a single change, or for publishing the release. Use when asked to write, draft, or prepare release notes, a release announcement, or an upgrade guide for a version.
license: Apache-2.0
compatibility: Host assistant with file-read tools and, for history, git. Node.js 20+ is optional, for the bundled notes checker.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Release notes author

Release notes are for the people about to install a version, and their
first question is "what do I have to do?". Answer that first, then say what
changed for them. Build the notes from evidence, the changelog and the
merged changes, not from memory.

## Gather what shipped

1. Find the version: the one the user names, or the next version in the
   changelog, the package manifest, or the tags. Confirm it if unsure.
2. Read the changelog's section for it (or `Unreleased`), and the merged
   changes since the previous release: `git log <last-tag>..HEAD`, pull
   request titles, and the diffs where an entry is unclear.
3. Look in the diff for what changelogs miss: renamed settings or
   environment variables, removed endpoints or flags, changed defaults,
   database migrations, and new requirements such as a runtime version.

## Write the notes

Use the repository's previous release notes as the model if they exist.
Otherwise use this order, leaving out any section with nothing in it:

| Section | What it holds |
| --- | --- |
| `# <project> <version>` | The version in the title, and the date |
| Breaking changes | Each change that can stop an existing setup working, and who it affects |
| Upgrade | The exact steps, in order: what to rename, set, or run, and when |
| Migrations | Data or schema changes, how long they take, and whether they lock anything |
| Roll back | How to return to the previous version, including after a migration |
| New | What readers can now do |
| Fixes | What no longer goes wrong, in the reader's terms |

- Translate commits into effects: not "refactor config loader" but "the
  `PORT` default is now 8080".
- Every breaking change has an upgrade step, and every migration has a
  rollback note, even when the answer is "restore the backup".
- Say only what the evidence shows. If something cannot be confirmed, ask,
  or leave it out and say so in your reply; never put a placeholder in the
  notes.

## Deliver

Give the notes in your reply, or save them where the user asks. Do not tag,
publish, or change the changelog; publishing is a separate, deliberate step.

When Node.js is available, check them:

```sh
node scripts/check-release-notes.mjs <notes.md>
```

It fails when the title has no version, a breaking change has no upgrade
section, a breaking change or migration has no rollback section, an entry is
only a commit hash, or a placeholder is left in.
