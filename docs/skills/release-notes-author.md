# release-notes-author

**Version 1.0.1 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/release-notes-author/SKILL.md) · plugin name `agent-skills:release-notes-author`**

Drafts release notes for the people about to install a version, and leads
with their first question: what do I have to do? It builds the notes from
the changelog, the merged changes since the last release, and the code, and
looks in the diff for what changelogs miss, such as a renamed environment
variable or a migration that locks a table. Every breaking change gets
upgrade steps, and every migration a way to roll back.

## Use it

> Draft the release notes for orders-api 1.5.0.

It never tags or publishes; publishing stays a deliberate step for a
person, as in this repository's
[release routine](../contributing.md#releases).
