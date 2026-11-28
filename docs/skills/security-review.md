# security-review

**Version 1.0.3 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/security-review/SKILL.md) · plugin name `agent-skills:security-review`**

Reviews a diff, commit, or pull request for what an attacker could do with
it. It runs the repository's own configured scanners first, then reads every
changed line for what scanners miss: the missing authorization check, the
input trusted without reason, the log line that leaks. Each finding has
`file:line` evidence and a severity by exploitability, and the report ends
with a verdict. It never quotes a secret and never edits the code.

## Grounded in

- The [OWASP Top 10](https://owasp.org/www-project-top-ten/) and the
  [OWASP Code Review Guide](https://owasp.org/www-project-code-review-guide/)

## Use it

> Do a security review of the latest commit before I merge it.

It uses the same report shape as [peer-code-review](peer-code-review.md),
so both reviews can sit side by side.
